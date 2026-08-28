import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

/**
 * Validate Telegram Mini App initData per official algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramWebAppInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 86400,
): { ok: true; user: TelegramWebAppUser | null; authDate: number } | { ok: false; reason: string } {
  if (!initData || !botToken) {
    return { ok: false, reason: 'missing initData or botToken' };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, reason: 'missing hash' };

  params.delete('hash');
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  try {
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'invalid hash' };
    }
  } catch {
    return { ok: false, reason: 'hash compare failed' };
  }

  const authDate = Number(params.get('auth_date') ?? 0);
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > maxAgeSec) {
    return { ok: false, reason: 'auth_date expired' };
  }

  return {
    ok: true,
    user: parseTelegramUser(params.get('user')),
    authDate,
  };
}

export function parseTelegramUser(raw: string | null): TelegramWebAppUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TelegramWebAppUser;
  } catch {
    return null;
  }
}
