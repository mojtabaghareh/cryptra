import type { NetworkId } from '../constants/chains';

/** Chain family a wallet belongs to. */
export type ChainType = 'evm' | 'solana' | 'ton';

/** Identifiers of every wallet provider Cryptra integrates with (packages/wallets). */
export type WalletProviderId =
  | 'metamask'
  | 'trustwallet'
  | 'walletconnect'
  | 'phantom'
  | 'coinbase'
  | 'rabby'
  | 'ledger'
  | 'trezor'
  | 'tonconnect';

/**
 * A wallet connected by a user. Cryptra is strictly NON-CUSTODIAL:
 * this record MUST NEVER contain a private key, seed phrase, or any
 * derivable secret — only public, connection-level metadata.
 */
export interface Wallet {
  id: string;
  userId: string;
  address: string;
  chainType: ChainType;
  networkId: NetworkId;
  provider: WalletProviderId;
  label: string | null;
  isPrimary: boolean;
  connectedAt: string;
  lastUsedAt: string;
  disconnectedAt: string | null;
}

export interface WalletConnectionRequest {
  userId: string;
  provider: WalletProviderId;
  chainType: ChainType;
}

export interface WalletBalance {
  walletId: string;
  networkId: NetworkId;
  tokenAddress: string | null; // null = native asset
  symbol: string;
  amountRaw: string; // integer string in smallest unit (wei / lamports / nanoton)
  decimals: number;
  fetchedAt: string;
}
