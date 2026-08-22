import { useEffect, useState } from 'react';
import { Card, Badge, Skeleton } from '../../lib/ui';
import { fetchMarketPrices } from '../../lib/api';

interface MarketRow {
  id: string;
  name: string;
  price: number;
  change24h: number;
}

const NAMES: Record<string, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
  toncoin: 'TON',
  binancecoin: 'BNB',
  ripple: 'XRP',
};

export function Markets() {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchMarketPrices();
        if (cancelled || !res.success) throw new Error('api failed');
        setRows(
          Object.entries(NAMES).map(([id, name]) => ({
            id,
            name,
            price: res.data[id]?.usd ?? 0,
            change24h: res.data[id]?.usd_24h_change ?? 0,
          })),
        );
      } catch {
        try {
          const r = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,toncoin,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true',
          );
          const d = await r.json();
          if (!cancelled) {
            setRows(
              Object.entries(NAMES).map(([id, name]) => ({
                id,
                name,
                price: d[id]?.usd ?? 0,
                change24h: d[id]?.usd_24h_change ?? 0,
              })),
            );
          }
        } catch {
          if (!cancelled) setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Markets</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Live prices · serverless API
      </p>
      {loading ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {rows.map((m) => {
            const up = m.change24h >= 0;
            return (
              <Card key={m.id} padded>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{m.id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>
                      ${m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <Badge variant={up ? 'success' : 'error'} size="sm">
                      {up ? '+' : ''}
                      {m.change24h.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Markets;
