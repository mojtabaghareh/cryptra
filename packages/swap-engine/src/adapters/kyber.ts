import type { ISwapAdapter } from '../types';

/** KyberSwap Aggregator chain path segments */
const CHAINS: Record<string, string> = {
  ethereum: 'ethereum',
  bsc: 'bsc',
  polygon: 'polygon',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  avalanche: 'avalanche',
  base: 'base',
};

/**
 * KyberSwap Aggregator — public HTTP API (no key required for basic quotes).
 * https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/aggregator-api-specification
 */
export class KyberAdapter implements ISwapAdapter {
  readonly id = 'kyber';
  readonly name = 'KyberSwap';
  readonly supportedChains = Object.keys(CHAINS);

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('https://aggregator-api.kyberswap.com/ethereum/api/v1/routes?tokenIn=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&tokenOut=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&amountIn=1000000000000000', {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok || res.status === 400;
    } catch {
      return true;
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
    if (params.fromChain !== params.toChain) {
      throw new Error('Kyber adapter is same-chain only');
    }
    const chain = CHAINS[params.fromChain];
    if (!chain) throw new Error(`Unsupported chain: ${params.fromChain}`);

    const url = new URL(`https://aggregator-api.kyberswap.com/${chain}/api/v1/routes`);
    url.searchParams.set('tokenIn', params.fromToken);
    url.searchParams.set('tokenOut', params.toToken);
    url.searchParams.set('amountIn', params.fromAmount);
    url.searchParams.set('gasInclude', 'true');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'X-Client-Id': 'cryptra' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error(`Kyber quote failed: ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as {
      data?: {
        routeSummary?: { amountOut?: string; gas?: string };
        routerAddress?: string;
      };
    };
    const amountOut = body.data?.routeSummary?.amountOut;
    if (!amountOut) throw new Error('Kyber: empty amountOut');
    return {
      toAmount: amountOut,
      route: { protocol: 'kyber', chain, ...body.data },
      estimatedGas: body.data?.routeSummary?.gas,
    };
  }

  async buildTransaction(params: {
    quote: unknown;
    userAddress: string;
  }) {
    const q = params.quote as {
      chain?: string;
      routeSummary?: unknown;
      routerAddress?: string;
    };
    const chain = q.chain || 'ethereum';
    const res = await fetch(`https://aggregator-api.kyberswap.com/${chain}/api/v1/route/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client-Id': 'cryptra',
      },
      body: JSON.stringify({
        routeSummary: q.routeSummary,
        sender: params.userAddress,
        recipient: params.userAddress,
        skipSimulateTx: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Kyber build failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }
}

export const kyberAdapter = new KyberAdapter();
