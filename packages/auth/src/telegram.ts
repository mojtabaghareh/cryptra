import crypto from 'node:crypto';
import { getConfig } from '@cryptra/config';
import { AppError, ErrorCodes } from '@cryptra/core';

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean;
  photo_url?: string;
}

export interface ValidatedTelegramData {
  user: TelegramWebAppUser;
  authDate: number;
  queryId?: string;
}

/**
 * Validate Telegram Mini App initData according to official algorithm.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramWebAppData(initData: string): ValidatedTelegramData {
  const config = getConfig();
  const botToken = config.TELEGRAM_BOT_TOKEN;

  if (!initData || typeof initData !== 'string') {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Missing Telegram initData',
    });
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Missing hash in initData',
    });
  }

  params.delete('hash');
  const entries = Array.from(params.entries());
  entries.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Invalid Telegram initData signature',
    });
  }

  const authDate = Number(params.get('auth_date') ?? 0);
  const now = Math.floor(Date.now() / 1000);
  // Allow 24 hours skew
  if (now - authDate > 86400) {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Telegram initData expired',
    });
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Missing user in initData',
    });
  }

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Invalid user JSON in initData',
    });
  }

  if (!user?.id) {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Invalid user object in initData',
    });
  }

  return {
    user,
    authDate,
    queryId: params.get('query_id') ?? undefined,
  };
}
