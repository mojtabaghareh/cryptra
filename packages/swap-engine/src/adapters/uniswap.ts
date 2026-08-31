import type { ISwapAdapter, SwapBuildParams, SwapQuoteParams } from '../types';

/**
 * Uniswap liquidity routed through official 0x Swap API v2 (Allowance Holder).
 * Prefer Uniswap sources; still an aggregator call with official 0x endpoints.
 *
 * Docs: https://0x.org/docs/api
 * Auth: 0x-api-key header (ZEROX_API_KEY from dashboard.0x.org)
 */

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
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

export class UniswapAdapter implements ISwapAdapter {
  readonly id = 'uniswap';
  readonly name = 'Uniswap';
  readonly supportedChains = Object.keys(CHAIN_IDS);

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getQuote(params: SwapQuoteParams) {
    if (params.fromChain !== params.toChain) {
      throw new Error('Uniswap adapter is same-chain only');
    }
    const chainId = CHAIN_IDS[params.fromChain];
    if (!chainId) throw new Error(`Uniswap unsupported chain: ${params.fromChain}`);

    // Price endpoint first is lighter; we need transaction → use quote with taker optional
    const url = new URL('https://api.0x.org/swap/allowance-holder/quote');
    url.searchParams.set('chainId', String(chainId));
    url.searchParams.set('sellToken', params.fromToken);
    url.searchParams.set('buyToken', params.toToken);
    url.searchParams.set('sellAmount', params.fromAmount);
    url.searchParams.set('slippageBps', String(params.slippageBps));
    // Bias toward Uniswap v2/v3/v4 liquidity on 0x
    url.searchParams.set(
      'excludedSources',
      '0x_RFQ,Balancer_V2,Balancer,Curve,Curve_V2,SushiSwap,DODO,DODO_V2',
    );

    const res = await fetch(url.toString(), {
      headers: zeroxHeaders(),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`Uniswap(0x) quote failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      buyAmount?: string;
      transaction?: {
        to: string;
        data: string;
        value: string;
        gas?: string;
      };
      issues?: unknown;
      route?: unknown;
    };

    if (!data.buyAmount) throw new Error('Uniswap(0x) quote missing buyAmount');

    return {
      toAmount: data.buyAmount,
      route: { protocol: 'uniswap', chainId, ...data },
      estimatedGas: data.transaction?.gas,
    };
  }

  async buildTransaction(params: SwapBuildParams) {
    const q = params.quote as {
      transaction?: { to: string; data: string; value: string; gas?: string };
      chainId?: number;
      buyAmount?: string;
    };

    // Prefer transaction embedded in quote (0x allowance-holder quote includes it)
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

    // Fresh quote with taker for firm tx
    if (!params.fromToken || !params.toToken || !params.fromAmount || !params.fromChain) {
      throw new Error('Uniswap build: quote has no transaction; pass tokens/amount/chain');
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
      throw new Error(`Uniswap(0x) build quote failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      transaction?: { to: string; data: string; value: string; gas?: string };
    };
    if (!data.transaction?.to) throw new Error('Uniswap(0x) missing transaction in response');

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

export const uniswapAdapter = new UniswapAdapter();
