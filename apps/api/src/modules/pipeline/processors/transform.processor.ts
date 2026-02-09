import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/database.module';
import type { DrizzleDB } from '../../../database/database.provider';
import { rawLeads } from '@fred/db/schema/raw-leads';

export interface TransformJobData {
  rawLeadId: string;
  companyId: string;
  entityType: string;
}

@Processor('data-transformation')
export class TransformProcessor extends WorkerHost {
  private readonly logger = new Logger(TransformProcessor.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    super();
  }

  async process(job: Job<TransformJobData>): Promise<void> {
    const { rawLeadId, companyId, entityType } = job.data;

    this.logger.log(
      `Processing raw lead ${rawLeadId} (type: ${entityType}) for company ${companyId}`,
    );

    try {
      // Mark as processing
      await this.db
        .update(rawLeads)
        .set({ processingStatus: 'processing' })
        .where(eq(rawLeads.id, rawLeadId));

      // TODO: Implement actual transformation logic
      // 1. Fetch the raw lead data
      // 2. Apply transformation rules based on entityType
      // 3. Map fields to lead/lead-company schema
      // 4. Upsert into leads or lead_companies table
      // 5. Handle deduplication

      // Mark as processed
      await this.db
        .update(rawLeads)
        .set({
          processingStatus: 'processed',
          processedAt: new Date(),
        })
        .where(eq(rawLeads.id, rawLeadId));

      this.logger.log(`Successfully processed raw lead ${rawLeadId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Failed to process raw lead ${rawLeadId}: ${errorMessage}`);

      // Mark as failed
      await this.db
        .update(rawLeads)
        .set({
          processingStatus: 'failed',
          errorMessage,
        })
        .where(eq(rawLeads.id, rawLeadId));

      throw error;
    }
  }
}
