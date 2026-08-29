import type { ISwapAdapter } from '../types';

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
};

/**
 * Uniswap routes via 0x Swap API restricted to Uniswap sources.
 * Requires ZEROX_API_KEY for production rate limits (optional for light use).
 * Docs: https://0x.org/docs/api
 */
export class UniswapAdapter implements ISwapAdapter {
  readonly id = 'uniswap';
  readonly name = 'Uniswap';
  readonly supportedChains = Object.keys(CHAIN_IDS);

  private apiKey(): string | undefined {
    return process.env.ZEROX_API_KEY || process.env.OX_API_KEY;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getQuote(params: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromChain: string;
    toChain: string;
    slippageBps: number;
  }) {
    if (params.fromChain !== params.toChain) {
      throw new Error('Uniswap adapter is same-chain only');
    }
    const chainId = CHAIN_IDS[params.fromChain];
    if (!chainId) throw new Error(`Unsupported chain: ${params.fromChain}`);

    const url = new URL('https://api.0x.org/swap/allowance-holder/quote');
    url.searchParams.set('chainId', String(chainId));
    url.searchParams.set('sellToken', params.fromToken);
    url.searchParams.set('buyToken', params.toToken);
    url.searchParams.set('sellAmount', params.fromAmount);
    url.searchParams.set('slippageBps', String(params.slippageBps));
    url.searchParams.set('excludedSources', '0x_RFQ,Curve,Balancer_V2,SushiSwap');

    const headers: Record<string, string> = { Accept: 'application/json', '0x-version': 'v2' };
    const key = this.apiKey();
    if (key) headers['0x-api-key'] = key;

    const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(12_000) });
    if (!res.ok) {
      throw new Error(`Uniswap(0x) quote failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      buyAmount?: string;
      transaction?: unknown;
      issues?: unknown;
    };
    if (!data.buyAmount) throw new Error('Uniswap quote missing buyAmount');
    return {
      toAmount: data.buyAmount,
      route: { protocol: 'uniswap', ...data },
      estimatedGas: undefined,
    };
  }

  async buildTransaction(params: { quote: unknown; userAddress: string }) {
    const q = params.quote as { transaction?: unknown };
    if (!q?.transaction) {
      throw new Error('Uniswap quote has no transaction payload — request a fresh quote');
    }
    return q.transaction;
  }
}

export const uniswapAdapter = new UniswapAdapter();
