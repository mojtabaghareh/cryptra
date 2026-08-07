// ============================================================
// IWalletAdapter.ts - Base interface for all wallets
// ============================================================

export interface WalletAccount {
  address: string;
  chainId: number | string;
}

export interface TransactionRequest {
  to: string;
  value: string; 
  data?: string;
}

export interface IWalletAdapter {
  readonly id: string;
  readonly name: string;
  readonly installed: boolean;

  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
  getAccount(): Promise<WalletAccount | null>;
  getBalance(): Promise<string>; 
  sendTransaction(tx: TransactionRequest): Promise<string>;
  switchChain(chainId: number | string): Promise<void>;
}