// ============================================================
// trade.ts - Shared Types for Trading Engine
// ============================================================

export type Chain = 'ethereum' | 'solana' | 'bnb' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'avalanche' | 'ton';
export type Dex = 'hyperliquid' | 'jupiter' | '1inch' | 'uniswap' | 'pancakeswap' | 'raydium';

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  price: number;
  priceImpact: number;
  slippage: number;
  fee: number;
  route: string[];
  dex: Dex;
  chain: Chain;
  txData?: string; // داده‌های خام تراکنش برای امضا
}

export interface SwapRequest {
  fromToken: string;
  toToken: string;
  amount: number;
  chain: Chain;
  slippage?: number;
  walletAddress: string;
  dex?: Dex; // اختیاری: کاربر می‌تواند دستی انتخاب کند
}

export interface TransactionStatus {
  status: 'pending' | 'signed' | 'broadcasted' | 'confirmed' | 'failed';
  txHash?: string;
  error?: string;
}
