import type { ISwapAdapter } from '../types';

/**
 * STON.fi DEX on TON — public REST simulate API.
 * https://docs.ston.fi/
 */
export class StonfiAdapter implements ISwapAdapter {
  readonly id = 'stonfi';
  readonly name = 'STON.fi';
  readonly supportedChains = ['ton'];

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('https://api.ston.fi/v1/assets', {
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
    if (params.fromChain !== 'ton' || params.toChain !== 'ton') {
      throw new Error('STON.fi only supports TON');
    }

    // STON.fi simulate: offer_address, ask_address, units (nanoton / jetton units)
    const url = new URL('https://api.ston.fi/v1/swap/simulate');
    url.searchParams.set('offer_address', params.fromToken);
    url.searchParams.set('ask_address', params.toToken);
    url.searchParams.set('units', params.fromAmount);
    url.searchParams.set('slippage_tolerance', String(params.slippageBps / 10000));

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error(`STON.fi simulate failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      ask_units?: string;
      offer_units?: string;
      swap_rate?: string;
    };
    if (!data.ask_units) throw new Error('STON.fi: missing ask_units');
    return {
      toAmount: data.ask_units,
      route: { protocol: 'stonfi', ...data },
    };
  }

  async buildTransaction(params: { quote: unknown; userAddress: string }) {
    // Client builds transfer with @ston-fi/sdk; server returns simulate payload
    return {
      type: 'stonfi_simulate',
      userAddress: params.userAddress,
      simulate: params.quote,
      note: 'Sign TON transfer via TonConnect using STON.fi router from simulate payload',
    };
  }
}

export const stonfiAdapter = new StonfiAdapter();
