import type { ISwapAdapter, SwapBuildParams, SwapQuoteParams } from '../types';

/**
 * KyberSwap Aggregator — official public HTTP API
 * Base: https://aggregator-api.kyberswap.com/{chain}/api/v1/routes
 * Build: POST .../route/build
 * Docs: https://docs.kyberswap.com/
 * No API key required for basic usage (X-Client-Id recommended).
 */

const CHAINS: Record<string, string> = {
  ethereum: 'ethereum',
  bsc: 'bsc',
  polygon: 'polygon',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  avalanche: 'avalanche',
  base: 'base',
  fantom: 'fantom',
};

const CLIENT_ID = process.env.KYBER_CLIENT_ID?.trim() || 'cryptra';

export class KyberAdapter implements ISwapAdapter {
  readonly id = 'kyber';
  readonly name = 'KyberSwap';
  readonly supportedChains = Object.keys(CHAINS);

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(
        'https://aggregator-api.kyberswap.com/ethereum/api/v1/routes' +
          '?tokenIn=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' +
          '&tokenOut=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' +
          '&amountIn=1000000000000000',
        {
          headers: { Accept: 'application/json', 'X-Client-Id': CLIENT_ID },
          signal: AbortSignal.timeout(6000),
        },
      );
      return res.ok || res.status === 400;
    } catch {
      return true;
    }
  }

  async getQuote(params: SwapQuoteParams) {
    if (params.fromChain !== params.toChain) {
      throw new Error('Kyber adapter is same-chain only');
    }
    const chain = CHAINS[params.fromChain];
    if (!chain) throw new Error(`Kyber unsupported chain: ${params.fromChain}`);

    const url = new URL(`https://aggregator-api.kyberswap.com/${chain}/api/v1/routes`);
    url.searchParams.set('tokenIn', params.fromToken);
    url.searchParams.set('tokenOut', params.toToken);
    url.searchParams.set('amountIn', params.fromAmount);
    url.searchParams.set('gasInclude', 'true');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'X-Client-Id': CLIENT_ID },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`Kyber quote failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }

    const body = (await res.json()) as {
      data?: {
        routeSummary?: {
          amountIn?: string;
          amountOut?: string;
          gas?: string;
          gasPrice?: string;
          gasUsd?: string;
        };
        routerAddress?: string;
      };
      code?: number;
      message?: string;
    };

    const amountOut = body.data?.routeSummary?.amountOut;
    if (!amountOut) {
      throw new Error(`Kyber empty amountOut: ${body.message || 'no route'}`);
    }

    return {
      toAmount: amountOut,
      route: {
        protocol: 'kyber',
        chain,
        routeSummary: body.data?.routeSummary,
        routerAddress: body.data?.routerAddress,
        slippageBps: params.slippageBps,
      },
      estimatedGas: body.data?.routeSummary?.gas,
    };
  }

  async buildTransaction(params: SwapBuildParams) {
    const q = params.quote as {
      chain?: string;
      routeSummary?: unknown;
      routerAddress?: string;
      slippageBps?: number;
    };

    const chain = q.chain || (params.fromChain && CHAINS[params.fromChain]) || 'ethereum';
    if (!q.routeSummary) {
      throw new Error('Kyber build requires routeSummary from quote');
    }

    const slippage = (params.slippageBps ?? q.slippageBps ?? 50) / 10_000;

    const res = await fetch(`https://aggregator-api.kyberswap.com/${chain}/api/v1/route/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client-Id': CLIENT_ID,
      },
      body: JSON.stringify({
        routeSummary: q.routeSummary,
        sender: params.userAddress,
        recipient: params.userAddress,
        slippageTolerance: slippage,
        skipSimulateTx: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      throw new Error(`Kyber build failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }

    const body = (await res.json()) as {
      data?: {
        data?: string;
        routerAddress?: string;
        amountIn?: string;
        amountOut?: string;
        gas?: string;
        value?: string;
      };
    };

    const d = body.data;
    if (!d?.data || !d.routerAddress) {
      throw new Error('Kyber build response missing calldata/routerAddress');
    }

    return {
      chain: 'evm',
      to: d.routerAddress,
      data: d.data,
      value: d.value || '0',
      gas: d.gas,
      from: params.userAddress,
      amountOut: d.amountOut,
    };
  }
}

export const kyberAdapter = new KyberAdapter();
