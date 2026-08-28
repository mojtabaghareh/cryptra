import { resolveBaseFeePercentMicros, type FeeTierId } from '@cryptra/core';

/** Protocol base fee without user-specific discounts. */
export function protocolFeeMicros(tierId: FeeTierId, tradeSizeUsd: number): number {
  return resolveBaseFeePercentMicros(tierId, tradeSizeUsd);
}
