import { UserRole } from "../enums";

/**
 * User — Platform-level identity
 * A user can belong to one tenant (except SUPER_ADMIN).
 */
export interface User {
  id: string;
  tenantId: string | null;          // null only for SUPER_ADMIN

  email: string;
  phone?: string | null;
  passwordHash: string;

  name: string;
  nameBn?: string | null;
  avatarUrl?: string | null;

  role: UserRole;
  isActive: boolean;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  twoFactorEnabled: boolean;

  // Meta
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateUserInput {
  tenantId: string | null;
  email: string;
  phone?: string;
  password: string;
  name: string;
  nameBn?: string;
  role: UserRole;
}
