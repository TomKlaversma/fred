import type { ProcessingStatus } from '../constants/processing-status';

export interface RawRecord {
  id: string;
  companyId: string;
  source: string;
  externalId: string | null;
  data: Record<string, unknown>;
  status: ProcessingStatus;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookPayload {
  source: string;
  externalId?: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface TransformRawJobData {
  rawRecordId: string;
  companyId: string;
}

export interface TransformBatchJobData {
  rawRecordIds: string[];
  companyId: string;
}

export interface FingerprintJobData {
  leadId: string;
  companyId: string;
}

export interface CampaignExecuteJobData {
  campaignId: string;
  companyId: string;
}
