export const LeadStatus = Object.freeze({
  NEW: 'new',
  ENRICHED: 'enriched',
  CONTACTED: 'contacted',
  CONVERSING: 'conversing',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  LOST: 'lost',
} as const);

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];
