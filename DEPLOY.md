# Cryptra — Deploy

## مسیر سریع (لوکال پروداکشن‌مانند)

```bash
cp .env.example .env
# TELEGRAM_BOT_TOKEN, JWT_SECRET, TELEGRAM_MINI_APP_URL را پر کن

docker compose -f docker-compose.prod.yml up -d --build
```

Mini App: `http://localhost:8080`  
API: `http://localhost:3000/health`

### دیتابیس بعد از بالا آمدن API

روی ماشین میزبان (با `DATABASE_URL` اشاره به localhost:5432 اگر پورت publish شده):

```bash
# یا exec داخل کانتینر api:
docker compose -f docker-compose.prod.yml exec api \
  sh -c 'pnpm db:generate && pnpm db:push && pnpm db:seed'
```

اگر پورت postgres در prod compose publish نیست، موقتاً در `docker-compose.prod.yml` اضافه کن:

```yaml
ports:
  - "5432:5432"
```

## تلگرام + HTTPS

1. Mini App را پشت HTTPS بگذار (Cloudflare Tunnel / Caddy / Traefik):

```bash
npx cloudflared tunnel --url http://localhost:8080
```

2. در `.env`:

```env
TELEGRAM_MINI_APP_URL=https://xxxx.trycloudflare.com
```

3. Bot را ری‌استارت کن یا:

```bash
pnpm setup:menu
```

## متغیرهای حیاتی

| Key | توضیح |
|-----|--------|
| `TELEGRAM_BOT_TOKEN` | BotFather |
| `JWT_SECRET` | حداقل ۳۲ کاراکتر |
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Redis |
| `TELEGRAM_MINI_APP_URL` | **https://** فقط |
| `ONEINCH_API_KEY` | اختیاری برای EVM swap |
| `ADMIN_API_KEY` | پنل ادمین |

## توسعه (بدون Docker اپ‌ها)

```bash
docker compose up -d          # فقط pg + redis
pnpm install
bash scripts/bootstrap-db.sh
pnpm dev:api
pnpm dev:bot
pnpm dev:miniapp
```

جزئیات ورود کاربر: [GETTING_STARTED.md](./GETTING_STARTED.md)
