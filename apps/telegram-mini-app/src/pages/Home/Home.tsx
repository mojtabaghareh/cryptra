import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, Button, PriceDisplay, Sparkline } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import { useTranslation } from '../../lib/i18n';
import { apiGet } from '../../lib/api';
import { fetchCoinsPage, type MarketCoin } from '../../lib/markets';

interface PortfolioData {
  totalValueUsd: number;
  openPositions: number;
  recentSwaps: number;
  assets: Array<{ symbol: string; chain?: string; balance: string }>;
}

const ACTIONS = [
  { id: 'buy', labelKey: 'home.action.buy', emoji: '➕', path: '/markets', color: 'text-cyan-400' },
  { id: 'sell', labelKey: 'home.action.sell', emoji: '➖', path: '/trade', color: 'text-pink-400' },
  { id: 'swap', labelKey: 'home.action.swap', emoji: '🔄', path: '/trade', color: 'text-violet-400' },
  { id: 'send', labelKey: 'home.action.send', emoji: '✈️', path: '/wallet', color: 'text-blue-400' },
] as const;

export function Home(): JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isConnected = useWalletStore((s) => s.isConnected);
  const connect = useWalletStore((s) => s.connect);
  const token = useSessionStore((s) => s.token);

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (token) {
          const res = await apiGet<{ success: boolean; data: PortfolioData }>(
            '/api/v1/portfolio/me',
            token,
          );
          if (!cancelled && res.success) setPortfolio(res.data);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loadCoins = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCoinsPage(1, 50);
      setCoins(data);
    } catch {
      setCoins([
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 68432, change24h: 1.26 },
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3254, change24h: 2.35 },
        { id: 'solana', symbol: 'SOL', name: 'Solana', price: 142, change24h: 4.1 },
        { id: 'toncoin', symbol: 'TON', name: 'Toncoin', price: 5.42, change24h: 3.2 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCoins();
  }, [loadCoins]);

  const balance = portfolio?.totalValueUsd ?? 10000;

  return (
    <div className="px-4 pb-6 space-y-5">
      <section className="pt-1">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">
          {t('home.hero1')}
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            {t('home.hero2')}
          </span>
        </h1>
        <p className="mt-1 text-sm text-white/45">{t('home.tagline')}</p>
      </section>

      <Card padded className="relative overflow-hidden border-cyan-400/25 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-500/10 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs text-white/50 flex items-center gap-1">
              {t('home.totalBalance')} <span className="opacity-60">👁</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
              24H ▾
            </span>
          </div>
          <PriceDisplay value={balance} className="text-[32px] mt-1" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-emerald-400 font-semibold">+5.6% {t('home.today')} ↗</span>
            <Sparkline positive points={[20, 24, 22, 30, 28, 38, 36, 48, 44, 55]} />
          </div>
          <p className="mt-2 text-[11px] text-white/35">{t('home.demoBalance')}</p>
          {!isConnected && (
            <Button className="mt-4" fullWidth onClick={() => void connect()}>
              {t('home.connectWallet')} 💼
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => navigate({ to: a.path })}
            className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-[#0e0e22] border border-blue-500/20 hover:border-cyan-400/40 transition"
          >
            <span className={`text-xl ${a.color}`}>{a.emoji}</span>
            <span className="text-[11px] text-white/70 font-medium">{t(a.labelKey)}</span>
          </button>
        ))}
      </div>

      <Card
        padded
        className="flex items-center gap-3 border-violet-500/25 bg-gradient-to-r from-violet-600/15 to-blue-600/10"
      >
        <div className="text-2xl">🎁</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{t('home.dailyBonus')}</div>
          <div className="text-[11px] text-white/50 truncate">{t('home.dailyBonusDesc')}</div>
        </div>
        <Button size="sm" onClick={() => navigate({ to: '/rewards' })}>
          {t('home.claimNow')}
        </Button>
      </Card>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">{t('home.topCoins')}</h2>
          <button
            type="button"
            className="text-xs text-cyan-400"
            onClick={() => navigate({ to: '/markets' })}
          >
            {t('home.viewAll')} →
          </button>
        </div>
        <div className="space-y-2">
          {(isLoading ? [] : coins.slice(0, 10)).map((c) => {
            const up = c.change24h >= 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate({ to: '/markets' })}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#0e0e22]/95 border border-blue-500/10 text-left"
              >
                {c.image ? (
                  <img src={c.image} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">
                    {c.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-white/40">{c.symbol}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm">
                    $
                    {c.price.toLocaleString(undefined, {
                      maximumFractionDigits: c.price < 10 ? 4 : 2,
                    })}
                  </div>
                  <div className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {up ? '+' : ''}
                    {c.change24h.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
          {isLoading && (
            <div className="text-center text-xs text-white/40 py-4">Loading markets…</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
