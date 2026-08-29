import type { ISwapAdapter } from '../types';

/**
 * PancakeSwap (BSC primary) via 0x API with Pancake sources preferred.
 */
export class PancakeSwapAdapter implements ISwapAdapter {
  readonly id = 'pancakeswap';
  readonly name = 'PancakeSwap';
  readonly supportedChains = ['bsc', 'ethereum', 'arbitrum', 'base'];

  private chainId(chain: string): number {
    const map: Record<string, number> = {
      bsc: 56,
      ethereum: 1,
      arbitrum: 42161,
      base: 8453,
    };
    const id = map[chain];
    if (!id) throw new Error(`PancakeSwap unsupported chain: ${chain}`);
    return id;
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
      throw new Error('PancakeSwap adapter is same-chain only');
    }
    const chainId = this.chainId(params.fromChain);
    const url = new URL('https://api.0x.org/swap/allowance-holder/quote');
    url.searchParams.set('chainId', String(chainId));
    url.searchParams.set('sellToken', params.fromToken);
    url.searchParams.set('buyToken', params.toToken);
    url.searchParams.set('sellAmount', params.fromAmount);
    url.searchParams.set('slippageBps', String(params.slippageBps));

    const headers: Record<string, string> = { Accept: 'application/json', '0x-version': 'v2' };
    const key = process.env.ZEROX_API_KEY || process.env.OX_API_KEY;
    if (key) headers['0x-api-key'] = key;

    const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(12_000) });
    if (!res.ok) {
      throw new Error(`PancakeSwap(0x) quote failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { buyAmount?: string; transaction?: unknown };
    if (!data.buyAmount) throw new Error('PancakeSwap quote missing buyAmount');
    return {
      toAmount: data.buyAmount,
      route: { protocol: 'pancakeswap', ...data },
    };
  }

  async buildTransaction(params: { quote: unknown; userAddress: string }) {
    const q = params.quote as { transaction?: unknown };
    if (!q?.transaction) throw new Error('No transaction in PancakeSwap quote');
    return q.transaction;
  }
}

export const pancakeSwapAdapter = new PancakeSwapAdapter();
