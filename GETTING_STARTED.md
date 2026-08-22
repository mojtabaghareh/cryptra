# Cryptra — از صفر تا ورود کاربر

هدف: کاربر `@Cryptrabot` را باز کند → دکمه Mini App → داخل اپ auth شود.

## پیش‌نیاز

- Node 18+
- pnpm 9+
- Docker (Postgres + Redis)
- توکن ربات از BotFather
- برای تست داخل تلگرام: یک URL با **HTTPS** (Cloudflare Tunnel / ngrok / Vercel)

## ۱) زیرساخت لوکال

```bash
git clone https://github.com/mojtabaghareh/cryptra.git
cd cryptra
cp .env.example .env
```

در `.env` حداقل این‌ها را پر کن:

```env
DATABASE_URL=postgresql://cryptra:cryptra@localhost:5432/cryptra
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-to-a-long-random-string-32chars
TELEGRAM_BOT_TOKEN=8960...your_token
TELEGRAM_BOT_USERNAME=Cryptrabot
TELEGRAM_MINI_APP_URL=https://YOUR-HTTPS-URL
ADMIN_API_KEY=dev-admin-key
CORS_ALLOWED_ORIGINS=
PORT=3000
```

```bash
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
```

## ۲) سه سرویس را بالا بیاور

ترمینال ۱ — API:

```bash
pnpm dev:api
# http://localhost:3000/health
```

ترمینال ۲ — Bot:

```bash
pnpm dev:bot
```

ترمینال ۳ — Mini App:

```bash
pnpm dev:miniapp
# http://localhost:5173  (proxy /api → :3000)
```

## ۳) HTTPS برای تلگرام

تلگرام فقط HTTPS می‌پذیرد. یکی از گزینه‌ها:

```bash
# Cloudflare quick tunnel به Mini App
npx cloudflared tunnel --url http://localhost:5173
```

خروجی را در `.env` بگذار:

```env
TELEGRAM_MINI_APP_URL=https://xxxx.trycloudflare.com
```

Bot را یک‌بار ری‌استارت کن، بعد:

```bash
export TELEGRAM_BOT_TOKEN=...
export TELEGRAM_MINI_APP_URL=https://xxxx.trycloudflare.com
node scripts/set-menu-button.mjs
```

## ۴) ورود کاربر

1. در تلگرام `@Cryptrabot` را باز کن
2. `/start`
3. دکمه **🚀 Open Cryptra** یا Menu Button
4. Mini App باز می‌شود → `initData` → `POST /api/v1/auth/telegram` → JWT
5. Profile / Trade / Markets در دسترس‌اند

## عیب‌یابی

| مشکل | کار |
|------|-----|
| دکمه Open نیست | `TELEGRAM_MINI_APP_URL` خالی یا بدون https |
| Auth failed | توکن ربات اشتباه یا initData منقضی |
| Markets خالی | API بالا نیست / proxy |
| DB error | `docker compose up -d` و `DATABASE_URL` |
| CORS | در dev از proxy ویت استفاده کن (same origin) |

## پورت‌ها

| سرویس | پورت |
|--------|------|
| API | 3000 |
| Mini App (vite) | 5173 |
| Postgres | 5432 |
| Redis | 6379 |
