import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

/**
 * Validate Telegram Mini App initData (HMAC-SHA256).
 * Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateInitData(initData: string, botToken: string): {
  ok: boolean;
  user?: Record<string, unknown>;
} {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false };

  params.delete('hash');
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculated = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculated !== hash) return { ok: false };

  // Optional: reject if auth_date too old (24h)
  const authDate = Number(params.get('auth_date') || 0);
  if (authDate && Date.now() / 1000 - authDate > 86400) {
    return { ok: false };
  }

  let user: Record<string, unknown> | undefined;
  const userRaw = params.get('user');
  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      // ignore
    }
  }

  return { ok: true, user };
}

function signJwt(payload: object, secret: string, expiresInSec = 604800): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url',
  );
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const jwtSecret = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || !jwtSecret) {
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured: TELEGRAM_BOT_TOKEN / JWT_SECRET',
    });
  }

  const initData =
    typeof req.body === 'object' && req.body
      ? (req.body as { initData?: string }).initData
      : undefined;

  if (!initData || typeof initData !== 'string') {
    return res.status(400).json({ success: false, error: 'initData required' });
  }

  const result = validateInitData(initData, botToken);
  if (!result.ok || !result.user) {
    return res.status(401).json({ success: false, error: 'Invalid Telegram initData' });
  }

  const user = result.user as {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };

  const token = signJwt(
    {
      sub: String(user.id),
      telegramId: user.id,
      username: user.username ?? null,
    },
    jwtSecret,
  );

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        telegramId: user.id,
        firstName: user.first_name ?? null,
        lastName: user.last_name ?? null,
        username: user.username ?? null,
        languageCode: user.language_code ?? 'en',
      },
    },
  });
}
