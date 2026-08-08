// ============================================================
// Cryptra V2 — Jupiter Adapter
// File: jupiter.ts
// Version: 2.0.0
// Production implementation — no mocks / no simulations
// ============================================================

export interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  swapMode?: 'ExactIn' | 'ExactOut';
  restrictIntermediateTokens?: boolean;
  onlyDirectRoutes?: boolean;
}

export interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;

  inAmount: string;
  outAmount: string;

  otherAmountThreshold: string;

  swapMode: 'ExactIn' | 'ExactOut';

  slippageBps: number;

  priceImpactPct: string;

  routePlan: unknown[];

  contextSlot?: number;

  timeTaken?: number;
}

export interface JupiterSwapParams {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;

  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  feeAccount?: string;
  trackingAccount?: string;

  dynamicComputeUnitLimit?: boolean;
  dynamicSlippage?: boolean;

  prioritizationFeeLamports?:
    | 'auto'
    | number
    | {
        priorityLevelWithMaxLamports: {
          priorityLevel:
            | 'medium'
            | 'high'
            | 'veryHigh';

          maxLamports: number;

          global?: boolean;
        };
      };
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
  prioritizationType?: unknown;
  dynamicSlippageReport?: unknown;
}

export interface JupiterResponse {
  success: boolean;

  quote?: JupiterQuoteResponse;

  swapTransaction?: string;

  lastValidBlockHeight?: number;

  outputAmount?: string;

  error?: string;

  code?: string;
}

export class JupiterAdapter {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    apiKey: string,
    options?: {
      baseUrl?: string;
      timeoutMs?: number;
    },
  ) {
    if (!apiKey?.trim()) {
      throw new Error('Jupiter API key is required');
    }

    this.apiKey = apiKey.trim();

    this.baseUrl =
      options?.baseUrl?.replace(/\/+$/, '') ??
      'https://api.jup.ag';

    this.timeoutMs = options?.timeoutMs ?? 15_000;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    );

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body:
          method === 'POST'
            ? JSON.stringify(body)
            : undefined,
        signal: controller.signal,
      });

      const text = await response.text();

      let data: unknown;

      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        data = undefined;
      }

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof data.error === 'string'
            ? data.error
            : `Jupiter API request failed with HTTP ${response.status}`;

        throw new Error(message);
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getQuote(
    params: JupiterQuoteParams,
  ): Promise<JupiterQuoteResponse> {
    return this.request<JupiterQuoteResponse>(
      'swap/v1/quote',
      'GET',
      undefined,
      {
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: params.slippageBps,
        swapMode: params.swapMode,
        restrictIntermediateTokens:
          params.restrictIntermediateTokens,
        onlyDirectRoutes: params.onlyDirectRoutes,
      },
    );
  }

  async buildSwap(
    params: JupiterSwapParams,
  ): Promise<JupiterSwapResponse> {
    return this.request<JupiterSwapResponse>(
      'swap/v1/swap',
      'POST',
      {
        quoteResponse: params.quoteResponse,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: params.wrapAndUnwrapSol,
        useSharedAccounts: params.useSharedAccounts,
        feeAccount: params.feeAccount,
        trackingAccount: params.trackingAccount,
        dynamicComputeUnitLimit:
          params.dynamicComputeUnitLimit,
        dynamicSlippage: params.dynamicSlippage,
        prioritizationFeeLamports:
          params.prioritizationFeeLamports,
      },
    );
  }

  async swap(
    params: JupiterSwapParams,
  ): Promise<JupiterResponse> {
    try {
      const result = await this.buildSwap(params);

      return {
        success: true,
        swapTransaction: result.swapTransaction,
        lastValidBlockHeight:
          result.lastValidBlockHeight,
        outputAmount:
          params.quoteResponse.outAmount,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown Jupiter API error',
        code: 'JUPITER_SWAP_FAILED',
      };
    }
  }
}
