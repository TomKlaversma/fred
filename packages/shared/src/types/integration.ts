import type { IntegrationStatus } from '../constants/integration-status';
import type { Provider } from '../constants/providers';

export interface Integration {
  id: string;
  companyId: string;
  provider: Provider;
  status: IntegrationStatus;
  credentials: string;
  metadata: Record<string, unknown>;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationInput {
  companyId: string;
  provider: Provider;
  credentials: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}

export interface UpdateIntegrationInput {
  status?: IntegrationStatus;
  credentials?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  expiresAt?: string | null;
}
