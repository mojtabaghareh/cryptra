import { EVM_CHAINS, NON_EVM_NETWORKS, type NetworkId } from './chains';

/**
 * Sentinel address used to represent the native asset of an EVM chain
 * inside quote/routing payloads (matches the convention used by 1inch,
 * Uniswap and most DEX aggregators).
 */
export const NATIVE_TOKEN_SENTINEL_EVM = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

/** Native asset descriptor per network — the only token data Cryptra hardcodes. */
export interface NativeToken {
  networkId: NetworkId;
  symbol: string;
  name: string;
  decimals: number;
}

export const NATIVE_TOKENS: Record<NetworkId, NativeToken> = {
  [EVM_CHAINS.ethereum]: { networkId: EVM_CHAINS.ethereum, symbol: 'ETH', name: 'Ether', decimals: 18 },
  [EVM_CHAINS.bnbChain]: { networkId: EVM_CHAINS.bnbChain, symbol: 'BNB', name: 'BNB', decimals: 18 },
  [EVM_CHAINS.polygon]: { networkId: EVM_CHAINS.polygon, symbol: 'POL', name: 'Polygon Ecosystem Token', decimals: 18 },
  [EVM_CHAINS.arbitrum]: { networkId: EVM_CHAINS.arbitrum, symbol: 'ETH', name: 'Ether', decimals: 18 },
  [EVM_CHAINS.optimism]: { networkId: EVM_CHAINS.optimism, symbol: 'ETH', name: 'Ether', decimals: 18 },
  [EVM_CHAINS.base]: { networkId: EVM_CHAINS.base, symbol: 'ETH', name: 'Ether', decimals: 18 },
  [EVM_CHAINS.avalanche]: { networkId: EVM_CHAINS.avalanche, symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
  [NON_EVM_NETWORKS.solana]: { networkId: NON_EVM_NETWORKS.solana, symbol: 'SOL', name: 'Solana', decimals: 9 },
  [NON_EVM_NETWORKS.ton]: { networkId: NON_EVM_NETWORKS.ton, symbol: 'TON', name: 'Toncoin', decimals: 9 },
};

/**
 * Cryptra does NOT hardcode an ERC-20 / SPL / Jetton token registry here.
 * The authoritative, always-current token list is fetched live by
 * packages/market-data from the real provider APIs below and cached —
 * this avoids shipping stale or incorrect token addresses.
 */
export const TOKEN_LIST_PROVIDER_ENDPOINTS = {
  oneInch: 'https://tokens.1inch.io',
  jupiter: 'https://token.jup.ag/all',
} as const;

