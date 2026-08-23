# Edupro — System Architecture (Production Grade)

> Last updated: 2026-08-23  
> Style: Modular Monolith → future Microservice-ready  
> Patterns: Clean Architecture + DDD elements + Multi-tenancy best practices

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients                                   │
│  Web (Next.js)  │  Flutter (Student/Parent)  │  Flutter (Staff) │
└────────────┬──────────────────┬──────────────────┬──────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway / BFF                            │
│              (Next.js App Router + Route Handlers)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Identity &     │ │  Tenant Context │ │  Billing &      │
│  Access         │ │  Resolver       │ │  Subscription   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│         (Use Cases / Application Services / DTOs)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Domain Layer                                │
│  Entities │ Value Objects │ Domain Services │ Domain Events      │
│  Bounded Contexts: Academic | Finance | Hifz | Identity | Ops    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  Infrastructure Layer                            │
│  Prisma (PostgreSQL) │ Auth │ SMS │ Payment │ File Storage │ Queue│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy Strategy (Critical Decision)

**Chosen Pattern: Shared Database + `tenant_id` + Row Level Security (RLS)**

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Database-per-tenant | Strong isolation | Expensive, hard to manage 100+ tenants | Reject for start |
| Schema-per-tenant | Good isolation | Complex migrations | Future option for Enterprise |
| **Shared DB + tenant_id** | Cheap, fast, easy reporting | Must enforce isolation strictly | **Selected** |

### Enforcement Rules (Non-negotiable)
1. Every tenant-scoped table **must** have `tenant_id`
2. All queries go through Tenant Context (never raw `findMany` without filter)
3. PostgreSQL Row Level Security (RLS) as second line of defense
4. Super Admin operates outside tenant context
5. Cross-tenant queries only allowed in Super Admin context with explicit audit

---

## 3. Bounded Contexts (DDD)

| Context | Responsibility | Key Aggregates |
|---------|----------------|----------------|
| **Identity** | Users, Roles, Permissions, Auth | User, Role, Permission |
| **Tenancy** | Tenant lifecycle, Branding, Subscription | Tenant, Subscription, Plan |
| **Academic** | Students, Classes, Admission, Attendance, Exams | Student, Class, Admission, Exam |
| **Hifz** | Quran memorization tracking | HifzProgress, Sabak, Revision |
| **Finance** | Fees, Invoices, Payments, Accounting | FeeStructure, Invoice, Payment |
| **HR** | Staff, Payroll, Leave | Staff, Payroll, LeaveRequest |
| **Operations** | Library, Hostel, Transport, Inventory | Book, Room, Route |
| **Communication** | SMS, WhatsApp, Push, Notices | Message, Notice |
| **Platform** | Super Admin, Analytics, Support | PlatformMetrics, Ticket |

---

## 4. Folder Structure (Clean Architecture)

```
src/
├── app/                          # Next.js App Router (Presentation)
├── domain/                       # Enterprise Business Rules
│   ├── entities/
│   ├── value-objects/
│   ├── enums/
│   └── repositories/             # Interfaces only
├── application/                  # Application Business Rules
│   ├── use-cases/
│   ├── services/
│   └── dtos/
├── infrastructure/               # Frameworks & Drivers
│   ├── database/                 # Prisma client & repositories impl
│   ├── auth/
│   ├── tenancy/
│   └── external/                 # bKash, SMS, etc.
├── shared/                       # Cross-cutting
│   ├── types/
│   ├── utils/
│   ├── constants/
│   └── errors/
└── components/                   # UI Components
```

---

## 5. Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Language | TypeScript (strict) | Type safety at scale |
| ORM | Prisma | Best DX + migrations + type safety |
| Auth | NextAuth.js v5 (Auth.js) + custom RBAC | Mature, flexible |
| Validation | Zod | Runtime + static type alignment |
| ID Strategy | CUID2 / ULID | Sortable, non-sequential |
| Soft Delete | `deletedAt` on all major entities | Audit + recovery |
| Audit | Separate `AuditLog` table | Compliance |
| Events | Domain events (in-process first) | Loose coupling |
| API Style | REST (OpenAPI later) | Simple + mobile friendly |

---

## 6. Security Baseline (Production)

- [ ] All tenant queries filtered by `tenant_id`
- [ ] RLS policies on PostgreSQL
- [ ] RBAC with granular permissions
- [ ] 2FA mandatory for Admin & Accountant roles
- [ ] Password hashing: Argon2id
- [ ] Rate limiting on auth & payment endpoints
- [ ] Audit log for sensitive actions
- [ ] Encryption at rest (DB) + TLS in transit
- [ ] Child data handling policy awareness

---

## 7. Scalability Path

1. **Now**: Modular Monolith (single deployable)
2. **Later**: Extract high-load contexts (Finance, Notification) as services
3. **Caching**: Redis for session, timetable, frequent reads
4. **Queue**: BullMQ / Inngest for SMS, reports, bulk operations
5. **Read replicas** when reporting load increases

---

## 8. Current Implementation Status

- [x] Architecture Decision Record
- [x] Folder structure
- [ ] Prisma Schema (Core + Multi-tenancy)
- [ ] Tenant Context middleware
- [ ] Auth + RBAC foundation
- [ ] Domain entities (Student, Tenant, User...)
- [ ] First vertical slice (Hifz or Admission)
