#!/usr/bin/env node
/**
 * Pre-launch environment & security checklist.
 *   pnpm launch:check
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) {
    console.error('✗ .env not found (cp .env.example .env)');
    process.exit(1);
  }
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv();

const weakSecrets = [
  'your-super-secret-jwt-key-at-least-32-chars',
  'your_telegram_bot_token',
  'your-admin-api-key',
  'change-me',
  'secret',
];

let critical = 0;
let warn = 0;

function ok(msg) {
  console.log(`✓ ${msg}`);
}
function fail(msg) {
  console.error(`✗ CRITICAL: ${msg}`);
  critical += 1;
}
function soft(msg) {
  console.warn(`! WARN: ${msg}`);
  warn += 1;
}

const jwt = process.env.JWT_SECRET || '';
if (jwt.length < 32) fail('JWT_SECRET must be at least 32 characters');
else if (weakSecrets.some((w) => jwt.includes(w))) fail('JWT_SECRET looks like a placeholder');
else ok('JWT_SECRET length OK');

const token = process.env.TELEGRAM_BOT_TOKEN || '';
if (!token || token.includes('your_telegram')) fail('TELEGRAM_BOT_TOKEN missing or placeholder');
else if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) soft('TELEGRAM_BOT_TOKEN format unusual');
else ok('TELEGRAM_BOT_TOKEN set');

const mini = process.env.TELEGRAM_MINI_APP_URL || '';
if (!mini) fail('TELEGRAM_MINI_APP_URL required for Menu Button');
else if (!mini.startsWith('https://')) fail('TELEGRAM_MINI_APP_URL must be https://');
else ok(`TELEGRAM_MINI_APP_URL = ${mini}`);

if (!process.env.DATABASE_URL) fail('DATABASE_URL missing');
else ok('DATABASE_URL set');

if (!process.env.REDIS_URL) soft('REDIS_URL missing (rate limit may degrade)');
else ok('REDIS_URL set');

const adminKey = process.env.ADMIN_API_KEY || '';
if (!adminKey || weakSecrets.some((w) => adminKey.includes(w))) {
  soft('ADMIN_API_KEY weak or placeholder');
} else ok('ADMIN_API_KEY set');

if (!process.env.ADMIN_TELEGRAM_CHAT_ID) soft('ADMIN_TELEGRAM_CHAT_ID not set (no Telegram alerts)');
else ok('ADMIN_TELEGRAM_CHAT_ID set');

if (process.env.NODE_ENV === 'production') {
  ok('NODE_ENV=production');
  const cors = process.env.CORS_ALLOWED_ORIGINS || '';
  if (!cors || cors === '*') soft('CORS_ALLOWED_ORIGINS should be your Mini App origin in production');
  else ok(`CORS_ALLOWED_ORIGINS = ${cors}`);
} else {
  soft(`NODE_ENV=${process.env.NODE_ENV || 'undefined'} (use production on server)`);
}

if (process.env.HYPERLIQUID_AGENT_PRIVATE_KEY) {
  ok('HL agent key present (live exchange path enabled)');
} else {
  soft('HYPERLIQUID_AGENT_PRIVATE_KEY not set — perps track HL mid only');
}

console.log(`\nSummary: ${critical} critical, ${warn} warnings`);
if (critical > 0) {
  console.error('Fix critical items before launch.');
  process.exit(1);
}
console.log('Ready for: docker compose prod + pnpm setup:menu + pnpm smoke');
process.exit(0);
