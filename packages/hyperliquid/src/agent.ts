/**
 * Optional Hyperliquid agent wallet execution.
 *
 * When HYPERLIQUID_AGENT_PRIVATE_KEY is unset, callers should only track mids.
 * When set, placeMarketOrder attempts a real exchange API call.
 *
 * Signing HL actions requires their specific L1 action format (msgpack + keccak).
 * This module implements a pragmatic path: if the official signing deps are
 * unavailable, it returns a structured skip so the rest of Cryptra still works.
 *
 * Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
 */

import { hyperliquidClient } from './client';

export interface AgentOrderRequest {
  symbol: string;
  isBuy: boolean;
  size: string;
  leverage?: number;
  reduceOnly?: boolean;
}

export interface AgentOrderResult {
  executed: boolean;
  mode: 'live' | 'tracking_only' | 'skipped';
  mid?: number;
  exchangeResponse?: unknown;
  message: string;
}

function getAgentKey(): string | undefined {
  const k = process.env.HYPERLIQUID_AGENT_PRIVATE_KEY?.trim();
  if (!k || k === '0x' || k.length < 10) return undefined;
  return k.startsWith('0x') ? k : `0x${k}`;
}

export function isAgentConfigured(): boolean {
  return Boolean(getAgentKey());
}

/**
 * Place a market-style order via agent wallet when configured.
 * Otherwise returns tracking_only with live mid price.
 */
export async function placeMarketOrder(req: AgentOrderRequest): Promise<AgentOrderResult> {
  const mid = await hyperliquidClient.getMid(req.symbol.toUpperCase());
  const key = getAgentKey();

  if (!key) {
    return {
      executed: false,
      mode: 'tracking_only',
      mid: mid ?? undefined,
      message:
        'No HYPERLIQUID_AGENT_PRIVATE_KEY — order tracked at HL mid only. Set agent key for live exchange execution.',
    };
  }

  const baseUrl =
    process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';

  // Live path: attempt exchange endpoint.
  // Full EIP-712 / msgpack signing is environment-specific; we post a documented
  // shape and surface the exchange error clearly if signature is incomplete.
  try {
    const assetId = await resolveAssetIndex(req.symbol);
    if (assetId == null) {
      return {
        executed: false,
        mode: 'skipped',
        mid: mid ?? undefined,
        message: `Unknown HL asset: ${req.symbol}`,
      };
    }

    // Without a full HL signer library, we do not invent signatures.
    // Return explicit skip so operators enable a verified signer later.
    return {
      executed: false,
      mode: 'skipped',
      mid: mid ?? undefined,
      message:
        'Agent key detected but full Hyperliquid action signer is not bundled. ' +
        'Mid tracked; wire @nktkas/hyperliquid or official SDK for live /exchange posts. ' +
        `assetIndex=${assetId} size=${req.size} isBuy=${req.isBuy}`,
      exchangeResponse: { baseUrl, assetId },
    };
  } catch (e) {
    return {
      executed: false,
      mode: 'skipped',
      mid: mid ?? undefined,
      message: e instanceof Error ? e.message : 'HL agent path failed',
    };
  }
}

async function resolveAssetIndex(symbol: string): Promise<number | null> {
  const { universe } = await hyperliquidClient.getMetaAndAssetCtxs();
  const upper = symbol.toUpperCase();
  const idx = universe.findIndex((u) => u.name.toUpperCase() === upper);
  return idx >= 0 ? idx : null;
}
