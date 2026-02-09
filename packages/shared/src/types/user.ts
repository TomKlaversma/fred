import type { UserRole } from '../constants/roles';

export interface User {
  id: string;
  companyId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  companyId: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: UserRole;
  isActive?: boolean;
}
