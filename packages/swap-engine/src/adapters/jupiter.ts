import type { ISwapAdapter, SwapBuildParams, SwapQuoteParams } from '../types';

/**
 * Jupiter Swap API (official).
 * Free tier:  https://lite-api.jup.ag/swap/v1/*
 * Paid tier:  https://api.jup.ag/swap/v1/*  + header x-api-key (portal.jup.ag)
 *
 * Docs: https://dev.jup.ag / https://station.jup.ag/docs
 * Old quote-api.jup.ag/v6 is deprecated.
 */

function jupiterBase(): string {
  const custom = process.env.JUPITER_API_URL?.trim();
  if (custom) return custom.replace(/\/$/, '');
  // Paid host when key present
  if (process.env.JUPITER_API_KEY?.trim()) return 'https://api.jup.ag/swap/v1';
  return 'https://lite-api.jup.ag/swap/v1';
}

function jupiterHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  const key = process.env.JUPITER_API_KEY?.trim();
  if (key) h['x-api-key'] = key;
  return h;
}

export class JupiterAdapter implements ISwapAdapter {
  readonly id = 'jupiter';
  readonly name = 'Jupiter';
  readonly supportedChains = ['solana'];

  async isAvailable(): Promise<boolean> {
    try {
      const url =
        `${jupiterBase()}/quote` +
        `?inputMint=So11111111111111111111111111111111111111112` +
        `&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` +
        `&amount=1000000&slippageBps=50`;
      const res = await fetch(url, {
        headers: jupiterHeaders(),
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuote(params: SwapQuoteParams) {
    if (params.fromChain !== 'solana' || params.toChain !== 'solana') {
      throw new Error('Jupiter only supports Solana');
    }

    const url = new URL(`${jupiterBase()}/quote`);
    url.searchParams.set('inputMint', params.fromToken);
    url.searchParams.set('outputMint', params.toToken);
    url.searchParams.set('amount', params.fromAmount);
    url.searchParams.set('slippageBps', String(params.slippageBps));
    url.searchParams.set('onlyDirectRoutes', 'false');
    url.searchParams.set('asLegacyTransaction', 'false');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: jupiterHeaders(),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jupiter quote failed: ${res.status} ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      outAmount: string;
      priceImpactPct?: string | number;
      routePlan?: unknown;
      otherAmountThreshold?: string;
      contextSlot?: number;
    };

    if (!data.outAmount) throw new Error('Jupiter quote missing outAmount');

    const impact =
      data.priceImpactPct != null ? Math.round(Number(data.priceImpactPct) * 100) : undefined;

    return {
      toAmount: data.outAmount,
      route: { protocol: 'jupiter', ...data },
      priceImpactBps: impact,
    };
  }

  async buildTransaction(params: SwapBuildParams) {
    const quoteResponse = params.quote as Record<string, unknown>;
    // Strip our wrapper field if present
    const { protocol: _p, ...rawQuote } = quoteResponse;

    const res = await fetch(`${jupiterBase()}/swap`, {
      method: 'POST',
      headers: {
        ...jupiterHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: Object.keys(rawQuote).length ? rawQuote : quoteResponse,
        userPublicKey: params.userAddress,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jupiter swap build failed: ${res.status} ${text.slice(0, 300)}`);
    }

    const body = (await res.json()) as {
      swapTransaction?: string;
      lastValidBlockHeight?: number;
      prioritizationFeeLamports?: number;
    };

    if (!body.swapTransaction) {
      throw new Error('Jupiter swap response missing swapTransaction');
    }

    return {
      chain: 'solana',
      swapTransaction: body.swapTransaction,
      lastValidBlockHeight: body.lastValidBlockHeight,
      prioritizationFeeLamports: body.prioritizationFeeLamports,
      encoding: 'base64',
    };
  }
}

export const jupiterAdapter = new JupiterAdapter();
