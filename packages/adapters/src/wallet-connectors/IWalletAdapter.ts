// ============================================================
// Cryptra V2.9 — Wallet Adapter Interface
// File: IWalletAdapter.ts
// Production / Non-Custodial
// ============================================================

export type WalletChainType = 'evm' | 'solana' | 'ton';

export interface WalletAccount {
  address: string;
  chainType: WalletChainType;
  chainId?: number | string;
}

export interface WalletConnectOptions {
  chainId?: number | string;
  onlyIfTrusted?: boolean;
}

export interface EvmTransaction {
  from?: string;
  to: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
}

export interface TonTransactionMessage {
  address: string;
  amount: string;
  payload?: string;
}

export interface TonTransaction {
  validUntil: number;
  messages: TonTransactionMessage[];
}

export interface WalletEventMap {
  accountsChanged: (accounts: string[]) => void;
  chainChanged: (chainId: string) => void;
  disconnect: (error?: unknown) => void;
}

export interface IWalletAdapter {
  readonly id: string;
  readonly name: string;
  readonly chainType: WalletChainType;

  isAvailable(): boolean;

  isConnected(): boolean;

  connect(options?: WalletConnectOptions): Promise<WalletAccount>;

  disconnect(): Promise<void>;

  getAccount(): Promise<WalletAccount | null>;

  getAddress(): Promise<string | null>;

  getChainId(): Promise<number | string | null>;

  signMessage(message: string): Promise<string>;

  sendTransaction(transaction: unknown): Promise<string>;

  on<K extends keyof WalletEventMap>(
    event: K,
    listener: WalletEventMap[K],
  ): () => void;

  removeAllListeners(): void;
}
