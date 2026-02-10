import type { User } from './user';
import type { Lead } from './lead';

export const ContactMethod = Object.freeze({
  EMAIL: 'email',
  LINKEDIN: 'linkedin',
  CALL: 'call',
  SMS: 'sms',
  OTHER: 'other',
} as const);

export type ContactMethod = (typeof ContactMethod)[keyof typeof ContactMethod];

export const ContactDirection = Object.freeze({
  OUTBOUND: 'outbound',
  INBOUND: 'inbound',
} as const);

export type ContactDirection =
  (typeof ContactDirection)[keyof typeof ContactDirection];

export interface ContactAttempt {
  id: string;
  companyId: string;
  leadId: string;
  userId: string;

  // Contact details
  method: ContactMethod;
  direction: ContactDirection;
  subject: string | null;
  body: string | null;

  // Response tracking
  responded: boolean;
  responseAt: string | null;

  // Metadata (channel-specific: message_id, thread_id, etc.)
  metadata: Record<string, unknown>;

  createdAt: string;

  // Relations (optional, loaded when needed)
  user?: User;
  lead?: Lead;
}

export interface CreateContactAttemptInput {
  leadId: string;
  method: ContactMethod;
  direction: ContactDirection;
  subject?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateContactAttemptInput {
  responded?: boolean;
  responseAt?: string;
}
