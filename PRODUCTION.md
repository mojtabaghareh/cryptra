# Production — cryptraa.ir

| Item | Value |
|------|--------|
| Domain | `cryptraa.ir` |
| Server IP | `5.75.205.142` (Hetzner DE) |
| Mini App URL | `https://cryptraa.ir` |

DNS must be **A @ → 5.75.205.142** (already verified on check-host).

---

## On the VPS (you must run this — Git cannot SSH to your server)

```bash
ssh root@5.75.205.142

# Docker if missing
curl -fsSL https://get.docker.com | sh

cd /opt
git clone https://github.com/mojtabaghareh/cryptra.git
cd cryptra

cp .env.production.example .env
nano .env   # set JWT_SECRET, TELEGRAM_BOT_TOKEN, POSTGRES_PASSWORD, ADMIN_API_KEY

chmod +x scripts/deploy-cryptraa.sh
export EMAIL=your-real@email.com
bash scripts/deploy-cryptraa.sh
```

Or manually:

```bash
export DOMAIN=cryptraa.ir EMAIL=your@email.com
docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d --build
```

Then:

```bash
pnpm setup:menu   # or node scripts/set-menu-button.mjs
curl -fsS https://cryptraa.ir/health
```

BotFather Menu / WebApp URL = **`https://cryptraa.ir`** (not github.io).

---

## What was set in this repo

- Caddyfile hosts `cryptraa.ir` + `www.cryptraa.ir`
- Default `TELEGRAM_MINI_APP_URL=https://cryptraa.ir`
- `.env.production.example` for the VPS
- `scripts/deploy-cryptraa.sh` one-shot deploy

Secrets (bot token, JWT) are **never** committed — only you put them in server `.env`.
