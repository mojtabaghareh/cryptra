#!/usr/bin/env node
/**
 * Sets Telegram bot Menu Button → Mini App URL
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_MINI_APP_URL=https://... node scripts/set-menu-button.mjs
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.TELEGRAM_MINI_APP_URL;
const text = process.env.TELEGRAM_MENU_TEXT || 'Open Cryptra';

if (!token || !url) {
  console.error('Need TELEGRAM_BOT_TOKEN and TELEGRAM_MINI_APP_URL');
  process.exit(1);
}

if (!url.startsWith('https://')) {
  console.error('TELEGRAM_MINI_APP_URL must be https:// (Telegram requirement)');
  process.exit(1);
}

const body = {
  menu_button: {
    type: 'web_app',
    text,
    web_app: { url },
  },
};

const res = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const json = await res.json();
console.log(JSON.stringify(json, null, 2));

if (!json.ok) process.exit(1);
console.log('\n✅ Menu button set. Open @Cryptrabot and tap the menu button.');
