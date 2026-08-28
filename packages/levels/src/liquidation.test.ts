import { describe, it, expect } from 'vitest';
import { estimateLiquidationPrice } from './liquidation';

describe('estimateLiquidationPrice', () => {
  it('long liq below entry', () => {
    const liq = estimateLiquidationPrice({
      entryPrice: 100,
      leverage: 10,
      side: 'LONG',
    });
    expect(liq).toBeLessThan(100);
    expect(liq).toBeGreaterThan(0);
  });

  it('short liq above entry', () => {
    const liq = estimateLiquidationPrice({
      entryPrice: 100,
      leverage: 10,
      side: 'SHORT',
    });
    expect(liq).toBeGreaterThan(100);
  });
});
