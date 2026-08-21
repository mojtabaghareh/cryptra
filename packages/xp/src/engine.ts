import { prisma, type XpSource } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';
import { levelService } from '@cryptra/levels';

export interface AwardXpInput {
  userId: string;
  source: XpSource;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface AwardXpResult {
  previousXp: number;
  newXp: number;
  awarded: number;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
}

/**
 * Anti-abuse limits (simple version).
 * Can be extended with Redis later.
 */
const DAILY_CAPS: Partial<Record<XpSource, number>> = {
  DAILY_LOGIN: 50,
  SWAP: 500,
  TRADE: 1000,
  REFERRAL: 300,
};

export class XpEngine {
  async award(input: AwardXpInput): Promise<AwardXpResult> {
    if (input.amount <= 0) {
      throw new AppError({
        code: ErrorCodes.XP_EVENT_INVALID,
        message: 'XP amount must be positive',
      });
    }

    // Basic daily cap check
    const cap = DAILY_CAPS[input.source];
    if (cap) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const todayTotal = await prisma.xpEvent.aggregate({
        where: {
          userId: input.userId,
          source: input.source,
          createdAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      });

      const alreadyEarned = todayTotal._sum.amount ?? 0;
      if (alreadyEarned >= cap) {
        // Silently award 0 instead of throwing (better UX)
        const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
        return {
          previousXp: user.xp,
          newXp: user.xp,
          awarded: 0,
          leveledUp: false,
          previousLevel: user.level,
          newLevel: user.level,
        };
      }

      // Clamp to remaining cap
      input.amount = Math.min(input.amount, cap - alreadyEarned);
    }

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new AppError({
        code: ErrorCodes.NOT_FOUND,
        message: 'User not found',
      });
    }

    const previousXp = user.xp;
    const previousLevel = user.level;

    // Write event + update user in a transaction
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: input.userId },
        data: { xp: { increment: input.amount } },
      }),
      prisma.xpEvent.create({
        data: {
          userId: input.userId,
          source: input.source,
          amount: input.amount,
          description: input.description,
          metadata: input.metadata ?? undefined,
        },
      }),
    ]);

    // Check level up
    const levelResult = await levelService.syncLevel(input.userId, updatedUser.xp);

    return {
      previousXp,
      newXp: updatedUser.xp,
      awarded: input.amount,
      leveledUp: levelResult.leveledUp,
      previousLevel,
      newLevel: levelResult.newLevel,
    };
  }

  async getHistory(userId: string, limit = 50) {
    return prisma.xpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTotalBySource(userId: string) {
    const groups = await prisma.xpEvent.groupBy({
      by: ['source'],
      where: { userId },
      _sum: { amount: true },
    });

    return groups.reduce(
      (acc, g) => {
        acc[g.source] = g._sum.amount ?? 0;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

export const xpEngine = new XpEngine();
