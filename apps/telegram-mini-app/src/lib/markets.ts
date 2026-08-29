export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  price: number;
  change24h: number;
  marketCap?: number;
  rank?: number;
}

/**
 * Fetch top coins by market cap (CoinGecko public API).
 * per_page max ~250; use page for more.
 */
export async function fetchCoinsPage(page = 1, perPage = 100): Promise<MarketCoin[]> {
  const url =
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd` +
    `&order=market_cap_desc&per_page=${perPage}&page=${page}` +
    `&sparkline=false&price_change_percentage=24h`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = (await res.json()) as Array<{
    id: string;
    symbol: string;
    name: string;
    image?: string;
    current_price: number;
    price_change_percentage_24h: number | null;
    market_cap: number;
    market_cap_rank: number;
  }>;

  return data.map((c) => ({
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price ?? 0,
    change24h: c.price_change_percentage_24h ?? 0,
    marketCap: c.market_cap,
    rank: c.market_cap_rank,
  }));
}

export async function searchCoins(query: string): Promise<MarketCoin[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await fetch(
    `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`,
  );
  if (!res.ok) throw new Error(`Search ${res.status}`);
  const data = (await res.json()) as {
    coins: Array<{ id: string; name: string; symbol: string; market_cap_rank: number | null; thumb?: string }>;
  };
  return (data.coins || []).slice(0, 40).map((c) => ({
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    image: c.thumb,
    price: 0,
    change24h: 0,
    rank: c.market_cap_rank ?? undefined,
  }));
}
