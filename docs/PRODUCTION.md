# Edupro — Production Deploy Guide

## Prerequisites

- Node.js 20+ (22 recommended)
- PostgreSQL 15+
- Docker & Docker Compose (optional but recommended)
- Domain + TLS (Cloudflare / Let’s Encrypt)

---

## 1. Environment

```bash
cp .env.example .env
# Set strong AUTH_SECRET:
openssl rand -base64 32
```

Required vars:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Min 32-char random secret |
| `AUTH_URL` | Public HTTPS origin |
| `NEXT_PUBLIC_APP_URL` | Same as AUTH_URL |
| `ROOT_DOMAIN` | e.g. `edupro.app` |

Switch Prisma to PostgreSQL in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 2. Database

```bash
npx prisma generate
npx prisma migrate deploy   # or: npx prisma db push
npm run db:seed
```

---

## 3. Build & Run (bare metal)

```bash
npm ci
npm run build
npm start                   # listens on PORT (default 3000)
```

Health check: `GET /api/health` → `{ "status": "ok" }`

---

## 4. Docker Compose

```bash
export AUTH_SECRET=$(openssl rand -base64 32)
docker compose up -d --build
```

Services:

| Service | Port | Notes |
|---------|------|-------|
| `app` | 3000 | Next.js standalone |
| `db` | 5432 | Postgres 16 |

After first boot, run migrations/seed once:

```bash
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
# (or mount seed script and run from a one-off container with deps)
```

> Note: production image is minimal (standalone). Prefer running migrate from CI or an init container that has Prisma CLI.

---

## 5. Reverse proxy (Nginx example)

```nginx
server {
  listen 443 ssl http2;
  server_name edupro.app *.edupro.app;

  ssl_certificate     /etc/ssl/certs/edupro.pem;
  ssl_certificate_key /etc/ssl/private/edupro.key;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 6. Security checklist

- [ ] Strong `AUTH_SECRET` (not default)
- [ ] HTTPS only + HSTS (enabled in `next.config.ts` when `NODE_ENV=production`)
- [ ] Postgres not exposed publicly
- [ ] Regular backups of Postgres volume
- [ ] Super Admin password rotated after first login
- [ ] SMS / payment keys only in server env (never `NEXT_PUBLIC_*`)
- [ ] `/api/health` monitored by uptime tool

---

## 7. Default seed accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `super@edupro.app` | `Super@1234` |
| Demo Tenant Admin | `admin@demo-madrasah.edu.bd` | `Admin@1234` |

**Change these immediately in production.**

---

## 8. Scaling notes

- Horizontal: multiple app replicas behind LB; sticky sessions not required (JWT session strategy).
- DB: connection pooler (PgBouncer) for > few workers.
- Multi-tenant isolation: all queries filtered by `tenantId` + server-side context.
- SMS/WhatsApp: plug provider in `communication-repository.ts`.


---

## Docker verify

```bash
# Build & start
export AUTH_SECRET=$(openssl rand -base64 32)
docker compose up -d --build

# Wait for healthy
docker compose ps
curl -s http://localhost:3000/api/health | jq .

# Logs
docker compose logs -f app

# Stop
docker compose down
```

App service depends on Postgres healthcheck; app exposes `/api/health` for LB probes.


---

## Rate limiting

- Default: in-memory (single node)
- Scale-out: set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- Use `rateLimitAsync` for Redis-backed paths when wiring new endpoints

## Data retention cron

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain/api/cron/retention
```

Schedule daily via system cron, GitHub Actions scheduled workflow, or cloud scheduler.
