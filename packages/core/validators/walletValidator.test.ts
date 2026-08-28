import { describe, it, expect } from 'vitest';
import {
  isValidEvmAddress,
  isValidSolanaAddress,
  isValidTonAddress,
  validateWalletAddress,
} from './walletValidator';

describe('walletValidator', () => {
  it('accepts valid EVM address', () => {
    // lowercase is always accepted by ethers.isAddress
    expect(isValidEvmAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb0')).toBe(true);
    // known checksummed address (vitalik.eth)
    expect(isValidEvmAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(true);
  });

  it('rejects invalid EVM address', () => {
    expect(isValidEvmAddress('0xdead')).toBe(false);
    expect(isValidEvmAddress('not-an-address')).toBe(false);
  });

  it('accepts valid Solana address', () => {
    expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
  });

  it('rejects invalid Solana address', () => {
    expect(isValidSolanaAddress('!!!')).toBe(false);
  });

  it('accepts TON raw format', () => {
    const raw = '0:' + 'a'.repeat(64);
    expect(isValidTonAddress(raw)).toBe(true);
  });

  it('validateWalletAddress throws on bad EVM', () => {
    expect(() =>
      validateWalletAddress({ chainType: 'evm', address: 'bad' }),
    ).toThrow();
  });
});
