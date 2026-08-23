/**
 * Tenant Context
 *
 * Critical security component.
 * Every request that touches tenant data must run inside a TenantContext.
 * Super Admin operations run with tenantId = null.
 */

import { TenantIsolationError } from "@/shared/errors";

export type TenantContextData = {
  tenantId: string | null;       // null = Super Admin context
  userId: string;
  role: string;
  isSuperAdmin: boolean;
};

// AsyncLocalStorage would be used in real Node runtime.
// For now we use a simple request-scoped holder pattern.
// In production with Next.js we will wire this via middleware + headers/cookies.

let currentContext: TenantContextData | null = null;

export function setTenantContext(ctx: TenantContextData): void {
  currentContext = ctx;
}

export function clearTenantContext(): void {
  currentContext = null;
}

export function getTenantContext(): TenantContextData {
  if (!currentContext) {
    throw new Error("TenantContext is not set. Did you forget middleware?");
  }
  return currentContext;
}

/**
 * Returns the current tenantId or throws if running in Super Admin context
 * and the caller expected a tenant.
 */
export function requireTenantId(): string {
  const ctx = getTenantContext();
  if (!ctx.tenantId) {
    throw new TenantIsolationError();
  }
  return ctx.tenantId;
}

/**
 * Helper for repository methods.
 * Super Admin can pass explicit tenantId; normal users are forced to their own.
 */
export function resolveTenantId(explicitTenantId?: string | null): string | null {
  const ctx = getTenantContext();

  if (ctx.isSuperAdmin) {
    return explicitTenantId ?? null;
  }

  // Non-super-admin must stay inside their tenant
  if (explicitTenantId && explicitTenantId !== ctx.tenantId) {
    throw new TenantIsolationError();
  }

  return ctx.tenantId;
}

export function assertSameTenant(resourceTenantId: string): void {
  const ctx = getTenantContext();
  if (ctx.isSuperAdmin) return;
  if (ctx.tenantId !== resourceTenantId) {
    throw new TenantIsolationError();
  }
}
