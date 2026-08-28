import { describe, it, expect } from 'vitest';
import {
  FEE_TIERS,
  DEFAULT_FEE_TIER_ID,
  LOWEST_STANDARD_FEE_TIER_ID,
  resolveBaseFeePercentMicros,
  HIGH_VOLUME_FEE_PERCENT_MICROS,
  getFeeTier,
} from './fees';

describe('fee constants', () => {
  it('has 6 tiers from 0.088% to 0.033%', () => {
    expect(FEE_TIERS).toHaveLength(6);
    expect(getFeeTier(1).percent).toBe('0.088');
    expect(getFeeTier(6).percent).toBe('0.033');
  });

  it('default tier is 1', () => {
    expect(DEFAULT_FEE_TIER_ID).toBe(1);
    expect(LOWEST_STANDARD_FEE_TIER_ID).toBe(6);
  });

  it('uses tier fee under high-volume threshold', () => {
    const micros = resolveBaseFeePercentMicros(1, 1000);
    expect(micros).toBe(88_000);
  });

  it('applies high-volume fee above threshold', () => {
    const micros = resolveBaseFeePercentMicros(1, 100_000);
    expect(micros).toBe(HIGH_VOLUME_FEE_PERCENT_MICROS);
  });
});
