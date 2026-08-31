import {
  hyperliquidClient,
  placeMarketOrder,
  isAgentConfigured,
} from '@cryptra/hyperliquid';
import type { IPerpAdapter, OrderSide, OrderType, PerpMarketSnapshot } from '../types';

/**
 * Hyperliquid — official public API
 * Info:  POST https://api.hyperliquid.xyz/info
 * Exchange: POST https://api.hyperliquid.xyz/exchange (signed L1 actions)
 * Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
 */
export class HyperliquidAdapter implements IPerpAdapter {
  readonly id = 'hyperliquid';
  readonly name = 'Hyperliquid';

  private get baseUrl(): string {
    return process.env.HYPERLIQUID_API_URL?.trim() || 'https://api.hyperliquid.xyz';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' }),
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMarkPrice(symbol: string): Promise<string> {
    const mid = await hyperliquidClient.getMid(symbol.toUpperCase());
    if (mid == null) {
      // Fallback metaAndAssetCtxs
      const { mids } = await hyperliquidClient.getMetaAndAssetCtxs();
      const px = mids[symbol.toUpperCase()];
      if (px == null) throw new Error(`Hyperliquid: no mid for ${symbol}`);
      return String(px);
    }
    return String(mid);
  }

  async listMarkets(): Promise<PerpMarketSnapshot[]> {
    const { universe, mids, assetCtxs } = await hyperliquidClient.getMetaAndAssetCtxs();
    return universe.map((u, i) => {
      const ctx = (assetCtxs[i] || {}) as {
        markPx?: string;
        midPx?: string;
        oraclePx?: string;
        funding?: string;
        openInterest?: string;
        dayNtlVlm?: string;
      };
      return {
        symbol: u.name,
        markPrice: ctx.markPx || (mids[u.name] != null ? String(mids[u.name]) : undefined),
        midPrice: ctx.midPx || (mids[u.name] != null ? String(mids[u.name]) : undefined),
        indexPrice: ctx.oraclePx,
        fundingRate: ctx.funding,
        openInterest: ctx.openInterest,
        maxLeverage: u.maxLeverage,
        volume24h: ctx.dayNtlVlm,
        raw: { meta: u, ctx },
      };
    });
  }

  async placeOrder(params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    size: string;
    price?: string;
    stopPrice?: string;
    leverage: number;
    userAddress?: string;
  }): Promise<{ externalId: string; status: string; message?: string }> {
    const result = await placeMarketOrder({
      symbol: params.symbol,
      isBuy: params.side === 'LONG',
      size: params.size,
      leverage: params.leverage,
    });

    if (result.executed) {
      return {
        externalId: `hl-live-${Date.now()}`,
        status: 'filled',
        message: result.message,
      };
    }

    // tracking_only still records local order with mid
    if (result.mode === 'tracking_only') {
      return {
        externalId: `hl-track-${Date.now()}`,
        status: 'open',
        message: result.message,
      };
    }

    throw new Error(
      result.message ||
        (isAgentConfigured()
          ? 'Hyperliquid exchange rejected order'
          : 'Set HYPERLIQUID_AGENT_PRIVATE_KEY for live HL orders'),
    );
  }

  async getPosition(_symbol: string, userAddress: string): Promise<unknown> {
    return hyperliquidClient.getClearinghouseState(userAddress);
  }
}

export const hyperliquidAdapter = new HyperliquidAdapter();
