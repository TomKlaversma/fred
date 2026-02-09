import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DRIZZLE } from '../../database/database.module';
import type { DrizzleDB } from '../../database/database.provider';
import { rawLeads } from '@fred/db/schema/raw-leads';
import { integrations } from '@fred/db/schema/integrations';
import { eq, and } from 'drizzle-orm';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { BatchWebhookPayloadDto } from './dto/batch-webhook-payload.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateApiKey(apiKey: string): Promise<string | null> {
    if (!apiKey) {
      return null;
    }

    // TODO: Implement proper API key lookup
    // For now, look for an active integration with matching credentials
    const [integration] = await this.db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.credentials, apiKey),
          eq(integrations.status, 'active'),
        ),
      )
      .limit(1);

    return integration?.companyId ?? null;
  }

  async processRawData(
    companyId: string,
    payload: WebhookPayloadDto,
  ): Promise<{ id: string; status: string }> {
    const [rawLead] = await this.db
      .insert(rawLeads)
      .values({
        companyId,
        entityType: payload.entityType,
        workflowId: payload.workflowId,
        rawData: payload.data,
        metadata: payload.metadata ?? {},
        processingStatus: 'pending',
      })
      .returning();

    this.logger.log(`Raw data received: ${rawLead.id} for company ${companyId}`);

    // Emit event for pipeline processing
    this.eventEmitter.emit('raw-data.received', {
      rawLeadId: rawLead.id,
      companyId,
      entityType: payload.entityType,
    });

    return { id: rawLead.id, status: 'accepted' };
  }

  async processRawDataBatch(
    companyId: string,
    payload: BatchWebhookPayloadDto,
  ): Promise<{ count: number; status: string }> {
    const values = payload.items.map((item) => ({
      companyId,
      entityType: item.entityType,
      workflowId: item.workflowId,
      rawData: item.data,
      metadata: item.metadata ?? {},
      processingStatus: 'pending' as const,
    }));

    const inserted = await this.db.insert(rawLeads).values(values).returning();

    this.logger.log(
      `Batch raw data received: ${inserted.length} items for company ${companyId}`,
    );

    // Emit events for each item
    for (const rawLead of inserted) {
      this.eventEmitter.emit('raw-data.received', {
        rawLeadId: rawLead.id,
        companyId,
        entityType: rawLead.entityType,
      });
    }

    return { count: inserted.length, status: 'accepted' };
  }
}
