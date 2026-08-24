# Edupro — Project Structure

Clean Architecture + vertical slices, multi-tenant SaaS.

```
src/
├── app/                          # Next.js App Router (presentation)
│   ├── api/                      # HTTP endpoints (auth, payments, health)
│   ├── login/                    # Public auth UI
│   ├── parent/ · student/        # Role portals
│   ├── super-admin/              # Platform operator UI + layout shell
│   └── tenant/
│       ├── admin/                # Tenant ops UI + shared layout shell
│       └── onboarding/
├── application/                  # Use-cases (server actions) · DTOs · services
│   └── use-cases/{domain}/
├── domain/                       # Entities · enums · repository ports
├── infrastructure/               # Adapters
│   ├── auth/                     # Auth.js · RBAC · session guards
│   ├── database/                 # Prisma · repositories
│   ├── payments/                 # bKash · Nagad
│   ├── sms/ · security/ · tenancy/
├── components/
│   ├── layout/                   # AppShell · Sidebar · AppHeader
│   └── ui/                       # Design-system primitives
├── lib/                          # Cross-cutting helpers (cn, branding)
└── shared/                       # constants · errors · types
```

## Layer rules

| Layer | May depend on | Must not |
|-------|---------------|----------|
| `app/` | application, components, infrastructure (thin) | raw Prisma in UI when a repository exists |
| `application/` | domain, infrastructure adapters | React components |
| `domain/` | nothing outward | Prisma, Next, UI |
| `infrastructure/` | domain ports | UI |

## UI composition

1. **Route layouts** (`tenant/admin/layout.tsx`, `super-admin/layout.tsx`) own chrome (sidebar + auth guard).
2. **Pages** own `AppHeader` + content only — no nested sidebars.
3. **Tokens** live in `globals.css`; components use `bg-primary`, `border-border`, etc.
4. **Routes** constants: `shared/constants/routes.ts`.

## Multi-tenancy

- Shared DB + `tenantId` on every tenant-owned row.
- `requireTenantSession()` sets request tenant context.
- Repositories always scope by `tenantId`.

## Production checklist

See `docs/PRODUCTION.md` (Postgres, secrets, Docker, health `/api/health`).
