import { userRepository } from '@cryptra/database';
import { writeAuditLog, AuditActions } from '@cryptra/security';
import { AppError, ErrorCodes } from '@cryptra/core';
import { validateTelegramWebAppData } from './telegram';
import { signToken } from './jwt';
import { randomBytes } from 'node:crypto';

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export interface AuthResult {
  user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    languageCode: string | null;
    xp: number;
    level: number;
    feeTier: number;
    referralCode: string;
  };
  token: string;
  isNewUser: boolean;
}

/**
 * Authenticate a user via Telegram Mini App initData.
 * Creates the user if they don't exist yet.
 */
export async function authenticateWithTelegram(
  initData: string,
  options?: { ip?: string; userAgent?: string },
): Promise<AuthResult> {
  const { user: tgUser } = validateTelegramWebAppData(initData);

  let user = await userRepository.findByTelegramId(tgUser.id);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    let referralCode = generateReferralCode();
    // Ensure uniqueness
    while (await userRepository.findByReferralCode(referralCode)) {
      referralCode = generateReferralCode();
    }

    user = await userRepository.create({
      telegramId: BigInt(tgUser.id),
      username: tgUser.username ?? null,
      firstName: tgUser.first_name ?? null,
      lastName: tgUser.last_name ?? null,
      languageCode: tgUser.language_code ?? 'en',
      isPremium: tgUser.is_premium ?? false,
      isBot: tgUser.is_bot ?? false,
      referralCode,
    });
  } else {
    // Update last active + basic profile fields
    user = await userRepository.update(user.id, {
      username: tgUser.username ?? user.username,
      firstName: tgUser.first_name ?? user.firstName,
      lastName: tgUser.last_name ?? user.lastName,
      languageCode: tgUser.language_code ?? user.languageCode,
      isPremium: tgUser.is_premium ?? user.isPremium,
      lastActiveAt: new Date(),
    });
  }

  if (!user.isActive) {
    throw new AppError({
      code: ErrorCodes.FORBIDDEN,
      message: 'Account is disabled',
    });
  }

  const token = signToken({
    sub: user.id,
    telegramId: user.telegramId.toString(),
    role: 'user',
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditActions.USER_LOGIN,
    ip: options?.ip,
    userAgent: options?.userAgent,
    metadata: { isNewUser, method: 'telegram' },
  });

  return {
    user: {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      languageCode: user.languageCode,
      xp: user.xp,
      level: user.level,
      feeTier: user.feeTier,
      referralCode: user.referralCode,
    },
    token,
    isNewUser,
  };
}
