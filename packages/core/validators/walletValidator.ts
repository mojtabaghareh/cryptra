import { z } from 'zod';
import { isAddress as isEvmAddress, getAddress as toEvmChecksumAddress } from 'ethers';
import { PublicKey } from '@solana/web3.js';

/**
 * Real (non-mock) address validation per chain family:
 *  - EVM: ethers.isAddress + EIP-55 checksum normalization
 *  - Solana: @solana/web3.js PublicKey construction (throws on invalid input)
 *  - TON: raw ("0:hex...") or user-friendly (base64url, 48 chars) address format
 */
export function isValidEvmAddress(address: string): boolean {
  return isEvmAddress(address);
}

export function toChecksumEvmAddress(address: string): string {
  if (!isEvmAddress(address)) {
    throw new Error(`Invalid EVM address: ${address}`);
  }
  return toEvmChecksumAddress(address);
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    // Throws if not a valid base58, 32-byte public key.
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

const TON_RAW_ADDRESS_REGEX = /^-?\d:[0-9a-fA-F]{64}$/;
const TON_FRIENDLY_ADDRESS_REGEX = /^[A-Za-z0-9_-]{48}$/;

export function isValidTonAddress(address: string): boolean {
  return TON_RAW_ADDRESS_REGEX.test(address) || TON_FRIENDLY_ADDRESS_REGEX.test(address);
}

export const walletConnectionSchema = z.object({
  userId: z.string().min(1),
  provider: z.enum([
    'metamask',
    'trustwallet',
    'walletconnect',
    'phantom',
    'coinbase',
    'rabby',
    'ledger',
    'trezor',
    'tonconnect',
  ]),
  chainType: z.enum(['evm', 'solana', 'ton']),
});

export const walletAddressSchema = z
  .object({
    chainType: z.enum(['evm', 'solana', 'ton']),
    address: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    const valid =
      value.chainType === 'evm'
        ? isValidEvmAddress(value.address)
        : value.chainType === 'solana'
          ? isValidSolanaAddress(value.address)
          : isValidTonAddress(value.address);

    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid ${value.chainType} address`,
        path: ['address'],
      });
    }
  });

export type WalletConnectionSchema = z.infer<typeof walletConnectionSchema>;
export type WalletAddressSchema = z.infer<typeof walletAddressSchema>;

export function validateWalletConnection(input: unknown): WalletConnectionSchema {
  return walletConnectionSchema.parse(input);
}

export function validateWalletAddress(input: unknown): WalletAddressSchema {
  return walletAddressSchema.parse(input);
}

