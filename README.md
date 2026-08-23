# Edupro — Production-Grade Education SaaS for Bangladesh

**School • College • Alia / Qawmi Madrasah** — Unified multi-tenant platform

> Inspired by Fedena, eSchool SaaS, Schoolplayer, MyClassCampus, Ilmify, Edufy (BD), Madrasah Hub — customized for Bangladesh context (Bangla-first UI, BMEB/BEFAQ, Hifz tracking, bKash/Nagad, BANBEIS reporting).

---

## 🎯 Vision

A single production-ready SaaS core that serves:
- General schools & colleges (SSC/HSC)
- Alia Madrasah (BMEB: Dakhil → Kamil)
- Qawmi Madrasah (BEFAQ: Hifzul Quran → Dawra-e-Hadith)

with deep madrasah-specific modules (Hifz tracking, Hijri calendar, Zakat/Donation, Namaz monitoring) as the primary differentiator.

---

## 🏗 Architecture Overview

| Layer | Choice | Notes |
|-------|--------|-------|
| **Frontend** | Next.js 15/16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui style | Modern, clean, responsive, dark mode ready |
| **Backend** | Next.js API Routes / Server Actions (initial) → scalable to NestJS/Laravel | API-first |
| **Database** | PostgreSQL + Prisma (tenant_id isolation) | Shared DB + RLS / tenant filter |
| **Auth** | NextAuth.js / custom JWT + RBAC | Super Admin + Tenant roles |
| **Multi-tenancy** | Subdomain (`school.edupro.app`) + tenant_id | Shared schema initially |
| **Mobile** | Flutter (planned) — Student/Parent + Staff apps | Shared API |
| **Payments** | bKash, Nagad, Rocket, Card | Local gateways priority |
| **SMS** | Local BD SMS gateway | + WhatsApp Business API |

### User Roles
- Super Admin (Platform)
- Institution Admin / Principal
- Teacher / Muhaddis / Hifz Teacher
- Accountant
- Parent
- Student
- Librarian, Hostel Warden, Transport Manager (sub-roles)

---

## 📦 Module Map (from Blueprint)

### Core
1. Multi-tenancy + Super Admin Panel + Subscription/Billing + White-label
2. Admission Management
3. Student Information System (SIS)
4. Attendance (QR / Biometric / App)
5. Timetable Generator
6. Exam & Result (BMEB / BEFAQ + Board formats)
7. Curriculum, Homework, LMS

### Madrasah Differentiator
- Hifzul Quran Tracking (Sabak / Sabki / Manzil)
- Islamic Curriculum modules
- Hijri Calendar + Ramadan/Eid auto-adjust
- Namaz Monitoring
- Zakat / Donation Management
- Bangla-first + RTL Arabic support

### Finance & HR
- Fee Structure, Invoices, Installments, Scholarships
- Full Accounting (Ledger, Balance Sheet)
- Payroll + Leave Management

### Operations
- Library, Hostel, Transport (GPS), Inventory, Gate Pass, Grievance, Events

### Engagement & Advanced
- Communication (SMS / WhatsApp / Push / Chat)
- CRM & Lead Management
- Alumni & Career
- Health & Safety
- Certificates (QR verifiable) + BANBEIS export
- AI features (remarks, chatbot, dropout prediction)
- SSO / 2FA, Helpdesk, Multi-campus

---

## 🚀 Development Status & Process

Following the recommended internal sequencing (even though external launch is single-phase):

| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | Foundation: Architecture, Multi-tenancy, Domain, Prisma Schema, UI shells | 🟡 In Progress |
| 2 | Core Academic: Admission, SIS, Attendance, Timetable | ⚪ Planned |
| 3 | Exam & Finance + Payment gateways | ⚪ Planned |
| 4 | Madrasah-specific (Hifz, Boards, Donation) | ⚪ Planned |
| 5 | Operations (HR, Library, Transport…) | ⚪ Planned |
| 6 | Engagement (Comms, LMS, CRM) | ⚪ Planned |
| 7 | Extended (Health, Extracurricular, Certificates, AI) | ⚪ Planned |
| 8 | Hardening (Security, Load, Isolation, Billing QA) | ⚪ Planned |

**Current focus (Sprint 1):**  
✅ Clean Architecture + Modular Monolith structure  
✅ Domain Enums + Core Entities (Tenant, User, Student, Hifz)  
✅ Production Prisma Schema (Multi-tenant + Hifz + Finance core)  
✅ Tenant Context & Isolation helpers  
✅ Modern UI shells (Landing, Login, Super Admin, Tenant Admin)  
➡️ Next: Auth foundation + first vertical slice (Hifz or Admission)

See detailed decisions → [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)


---

## 🎨 UI Principles

- **Clean & Modern**: Soft shadows, generous whitespace, consistent 8px grid
- **Bangla-first**: Primary language Bangla, English secondary, Arabic RTL support
- **Role-based layouts**: Distinct but cohesive experiences for each portal
- **Mobile responsive**: Staff + Parent/Student mobile-first patterns
- **Accessibility**: High contrast, keyboard navigation, screen-reader friendly
- **Dark mode** ready

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure (organized)

```
src/
├── app/                    # App Router
│   ├── (marketing)/        # Landing, pricing, public pages
│   ├── (auth)/             # Login, register, forgot-password
│   ├── (super-admin)/      # Platform-level dashboard
│   ├── (tenant)/           # Tenant-scoped portals
│   │   ├── admin/
│   │   ├── teacher/
│   │   ├── parent/
│   │   └── student/
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Reusable primitives (Button, Card, Input…)
│   ├── layout/             # Sidebars, headers, navs
│   ├── modules/            # Feature-specific components
│   └── charts/
├── lib/
│   ├── utils.ts
│   ├── auth.ts
│   └── db.ts
├── types/
│   ├── tenant.ts
│   ├── student.ts
│   └── index.ts
└── styles/
```

---

## 🔐 Security & Production Notes

- Role-Based Access Control (RBAC) with granular permissions
- Data isolation via tenant_id + future RLS
- Encryption at rest & in transit
- Full audit trail
- Offline-capable patterns for rural madrasahs
- Child data privacy compliance mindset

---

## 📞 Next Steps (as per blueprint)

- [x] Git repository initialized & pushed
- [ ] Complete Super Admin + Tenant onboarding UI
- [ ] Database schema (Prisma) for multi-tenancy + core entities
- [ ] Authentication flow
- [ ] Sample dashboards for each major role
- [ ] Hifz tracking prototype (key differentiator)

---

**Built with ❤️ for Bangladesh's education institutions**

Repository: https://github.com/Arif-shellbeehaken/Edupro
