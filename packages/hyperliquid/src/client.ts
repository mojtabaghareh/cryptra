/**
 * Hyperliquid public info API client.
 * Live order signing requires agent wallet keys — not stored on server by default.
 * This client enriches quotes/fills with real mid prices and meta.
 *
 * Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
 */

const DEFAULT_URL = 'https://api.hyperliquid.xyz';

export interface HlAssetMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
}

export interface HlMidPrice {
  symbol: string;
  mid: number;
}

export class HyperliquidClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      process.env.HYPERLIQUID_API_URL ||
      DEFAULT_URL;
  }

  private async postInfo(body: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Hyperliquid info ${res.status}: ${text}`);
    }
    return res.json();
  }

  /** All perp universe + asset contexts */
  async getMetaAndAssetCtxs(): Promise<{
    universe: HlAssetMeta[];
    mids: Record<string, number>;
  }> {
    const data = (await this.postInfo({ type: 'metaAndAssetCtxs' })) as [
      { universe: Array<{ name: string; szDecimals: number; maxLeverage: number }> },
      Array<{ midPx?: string; markPx?: string }>,
    ];

    const universe = (data[0]?.universe ?? []).map((u) => ({
      name: u.name,
      szDecimals: u.szDecimals,
      maxLeverage: u.maxLeverage,
    }));

    const mids: Record<string, number> = {};
    const ctxs = data[1] ?? [];
    for (let i = 0; i < universe.length; i++) {
      const px = ctxs[i]?.midPx || ctxs[i]?.markPx;
      if (px) mids[universe[i].name] = Number(px);
    }

    return { universe, mids };
  }

  async getAllMids(): Promise<Record<string, string>> {
    const data = (await this.postInfo({ type: 'allMids' })) as Record<string, string>;
    return data ?? {};
  }

  async getMid(symbol: string): Promise<number | null> {
    const mids = await this.getAllMids();
    // HL uses coin names like BTC, ETH
    const raw = mids[symbol] ?? mids[symbol.toUpperCase()];
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  async getMajorPerps(): Promise<HlMidPrice[]> {
    const symbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'ARB', 'OP', 'AVAX', 'LINK', 'MATIC', 'TIA'];
    const mids = await this.getAllMids();
    return symbols
      .filter((s) => mids[s] != null)
      .map((s) => ({ symbol: s, mid: Number(mids[s]) }));
  }
}

export const hyperliquidClient = new HyperliquidClient();
