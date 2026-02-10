export const CampaignStatus = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
} as const);

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];
