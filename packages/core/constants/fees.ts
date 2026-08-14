/**
 * FINAL fee configuration per Cryptra Master Specification v2 (§11, §12, §32).
 * All previous fee values are void. Backend (packages/fees) is the single
 * source of truth — Frontend must never compute or override these values.
 *
 * Percentages are stored both as a human-readable decimal string AND as an
 * integer "percentMicros" (percent * PERCENT_MICRO_SCALE) so all downstream
 * math (packages/fees/FeeCalculator) can stay integer-based and deterministic
 * instead of relying on floating point.
 */

/** percentMicros = percent * 1_000_000  (e.g. 0.088% -> 88000) */
export const PERCENT_MICRO_SCALE = 1_000_000;

export type FeeTierId = 1 | 2 | 3 | 4 | 5 | 6;

export interface FeeTierConfig {
  id: FeeTierId;
  label: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  percent: string; // decimal string, e.g. "0.088"
  percentMicros: number; // 88000
}

export const FEE_TIERS: readonly FeeTierConfig[] = [
  { id: 1, label: 'Tier 1', difficulty: 'easy', percent: '0.088', percentMicros: 88_000 },
  { id: 2, label: 'Tier 2', difficulty: 'easy', percent: '0.078', percentMicros: 78_000 },
  { id: 3, label: 'Tier 3', difficulty: 'easy', percent: '0.068', percentMicros: 68_000 },
  { id: 4, label: 'Tier 4', difficulty: 'medium', percent: '0.058', percentMicros: 58_000 },
  { id: 5, label: 'Tier 5', difficulty: 'hard', percent: '0.045', percentMicros: 45_000 },
  { id: 6, label: 'Tier 6', difficulty: 'very_hard', percent: '0.033', percentMicros: 33_000 },
] as const;

export const DEFAULT_FEE_TIER_ID: FeeTierId = 1;
export const LOWEST_STANDARD_FEE_TIER_ID: FeeTierId = 6;

export function getFeeTier(id: FeeTierId): FeeTierConfig {
  const tier = FEE_TIERS.find((t) => t.id === id);
  if (!tier) {
    throw new Error(`Unknown fee tier id: ${String(id)}`);
  }
  return tier;
}

/**
 * High-Volume Fee Rule (§12): trades above this USD notional get a flat
 * 0.055% fee instead of the user's standard tier fee. Threshold is
 * configurable (backed by packages/fees runtime config), this is the
 * compile-time default.
 */
export const HIGH_VOLUME_USD_THRESHOLD_DEFAULT = '50000';
export const HIGH_VOLUME_FEE_PERCENT = '0.055';
export const HIGH_VOLUME_FEE_PERCENT_MICROS = 55_000;

/**
 * Priority order in which fee/discount rules are resolved (§12).
 * FeeCalculator (packages/fees) MUST apply exactly one terminal fee —
 * rules are evaluated top to bottom and the first applicable one wins,
 * discounts are never silently stacked.
 */
export const FEE_RESOLUTION_PRIORITY = [
  'standard_tier',
  'high_volume',
  'subscription_discount',
  'referral_discount',
  'other_approved_discount',
] as const;

export type FeeResolutionRule = (typeof FEE_RESOLUTION_PRIORITY)[number];

/**
 * Deterministic fee resolution helper — given a trade's USD notional and the
 * user's fee tier, returns the applicable fee percent per the priority order
 * above (standard tier vs. high-volume rule). Discount stacking beyond this
 * point (subscription/referral/other) is resolved by packages/fees at
 * runtime against user-specific, approved discount records.
 */
export function resolveBaseFeePercentMicros(
  tierId: FeeTierId,
  tradeSizeUsd: number,
  highVolumeThresholdUsd: number = Number(HIGH_VOLUME_USD_THRESHOLD_DEFAULT),
): number {
  if (tradeSizeUsd > highVolumeThresholdUsd) {
    return HIGH_VOLUME_FEE_PERCENT_MICROS;
  }
  return getFeeTier(tierId).percentMicros;
}

