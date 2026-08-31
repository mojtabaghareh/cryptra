import type { ISwapAdapter, SwapBuildParams, SwapQuoteParams } from '../types';

/**
 * 1inch Aggregation Protocol — official Swap API v6.0
 * Base: https://api.1inch.dev/swap/v6.0/{chainId}/quote|swap
 * Auth: Authorization: Bearer <ONEINCH_API_KEY>  (portal.1inch.dev)
 * Docs: https://portal.1inch.dev/documentation
 */

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  avalanche: 43114,
  base: 8453,
  gnosis: 100,
  fantom: 250,
};

function apiKey(): string | undefined {
  return (
    process.env.ONEINCH_API_KEY?.trim() ||
    process.env.ONE_INCH_API_KEY?.trim() ||
    undefined
  );
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  const key = apiKey();
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

export class OneInchAdapter implements ISwapAdapter {
  readonly id = '1inch';
  readonly name = '1inch';
  readonly supportedChains = Object.keys(CHAIN_IDS);

  async isAvailable(): Promise<boolean> {
    // Available when key set; without key quotes usually 401
    return true;
  }

  async getQuote(params: SwapQuoteParams) {
    if (params.fromChain !== params.toChain) {
      throw new Error('1inch adapter is same-chain only');
    }
    const chainId = CHAIN_IDS[params.fromChain];
    if (!chainId) throw new Error(`1inch unsupported chain: ${params.fromChain}`);

    if (!apiKey()) {
      throw new Error(
        'ONEINCH_API_KEY required — get a free key at https://portal.1inch.dev',
      );
    }

    const url = new URL(`https://api.1inch.dev/swap/v6.0/${chainId}/quote`);
    url.searchParams.set('src', params.fromToken);
    url.searchParams.set('dst', params.toToken);
    url.searchParams.set('amount', params.fromAmount);
    url.searchParams.set('includeTokensInfo', 'true');
    url.searchParams.set('includeProtocols', 'true');
    url.searchParams.set('includeGas', 'true');

    const res = await fetch(url.toString(), {
      headers: headers(),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      throw new Error(`1inch quote failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      dstAmount: string;
      protocols?: unknown;
      gas?: number | string;
    };

    if (!data.dstAmount) throw new Error('1inch quote missing dstAmount');

    return {
      toAmount: data.dstAmount,
      route: { protocol: '1inch', chainId, ...data },
      estimatedGas: data.gas != null ? String(data.gas) : undefined,
    };
  }

  async buildTransaction(params: SwapBuildParams) {
    const chain =
      params.fromChain ||
      (params.quote as { chainId?: number })?.chainId?.toString();
    const chainKey =
      params.fromChain ||
      Object.entries(CHAIN_IDS).find(
        ([, id]) => id === (params.quote as { chainId?: number })?.chainId,
      )?.[0];

    const chainId =
      (chainKey && CHAIN_IDS[chainKey]) ||
      (typeof chain === 'string' && CHAIN_IDS[chain]) ||
      (params.quote as { chainId?: number })?.chainId;

    if (!chainId) throw new Error('1inch build: missing chain');

    const fromToken = params.fromToken;
    const toToken = params.toToken;
    const fromAmount = params.fromAmount;
    if (!fromToken || !toToken || !fromAmount) {
      throw new Error('1inch build requires fromToken, toToken, fromAmount');
    }
    if (!apiKey()) {
      throw new Error('ONEINCH_API_KEY required for swap build');
    }

    const slippagePct = (params.slippageBps ?? 50) / 100;

    const url = new URL(`https://api.1inch.dev/swap/v6.0/${chainId}/swap`);
    url.searchParams.set('src', fromToken);
    url.searchParams.set('dst', toToken);
    url.searchParams.set('amount', fromAmount);
    url.searchParams.set('from', params.userAddress);
    url.searchParams.set('slippage', String(slippagePct));
    url.searchParams.set('disableEstimate', 'true');
    url.searchParams.set('allowPartialFill', 'false');

    const res = await fetch(url.toString(), {
      headers: headers(),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      throw new Error(`1inch swap build failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      tx?: {
        from: string;
        to: string;
        data: string;
        value: string;
        gas?: number;
        gasPrice?: string;
      };
      dstAmount?: string;
    };

    if (!data.tx?.to || !data.tx?.data) {
      throw new Error('1inch swap response missing tx');
    }

    return {
      chain: 'evm',
      chainId,
      to: data.tx.to,
      data: data.tx.data,
      value: data.tx.value || '0',
      gas: data.tx.gas,
      gasPrice: data.tx.gasPrice,
      from: data.tx.from || params.userAddress,
      dstAmount: data.dstAmount,
    };
  }
}

export const oneInchAdapter = new OneInchAdapter();
