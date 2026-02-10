export const CampaignLeadStatus = Object.freeze({
  PENDING: 'pending',
  SENT: 'sent',
  REPLIED: 'replied',
  BOUNCED: 'bounced',
} as const);

export type CampaignLeadStatus = (typeof CampaignLeadStatus)[keyof typeof CampaignLeadStatus];
