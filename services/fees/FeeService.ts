import { feeCalculator, type FeeCalculationInput } from '@cryptra/fees';
import {
  FEE_TIERS,
  resolveBaseFeePercentMicros,
  getFeeTier,
  type FeeTierId,
} from '@cryptra/core';

export class FeeService {
  listTiers() {
    return FEE_TIERS;
  }

  preview(amount: string, feePercent?: number) {
    return feeCalculator.preview(amount, feePercent);
  }

  async calculate(input: FeeCalculationInput) {
    return feeCalculator.calculate(input);
  }

  resolveBase(tierId: FeeTierId, tradeSizeUsd: number) {
    const micros = resolveBaseFeePercentMicros(tierId, tradeSizeUsd);
    return {
      percentMicros: micros,
      percent: (micros / 1_000_000).toFixed(3),
      tier: getFeeTier(tierId),
    };
  }
}

export const feeService = new FeeService();
