import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';

/**
 * Referral orchestration using DB — domain package @cryptra/referral used when available.
 */
export class ReferralService {
  async getCode(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true },
    });
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }
    if (user.referralCode) return user.referralCode;

    const code = `CRY${userId.slice(0, 8).toUpperCase()}`;
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return code;
  }

  async stats(userId: string) {
    const referred = await prisma.user.count({
      where: { referredById: userId },
    }).catch(() => 0);
    return { referredCount: referred };
  }

  async applyCode(userId: string, code: string) {
    const normalized = code.trim().toUpperCase();
    const referrer = await prisma.user.findFirst({
      where: { referralCode: normalized },
    });
    if (!referrer || referrer.id === userId) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Invalid referral code',
      });
    }
    const me = await prisma.user.findUnique({ where: { id: userId } });
    if (!me) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }
    if (me.referredById) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Referral already set',
      });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { referredById: referrer.id },
    });
    return { referrerId: referrer.id };
  }
}

export const referralService = new ReferralService();
