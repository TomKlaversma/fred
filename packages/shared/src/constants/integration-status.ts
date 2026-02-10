export const IntegrationStatus = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const);

export type IntegrationStatus = (typeof IntegrationStatus)[keyof typeof IntegrationStatus];
