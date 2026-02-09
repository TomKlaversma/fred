export const Channel = {
  EMAIL: 'email',
  LINKEDIN: 'linkedin',
  SMS: 'sms',
} as const;

export type Channel = (typeof Channel)[keyof typeof Channel];
