// ============================================================
// Cryptra V2 — DEX Connector Types
// Version: 2.0.0
// ============================================================

/**
 * Supported blockchain families.
 */
export type ChainType =
  | 'evm'
  | 'solana'
  | 'ton';

/**
 * Supported DEX/execution provider categories.
 */
export type DexProviderType =
  | 'aggregator'
  | 'exchange'
  | 'router';

/**
 * Supported swap/order directions.
 */
export type TradeSide =
  | 'buy'
  | 'sell';

/**
 * Generic token definition.
 */
export interface DexToken {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number | string;
  name?: string;
}

/**
 * User wallet information required by a DEX adapter.
 */
export interface DexWallet {
  address: string;
  chainType: ChainType;
  chainId: number | string;
}

/**
 * Generic token amount.
 *
 * `raw` must always represent the smallest unit of the token.
 * `formatted` is optional and intended only for UI/display purposes.
 */
export interface DexAmount {
  raw: string;
  decimals: number;
  formatted?: string;
}

/**
 * Generic swap request.
 */
export interface DexSwapRequest {
  chainType: ChainType;
  chainId: number | string;

  wallet: DexWallet;

  fromToken: DexToken;
  toToken: DexToken;

  amount: DexAmount;

  slippageBps: number;

  recipient?: string;

  deadline?: number;

  /**
   * Optional provider-specific metadata.
   * Must not contain private keys or wallet secrets.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Generic quote request.
 */
export interface DexQuoteRequest {
  chainType: ChainType;
  chainId: number | string;

  fromToken: DexToken;
  toToken: DexToken;

  amount: DexAmount;

  slippageBps: number;

  walletAddress?: string;

  metadata?: Record<string, unknown>;
}

/**
 * Generic quote result.
 */
export interface DexQuote {
  provider: string;

  chainType: ChainType;
  chainId: number | string;

  fromToken: DexToken;
  toToken: DexToken;

  inputAmount: DexAmount;
  outputAmount: DexAmount;

  priceImpact?: string;

  estimatedGas?: string;
  estimatedGasUsd?: string;

  route?: DexRoute;

  expiresAt?: number;

  metadata?: Record<string, unknown>;
}

/**
 * Route information returned by a DEX aggregator.
 */
export interface DexRoute {
  provider: string;

  steps: DexRouteStep[];

  /**
   * Total number of hops in the route.
   */
  hopCount: number;
}

/**
 * Individual route step.
 */
export interface DexRouteStep {
  protocol: string;

  fromToken: DexToken;
  toToken: DexToken;

  inputAmount: DexAmount;
  outputAmount: DexAmount;

  poolAddress?: string;

  metadata?: Record<string, unknown>;
}

/**
 * Transaction payload that is passed to a wallet
 * for user authorization/signing.
 *
 * The adapter must NEVER contain or request a private key.
 */
export interface DexTransaction {
  chainType: ChainType;

  chainId: number | string;

  from: string;

  to?: string;

  value?: string;

  data?: string;

  /**
   * Solana-specific serialized transaction payload.
   */
  serializedTransaction?: string;

  /**
   * TON-specific transaction metadata.
   */
  messages?: unknown[];

  gasLimit?: string;

  maxFeePerGas?: string;

  maxPriorityFeePerGas?: string;

  metadata?: Record<string, unknown>;
}

/**
 * Result of building a transaction.
 */
export interface DexTransactionBuildResult {
  success: boolean;

  transaction?: DexTransaction;

  provider: string;

  error?: DexError;
}

/**
 * Result of a submitted transaction.
 */
export interface DexExecutionResult {
  success: boolean;

  provider: string;

  transactionHash?: string;

  status:
    | 'pending'
    | 'confirmed'
    | 'failed';

  error?: DexError;

  metadata?: Record<string, unknown>;
}

/**
 * Standardized DEX error.
 */
export interface DexError {
  code: string;

  message: string;

  provider?: string;

  retryable?: boolean;

  details?: Record<string, unknown>;
}

/**
 * General adapter configuration.
 */
export interface DexAdapterConfig {
  provider: string;

  chainType: ChainType;

  chainIds: Array<number | string>;

  baseUrl?: string;

  apiKey?: string;

  timeoutMs?: number;

  enabled?: boolean;

  /**
   * Additional provider configuration.
   *
   * Never place private keys or secrets here.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Provider health information.
 */
export interface DexHealthStatus {
  provider: string;

  available: boolean;

  latencyMs?: number;

  checkedAt: number;

  error?: DexError;
}
