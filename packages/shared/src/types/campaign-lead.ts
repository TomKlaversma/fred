import type { CampaignLeadStatus } from '../constants/campaign-lead-status';

export interface CampaignLead {
  id: string;
  campaignId: string;
  leadId: string;
  status: CampaignLeadStatus;
  sentAt: string | null;
  repliedAt: string | null;
  bouncedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
