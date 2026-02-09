import type { Channel } from '../constants/channels';

export interface Message {
  id: string;
  campaignId: string;
  campaignLeadId: string;
  channel: Channel;
  subject: string | null;
  body: string;
  sentAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageInput {
  campaignId: string;
  campaignLeadId: string;
  channel: Channel;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMessageInput {
  subject?: string | null;
  body?: string;
  sentAt?: string;
  metadata?: Record<string, unknown>;
}
