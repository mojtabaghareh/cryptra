# Cryptra

> **Financial Intelligence Layer**  
> ما به کاربر کمک نمی‌کنیم ترید کند.  
> ما به کاربر کمک می‌کنیم بفهمد چطور تصمیم می‌گیرد.

**Stack:** Telegram Mini App + Bot · Fastify API · Prisma · Redis · Jupiter / 1inch / Hyperliquid

---

## شروع سریع

```bash
git clone https://github.com/mojtabaghareh/cryptra.git
cd cryptra
cp .env.example .env
# TELEGRAM_BOT_TOKEN + JWT_SECRET را پر کنید

docker compose up -d          # Postgres + Redis
pnpm install
bash scripts/bootstrap-db.sh

pnpm dev:api      # :3000
pnpm dev:bot
pnpm dev:miniapp  # :5173
```

ورود کاربر و Menu Button: **[GETTING_STARTED.md](./GETTING_STARTED.md)**  
Deploy پروداکشن: **[DEPLOY.md](./DEPLOY.md)**

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## قابلیت‌های فعلی

- Auth تلگرام (initData → JWT)
- Wallet: MetaMask / Phantom / TON + موجودی on-chain
- Swap: Quote → Build → Sign & send → Execute (Jupiter / 1inch)
- Perps: ثبت با mid واقعی Hyperliquid
- XP / Level / Referral / Achievements / Reflection / Leaderboard
- Bot: `/start` + Menu Button Mini App

---

## ساختار

```
apps/telegram-mini-app   Mini App (Vite + React)
apps/telegram-bot        Grammy bot
services/api             Fastify /api/v1
packages/*               domain packages
docker-compose.yml       dev infra
docker-compose.prod.yml  full stack
```

---

## ماموریت

*We don’t help users trade. We help users understand how they decide.*
