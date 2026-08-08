// ============================================================
// Cryptra V2 — Hyperliquid Adapter
// File: HyperliquidAdapter.ts
// Version: 2.0.0
// Production architecture — no mocks / no fake orders
// ============================================================

export type HyperliquidOrderType =
  | 'market'
  | 'limit';

export interface HyperliquidOrder {
  symbol: string;
  side: 'buy' | 'sell';
  type: HyperliquidOrderType;
  size: string;
  price?: string;
  reduceOnly?: boolean;
  timeInForce?: 'Alo' | 'Ioc' | 'Gtc';
  clientOrderId?: string;
}

export interface HyperliquidSignedRequest {
  action: Record<string, unknown>;
  nonce: number;
  signature: Record<string, unknown>;
  vaultAddress?: string;
  expiresAfter?: number;
}

export interface HyperliquidResponse {
  success: boolean;
  orderId?: string;
  transactionHash?: string;
  status?:
    | 'pending'
    | 'confirmed'
    | 'failed';
  data?: unknown;
  error?: string;
  code?: string;
}

export interface HyperliquidSigner {
  signL1Action(
    action: Record<string, unknown>,
    nonce: number,
    expiresAfter?: number,
  ): Promise<Record<string, unknown>>;
}

interface HyperliquidMetaResponse {
  universe: Array<{
    name: string;
    szDecimals: number;
    maxLeverage?: number;
    onlyIsolated?: boolean;
  }>;
}

interface HyperliquidOrderResponse {
  status: string;
  response?: {
    type: string;
    data?: {
      statuses?: Array<
        | string
        | {
            resting?: {
              oid: number;
            };
            filled?: {
              oid: number;
              avgPx?: string;
              totalSz?: string;
            };
            error?: string;
          }
      >;
    };
  };
}

export class HyperliquidAdapter {
  private readonly baseUrl: string;
  private readonly signer: HyperliquidSigner;
  private readonly timeoutMs: number;

  constructor(
    signer: HyperliquidSigner,
    options?: {
      baseUrl?: string;
      timeoutMs?: number;
    },
  ) {
    this.signer = signer;

    this.baseUrl =
      options?.baseUrl?.replace(/\/+$/, '') ??
      'https://api.hyperliquid.xyz';

    this.timeoutMs = options?.timeoutMs ?? 15_000;
  }

  private async post<T>(
    endpoint: string,
    body: unknown,
  ): Promise<T> {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    );

    try {
      const response = await fetch(
        `${this.baseUrl}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      const text = await response.text();

      let data: unknown;

      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        throw new Error(
          `Invalid JSON response from Hyperliquid: ${text}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          `Hyperliquid HTTP ${response.status}`,
        );
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getMeta(): Promise<HyperliquidMetaResponse> {
    return this.post<HyperliquidMetaResponse>(
      'info',
      {
        type: 'meta',
      },
    );
  }

  async getPrice(
    symbol: string,
  ): Promise<number> {
    const response = await this.post<
      Array<{
        coin: string;
        markPx: string;
      }>
    >(
      'info',
      {
        type: 'allMids',
      },
    );

    const item = response.find(
      (entry) =>
        entry.coin.toUpperCase() ===
        symbol.toUpperCase(),
    );

    if (!item) {
      throw new Error(
        `Hyperliquid price not found for ${symbol}`,
      );
    }

    const price = Number(item.markPx);

    if (!Number.isFinite(price)) {
      throw new Error(
        `Invalid Hyperliquid price for ${symbol}`,
      );
    }

    return price;
  }

  private async resolveAssetIndex(
    symbol: string,
  ): Promise<number> {
    const meta = await this.getMeta();

    const index = meta.universe.findIndex(
      (asset) =>
        asset.name.toUpperCase() ===
        symbol.toUpperCase(),
    );

    if (index < 0) {
      throw new Error(
        `Hyperliquid asset not found: ${symbol}`,
      );
    }

    return index;
  }

  async placeOrder(
    order: HyperliquidOrder,
  ): Promise<HyperliquidResponse> {
    try {
      if (!order.size || Number(order.size) <= 0) {
        throw new Error(
          'Order size must be greater than zero',
        );
      }

      if (
        order.type === 'limit' &&
        (!order.price || Number(order.price) <= 0)
      ) {
        throw new Error(
          'Limit orders require a valid price',
        );
      }

      const assetIndex =
        await this.resolveAssetIndex(order.symbol);

      const nonce = Date.now();

      const isBuy = order.side === 'buy';

      const orderType =
        order.type === 'market'
          ? {
              limit: {
                tif: 'Ioc',
              },
            }
          : {
              limit: {
                tif:
                  order.timeInForce ?? 'Gtc',
              },
            };

      const action: Record<string, unknown> = {
        type: 'order',

        orders: [
          {
            a: assetIndex,
            b: isBuy,
            p:
              order.type === 'market'
                ? await this.getPrice(order.symbol)
                : order.price,
            s: order.size,
            r: order.reduceOnly ?? false,
            t: orderType,
            ...(order.clientOrderId
              ? {
                  c: order.clientOrderId,
                }
              : {}),
          },
        ],

        grouping: 'na',
      };

      const signature =
        await this.signer.signL1Action(
          action,
          nonce,
        );

      const payload: HyperliquidSignedRequest = {
        action,
        nonce,
        signature,
      };

      const response =
        await this.post<HyperliquidOrderResponse>(
          'exchange',
          payload,
        );

      const status =
        response.response?.data?.statuses?.[0];

      if (
        typeof status === 'object' &&
        status !== null &&
        'error' in status &&
        typeof status.error === 'string'
      ) {
        return {
          success: false,
          status: 'failed',
          error: status.error,
          code: 'HYPERLIQUID_ORDER_REJECTED',
          data: response,
        };
      }

      let orderId: string | undefined;

      if (
        typeof status === 'object' &&
        status !== null &&
        'resting' in status &&
        status.resting
      ) {
        orderId =
          status.resting.oid.toString();
      }

      if (
        typeof status === 'object' &&
        status !== null &&
        'filled' in status &&
        status.filled
      ) {
        orderId =
          status.filled.oid.toString();
      }

      return {
        success: true,
        orderId,
        status: 'confirmed',
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error:
          error instanceof Error
            ? error.message
            : 'Unknown Hyperliquid error',
        code: 'HYPERLIQUID_ORDER_FAILED',
      };
    }
  }
}
