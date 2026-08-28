# Edupro — Security & Production Hardening

## Authentication & access
- Auth.js v5 (JWT session) + RBAC (`requireTenantContext`, `requireSuperAdmin`)
- Tenant isolation via `tenantId` on queries + middleware context
- 2FA (TOTP) for privileged accounts
- Parent portal OTP (rate-limited, cookie session, 10 min challenge / 12 h session)

## Rate limiting
| Surface | Limit | Backend |
|---------|-------|---------|
| Login | 8 / 15 min per email | Memory or Upstash |
| Parent OTP | 5 / 15 min per phone | Memory or Upstash |

Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for multi-instance.

## HTTP hardening
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/mic/geo off)
- Soft CSP + HSTS in production (`next.config`)
- `X-Request-Id` on every response
- `poweredByHeader: false`

## Data
- Soft delete on students/staff where modeled
- Audit trail on sensitive actions
- Retention cron: `/api/cron/retention` (`CRON_SECRET`)
- Tenant backup JSON (admin-only): `/tenant/admin/system/backup`
- No secrets in client bundles — server actions only

## Secrets checklist
- [ ] `AUTH_SECRET` ≥ 32 chars (openssl rand -base64 32)
- [ ] Strong DB password; TLS to Postgres
- [ ] `CRON_SECRET` for jobs
- [ ] Rotate bKash/Nagad/SMS keys; sandbox vs live flags
- [ ] Never commit `.env`

## Scaling notes
- Horizontal app replicas behind LB → Redis rate limit required
- PgBouncer + `connection_limit` on `DATABASE_URL`
- Optional `DATABASE_URL_READ` for reports/export
- Stateless sessions (JWT) — no sticky sessions required

## Incident
1. Check `/api/health` dependency matrix
2. Correlate logs by `X-Request-Id` / JSON `requestId`
3. Suspend tenant from super-admin if abuse
4. Rotate secrets; invalidate sessions by changing `AUTH_SECRET` only as last resort
