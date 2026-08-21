export interface TokenPrice {
  id: string;
  symbol: string;
  name?: string;
  priceUsd: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: Date;
}

export interface PriceMap {
  [idOrSymbol: string]: TokenPrice;
}
