/**
 * Canonical app routes — avoid stringly-typed hrefs in nav / redirects.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  login2fa: "/login/verify-2fa",
  parent: "/parent",
  student: "/student",
  onboarding: "/tenant/onboarding",
  tenant: {
    dashboard: "/tenant/admin/dashboard",
    students: "/tenant/admin/students",
    studentsNew: "/tenant/admin/students/new",
    studentsImport: "/tenant/admin/students/import",
    attendance: "/tenant/admin/attendance",
    hifz: "/tenant/admin/hifz",
    namaz: "/tenant/admin/namaz",
    finance: "/tenant/admin/finance",
    exams: "/tenant/admin/exams",
    hr: "/tenant/admin/hr",
    settings: "/tenant/admin/settings",
    reports: "/tenant/admin/reports",
  },
  superAdmin: {
    dashboard: "/super-admin/dashboard",
    tenants: "/super-admin/tenants",
    subscriptions: "/super-admin/subscriptions",
    revenue: "/super-admin/revenue",
    support: "/super-admin/support",
  },
  api: {
    health: "/api/health",
    bkashCreate: "/api/payments/bkash/create",
    nagadCreate: "/api/payments/nagad/create",
  },
} as const;
