// ============================================================
// Cryptra V2 — DEX Adapter Interface
// Version: 2.0.0
// ============================================================

import {
  DexAdapterConfig,
  DexExecutionResult,
  DexHealthStatus,
  DexQuote,
  DexQuoteRequest,
  DexSwapRequest,
  DexTransactionBuildResult,
} from './types';

/**
 * Base contract for every Cryptra DEX / execution adapter.
 *
 * Important:
 * - Adapters never receive or store private keys.
 * - Adapters are responsible for provider communication.
 * - Wallets are responsible for user authorization/signing.
 * - Core/business logic must not depend on provider-specific APIs.
 */
export interface IDexAdapter {
  /**
   * Unique provider identifier.
   *
   * Examples:
   * - "1inch"
   * - "jupiter"
   * - "hyperliquid"
   */
  readonly id: string;

  /**
   * Human-readable provider name.
   */
  readonly name: string;

  /**
   * Provider category.
   */
  readonly type: 'aggregator' | 'exchange' | 'router';

  /**
   * Blockchain family supported by this adapter.
   */
  readonly chainType: 'evm' | 'solana' | 'ton';

  /**
   * Supported chain IDs.
   */
  readonly supportedChainIds: Array<number | string>;

  /**
   * Whether the adapter is enabled.
   */
  readonly enabled: boolean;

  /**
   * Return the current adapter configuration.
   */
  getConfig(): DexAdapterConfig;

  /**
   * Check whether the provider is reachable and operational.
   */
  healthCheck(): Promise<DexHealthStatus>;

  /**
   * Request a price/route quote.
   */
  getQuote(request: DexQuoteRequest): Promise<DexQuote>;

  /**
   * Build a transaction/order payload from a swap request.
   *
   * This method must NOT sign or broadcast a user transaction.
   */
  buildTransaction(
    request: DexSwapRequest,
  ): Promise<DexTransactionBuildResult>;

  /**
   * Execute a provider-side operation after the required
   * authorization/signing flow has been completed.
   *
   * For wallet-based swaps, the signed payload should be
   * supplied through provider-specific metadata.
   */
  execute(
    request: DexSwapRequest,
    signedTransaction?: string,
  ): Promise<DexExecutionResult>;
}
