export interface Company {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  slug?: string;
  plan?: Company['plan'];
  settings?: Record<string, unknown>;
}

export interface UpdateCompanyInput {
  name?: string;
  slug?: string;
  plan?: Company['plan'];
  settings?: Record<string, unknown>;
}
