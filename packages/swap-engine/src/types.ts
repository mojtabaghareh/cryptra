export interface SwapQuoteRequest {
  userId: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromChain: string;
  toChain: string;
  slippageBps?: number; // default 50 = 0.5%
  preferredProtocol?: string;
}

export interface SwapQuote {
  quoteId: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromChain: string;
  toChain: string;
  protocol: string;
  route: unknown;
  feePercent: number;
  feeAmount: string;
  priceImpactBps?: number;
  estimatedGas?: string;
  expiresAt: Date;
}

export interface SwapExecuteRequest {
  userId: string;
  quoteId: string;
  txHash?: string;
}

export interface SwapExecuteResult {
  swapId: string;
  status: 'SUBMITTED' | 'CONFIRMED' | 'FAILED';
  txHash?: string;
  errorMessage?: string;
}

export interface SwapQuoteParams {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromChain: string;
  toChain: string;
  slippageBps: number;
}

export interface SwapQuoteResult {
  toAmount: string;
  route: unknown;
  priceImpactBps?: number;
  estimatedGas?: string;
}

/** Unified build input — adapters ignore fields they do not need. */
export interface SwapBuildParams {
  quote: unknown;
  userAddress: string;
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  fromChain?: string;
  toChain?: string;
  slippageBps?: number;
}

export interface ISwapAdapter {
  readonly id: string;
  readonly name: string;
  readonly supportedChains: string[];

  isAvailable(): Promise<boolean>;

  getQuote(params: SwapQuoteParams): Promise<SwapQuoteResult>;

  buildTransaction?(params: SwapBuildParams): Promise<unknown>;
}
