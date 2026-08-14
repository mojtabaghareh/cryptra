import type { NetworkId } from '../constants/chains';

/**
 * Token metadata. The authoritative token list is fetched at runtime from
 * packages/market-data (backed by real provider APIs — 1inch / Jupiter token
 * lists, on-chain metadata) — this type only describes the shape, it does
 * NOT hardcode a token registry.
 */
export interface Token {
  address: string; // native asset uses NATIVE_TOKEN_ADDRESS_PLACEHOLDER (see constants/tokens)
  networkId: NetworkId;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string | null;
  isNative: boolean;
  verified: boolean;
}

export interface TokenAmount {
  token: Token;
  amountRaw: string; // integer string, smallest unit
}

export interface TokenPrice {
  tokenAddress: string;
  networkId: NetworkId;
  priceUsd: string; // decimal string to avoid float precision loss
  updatedAt: string;
}

