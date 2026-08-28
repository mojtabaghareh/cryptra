import { hyperliquidClient } from '@cryptra/hyperliquid';

export class MarketService {
  async perpMids() {
    return hyperliquidClient.getMajorPerps();
  }

  async mid(symbol: string) {
    return hyperliquidClient.getMid(symbol);
  }

  async meta() {
    return hyperliquidClient.getMetaAndAssetCtxs();
  }
}

export const marketService = new MarketService();
