import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Badge, Skeleton, Button } from '../../lib/ui';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from '../../lib/i18n';
import { fetchCoinsPage, searchCoins, type MarketCoin } from '../../lib/markets';

const TABS = ['All', 'Hot', 'Gainers', 'Losers'] as const;

export function Markets() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rows, setRows] = useState<MarketCoin[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');
  const [q, setQ] = useState('');
  const [searchHits, setSearchHits] = useState<MarketCoin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (p: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchCoinsPage(p, 100);
      setRows((prev) => (append ? [...prev, ...data] : data));
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load markets');
      if (!append) {
        // minimal fallback
        setRows([
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 68432, change24h: 1.2, rank: 1 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3254, change24h: 2.1, rank: 2 },
        ]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    if (!q.trim()) {
      setSearchHits(null);
      return;
    }
    const handle = setTimeout(() => {
      void (async () => {
        try {
          const hits = await searchCoins(q);
          setSearchHits(hits);
        } catch {
          setSearchHits([]);
        }
      })();
    }, 400);
    return () => clearTimeout(handle);
  }, [q]);

  const filtered = useMemo(() => {
    let list = searchHits ?? rows;
    if (!searchHits) {
      if (tab === 'Gainers') list = list.filter((r) => r.change24h >= 0);
      if (tab === 'Losers') list = list.filter((r) => r.change24h < 0);
      if (tab === 'Hot') list = [...list].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
    }
    return list;
  }, [rows, tab, searchHits]);

  return (
    <div className="px-4 pb-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('markets.title')}</h1>
        <p className="text-xs text-white/45 mt-0.5">
          {searchHits ? `${searchHits.length} search results` : `${rows.length}+ coins · CoinGecko`}
        </p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('markets.search')}
        className="w-full rounded-xl bg-[#12122a] border border-blue-500/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-cyan-400/40"
      />

      {!searchHits && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((tTab) => (
            <button
              key={tTab}
              type="button"
              onClick={() => setTab(tTab)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                tab === tTab
                  ? 'bg-blue-600/30 border-cyan-400/40 text-cyan-200'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              {tTab}
            </button>
          ))}
        </div>
      )}

      {error && (
        <Card padded>
          <p className="text-xs text-red-400">{error}</p>
          <Button size="sm" className="mt-2" onClick={() => void loadPage(1, false)}>
            Retry
          </Button>
        </Card>
      )}

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
                key={m.id + m.symbol}
                type="button"
                onClick={() => navigate({ to: '/trade' })}
                className="w-full text-left"
              >
                <Card padded className="flex items-center gap-3">
                  {m.image ? (
                    <img src={m.image} alt="" className="w-10 h-10 rounded-full bg-white/5" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/20 flex items-center justify-center text-xs font-bold">
                      {m.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {m.rank != null && (
                        <span className="text-[10px] text-white/30">#{m.rank}</span>
                      )}
                      {m.symbol}/USDT
                    </div>
                    <div className="text-xs text-white/40 truncate">{m.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {m.price > 0
                        ? `$${m.price.toLocaleString(undefined, {
                            maximumFractionDigits: m.price < 1 ? 6 : 2,
                          })}`
                        : '—'}
                    </div>
                    {m.price > 0 && (
                      <Badge variant={up ? 'success' : 'error'} size="sm">
                        {up ? '+' : ''}
                        {m.change24h.toFixed(2)}%
                      </Badge>
                    )}
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {!searchHits && !loading && (
        <Button
          fullWidth
          variant="outline"
          disabled={loadingMore}
          onClick={() => void loadPage(page + 1, true)}
        >
          {loadingMore ? 'Loading…' : `Load more (page ${page + 1})`}
        </Button>
      )}

      <Card padded className="flex items-center justify-between border-cyan-500/25 bg-gradient-to-r from-blue-600/20 to-cyan-500/10">
        <div>
          <div className="font-semibold text-sm">⚡ Smart Route</div>
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
