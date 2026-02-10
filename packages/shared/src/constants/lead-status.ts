export const LeadStatus = Object.freeze({
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  LOST: 'lost',
} as const);

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];
