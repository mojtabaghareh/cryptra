import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, Button, PriceDisplay, Sparkline } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import { useTranslation } from '../../lib/i18n';
import { apiGet, fetchMarketPrices } from '../../lib/api';

interface PortfolioData {
  totalValueUsd: number;
  openPositions: number;
  recentSwaps: number;
  assets: Array<{ symbol: string; chain?: string; balance: string }>;
}

interface CoinRow {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const COIN_META: Record<string, { symbol: string; name: string }> = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { symbol: 'ETH', name: 'Ethereum' },
  solana: { symbol: 'SOL', name: 'Solana' },
  toncoin: { symbol: 'TON', name: 'Toncoin' },
  binancecoin: { symbol: 'BNB', name: 'BNB' },
  ripple: { symbol: 'XRP', name: 'XRP' },
  cardano: { symbol: 'ADA', name: 'Cardano' },
  dogecoin: { symbol: 'DOGE', name: 'Dogecoin' },
  'avalanche-2': { symbol: 'AVAX', name: 'Avalanche' },
  chainlink: { symbol: 'LINK', name: 'Chainlink' },
  polkadot: { symbol: 'DOT', name: 'Polkadot' },
  polygon: { symbol: 'MATIC', name: 'Polygon' },
  litecoin: { symbol: 'LTC', name: 'Litecoin' },
  uniswap: { symbol: 'UNI', name: 'Uniswap' },
  stellar: { symbol: 'XLM', name: 'Stellar' },
  cosmos: { symbol: 'ATOM', name: 'Cosmos' },
  near: { symbol: 'NEAR', name: 'NEAR' },
  aptos: { symbol: 'APT', name: 'Aptos' },
  arbitrum: { symbol: 'ARB', name: 'Arbitrum' },
  optimism: { symbol: 'OP', name: 'Optimism' },
};

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
  const [coins, setCoins] = useState<CoinRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    try {
      if (token) {
        const res = await apiGet<{ success: boolean; data: PortfolioData }>(
          '/api/v1/portfolio/me',
          token,
        );
        if (res.success) setPortfolio(res.data);
        else setPortfolio(null);
      } else setPortfolio(null);
    } catch {
      setPortfolio(null);
    }
  }, [token]);

  const fetchCoins = useCallback(async () => {
    setIsLoading(true);
    const ids = Object.keys(COIN_META).join(',');
    try {
      try {
        const res = await fetchMarketPrices();
        if (res.success && res.data) {
          const rows = Object.entries(COIN_META)
            .map(([id, m]) => ({
              id,
              ...m,
              price: res.data[id]?.usd ?? 0,
              change: res.data[id]?.usd_24h_change ?? 0,
            }))
            .filter((r) => r.price > 0);
          if (rows.length) {
            setCoins(rows);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        /* fallback */
      }
      const r = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      );
      const d = await r.json();
      setCoins(
        Object.entries(COIN_META).map(([id, m]) => ({
          id,
          ...m,
          price: d[id]?.usd ?? 0,
          change: d[id]?.usd_24h_change ?? 0,
        })),
      );
    } catch {
      setCoins(
        Object.entries(COIN_META).map(([id, m], i) => ({
          id,
          ...m,
          price: [68432, 3254, 142, 5.4, 587, 0.6][i % 6] ?? 1,
          change: [1.26, 2.35, 4.1, 3.2, -1.2, 0.8][i % 6] ?? 0,
        })),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPortfolio();
    void fetchCoins();
  }, [fetchPortfolio, fetchCoins]);

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
            className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-[#0e0e22] border border-blue-500/20 hover:border-cyan-400/40 transition shadow-[0_0_20px_rgba(0,0,0,0.3)]"
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
          {(isLoading ? coins.slice(0, 4) : coins.slice(0, 8)).map((c) => {
            const up = c.change >= 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate({ to: '/markets' })}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#0e0e22]/95 border border-blue-500/10 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {c.symbol.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-white/40">{c.symbol}</div>
                </div>
                <div className="hidden sm:block opacity-80">
                  <Sparkline
                    positive={up}
                    points={up ? [10, 14, 12, 18, 16, 22] : [22, 18, 20, 14, 16, 10]}
                  />
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
                    {c.change.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Home;
