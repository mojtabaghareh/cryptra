import { JsonRpcProvider } from 'ethers';
import { Connection, type Commitment } from '@solana/web3.js';
import { TonClient } from '@ton/ton';
import { CHAIN_METADATA, EVM_CHAINS, getChainMetadata, type EvmChainId } from '@cryptra/core';

/**
 * Resolves the RPC URL for a given EVM chain from environment configuration.
 * No RPC URLs or API keys are ever hardcoded — they must be provided via
 * .env (see .env.example: RPC_URL_ETHEREUM, RPC_URL_BNB_CHAIN, ...).
 */
export function getEvmRpcUrl(chainId: EvmChainId): string {
  const meta = getChainMetadata(chainId);
  const url = process.env[meta.rpcEnvVar];
  if (!url) {
    throw new Error(
      `Missing RPC URL for chain "${meta.displayName}". Set ${meta.rpcEnvVar} in the environment.`,
    );
  }
  return url;
}

const evmProviderCache = new Map<EvmChainId, JsonRpcProvider>();

/** Returns a cached ethers JsonRpcProvider for the given EVM chain. */
export function getEvmProvider(chainId: EvmChainId): JsonRpcProvider {
  const cached = evmProviderCache.get(chainId);
  if (cached) return cached;

  const provider = new JsonRpcProvider(getEvmRpcUrl(chainId), chainId, {
    staticNetwork: true,
  });
  evmProviderCache.set(chainId, provider);
  return provider;
}

export function toChainIdHex(chainId: EvmChainId): string {
  return `0x${chainId.toString(16)}`;
}

export function fromChainIdHex(chainIdHex: string): EvmChainId {
  const id = parseInt(chainIdHex, 16) as EvmChainId;
  if (!(id in CHAIN_METADATA)) {
    throw new Error(`Unsupported EVM chainId: ${chainIdHex}`);
  }
  return id;
}

export const ALL_EVM_CHAIN_IDS: EvmChainId[] = Object.values(EVM_CHAINS);

const SOLANA_DEFAULT_COMMITMENT: Commitment = 'confirmed';

export function getSolanaRpcUrl(): string {
  const url = process.env.RPC_URL_SOLANA;
  if (!url) {
    throw new Error('Missing RPC URL for Solana. Set RPC_URL_SOLANA in the environment.');
  }
  return url;
}

let cachedSolanaConnection: Connection | null = null;

/** Returns a cached @solana/web3.js Connection built from the configured RPC endpoint. */
export function getSolanaConnection(): Connection {
  if (cachedSolanaConnection) return cachedSolanaConnection;
  cachedSolanaConnection = new Connection(getSolanaRpcUrl(), SOLANA_DEFAULT_COMMITMENT);
  return cachedSolanaConnection;
}

export const SOLANA_NETWORK_ID = 'solana' as const;

export function getTonRpcUrl(): string {
  const url = process.env.RPC_URL_TON;
  if (!url) {
    throw new Error('Missing RPC URL for TON. Set RPC_URL_TON in the environment (e.g. a toncenter endpoint).');
  }
  return url;
}

export function getTonApiKey(): string | undefined {
  return process.env.TON_API_KEY;
}

let cachedTonClient: TonClient | null = null;

/** Returns a cached @ton/ton TonClient built from the configured RPC endpoint. */
export function getTonClient(): TonClient {
  if (cachedTonClient) return cachedTonClient;
  cachedTonClient = new TonClient({
    endpoint: getTonRpcUrl(),
    apiKey: getTonApiKey(),
  });
  return cachedTonClient;
}

export function getTonConnectManifestUrl(): string {
  const url = process.env.TON_CONNECT_MANIFEST_URL;
  if (!url) {
    throw new Error(
      'Missing TON Connect manifest URL. Set TON_CONNECT_MANIFEST_URL in the environment ' +
        '(a public tonconnect-manifest.json served by the Web App / Mini App).',
    );
  }
  return url;
}

export const TON_NETWORK_ID = 'ton' as const;

