export const Provider = {
  LINKEDIN: 'linkedin',
  EMAIL_SMTP: 'email_smtp',
  GOOGLE: 'google',
  CUSTOM: 'custom',
} as const;

export type Provider = (typeof Provider)[keyof typeof Provider];
