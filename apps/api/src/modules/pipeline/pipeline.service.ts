import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.provider';
import { rawLeads } from '@app/db/schema/raw-leads';

export interface PipelineStatus {
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  queueSize: number;
}

export interface PipelineJob {
  id: string;
  entityType: string;
  processingStatus: string;
  createdAt: Date;
  processedAt: Date | null;
  errorMessage: string | null;
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @InjectQueue('data-transformation') private readonly transformQueue: Queue,
  ) {}

  async getStatus(companyId: string): Promise<PipelineStatus> {
    const statusCounts = await this.db
      .select({
        processingStatus: rawLeads.processingStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(rawLeads)
      .where(eq(rawLeads.companyId, companyId))
      .groupBy(rawLeads.processingStatus);

    const status: PipelineStatus = {
      pending: 0,
      processing: 0,
      processed: 0,
      failed: 0,
      queueSize: 0,
    };

    for (const row of statusCounts) {
      if (row.processingStatus in status) {
        status[row.processingStatus as keyof Omit<PipelineStatus, 'queueSize'>] = row.count;
      }
    }

    // Get queue size
    const jobCounts = await this.transformQueue.getJobCounts();
    status.queueSize = (jobCounts.waiting ?? 0) + (jobCounts.active ?? 0);

    return status;
  }

  async getJobs(companyId: string): Promise<PipelineJob[]> {
    const jobs = await this.db
      .select({
        id: rawLeads.id,
        entityType: rawLeads.entityType,
        processingStatus: rawLeads.processingStatus,
        createdAt: rawLeads.createdAt,
        processedAt: rawLeads.processedAt,
        errorMessage: rawLeads.errorMessage,
      })
      .from(rawLeads)
      .where(eq(rawLeads.companyId, companyId))
      .orderBy(rawLeads.createdAt)
      .limit(50);

    return jobs;
  }

  async retryJob(companyId: string, jobId: string): Promise<{ status: string }> {
    const [rawLead] = await this.db
      .select()
      .from(rawLeads)
      .where(eq(rawLeads.id, jobId))
      .limit(1);

    if (!rawLead || rawLead.companyId !== companyId) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Reset status to pending
    await this.db
      .update(rawLeads)
      .set({
        processingStatus: 'pending',
        errorMessage: null,
      })
      .where(eq(rawLeads.id, jobId));

    // Add to queue
    await this.transformQueue.add('transform', {
      rawLeadId: jobId,
      companyId,
      entityType: rawLead.entityType,
    });

    this.logger.log(`Job ${jobId} queued for retry`);

    return { status: 'queued' };
  }
}
