import { getConfig } from '@cryptra/config';
import type { IPerpAdapter, OrderSide, OrderType } from '../types';

/**
 * Hyperliquid adapter.
 * Uses the public REST API. Signing of orders must be done client-side
 * or via a secure signer service — this adapter focuses on market data
 * and order placement structure.
 *
 * Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/
 */
export class HyperliquidAdapter implements IPerpAdapter {
  readonly id = 'hyperliquid';
  readonly name = 'Hyperliquid';

  private get baseUrl(): string {
    try {
      return getConfig().HYPERLIQUID_API_URL;
    } catch {
      return 'https://api.hyperliquid.xyz';
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' }),
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMarkPrice(symbol: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Hyperliquid allMids failed: ${res.status}`);
    }

    const data = (await res.json()) as Record<string, string>;
    const price = data[symbol];
    if (!price) {
      throw new Error(`No mark price for symbol ${symbol}`);
    }
    return price;
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
  }): Promise<{ externalId: string; status: string }> {
    // Hyperliquid requires EIP-712 signed payloads.
    // In production this should go through a secure signing service.
    // Here we structure the call and return a clear error if signing is not available.

    if (!params.userAddress) {
      throw new Error(
        'Hyperliquid requires a user address and signed payload. ' +
          'Sign the order on the client or via a signer service, then submit.',
      );
    }

    // Placeholder for the actual exchange endpoint
    // Real implementation needs the signed action body.
    throw new Error(
      'Hyperliquid order signing is not configured on the server. ' +
        'Use client-side signing and submit the signed payload.',
    );
  }

  async getMeta() {
    const res = await fetch(`${this.baseUrl}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Hyperliquid meta failed: ${res.status}`);
    }

    return res.json();
  }
}

export const hyperliquidAdapter = new HyperliquidAdapter();
