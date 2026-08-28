import { feeCalculator } from './src/calculator';

/** User-facing fee resolution via FeeCalculator + DB tiers. */
export async function calculateUserFee(userId: string, amount: string, volumeUsd?: number) {
  return feeCalculator.calculate({ userId, amount, volumeUsd });
}

export { feeCalculator };
