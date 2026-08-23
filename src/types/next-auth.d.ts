import { DefaultSession } from "next-auth";
import { UserRole } from "@/domain/enums";

/**
 * Extend NextAuth session & JWT with our multi-tenant fields.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole | string;
      tenantId: string | null;
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole | string;
    tenantId: string | null;
    isSuperAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole | string;
    tenantId: string | null;
    isSuperAdmin: boolean;
  }
}
