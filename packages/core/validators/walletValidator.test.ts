import { describe, it, expect } from 'vitest';
import {
  isValidEvmAddress,
  isValidSolanaAddress,
  isValidTonAddress,
  validateWalletAddress,
} from './walletValidator';

describe('walletValidator', () => {
  it('accepts valid EVM address', () => {
    expect(isValidEvmAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
  });

  it('rejects invalid EVM address', () => {
    expect(isValidEvmAddress('0xdead')).toBe(false);
    expect(isValidEvmAddress('not-an-address')).toBe(false);
  });

  it('accepts valid Solana address', () => {
    // System program id
    expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
  });

  it('rejects invalid Solana address', () => {
    expect(isValidSolanaAddress('!!!')).toBe(false);
  });

  it('accepts TON raw format', () => {
    const raw =
      '0:' + 'a'.repeat(64);
    expect(isValidTonAddress(raw)).toBe(true);
  });

  it('validateWalletAddress throws on bad EVM', () => {
    expect(() =>
      validateWalletAddress({ chainType: 'evm', address: 'bad' }),
    ).toThrow();
  });
});
