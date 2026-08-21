import { getConfig } from '@cryptra/config';
import type { ISwapAdapter } from '../types';

/**
 * Chain ID mapping for 1inch.
 */
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  avalanche: 43114,
  base: 8453,
};

/**
 * 1inch Aggregation Protocol adapter (EVM).
 */
export class OneInchAdapter implements ISwapAdapter {
  readonly id = '1inch';
  readonly name = '1inch';
  readonly supportedChains = Object.keys(CHAIN_IDS);

  private getApiKey(): string | undefined {
    try {
      return getConfig().ONEINCH_API_KEY;
    } catch {
      return undefined;
    }
  }

  async isAvailable(): Promise<boolean> {
    // Without API key we still allow the adapter but calls will fail with clear error
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
      throw new Error('1inch does not support cross-chain swaps in this adapter');
    }

    const chainId = CHAIN_IDS[params.fromChain];
    if (!chainId) {
      throw new Error(`Unsupported chain for 1inch: ${params.fromChain}`);
    }

    const apiKey = this.getApiKey();
    const baseUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/quote`;

    const url = new URL(baseUrl);
    url.searchParams.set('src', params.fromToken);
    url.searchParams.set('dst', params.toToken);
    url.searchParams.set('amount', params.fromAmount);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`1inch quote failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      dstAmount: string;
      protocols?: unknown;
      gas?: number;
    };

    return {
      toAmount: data.dstAmount,
      route: data,
      estimatedGas: data.gas != null ? String(data.gas) : undefined,
    };
  }

  async buildTransaction(params: {
    quote: unknown;
    userAddress: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromChain: string;
    slippageBps: number;
  }) {
    const chainId = CHAIN_IDS[params.fromChain];
    if (!chainId) {
      throw new Error(`Unsupported chain: ${params.fromChain}`);
    }

    const apiKey = this.getApiKey();
    const baseUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/swap`;

    const url = new URL(baseUrl);
    url.searchParams.set('src', params.fromToken);
    url.searchParams.set('dst', params.toToken);
    url.searchParams.set('amount', params.fromAmount);
    url.searchParams.set('from', params.userAddress);
    url.searchParams.set('slippage', String(params.slippageBps / 100)); // 1inch expects percent
    url.searchParams.set('disableEstimate', 'true');

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`1inch swap build failed: ${res.status} ${text}`);
    }

    return res.json();
  }
}

export const oneInchAdapter = new OneInchAdapter();
