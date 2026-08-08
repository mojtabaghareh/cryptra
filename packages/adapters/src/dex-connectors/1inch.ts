// ============================================================
// Cryptra V2 — 1inch Adapter
// File: 1inch.ts
// Version: 2.0.0
// Production implementation — no mocks / no simulations
// ============================================================

export interface OneInchSwapParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage: number;
  chainId: number;
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
  receiver?: string;
  referrer?: string;
}

export interface OneInchQuoteResponse {
  fromToken: {
    address: string;
    symbol?: string;
    name?: string;
    decimals?: number;
  };

  toToken: {
    address: string;
    symbol?: string;
    name?: string;
    decimals?: number;
  };

  fromTokenAmount: string;
  toTokenAmount: string;

  estimatedGas?: number;

  protocols?: unknown[];
}

export interface OneInchSwapResponse {
  dstAmount: string;

  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas?: number;
    gasPrice?: string;
  };

  fromToken?: {
    address: string;
    symbol?: string;
    name?: string;
    decimals?: number;
  };

  toToken?: {
    address: string;
    symbol?: string;
    name?: string;
    decimals?: number;
  };

  protocols?: unknown[];
}

export interface OneInchResponse {
  success: boolean;
  tx?: OneInchSwapResponse['tx'];
  toTokenAmount?: string;
  quote?: OneInchQuoteResponse;
  error?: string;
  code?: string;
}

export class OneInchAdapter {
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
      throw new Error('1inch API key is required');
    }

    this.apiKey = apiKey.trim();

    this.baseUrl =
      options?.baseUrl?.replace(/\/+$/, '') ??
      'https://api.1inch.dev/swap/v6.0';

    this.timeoutMs = options?.timeoutMs ?? 15_000;
  }

  private async request<T>(
    chainId: number,
    endpoint: string,
    params: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        query.set(key, String(value));
      }
    }

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    );

    try {
      const response = await fetch(
        `${this.baseUrl}/${chainId}/${endpoint}?${query.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          signal: controller.signal,
        },
      );

      const text = await response.text();

      let body: unknown;

      try {
        body = text ? JSON.parse(text) : undefined;
      } catch {
        body = undefined;
      }

      if (!response.ok) {
        const message =
          typeof body === 'object' &&
          body !== null &&
          'description' in body &&
          typeof body.description === 'string'
            ? body.description
            : `1inch API request failed with HTTP ${response.status}`;

        throw new Error(message);
      }

      return body as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getQuote(
    params: Pick<
      OneInchSwapParams,
      | 'fromTokenAddress'
      | 'toTokenAddress'
      | 'amount'
      | 'chainId'
    >,
  ): Promise<OneInchQuoteResponse> {
    return this.request<OneInchQuoteResponse>(
      params.chainId,
      'quote',
      {
        src: params.fromTokenAddress,
        dst: params.toTokenAddress,
        amount: params.amount,
      },
    );
  }

  async swap(
    params: OneInchSwapParams,
  ): Promise<OneInchResponse> {
    try {
      const swap = await this.request<OneInchSwapResponse>(
        params.chainId,
        'swap',
        {
          src: params.fromTokenAddress,
          dst: params.toTokenAddress,
          amount: params.amount,
          from: params.fromAddress,
          slippage: params.slippage,
          disableEstimate: params.disableEstimate,
          allowPartialFill: params.allowPartialFill,
          receiver: params.receiver,
          referrer: params.referrer,
        },
      );

      return {
        success: true,
        tx: swap.tx,
        toTokenAmount: swap.dstAmount,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown 1inch API error',
        code: 'ONEINCH_SWAP_FAILED',
      };
    }
  }
}
