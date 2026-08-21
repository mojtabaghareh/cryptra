import { useEffect, useState } from 'react';
import { Card, Badge, Skeleton } from '../../lib/ui';
import styles from './Markets.module.css';

interface MarketRow {
  id: string;
  name: string;
  price: number;
  change24h: number;
}

export function Markets() {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,toncoin,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true',
    )
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {
          bitcoin: 'Bitcoin',
          ethereum: 'Ethereum',
          solana: 'Solana',
          toncoin: 'TON',
          binancecoin: 'BNB',
          ripple: 'XRP',
        };
        setRows(
          Object.entries(map).map(([id, name]) => ({
            id,
            name,
            price: d[id]?.usd ?? 0,
            change24h: d[id]?.usd_24h_change ?? 0,
          })),
        );
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container ?? ''} style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Markets</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Live prices via CoinGecko
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
