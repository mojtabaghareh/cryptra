#!/usr/bin/env node
/**
 * Set Telegram Bot Menu Button → Mini App URL
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_MINI_APP_URL=https://... node scripts/set-menu-button.mjs
 *   pnpm setup:menu
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.TELEGRAM_MINI_APP_URL;
const text = process.env.TELEGRAM_MENU_TEXT || 'Open Cryptra';

if (!token || token.includes('your_telegram')) {
  console.error('Missing TELEGRAM_BOT_TOKEN');
  process.exit(1);
}
if (!url || !url.startsWith('https://')) {
  console.error('TELEGRAM_MINI_APP_URL must be https://…');
  process.exit(1);
}

const api = `https://api.telegram.org/bot${token}`;

async function call(method, body) {
  const res = await fetch(`${api}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`${method}: ${JSON.stringify(data)}`);
  }
  return data.result;
}

const me = await call('getMe', {});
console.log(`Bot: @${me.username} (${me.id})`);

await call('setChatMenuButton', {
  menu_button: {
    type: 'web_app',
    text,
    web_app: { url },
  },
});

console.log(`Menu button → ${url}`);
console.log('Done.');
