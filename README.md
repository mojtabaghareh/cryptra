# Cryptra

> **Financial Intelligence Layer**  
> We don’t help users trade. We help users understand how they decide.

**Stack:** Telegram Mini App + Bot · Fastify · Prisma · Redis · Jupiter / 1inch / Hyperliquid

---

## Launch (production)

راهنمای کامل از دامنه تا Menu Button و smoke test:

→ **[LAUNCH.md](./LAUNCH.md)**

```bash
cp .env.example .env          # secrets واقعی
pnpm launch:check            # قبل از go-live
docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d --build
pnpm setup:menu
API_URL=https://app.yourdomain.com pnpm smoke
```

Deploy جزئیات: [DEPLOY.md](./DEPLOY.md) · شروع توسعه: [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## Dev

```bash
docker compose up -d
pnpm install && bash scripts/bootstrap-db.sh
pnpm dev:api && pnpm dev:bot && pnpm dev:miniapp
```

---

## قابلیت‌ها

- Auth تلگرام (initData → JWT) + production secret guard
- Wallet MetaMask / Phantom / TON + balances
- Swap: Quote → Build → Sign & send → Execute
- Perps: HL mid tracking (+ optional agent env)
- XP / Referral / Achievements / Reflection / Leaderboard
- `/health` · `/status` · `pnpm smoke` · Telegram alerts
