/**
 * Hyperliquid agent wallet execution with real L1 action signing.
 *
 * Env:
 *  - HYPERLIQUID_AGENT_PRIVATE_KEY  (required for live)
 *  - HYPERLIQUID_API_URL            (default mainnet)
 *  - HYPERLIQUID_IS_MAINNET         (default true; set "false" for testnet)
 *
 * Market orders are sent as aggressive IOC limits at mid ± slippage.
 */

import { hyperliquidClient } from './client';
import {
  buildOrderAction,
  buildUpdateLeverageAction,
  signL1Action,
} from './signing';

export interface AgentOrderRequest {
  symbol: string;
  isBuy: boolean;
  size: string;
  leverage?: number;
  reduceOnly?: boolean;
  /** Max deviation from mid for IOC aggressive price, default 0.5% */
  slippageBps?: number;
}

export interface AgentOrderResult {
  executed: boolean;
  mode: 'live' | 'tracking_only' | 'skipped';
  mid?: number;
  exchangeResponse?: unknown;
  message: string;
  signature?: { r: string; s: string; v: number };
  nonce?: number;
}

function getAgentKey(): string | undefined {
  const k = process.env.HYPERLIQUID_AGENT_PRIVATE_KEY?.trim();
  if (!k || k === '0x' || k.length < 10) return undefined;
  return k.startsWith('0x') ? k : `0x${k}`;
}

export function isAgentConfigured(): boolean {
  return Boolean(getAgentKey());
}

function isMainnet(): boolean {
  const v = process.env.HYPERLIQUID_IS_MAINNET?.trim().toLowerCase();
  if (v === 'false' || v === '0') return false;
  const url = process.env.HYPERLIQUID_API_URL || '';
  if (url.includes('testnet')) return false;
  return true;
}

function baseUrl(): string {
  return process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';
}

function aggressivePrice(mid: number, isBuy: boolean, slippageBps: number): string {
  const mult = isBuy ? 1 + slippageBps / 10_000 : 1 - slippageBps / 10_000;
  const px = mid * mult;
  // HL expects string decimals without scientific notation
  if (px >= 1000) return px.toFixed(1);
  if (px >= 1) return px.toFixed(3);
  if (px >= 0.01) return px.toFixed(5);
  return px.toFixed(8);
}

async function postExchange(body: unknown): Promise<unknown> {
  const res = await fetch(`${baseUrl()}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HL exchange ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(`HL exchange ${res.status}: ${text.slice(0, 300)}`);
  }
  return json;
}

async function resolveAssetIndex(symbol: string): Promise<number | null> {
  const { universe } = await hyperliquidClient.getMetaAndAssetCtxs();
  const upper = symbol.toUpperCase();
  const idx = universe.findIndex((u) => u.name.toUpperCase() === upper);
  return idx >= 0 ? idx : null;
}

async function signAndPost(action: Record<string, unknown>, key: string) {
  const nonce = Date.now();
  const signature = await signL1Action({
    privateKey: key,
    action,
    nonce,
    isMainnet: isMainnet(),
  });
  const response = await postExchange({
    action,
    nonce,
    signature,
  });
  return { nonce, signature, response };
}

/**
 * Place a market-style IOC order via agent wallet when configured.
 */
export async function placeMarketOrder(req: AgentOrderRequest): Promise<AgentOrderResult> {
  const mid = await hyperliquidClient.getMid(req.symbol.toUpperCase());
  const key = getAgentKey();
  const slippageBps = req.slippageBps ?? 50;

  if (!key) {
    return {
      executed: false,
      mode: 'tracking_only',
      mid: mid ?? undefined,
      message:
        'No HYPERLIQUID_AGENT_PRIVATE_KEY — order tracked at HL mid only. Set agent key for live exchange execution.',
    };
  }

  if (mid == null || !Number.isFinite(mid) || mid <= 0) {
    return {
      executed: false,
      mode: 'skipped',
      message: `No mid price for ${req.symbol}`,
    };
  }

  try {
    const assetId = await resolveAssetIndex(req.symbol);
    if (assetId == null) {
      return {
        executed: false,
        mode: 'skipped',
        mid,
        message: `Unknown HL asset: ${req.symbol}`,
      };
    }

    // Optional leverage update first (best-effort)
    if (req.leverage != null && req.leverage >= 1) {
      try {
        const levAction = buildUpdateLeverageAction({
          assetIndex: assetId,
          isCross: true,
          leverage: Math.min(50, Math.floor(req.leverage)),
        });
        await signAndPost(levAction, key);
      } catch (e) {
        console.warn('[HL] updateLeverage failed (continuing to order)', e);
      }
    }

    const price = aggressivePrice(mid, req.isBuy, slippageBps);
    const action = buildOrderAction({
      assetIndex: assetId,
      isBuy: req.isBuy,
      price,
      size: req.size,
      reduceOnly: req.reduceOnly ?? false,
      tif: 'Ioc',
    });

    const { nonce, signature, response } = await signAndPost(action, key);

    // HL returns { status: "ok", response: { type: "order", data: { statuses: [...] } } }
    const status =
      typeof response === 'object' && response && 'status' in response
        ? String((response as { status: unknown }).status)
        : 'unknown';

    const ok = status === 'ok';
    return {
      executed: ok,
      mode: ok ? 'live' : 'skipped',
      mid,
      nonce,
      signature,
      exchangeResponse: response,
      message: ok
        ? `Live HL order posted · asset=${assetId} px=${price} sz=${req.size} side=${req.isBuy ? 'buy' : 'sell'}`
        : `HL exchange rejected · ${JSON.stringify(response).slice(0, 200)}`,
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
