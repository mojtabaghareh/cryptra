import type { ChainType, WalletProviderId } from '@cryptra/core';

export interface WalletAdapterAccount {
  address: string;
  chainType: ChainType;
  /** For EVM: EIP-155 chain id. For Solana/TON: the network id string. */
  networkId: number | string;
}

export type WalletAdapterEvent = 'accountsChanged' | 'chainChanged' | 'disconnect' | 'connect';

export interface PreparedEvmTransaction {
  to: string;
  data?: string;
  value?: string; // decimal wei string
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Common contract every wallet adapter must implement.
 * STRICT NON-CUSTODIAL RULE: an adapter implementation must never accept,
 * derive, or persist a private key or seed phrase. All signing happens
 * through the wallet's own provider (browser extension, WalletConnect
 * session, hardware device, or TON Connect bridge).
 */
export interface IWalletAdapter {
  readonly id: WalletProviderId;
  readonly name: string;
  readonly chainType: ChainType;

  isAvailable(): Promise<boolean>;
  connect(): Promise<WalletAdapterAccount>;
  disconnect(): Promise<void>;
  getAccount(): WalletAdapterAccount | null;

  signMessage(message: string): Promise<string>;

  /** EVM adapters accept `PreparedEvmTransaction`; Solana/TON adapters accept their native tx type. */
  sendTransaction(transaction: unknown): Promise<{ txHash: string }>;

  on(event: WalletAdapterEvent, handler: (...args: unknown[]) => void): void;
  off(event: WalletAdapterEvent, handler: (...args: unknown[]) => void): void;
}

