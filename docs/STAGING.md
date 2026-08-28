# Edupro — Staging deploy checklist

Use this before production cutover.

## 1. Infrastructure

- [ ] PostgreSQL 15+ (not SQLite) with daily backups
- [ ] Node 22 runtime / Docker image built with `DOCKER_BUILD=1`
- [ ] TLS certificate on domain (e.g. `staging.edupro.app`)
- [ ] Optional: Upstash Redis for multi-instance rate limit
- [ ] Optional: read replica → `DATABASE_URL_READ`

## 2. Environment (staging `.env`)

```bash
NODE_ENV=production
DATABASE_URL="postgresql://..."
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="https://staging.yourdomain.com"
NEXT_PUBLIC_APP_URL="https://staging.yourdomain.com"
ROOT_DOMAIN="yourdomain.com"
CRON_SECRET="$(openssl rand -hex 24)"
SMS_PROVIDER=console   # or sslwireless when keys ready
BKASH_MODE=sandbox
NAGAD_MODE=sandbox
ROCKET_MODE=sandbox
LOG_LEVEL=info
```

## 3. Deploy steps

```bash
npm ci
npx prisma generate
npx prisma migrate deploy   # or db push on first staging
npm run db:seed             # demo tenant only on staging
npm run build
npm run start               # or docker compose up -d
```

## 4. Post-deploy verification

```bash
BASE_URL=https://staging.yourdomain.com npm run smoke
curl -s https://staging.yourdomain.com/api/health | jq .
```

Manual:

- [ ] Super-admin login → provision test tenant
- [ ] Tenant admin: student create, fee invoice, attendance mark
- [ ] Parent OTP login (console SMS log)
- [ ] `/s/{slug}` public site loads
- [ ] `/tenant/admin/system/backup` downloads JSON
- [ ] Branding colors apply after save
- [ ] 2FA setup for admin (optional)

## 5. Cron (staging)

```bash
# Daily 02:00 retention
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://staging.yourdomain.com/api/cron/retention
```

## 6. Go-live gates

- [ ] `npm audit --audit-level=high` reviewed
- [ ] Payment keys switched from sandbox only after finance UAT
- [ ] SMS provider live sender-ID approved
- [ ] Backup restore drill once
- [ ] Support ticket path tested (tenant → super-admin)
