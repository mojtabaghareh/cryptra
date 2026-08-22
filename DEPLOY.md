# Cryptra — Deploy

## مسیر سریع (لوکال پروداکشن‌مانند)

```bash
cp .env.example .env
# TELEGRAM_BOT_TOKEN, JWT_SECRET, TELEGRAM_MINI_APP_URL را پر کن

docker compose -f docker-compose.prod.yml up -d --build
```

- Mini App: `http://localhost:8080`
- API: `http://localhost:3000/health`

### دیتابیس

```bash
docker compose -f docker-compose.prod.yml exec api \
  sh -c 'pnpm db:generate && pnpm db:push && pnpm db:seed'
```

اگر پورت postgres publish نیست، موقتاً در compose اضافه کن: `"5432:5432"`.

---

## HTTPS با Caddy (دامنه واقعی)

1. DNS: `A` رکورد `app.example.com` → IP سرور
2. پورت‌های `80` و `443` باز باشند
3. اجرا:

```bash
export DOMAIN=app.example.com
export EMAIL=ops@example.com

docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d --build
```

Caddy به‌صورت خودکار گواهی Let's Encrypt می‌گیرد.

4. در `.env`:

```env
TELEGRAM_MINI_APP_URL=https://app.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
```

5. Menu Button:

```bash
pnpm setup:menu
```

فایل‌ها:
- `infrastructure/caddy/Caddyfile`
- `docker-compose.caddy.yml` (overlay روی prod)

---

## بدون دامنه (Cloudflare Tunnel)

```bash
npx cloudflared tunnel --url http://localhost:8080
# یا وقتی Caddy محلی نیست: http://localhost:8080
```

`TELEGRAM_MINI_APP_URL` را روی URL تونل بگذار و bot را ری‌استارت / `pnpm setup:menu`.

---

## CI

| Workflow | کار |
|----------|-----|
| `.github/workflows/ci.yml` | install + prisma generate + miniapp build + docker build |
| `.github/workflows/security.yml` | audit + gitleaks + dependency review |
| `.github/workflows/deploy.yml` | manual dispatch (هوک SSH — فعال‌سازی با secrets) |

برای deploy خودکار، secrets را ست کن: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` و بخش کامنت‌شده در `deploy.yml` را باز کن.

---

## متغیرهای حیاتی

| Key | توضیح |
|-----|--------|
| `TELEGRAM_BOT_TOKEN` | BotFather |
| `JWT_SECRET` | ≥ ۳۲ کاراکتر |
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Redis |
| `TELEGRAM_MINI_APP_URL` | **فقط https://** |
| `DOMAIN` / `EMAIL` | برای Caddy |
| `ONEINCH_API_KEY` | اختیاری EVM |
| `ADMIN_API_KEY` | ادمین |

---

## توسعه

```bash
docker compose up -d
pnpm install
bash scripts/bootstrap-db.sh
pnpm dev:api && pnpm dev:bot && pnpm dev:miniapp
```

جزئیات ورود کاربر: [GETTING_STARTED.md](./GETTING_STARTED.md)
