#!/usr/bin/env node
/**
 * Cryptra smoke tests against a running API.
 *
 *   API_URL=http://localhost:3000 node scripts/smoke.mjs
 *   pnpm smoke
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv();

const BASE = (process.env.API_URL || process.env.SMOKE_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

let passed = 0;
let failed = 0;

async function check(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    console.log(`✓ ${name} (${Date.now() - t0}ms)`);
    passed += 1;
  } catch (e) {
    console.error(`✗ ${name}: ${e instanceof Error ? e.message : e}`);
    failed += 1;
  }
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

console.log(`Smoke → ${BASE}\n`);

await check('GET /health returns JSON status', async () => {
  const { status, body } = await get('/health');
  if (status !== 200 && status !== 503) throw new Error(`unexpected HTTP ${status}`);
  if (!body || typeof body !== 'object' || !body.status) {
    throw new Error('missing status field');
  }
  if (!Array.isArray(body.checks)) throw new Error('missing checks[]');
  console.log(`    overall=${body.status} checks=${body.checks.map((c) => c.name + ':' + c.status).join(', ')}`);
});

await check('GET /ready', async () => {
  const { status, body } = await get('/ready');
  if (status !== 200 && status !== 503) throw new Error(`HTTP ${status}`);
  if (!body?.status) throw new Error('no status');
});

await check('GET /metrics exposes prometheus text', async () => {
  const res = await fetch(`${BASE}/metrics`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes('http_request') && !text.includes('# HELP')) {
    // still accept non-empty metrics
    if (text.length < 10) throw new Error('empty metrics');
  }
});

await check('GET /api/v1/market/prices (public market)', async () => {
  const { status, body } = await get('/api/v1/market/prices');
  // may be 200 with data or error if upstream down — accept 200
  if (status === 404) throw new Error('route missing');
  if (status >= 500) throw new Error(`server error ${status}`);
  if (status === 200 && body && typeof body === 'object') {
    console.log(`    keys=${Object.keys(body.data || body).slice(0, 5).join(',')}`);
  }
});

await check('POST /api/v1/auth/telegram rejects empty body', async () => {
  const res = await fetch(`${BASE}/api/v1/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(10_000),
  });
  // expect 4xx validation, not 5xx
  if (res.status >= 500) throw new Error(`unexpected 5xx ${res.status}`);
  if (res.status === 200) throw new Error('should not accept empty initData');
});

console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
