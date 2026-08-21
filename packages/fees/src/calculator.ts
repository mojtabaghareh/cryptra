import { getConfig } from '@cryptra/config';
import { prisma } from '@cryptra/database';

export interface FeeCalculationInput {
  userId: string;
  amount: string; // human-readable or raw string amount
  volumeUsd?: number;
}

export interface FeeCalculationResult {
  feePercent: number;
  feeAmount: string;
  tier: number;
  tierName: string;
  baseFeePercent: number;
  minFeePercent: number;
}

/**
 * Default fee tiers (used when FeeTier table is empty).
 * Higher level / more XP = lower fee.
 */
const DEFAULT_TIERS = [
  { level: 0, name: 'Standard', feePercent: 0.088, minXp: 0 },
  { level: 1, name: 'Bronze', feePercent: 0.075, minXp: 500 },
  { level: 2, name: 'Silver', feePercent: 0.06, minXp: 2000 },
  { level: 3, name: 'Gold', feePercent: 0.05, minXp: 8000 },
  { level: 4, name: 'Platinum', feePercent: 0.04, minXp: 25000 },
  { level: 5, name: 'Diamond', feePercent: 0.033, minXp: 100000 },
] as const;

export class FeeCalculator {
  /**
   * Calculate the effective fee for a user based on their tier / XP.
   */
  async calculate(input: FeeCalculationInput): Promise<FeeCalculationResult> {
    const config = getConfig();
    const baseFee = config.BASE_FEE_PERCENT;
    const minFee = config.MIN_FEE_PERCENT;

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { xp: true, level: true, feeTier: true },
    });

    if (!user) {
      return {
        feePercent: baseFee,
        feeAmount: this.computeFeeAmount(input.amount, baseFee),
        tier: 0,
        tierName: 'Standard',
        baseFeePercent: baseFee,
        minFeePercent: minFee,
      };
    }

    // Prefer DB tiers if available
    let tiers = await prisma.feeTier.findMany({ orderBy: { level: 'asc' } });
    if (tiers.length === 0) {
      tiers = DEFAULT_TIERS.map((t) => ({
        id: t.level,
        level: t.level,
        name: t.name,
        feePercent: t.feePercent,
        minXp: t.minXp,
        description: null,
        createdAt: new Date(),
      }));
    }

    // Find best tier the user qualifies for
    let selected = tiers[0];
    for (const tier of tiers) {
      if (user.xp >= tier.minXp) {
        selected = tier;
      }
    }

    // Never go below absolute minimum
    const feePercent = Math.max(selected.feePercent, minFee);

    return {
      feePercent,
      feeAmount: this.computeFeeAmount(input.amount, feePercent),
      tier: selected.level,
      tierName: selected.name,
      baseFeePercent: baseFee,
      minFeePercent: minFee,
    };
  }

  private computeFeeAmount(amount: string, feePercent: number): string {
    try {
      const value = Number(amount);
      if (Number.isNaN(value) || value <= 0) return '0';
      const fee = (value * feePercent) / 100;
      // Keep reasonable precision
      return fee.toFixed(8).replace(/\.?0+$/, '') || '0';
    } catch {
      return '0';
    }
  }

  /**
   * Preview fee without needing a user (for UI).
   */
  preview(amount: string, feePercent?: number): { feePercent: number; feeAmount: string } {
    const config = getConfig();
    const pct = feePercent ?? config.BASE_FEE_PERCENT;
    return {
      feePercent: pct,
      feeAmount: this.computeFeeAmount(amount, pct),
    };
  }
}

export const feeCalculator = new FeeCalculator();
