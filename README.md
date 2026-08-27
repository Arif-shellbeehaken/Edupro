# Edupro — Production-Grade Education SaaS for Bangladesh

**School • College • Alia / Qawmi Madrasah** — Unified multi-tenant platform

> Inspired by Fedena, eSchool SaaS, Schoolplayer, MyClassCampus, Ilmify, Edufy (BD), Madrasah Hub — customized for Bangladesh context (Bangla-first UI, BMEB/BEFAQ, Hifz tracking, bKash/Nagad, BANBEIS reporting).

---


---

## 🚀 Quickstart (local)

```bash
# 1. Clone & install
git clone https://github.com/Arif-shellbeehaken/Edupro.git
cd Edupro
cp .env.example .env
npm install

# 2. Database (SQLite dev OR Postgres)
# SQLite: set DATABASE_URL="file:./dev.db" in .env and prisma/schema provider = "sqlite"
npx prisma generate
npx prisma db push
npm run db:seed

# 3. Run
npm run dev
# → http://localhost:3000
```

**Demo logins** (from seed):

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `super@edupro.app` | `Super@1234` |
| Institution Admin | `admin@demo-madrasah.edu.bd` | `Admin@1234` |
| Parent OTP | `/parent/login` | phone linked to student |

**Docker**

```bash
export AUTH_SECRET=$(openssl rand -base64 32)
docker compose up -d --build
curl -s http://localhost:3000/api/health
```


## 🏭 Production quickstart

```bash
# 1. Env
cp .env.example .env
# Set DATABASE_URL (Postgres), AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL, ROOT_DOMAIN

# 2. Prisma → PostgreSQL in prisma/schema.prisma, then:
npx prisma generate
npx prisma migrate deploy   # or db push
npm run db:seed

# 3a. Node process
npm run build && npm run start:prod

# 3b. Docker (recommended)
export AUTH_SECRET=$(openssl rand -base64 32)
docker compose up -d --build
curl -sf http://localhost:3000/api/health\n# or: npm run smoke

# 4. First login
# Super Admin → provision tenants from /super-admin
# Tenant Admin → onboarding wizard, fee structure, classes
```

**Health:** `GET /api/health` · **SMS types:** `docs/SMS_CATALOG.md` · **Deploy:** `docs/PRODUCTION.md`

Parent portal (OTP): `/parent/login` — guardian phone linked on student record.

See `docs/PRODUCTION.md` for production deploy and `docs/SMS_CATALOG.md` for SMS types.


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

## 🚀 Development Status

| Area | Modules | Status |
|------|---------|--------|
| **Core** | Auth, Multi-tenancy, RBAC, Tenant provisioning | ✅ |
| **Academic** | SIS, Attendance, Exam/Marks, Timetable, Hifz | ✅ |
| **Finance** | Fee structure, Invoice, Payment (bKash/Nagad ready) | ✅ |
| **People** | HR Staff, Leave, Payroll | ✅ |
| **Ops** | Library, Hostel, Transport, Inventory | ✅ |
| **Growth** | Admission CRM, Communication (SMS log + Notice) | ✅ |
| **Docs** | Certificates + Print, Reports, BANBEIS CSV | ✅ |
| **Platform** | Tenant Settings, Super-admin Subscriptions, Health API | ✅ |
| **Deploy** | Docker, security headers, PRODUCTION.md | ✅ |

### Quick start (local)

```bash
npm install
cp .env.example .env          # set AUTH_SECRET
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

| Account | Email | Password |
|---------|-------|----------|
| Super Admin | `super@edupro.app` | `Super@1234` |
| Tenant Admin | `admin@demo-madrasah.edu.bd` | `Admin@1234` |

### Production deploy

See **[docs/PRODUCTION.md](docs/PRODUCTION.md)** for PostgreSQL, Docker Compose, Nginx, and security checklist.

```bash
docker compose up -d --build
curl http://localhost:3000/api/health
```

**Architecture notes:**  
✅ Clean Architecture + Modular Monolith structure  
✅ Domain Enums + Core Entities (Tenant, User, Student, Hifz)  
✅ Production Prisma Schema (Multi-tenant + Hifz + Finance core)  

✅ Tenant Context & Isolation helpers  
✅ Modern UI shells (Landing, Login, Super Admin, Tenant Admin)  
✅ **Auth Foundation** — Auth.js v5 + Credentials + JWT session + RBAC guards + Middleware  
✅ Login Server Action + DB Seed (Super Admin + Demo Tenant + Admin)  
➡️ Next: Session-aware dashboards + first vertical slice (Hifz recommended)

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
# 1. Install dependencies
npm install

# 2. Environment
cp .env.example .env
# Edit DATABASE_URL and set a strong AUTH_SECRET

# 3. Database
npx prisma generate
npx prisma db push
npm run db:seed

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo logins (after seed):**
- Super Admin → `super@edupro.app` / `Super@1234`
- Institution Admin → `admin@demo-madrasah.edu.bd` / `Admin@1234`


---

## 📁 Project Structure (Clean Architecture)

```
src/
├── app/                         # Presentation (App Router)
│   ├── api/                     # health · auth · payments
│   ├── login/ · parent/ · student/
│   ├── super-admin/             # + layout shell (platform)
│   └── tenant/admin/            # + layout shell (tenant)
├── application/use-cases/       # Server actions by domain
├── domain/                      # entities · enums
├── infrastructure/              # auth · prisma repos · payments · sms · tenancy
├── components/
│   ├── layout/                  # AppShell · Sidebar · AppHeader
│   └── ui/                      # token-based design system
├── lib/                         # cn · branding helpers
└── shared/                      # routes constants · errors
```

Details: [`docs/architecture/STRUCTURE.md`](docs/architecture/STRUCTURE.md) · Deploy: [`docs/PRODUCTION.md`](docs/PRODUCTION.md)

---

## 🔐 Security & Production Notes

- Role-Based Access Control (RBAC) with granular permissions
- Data isolation via tenant_id + future RLS
- Encryption at rest & in transit
- Full audit trail
- Offline-capable patterns for rural madrasahs
- Child data privacy compliance mindset

---

## 📞 Status

- [x] Git repository initialized & pushed
- [x] Super Admin + Tenant shells, onboarding, white-label
- [x] Prisma multi-tenant schema + seed
- [x] Layout-driven chrome (no duplicated sidebars)
- [x] Design tokens + production docs
- [ ] Authentication flow
- [ ] Sample dashboards for each major role
- [ ] Hifz tracking prototype (key differentiator)

---

**Built with ❤️ for Bangladesh's education institutions**

Repository: https://github.com/Arif-shellbeehaken/Edupro
