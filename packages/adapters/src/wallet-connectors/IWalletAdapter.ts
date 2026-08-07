// ============================================================
// Cryptra — IWalletAdapter.ts
// Core Wallet Adapter Interface
// Version: 2.0.0
// ============================================================

export type WalletChain =
  | 'ethereum'
  | 'bsc'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'solana'
  | 'ton';

export type WalletProvider =
  | 'metamask'
  | 'phantom'
  | 'trust-wallet'
  | 'walletconnect'
  | 'ton-connect';

export interface WalletAccount {
  address: string;
  chain: WalletChain;
  chainId: number | string;
  provider: WalletProvider;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  chainId?: number | string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TransactionResult {
  hash: string;
  chain: WalletChain;
}

export interface WalletCapabilities {
  connect: boolean;
  disconnect: boolean;
  balance: boolean;
  transactions: boolean;
  sendTransaction: boolean;
  switchChain: boolean;
  signMessage: boolean;
}

export interface IWalletAdapter {
  readonly id: WalletProvider;
  readonly name: string;
  readonly installed: boolean;

  /**
   * قابلیت‌های کیف پول
   */
  readonly capabilities: WalletCapabilities;

  /**
   * اتصال کیف پول
   */
  connect(): Promise<WalletAccount>;

  /**
   * قطع اتصال
   */
  disconnect(): Promise<void>;

  /**
   * بررسی وضعیت اتصال
   */
  isConnected(): Promise<boolean>;

  /**
   * دریافت حساب فعال
   */
  getAccount(): Promise<WalletAccount | null>;

  /**
   * دریافت موجودی Native
   */
  getBalance(): Promise<string>;

  /**
   * ارسال تراکنش
   */
  sendTransaction(
    tx: TransactionRequest
  ): Promise<TransactionResult>;

  /**
   * تغییر شبکه
   */
  switchChain(chainId: number | string): Promise<void>;

  /**
   * امضای پیام
   */
  signMessage?(message: string): Promise<string>;
}
