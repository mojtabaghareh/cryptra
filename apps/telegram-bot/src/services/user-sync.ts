import { userRepository } from '@cryptra/database';
import { achievementService } from '@cryptra/achievements';
import { randomBytes } from 'node:crypto';
import type { User as TgUser } from 'grammy/types';

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Ensure the Telegram user exists in our DB.
 * Creates account on first contact.
 */
export async function ensureUser(tgUser: TgUser) {
  let user = await userRepository.findByTelegramId(tgUser.id);

  if (!user) {
    let referralCode = generateReferralCode();
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

    // First login achievement
    try {
      await achievementService.tryUnlock(user.id, 'FIRST_LOGIN');
    } catch {
      // non-blocking
    }
  } else {
    user = await userRepository.update(user.id, {
      username: tgUser.username ?? user.username,
      firstName: tgUser.first_name ?? user.firstName,
      lastName: tgUser.last_name ?? user.lastName,
      languageCode: tgUser.language_code ?? user.languageCode,
      isPremium: tgUser.is_premium ?? user.isPremium,
      lastActiveAt: new Date(),
    });
  }

  return user;
}
