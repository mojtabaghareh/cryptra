# Cryptra — Serverless Deploy (Vercel)

## What runs on serverless

| Piece | How |
|-------|-----|
| Telegram Mini App (static) | Vercel static from `apps/telegram-mini-app/dist` |
| API | Vercel Serverless Functions under `/api` |
| Bot (long polling) | **Not** serverless — needs always-on process (Railway / Fly / VPS) |

## One-time setup

1. Push repo to GitHub (already: `mojtabaghareh/cryptra`)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this repo
3. **Root Directory**: leave empty (uses root `vercel.json`)
4. Environment variables:

```
TELEGRAM_BOT_TOKEN=your_bot_token
JWT_SECRET=at-least-32-random-chars
```

5. Deploy

## After deploy

You get a URL like:

```
https://cryptra-xxx.vercel.app
```

### Connect to BotFather

1. `@BotFather` → `/mybots` → Cryptra → **Bot Settings** → **Menu Button**
2. URL = `https://YOUR-VERCEL-URL.vercel.app`
3. Title = `Open Cryptra`

Or via API:

```bash
curl -X POST "https://api.telegram.org/bot$TOKEN/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button":{"type":"web_app","text":"Open Cryptra","web_app":{"url":"https://YOUR-VERCEL-URL.vercel.app"}}}'
```

## Local serverless test

```bash
npm i -g vercel
vercel dev
```

## Endpoints available

- `GET  /api/health`
- `GET  /api/v1/market/prices`
- `POST /api/v1/auth/telegram`  body: `{ "initData": "..." }`
- `GET  /api/v1/portfolio/me`   header: `Authorization: Bearer <token>`

## Full backend (Postgres + Redis + Bot)

Use Railway / Fly / Docker from `services/api` + `apps/telegram-bot`.
Serverless covers Mini App + auth + markets so Telegram works without a VPS first.
