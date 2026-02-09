import type { CampaignStatus } from '../constants/campaign-status';
import type { Channel } from '../constants/channels';

export interface Campaign {
  id: string;
  companyId: string;
  name: string;
  channel: Channel;
  status: CampaignStatus;
  settings: Record<string, unknown>;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignInput {
  companyId: string;
  name: string;
  channel: Channel;
  status?: CampaignStatus;
  settings?: Record<string, unknown>;
  scheduledAt?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  channel?: Channel;
  status?: CampaignStatus;
  settings?: Record<string, unknown>;
  scheduledAt?: string | null;
}
