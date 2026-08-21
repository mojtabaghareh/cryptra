import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';
import { xpEngine } from '@cryptra/xp';

const REFERRAL_XP_REWARD = 100; // XP given to referrer when referee becomes active
const REFEREE_XP_BONUS = 50; // XP given to new user for using a code

export interface ApplyReferralResult {
  success: boolean;
  referrerId?: string;
  message: string;
}

export class ReferralService {
  /**
   * Apply a referral code for a newly registered user.
   * Must be called only once, shortly after registration.
   */
  async applyCode(refereeId: string, code: string): Promise<ApplyReferralResult> {
    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      throw new AppError({
        code: ErrorCodes.REFERRAL_CODE_INVALID,
        message: 'Referral code is empty',
      });
    }

    const referee = await prisma.user.findUnique({ where: { id: refereeId } });
    if (!referee) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }

    // Already has a referrer?
    if (referee.referredById) {
      throw new AppError({
        code: ErrorCodes.REFERRAL_ALREADY_ACTIVE,
        message: 'User already has a referrer',
      });
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: normalized },
    });

    if (!referrer) {
      throw new AppError({
        code: ErrorCodes.REFERRAL_CODE_INVALID,
        message: 'Invalid referral code',
      });
    }

    // Self-referral protection
    if (referrer.id === refereeId) {
      throw new AppError({
        code: ErrorCodes.REFERRAL_SELF_REFERRAL,
        message: 'Cannot use your own referral code',
      });
    }

    // Create referral record + link users
    await prisma.$transaction([
      prisma.user.update({
        where: { id: refereeId },
        data: { referredById: referrer.id },
      }),
      prisma.referral.create({
        data: {
          referrerId: referrer.id,
          refereeId,
          status: 'PENDING',
        },
      }),
    ]);

    // Give small bonus XP to the new user
    await xpEngine.award({
      userId: refereeId,
      source: 'REFERRAL',
      amount: REFEREE_XP_BONUS,
      description: `Joined with referral code ${normalized}`,
    });

    return {
      success: true,
      referrerId: referrer.id,
      message: 'Referral code applied successfully',
    };
  }

  /**
   * Activate a referral (e.g. after referee completes first swap/trade).
   * Awards XP to the referrer.
   */
  async activate(refereeId: string): Promise<void> {
    const referral = await prisma.referral.findUnique({
      where: { refereeId },
    });

    if (!referral || referral.status !== 'PENDING') {
      return; // already active or doesn't exist
    }

    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date(),
        rewardAmount: REFERRAL_XP_REWARD,
      },
    });

    await xpEngine.award({
      userId: referral.referrerId,
      source: 'REFERRAL',
      amount: REFERRAL_XP_REWARD,
      description: 'Referral activated',
      metadata: { refereeId },
    });
  }

  async getStats(userId: string) {
    const [total, active, pending] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.count({ where: { referrerId: userId, status: 'ACTIVE' } }),
      prisma.referral.count({ where: { referrerId: userId, status: 'PENDING' } }),
    ]);

    return { total, active, pending };
  }

  async getReferrals(userId: string, limit = 50) {
    return prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const referralService = new ReferralService();
