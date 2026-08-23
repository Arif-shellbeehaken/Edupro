import { InstitutionType, SubscriptionPlan, TenantStatus } from "../enums";

/**
 * Tenant Aggregate Root
 * Represents one educational institution on the platform.
 */
export interface Tenant {
  id: string;
  name: string;
  nameBn?: string | null;
  slug: string;                       // used for subdomain: {slug}.edupro.app
  type: InstitutionType;
  status: TenantStatus;
  plan: SubscriptionPlan;

  // Branding (White-label)
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;

  // Contact
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  district?: string | null;
  division?: string | null;

  // Academic
  academicYearStartMonth?: number;    // 1-12
  boardAffiliation?: string[];        // ["BMEB", "BEFAQ", "GENERAL"]

  // Limits (from plan)
  maxStudents: number;
  maxStaff: number;

  // Trial / Billing
  trialEndsAt?: Date | null;
  subscriptionEndsAt?: Date | null;

  // Meta
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateTenantInput {
  name: string;
  nameBn?: string;
  slug: string;
  type: InstitutionType;
  plan?: SubscriptionPlan;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  division?: string;
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword: string;
}
