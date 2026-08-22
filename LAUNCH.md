# Cryptra — Launch Checklist (Production)

هدف: از ریپو تا کاربر واقعی داخل تلگرام، بدون placeholder.

---

## ۰. پیش‌نیاز

- [ ] دامنه (مثلاً `app.yourdomain.com`) با DNS A → IP سرور
- [ ] سرور Linux با Docker + Docker Compose
- [ ] پورت‌های `80` و `443` باز
- [ ] توکن بات از BotFather
- [ ] `ADMIN_TELEGRAM_CHAT_ID` (آیدی عددی خودت)

```bash
git clone https://github.com/mojtabaghareh/cryptra.git
cd cryptra
cp .env.example .env
```

---

## ۱. متغیرهای `.env` (الزامی)

```env
NODE_ENV=production
JWT_SECRET=<حداقل ۳۲ کاراکتر تصادفی قوی>
TELEGRAM_BOT_TOKEN=<از BotFather>
TELEGRAM_BOT_USERNAME=Cryptrabot
TELEGRAM_MINI_APP_URL=https://app.yourdomain.com
ADMIN_TELEGRAM_CHAT_ID=<83355128 یا آیدی تو>
ADMIN_API_KEY=<رشته تصادفی قوی>
DATABASE_URL=postgresql://cryptra:STRONG_PASSWORD@postgres:5432/cryptra
REDIS_URL=redis://redis:6379
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
POSTGRES_PASSWORD=<همان پسورد DB>
```

اختیاری:

```env
ONEINCH_API_KEY=
HYPERLIQUID_AGENT_PRIVATE_KEY=   # فقط اگر execution واقعی HL می‌خواهی
HYPERLIQUID_AGENT_ADDRESS=
```

بررسی خودکار:

```bash
pnpm launch:check
```

باید همه آیتم‌های critical سبز باشند.

---

## ۲. HTTPS ثابت (Caddy)

```bash
export DOMAIN=app.yourdomain.com
export EMAIL=ops@yourdomain.com

docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d --build
```

صبر کن تا گواهی صادر شود، بعد:

```bash
curl -fsS https://$DOMAIN/health | jq .
curl -fsS https://$DOMAIN/ | head
```

بدون دامنه (موقت):

```bash
npx cloudflared tunnel --url http://localhost:8080
# TELEGRAM_MINI_APP_URL را روی URL تونل بگذار
```

---

## ۳. دیتابیس

```bash
docker compose -f docker-compose.prod.yml exec api \
  sh -c 'pnpm db:generate && pnpm db:push && pnpm db:seed'
```

---

## ۴. Menu Button تلگرام

`TELEGRAM_MINI_APP_URL` باید **https://** باشد.

```bash
pnpm setup:menu
```

خروجی مورد انتظار: `Menu button → https://...`

در BotFather هم می‌توانی Web App را ست کنی؛ `setup:menu` کافی است.

---

## ۵. تست روی سرور

```bash
API_URL=https://app.yourdomain.com pnpm smoke
```

یا از داخل شبکه:

```bash
API_URL=http://localhost:3000 pnpm smoke
```

باید همه ✓ باشند. اگر `/health` → unhealthy، لاگ api و postgres/redis را ببین.

در Mini App: **Profile → System status** یا `/status`.

---

## ۶. مسیر کاربر واقعی

1. باز کردن `@Cryptrabot` در تلگرام
2. `/start` → دکمه Menu / Open Cryptra
3. Mini App با JWT (initData)
4. Wallet → MetaMask / Phantom
5. Trade → Quote → Build → Sign & send → Execute
6. Profile → XP / Reflection / Status

---

## ۷. Hyperliquid agent (اختیاری)

بدون کلید: orderها با **mid واقعی** در DB ثبت می‌شوند (tracking).

با کلید agent:

```env
HYPERLIQUID_AGENT_PRIVATE_KEY=0x...
HYPERLIQUID_AGENT_ADDRESS=0x...
```

کد در `packages/hyperliquid` وقتی کلید باشد تلاش می‌کند action را به API بفرستد.  
**هرگز** کلید را در فرانت یا Git نگذار.

---

## ۸. امنیت (hardening)

- [ ] `JWT_SECRET` ≠ مقدار نمونه و ≥ ۳۲ کاراکتر
- [ ] `ADMIN_API_KEY` قوی؛ فقط با هدر `x-admin-key`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ALLOWED_ORIGINS` فقط دامنه Mini App
- [ ] Postgres از اینترنت publish نشود (فقط شبکه Docker)
- [ ] روت‌های ادمین و توکن بات لو نروند
- [ ] `pnpm launch:check` قبل از go-live
- [ ] CI روی `main` سبز باشد

API در production اگر secret ضعیف باشد **بالا نمی‌آید** (`assertProductionSecurity`).

---

## ۹. مانیتورینگ بعد از launch

| ابزار | استفاده |
|--------|----------|
| `GET /health` | Load balancer / uptime |
| `GET /metrics` | Prometheus |
| Telegram admin | unhealthy / HTTP 5xx |
| Mini App `/status` | تشخیص سریع |
| `pnpm smoke` | بعد از هر deploy |

---

## ۱۰. Rollback سریع

```bash
cd cryptra
git log --oneline -5
git checkout <good-sha>
docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d --build
```

---

## وضعیت تکمیل

| آیتم | وضعیت در کد |
|------|-------------|
| HTTPS / Caddy / tunnel docs | ✓ |
| `setup:menu` | ✓ |
| `pnpm smoke` | ✓ |
| `pnpm launch:check` | ✓ |
| Security boot in production | ✓ |
| HL mid tracking | ✓ |
| HL agent optional | ✓ (env-gated) |
| دامنه واقعی شما | باید روی سرور شما ست شود |

بعد از انجام مراحل ۱–۵ روی سرور، پروژه از نظر launch آماده است.
