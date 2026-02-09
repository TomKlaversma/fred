export interface LeadCompany {
  id: string;
  companyId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  linkedinUrl: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadCompanyInput {
  companyId: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  linkedinUrl?: string;
  customFields?: Record<string, unknown>;
}

export interface UpdateLeadCompanyInput {
  name?: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  linkedinUrl?: string | null;
  customFields?: Record<string, unknown>;
}
