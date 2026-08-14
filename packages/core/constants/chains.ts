/**
 * Supported EVM chains (packages/blockchains → EVM adapters, packages/wallets).
 * Chain IDs are the real, canonical EIP-155 chain IDs.
 */
export const EVM_CHAINS = {
  ethereum: 1,
  bnbChain: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  avalanche: 43114,
} as const;

export type EvmChainKey = keyof typeof EVM_CHAINS;
export type EvmChainId = (typeof EVM_CHAINS)[EvmChainKey];

/** Non-EVM ecosystems supported alongside the EVM chains. */
export const NON_EVM_NETWORKS = {
  solana: 'solana',
  ton: 'ton',
} as const;

export type NonEvmNetworkId = (typeof NON_EVM_NETWORKS)[keyof typeof NON_EVM_NETWORKS];

/** Union of every network identifier Cryptra can operate on. */
export type NetworkId = EvmChainId | NonEvmNetworkId;

export interface ChainMetadata {
  id: NetworkId;
  key: string;
  displayName: string;
  chainType: 'evm' | 'solana' | 'ton';
  nativeCurrencySymbol: string;
  nativeCurrencyDecimals: number;
  blockExplorerUrl: string;
  /** Actual RPC endpoints must come from environment configuration — never hardcoded secrets/keys here. */
  rpcEnvVar: string;
}

export const CHAIN_METADATA: Record<NetworkId, ChainMetadata> = {
  [EVM_CHAINS.ethereum]: {
    id: EVM_CHAINS.ethereum,
    key: 'ethereum',
    displayName: 'Ethereum',
    chainType: 'evm',
    nativeCurrencySymbol: 'ETH',
    nativeCurrencyDecimals: 18,
    blockExplorerUrl: 'https://etherscan.io',
    rpcEnvVar: 'RPC_URL_ETHEREUM',
  },
  [EVM_CHAINS.bnbChain]: {
    id: EVM_CHAINS.bnbChain,
    key: 'bnbChain',
    displayName: 'BNB Chain',
    chainType: 'evm',
    nativeCurrencySymbol: 'BNB',
    nativeCurrencyDecimals: 18,
    blockExplorerUrl: 'https://bscscan.com',
    rpcEnvVar: 'RPC_URL_BNB_CHAIN',
  },
  [EVM_CHAINS.polygon]: {
    id: EVM_CHAINS.polygon,
    key: 'polygon',
    displayName: 'Polygon',
    chainType: 'evm',
    nativeCurrencySymbol: 'POL',
    nativeCurrencyDecimals: 18,
    blockExplorerUrl: 'https://polygonscan.com',
    rpcEnvVar: 'RPC_URL_POLYGON',
  },
  [EVM_CHAINS.arbitrum]: {
    id: EVM_CHAINS.arbitrum,
    key: 'arbitrum',
    displayName: 'Arbitrum One',
    chainType: 'evm',
    nativeCurrencySymbol: 'ETH',
    nativeCurrencyDecimals: 18,
    blockExplorerUrl: 'https://arbiscan.io',
    rpcEnvVar: 'RPC_URL_ARBITRUM',
  },
  [EVM_CHAINS.optimism]: {
    id: EVM_CHAINS.optimism,
    key: 'optimism',
    displayName: 'Optimism',
    chainType: 'evm',
    nativeCurrencySymbol: 'ETH',
    nativeCurrencyDecimals: 18,
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    rpcEnvVar: 'RPC_URL_OPTIMISM',
  },
  [EVM_CHAINS.base]: {
    id: EVM_CHAINS.base,
    key: 'base',
    displayName: 'Base',
    chainType: 'evm',
    nativeCurrencySymbol: 'ETH',
    nativeCurrencyDecimals: 18,
    blockExplorerUrl: 'https://basescan.org',
    rpcEnvVar: 'RPC_URL_BASE',
  },
  [EVM_CHAINS.avalanche]: {
    id: EVM_CHAINS.avalanche,
    key: 'avalanche',
    displayName: 'Avalanche C-Chain',
    chainType: 'evm',
    nativeCurrencySymbol: 'AVAX',
    nativeCurrencyDecimals: 18,
    blockExplorerUrl: 'https://snowtrace.io',
    rpcEnvVar: 'RPC_URL_AVALANCHE',
  },
  [NON_EVM_NETWORKS.solana]: {
    id: NON_EVM_NETWORKS.solana,
    key: 'solana',
    displayName: 'Solana',
    chainType: 'solana',
    nativeCurrencySymbol: 'SOL',
    nativeCurrencyDecimals: 9,
    blockExplorerUrl: 'https://solscan.io',
    rpcEnvVar: 'RPC_URL_SOLANA',
  },
  [NON_EVM_NETWORKS.ton]: {
    id: NON_EVM_NETWORKS.ton,
    key: 'ton',
    displayName: 'TON',
    chainType: 'ton',
    nativeCurrencySymbol: 'TON',
    nativeCurrencyDecimals: 9,
    blockExplorerUrl: 'https://tonscan.org',
    rpcEnvVar: 'RPC_URL_TON',
  },
};

export function isEvmNetwork(networkId: NetworkId): networkId is EvmChainId {
  return typeof networkId === 'number';
}

export function getChainMetadata(networkId: NetworkId): ChainMetadata {
  const meta = CHAIN_METADATA[networkId];
  if (!meta) {
    throw new Error(`Unknown networkId: ${String(networkId)}`);
  }
  return meta;
}

