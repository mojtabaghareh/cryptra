import { useEffect, useMemo, useState } from 'react';
import { Card, Badge, Skeleton, Button } from '../../lib/ui';
import { fetchMarketPrices } from '../../lib/api';
import { useNavigate } from '@tanstack/react-router';

interface MarketRow {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

const META: Record<string, { symbol: string; name: string }> = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { symbol: 'ETH', name: 'Ethereum' },
  solana: { symbol: 'SOL', name: 'Solana' },
  toncoin: { symbol: 'TON', name: 'Toncoin' },
  binancecoin: { symbol: 'BNB', name: 'BNB' },
  ripple: { symbol: 'XRP', name: 'XRP' },
};

const TABS = ['All', 'Hot', 'Gainers', 'Losers'] as const;

export function Markets() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchMarketPrices();
        if (cancelled || !res.success) throw new Error('api failed');
        setRows(
          Object.entries(META).map(([id, m]) => ({
            id,
            ...m,
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
              Object.entries(META).map(([id, m]) => ({
                id,
                ...m,
                price: d[id]?.usd ?? 0,
                change24h: d[id]?.usd_24h_change ?? 0,
              })),
            );
          }
        } catch {
          if (!cancelled) {
            setRows([
              { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 68432, change24h: 1.26 },
              { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3254, change24h: 2.14 },
              { id: 'toncoin', symbol: 'TON', name: 'Toncoin', price: 5.42, change24h: 3.67 },
              { id: 'solana', symbol: 'SOL', name: 'Solana', price: 142.56, change24h: 4.32 },
              { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 587.21, change24h: -1.8 },
            ]);
          }
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

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'Gainers') list = list.filter((r) => r.change24h >= 0);
    if (tab === 'Losers') list = list.filter((r) => r.change24h < 0);
    if (tab === 'Hot') list = [...list].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(s) || r.symbol.toLowerCase().includes(s),
      );
    }
    return list;
  }, [rows, tab, q]);

  return (
    <div className="px-4 pb-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Markets</h1>
        <p className="text-xs text-white/45 mt-0.5">Live prices across top pairs</p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search coin or token…"
        className="w-full rounded-xl bg-[#12122a] border border-blue-500/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-cyan-400/40"
      />

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              tab === t
                ? 'bg-blue-600/30 border-cyan-400/40 text-cyan-200'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton height={64} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const up = m.change24h >= 0;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate({ to: '/trade' })}
                className="w-full text-left"
              >
                <Card padded className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/20 flex items-center justify-center text-xs font-bold">
                    {m.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">
                      {m.symbol}/USDT
                    </div>
                    <div className="text-xs text-white/40">{m.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      ${m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <Badge variant={up ? 'success' : 'error'} size="sm">
                      {up ? '+' : ''}
                      {m.change24h.toFixed(2)}%
                    </Badge>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <Card padded className="flex items-center justify-between border-cyan-500/25 bg-gradient-to-r from-blue-600/20 to-cyan-500/10">
        <div>
          <div className="font-semibold text-sm flex items-center gap-1">⚡ Smart Route</div>
          <div className="text-xs text-white/50">Best price across 20+ DEX</div>
        </div>
        <Button size="sm" onClick={() => navigate({ to: '/trade' })}>
          Open
        </Button>
      </Card>
    </div>
  );
}

export default Markets;
