import type { ISwapAdapter, SwapBuildParams, SwapQuoteParams } from '../types';

/**
 * STON.fi DEX on TON — official REST API
 * Base: https://api.ston.fi
 * Simulate: POST /v1/swap/simulate
 * Routers: GET /v1/routers
 * Docs: https://docs.ston.fi/
 *
 * On-chain execution uses @ston-fi/sdk + TonConnect on the client.
 * Server returns simulate payload + router address for the client to sign.
 */

const API = process.env.STONFI_API_URL?.trim() || 'https://api.ston.fi';

/** Native TON placeholder used by STON.fi */
export const STONFI_TON_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

export class StonfiAdapter implements ISwapAdapter {
  readonly id = 'stonfi';
  readonly name = 'STON.fi';
  readonly supportedChains = ['ton'];

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${API}/v1/assets`, {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuote(params: SwapQuoteParams) {
    if (params.fromChain !== 'ton' || params.toChain !== 'ton') {
      throw new Error('STON.fi only supports TON');
    }

    const slippage = String(params.slippageBps / 10_000);

    // Official simulate — query params per STON.fi OpenAPI
    const url = new URL(`${API}/v1/swap/simulate`);
    url.searchParams.set('offer_address', params.fromToken);
    url.searchParams.set('ask_address', params.toToken);
    url.searchParams.set('units', params.fromAmount);
    url.searchParams.set('slippage_tolerance', slippage);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`STON.fi simulate failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      ask_units?: string;
      offer_units?: string;
      swap_rate?: string;
      price_impact?: string;
      fee_units?: string;
      router_address?: string;
      pool_address?: string;
      min_ask_units?: string;
    };

    if (!data.ask_units) throw new Error('STON.fi: missing ask_units in simulate response');

    // Fetch default router if not in simulate
    let routerAddress = data.router_address;
    if (!routerAddress) {
      try {
        const r = await fetch(`${API}/v1/routers`, { signal: AbortSignal.timeout(5000) });
        if (r.ok) {
          const routers = (await r.json()) as { address?: string }[] | { router_list?: { address?: string }[] };
          const list = Array.isArray(routers)
            ? routers
            : (routers as { router_list?: { address?: string }[] }).router_list || [];
          routerAddress = list[0]?.address;
        }
      } catch {
        /* optional */
      }
    }

    const impact =
      data.price_impact != null ? Math.round(Number(data.price_impact) * 10_000) : undefined;

    return {
      toAmount: data.ask_units,
      route: {
        protocol: 'stonfi',
        ...data,
        router_address: routerAddress,
        offer_address: params.fromToken,
        ask_address: params.toToken,
        slippage_tolerance: slippage,
      },
      priceImpactBps: impact,
    };
  }

  async buildTransaction(params: SwapBuildParams) {
    const sim = params.quote as {
      ask_units?: string;
      min_ask_units?: string;
      offer_units?: string;
      router_address?: string;
      pool_address?: string;
      offer_address?: string;
      ask_address?: string;
      slippage_tolerance?: string;
    };

    if (!sim?.ask_units) {
      throw new Error('STON.fi build requires simulate payload from quote');
    }

    return {
      chain: 'ton',
      type: 'stonfi_swap',
      userAddress: params.userAddress,
      routerAddress: sim.router_address,
      poolAddress: sim.pool_address,
      offerAddress: sim.offer_address || params.fromToken,
      askAddress: sim.ask_address || params.toToken,
      offerUnits: sim.offer_units || params.fromAmount,
      minAskUnits: sim.min_ask_units || sim.ask_units,
      askUnits: sim.ask_units,
      slippageTolerance: sim.slippage_tolerance,
      /**
       * Client must use @ston-fi/sdk Router.getSwap*TxParams + TonConnect.sendTransaction
       * with the fields above. Server does not hold TON private keys.
       */
      clientSdk: '@ston-fi/sdk',
      docs: 'https://docs.ston.fi/developer-section/dex/sdk/v1/swap',
    };
  }
}

export const stonfiAdapter = new StonfiAdapter();
