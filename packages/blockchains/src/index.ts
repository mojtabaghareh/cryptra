/**
 * Chain registry used by wallets/swaps — static config, not RPC simulation.
 * RPC URLs come from env (SOLANA_RPC_URL, etc.), never hardcoded secrets.
 */

export type ChainFamily = 'evm' | 'solana' | 'ton';

export interface ChainDefinition {
  id: string;
  family: ChainFamily;
  chainId?: number;
  name: string;
  nativeSymbol: string;
  explorerUrl: string;
  rpcEnvKey?: string;
}

export const CHAINS: readonly ChainDefinition[] = [
  {
    id: 'ethereum',
    family: 'evm',
    chainId: 1,
    name: 'Ethereum',
    nativeSymbol: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcEnvKey: 'ETHEREUM_RPC_URL',
  },
  {
    id: 'arbitrum',
    family: 'evm',
    chainId: 42161,
    name: 'Arbitrum One',
    nativeSymbol: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    rpcEnvKey: 'ARBITRUM_RPC_URL',
  },
  {
    id: 'base',
    family: 'evm',
    chainId: 8453,
    name: 'Base',
    nativeSymbol: 'ETH',
    explorerUrl: 'https://basescan.org',
    rpcEnvKey: 'BASE_RPC_URL',
  },
  {
    id: 'optimism',
    family: 'evm',
    chainId: 10,
    name: 'Optimism',
    nativeSymbol: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io',
    rpcEnvKey: 'OPTIMISM_RPC_URL',
  },
  {
    id: 'polygon',
    family: 'evm',
    chainId: 137,
    name: 'Polygon',
    nativeSymbol: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    rpcEnvKey: 'POLYGON_RPC_URL',
  },
  {
    id: 'avalanche',
    family: 'evm',
    chainId: 43114,
    name: 'Avalanche C-Chain',
    nativeSymbol: 'AVAX',
    explorerUrl: 'https://snowtrace.io',
    rpcEnvKey: 'AVALANCHE_RPC_URL',
  },
  {
    id: 'solana',
    family: 'solana',
    name: 'Solana',
    nativeSymbol: 'SOL',
    explorerUrl: 'https://solscan.io',
    rpcEnvKey: 'SOLANA_RPC_URL',
  },
  {
    id: 'ton',
    family: 'ton',
    name: 'TON',
    nativeSymbol: 'TON',
    explorerUrl: 'https://tonviewer.com',
    rpcEnvKey: 'TON_RPC_URL',
  },
] as const;

export function getChain(id: string): ChainDefinition | undefined {
  return CHAINS.find((c) => c.id === id);
}

export function getRpcUrl(chain: ChainDefinition): string | undefined {
  if (!chain.rpcEnvKey) return undefined;
  const v = process.env[chain.rpcEnvKey];
  return v && v.length > 0 ? v : undefined;
}
