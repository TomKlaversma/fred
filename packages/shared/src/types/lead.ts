import type { LeadStatus } from '../constants/lead-status';

export interface Lead {
  id: string;
  companyId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  linkedinUrl: string | null;
  phone: string | null;
  status: LeadStatus;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  companyId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  linkedinUrl?: string;
  phone?: string;
  status?: LeadStatus;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface UpdateLeadInput {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  linkedinUrl?: string | null;
  phone?: string | null;
  status?: LeadStatus;
  tags?: string[];
  customFields?: Record<string, unknown>;
}
