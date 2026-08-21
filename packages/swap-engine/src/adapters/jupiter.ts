import type { ISwapAdapter } from '../types';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

/**
 * Jupiter Aggregator adapter (Solana).
 * Uses the public Jupiter Quote API.
 */
export class JupiterAdapter implements ISwapAdapter {
  readonly id = 'jupiter';
  readonly name = 'Jupiter';
  readonly supportedChains = ['solana'];

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=50', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuote(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromChain: string;
    toChain: string;
    slippageBps: number;
  }) {
    if (params.fromChain !== 'solana' || params.toChain !== 'solana') {
      throw new Error('Jupiter only supports Solana');
    }

    // fromAmount is expected in smallest units (lamports / token decimals)
    const url = new URL(JUPITER_QUOTE_API);
    url.searchParams.set('inputMint', params.fromToken);
    url.searchParams.set('outputMint', params.toToken);
    url.searchParams.set('amount', params.fromAmount);
    url.searchParams.set('slippageBps', String(params.slippageBps));
    url.searchParams.set('onlyDirectRoutes', 'false');
    url.searchParams.set('asLegacyTransaction', 'false');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jupiter quote failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      outAmount: string;
      priceImpactPct?: number;
      routePlan?: unknown;
      otherAmountThreshold?: string;
    };

    const priceImpactBps =
      data.priceImpactPct != null
        ? Math.round(Number(data.priceImpactPct) * 100)
        : undefined;

    return {
      toAmount: data.outAmount,
      route: data,
      priceImpactBps,
      estimatedGas: undefined,
    };
  }

  async buildTransaction(params: {
    quote: unknown;
    userAddress: string;
  }) {
    const res = await fetch(JUPITER_SWAP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        quoteResponse: params.quote,
        userPublicKey: params.userAddress,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jupiter swap build failed: ${res.status} ${text}`);
    }

    return res.json();
  }
}

export const jupiterAdapter = new JupiterAdapter();
