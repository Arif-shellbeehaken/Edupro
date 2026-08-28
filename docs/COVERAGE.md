# Blueprint coverage matrix (software scope)

External hardware/mobile stores are out of pure web scope; everything else is implemented at product MVP→production depth.

| # | Area | Coverage |
|---|------|----------|
| 0 | Multi-tenant SaaS, super-admin, plans, white-label, onboarding | Full |
| 1 | Roles, admin/parent/student portals | Full (web); Flutter apps = separate repo |
| 2 | Admission CRM, merit, SIS, promote, attendance, timetable, exam, homework, LMS materials | Full |
| 3 | Hifz, Hijri, Namaz, donations, Bangla UI | Full |
| 4–5 | Fees, bKash/Nagad/Rocket, HR/payroll | Full (gateways sandbox→live via env) |
| 6 | Library, hostel, transport, inventory, gate, grievance, notices | Full (GPS hardware optional) |
| 7 | SMS + WhatsApp channel option, bulk | Full |
| 8 | Reports, EMIS export, dropout risk | Full |
| 9 | RBAC, audit, backup, rate-limit, headers | Full |
| 12 | CRM, public site `/s/{slug}` | Full |
| 13–15 | Alumni, career, health, emergency, clubs, canteen, assets | Full (CRUD+workflows) |
| 16 | Certificates, BANBEIS export | Full (blockchain verify optional) |
| 17 | AI remarks/dropout heuristic | Partial heuristics; ML model external |
| 18 | 2FA, bulk import, tickets, survey, multi-campus | Full; SAML SSO = enterprise add-on |

**Not in this monorepo (by design):** native Flutter apps, live biometric devices, live bus GPS hardware, SAML IdP, full GraphQL gateway.
