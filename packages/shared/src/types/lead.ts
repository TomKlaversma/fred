import type { LeadStatus } from '../constants/lead-status';
import type { ContactMethod } from './contact-attempt';
import type { User } from './user';

export interface Lead {
  id: string;
  companyId: string;
  leadCompanyId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  linkedinUrl: string | null;
  phone: string | null;
  status: LeadStatus;

  // Assignment (V1)
  assignedToUserId: string | null;
  assignedAt: string | null;
  assignedTo?: User | null;

  // Contact tracking summary (V1)
  lastContactedAt: string | null;
  lastContactMethod: ContactMethod | null;
  contactCount: number;
  lastResponseAt: string | null;

  // Attribution & metadata
  source: string | null;
  sourceWorkflow: string | null;
  enrichmentData: Record<string, unknown>;
  tags: string[];
  notes: string | null;
  score: number | null;

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
