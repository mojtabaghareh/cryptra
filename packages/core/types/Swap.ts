import type { NetworkId } from '../constants/chains';
import type { SwapProtocolId } from '../constants/protocols';
import type { Token } from './Token';

export type SwapStatus =
  | 'quoting'
  | 'quoted'
  | 'awaiting_signature'
  | 'submitted'
  | 'confirmed'
  | 'failed'
  | 'expired';

export interface SwapQuoteRequest {
  userId: string;
  networkId: NetworkId;
  fromToken: string; // token address
  toToken: string; // token address
  amountInRaw: string;
  slippageBps: number; // basis points, e.g. 50 = 0.50%
}

/** A single route quote normalized from one aggregator/protocol. */
export interface SwapRouteQuote {
  protocol: SwapProtocolId;
  fromToken: Token;
  toToken: Token;
  amountInRaw: string;
  amountOutRaw: string;
  minAmountOutRaw: string;
  priceImpactBps: number;
  estimatedGasRaw: string;
  routePath: string[]; // ordered list of pool/hop identifiers as returned by the aggregator
  expiresAt: string;
  raw: unknown; // untouched provider payload, kept for execution-time verification
}

export interface SwapExecution {
  id: string;
  userId: string;
  walletId: string;
  networkId: NetworkId;
  chosenRoute: SwapRouteQuote;
  status: SwapStatus;
  txHash: string | null;
  feePercent: string; // decimal string, resolved via packages/fees at execution time
  feeAmountRaw: string;
  createdAt: string;
  updatedAt: string;
}

