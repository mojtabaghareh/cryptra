/**
 * Simple isolated-margin liquidation estimate (not exchange-specific).
 * entryPrice, size, leverage are positive numbers; side LONG | SHORT.
 */
export function estimateLiquidationPrice(input: {
  entryPrice: number;
  leverage: number;
  side: 'LONG' | 'SHORT';
  maintenanceMarginRate?: number;
}): number {
  const { entryPrice, leverage, side } = input;
  const mmr = input.maintenanceMarginRate ?? 0.005;
  if (entryPrice <= 0 || leverage < 1) return 0;

  // Approx: long liq ≈ entry * (1 - 1/lev + mmr); short inverse
  if (side === 'LONG') {
    return Math.max(0, entryPrice * (1 - 1 / leverage + mmr));
  }
  return entryPrice * (1 + 1 / leverage - mmr);
}
