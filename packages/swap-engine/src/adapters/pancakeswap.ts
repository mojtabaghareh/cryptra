import type { ISwapAdapter, SwapBuildParams, SwapQuoteParams } from '../types';

/**
 * PancakeSwap-oriented quotes via official 0x Swap API v2.
 * Primary chain: BSC (56). Also ethereum / arbitrum / base where 0x indexes PCS liquidity.
 * Docs: https://0x.org/docs/api
 */

const CHAIN_IDS: Record<string, number> = {
  bsc: 56,
  ethereum: 1,
  arbitrum: 42161,
  base: 8453,
};

function zeroxHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/json',
    '0x-version': 'v2',
  };
  const key = process.env.ZEROX_API_KEY?.trim() || process.env.OX_API_KEY?.trim();
  if (key) h['0x-api-key'] = key;
  return h;
}

export class PancakeSwapAdapter implements ISwapAdapter {
  readonly id = 'pancakeswap';
  readonly name = 'PancakeSwap';
  readonly supportedChains = Object.keys(CHAIN_IDS);

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getQuote(params: SwapQuoteParams) {
    if (params.fromChain !== params.toChain) {
      throw new Error('PancakeSwap adapter is same-chain only');
    }
    const chainId = CHAIN_IDS[params.fromChain];
    if (!chainId) throw new Error(`PancakeSwap unsupported chain: ${params.fromChain}`);

    const url = new URL('https://api.0x.org/swap/allowance-holder/quote');
    url.searchParams.set('chainId', String(chainId));
    url.searchParams.set('sellToken', params.fromToken);
    url.searchParams.set('buyToken', params.toToken);
    url.searchParams.set('sellAmount', params.fromAmount);
    url.searchParams.set('slippageBps', String(params.slippageBps));

    const res = await fetch(url.toString(), {
      headers: zeroxHeaders(),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`PancakeSwap(0x) quote failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      buyAmount?: string;
      transaction?: { to: string; data: string; value: string; gas?: string };
    };

    if (!data.buyAmount) throw new Error('PancakeSwap quote missing buyAmount');

    return {
      toAmount: data.buyAmount,
      route: { protocol: 'pancakeswap', chainId, ...data },
      estimatedGas: data.transaction?.gas,
    };
  }

  async buildTransaction(params: SwapBuildParams) {
    const q = params.quote as {
      transaction?: { to: string; data: string; value: string; gas?: string };
      chainId?: number;
    };

    if (q?.transaction?.to && q.transaction.data) {
      return {
        chain: 'evm',
        chainId: q.chainId,
        to: q.transaction.to,
        data: q.transaction.data,
        value: q.transaction.value || '0',
        gas: q.transaction.gas,
        from: params.userAddress,
      };
    }

    if (!params.fromToken || !params.toToken || !params.fromAmount || !params.fromChain) {
      throw new Error('PancakeSwap build needs tokens/amount/chain when quote has no tx');
    }
    const chainId = CHAIN_IDS[params.fromChain];
    if (!chainId) throw new Error(`Unsupported chain: ${params.fromChain}`);

    const url = new URL('https://api.0x.org/swap/allowance-holder/quote');
    url.searchParams.set('chainId', String(chainId));
    url.searchParams.set('sellToken', params.fromToken);
    url.searchParams.set('buyToken', params.toToken);
    url.searchParams.set('sellAmount', params.fromAmount);
    url.searchParams.set('taker', params.userAddress);
    url.searchParams.set('slippageBps', String(params.slippageBps ?? 50));

    const res = await fetch(url.toString(), {
      headers: zeroxHeaders(),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`PancakeSwap build failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      transaction?: { to: string; data: string; value: string; gas?: string };
    };
    if (!data.transaction?.to) throw new Error('PancakeSwap missing transaction');

    return {
      chain: 'evm',
      chainId,
      to: data.transaction.to,
      data: data.transaction.data,
      value: data.transaction.value || '0',
      gas: data.transaction.gas,
      from: params.userAddress,
    };
  }
}

export const pancakeSwapAdapter = new PancakeSwapAdapter();
