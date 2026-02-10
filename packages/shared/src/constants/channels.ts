export const Channel = Object.freeze({
  EMAIL: 'email',
  LINKEDIN: 'linkedin',
  SMS: 'sms',
} as const);

export type Channel = (typeof Channel)[keyof typeof Channel];
