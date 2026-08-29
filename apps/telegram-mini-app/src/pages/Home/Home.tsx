import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, Button, Badge, PriceDisplay, Sparkline } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet } from '../../lib/api';

interface PortfolioData {
  totalValueUsd: number;
  openPositions: number;
  recentSwaps: number;
  assets: Array<{ symbol: string; chain?: string; balance: string }>;
}

const DEMO_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 68432, change: 1.26 },
  { symbol: 'ETH', name: 'Ethereum', price: 3254, change: 2.14 },
  { symbol: 'TON', name: 'Toncoin', price: 5.42, change: 3.67 },
];

const ACTIONS = [
  { id: 'buy', label: 'Buy', emoji: '➕', path: '/markets' },
  { id: 'sell', label: 'Sell', emoji: '➖', path: '/trade' },
  { id: 'swap', label: 'Swap', emoji: '🔄', path: '/trade' },
  { id: 'send', label: 'Send', emoji: '📤', path: '/wallet' },
] as const;

export function Home(): JSX.Element {
  const navigate = useNavigate();
  const isConnected = useWalletStore((s) => s.isConnected);
  const connect = useWalletStore((s) => s.connect);
  const token = useSessionStore((s) => s.token);
  const sessionUser = useSessionStore((s) => s.user);

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    setIsLoading(true);
    try {
      if (token) {
        const res = await apiGet<{ success: boolean; data: PortfolioData }>(
          '/api/v1/portfolio/me',
          token,
        );
        if (res.success) setPortfolio(res.data);
        else setPortfolio(null);
      } else {
        setPortfolio(null);
      }
    } catch {
      setPortfolio(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchPortfolio();
  }, [fetchPortfolio]);

  const balance = portfolio?.totalValueUsd ?? (token || isConnected ? 0 : 10000);
  const showDemo = !token && !isConnected;

  return (
    <div className="px-4 pb-4 space-y-5">
      {/* Hero */}
      <section className="pt-1">
        <h1 className="text-2xl font-bold leading-tight">
          Trade Smarter.
          <br />
          <span className="gradient-text">Grow Faster.</span>
        </h1>
        {sessionUser && (
          <p className="mt-1 text-sm text-cyan-200/60">
            Hi {sessionUser.firstName || sessionUser.username || 'Trader'} · L
            {sessionUser.level} · {sessionUser.xp} XP
          </p>
        )}
      </section>

      {/* Balance card */}
      <Card padded className="relative overflow-hidden border-cyan-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-transparent to-cyan-500/10 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-white/50 mb-1">Total Balance</div>
              {isLoading ? (
                <div className="h-9 w-36 animate-pulse rounded bg-white/10" />
              ) : (
                <PriceDisplay value={balance} className="text-[28px]" />
              )}
              <div className="mt-1 text-sm text-emerald-400 font-medium">+5.6% Today</div>
            </div>
            <Sparkline positive />
          </div>

          {!token && !isConnected && (
            <p className="mt-3 text-[11px] text-white/35">Demo balance · connect or open in Telegram</p>
          )}

          {!isConnected && !token && (
            <Button className="mt-4" fullWidth onClick={() => void connect()}>
              Connect wallet
            </Button>
          )}
        </div>
      </Card>

      {/* Quick actions */}
      <section>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate({ to: a.path })}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#12122a] border border-blue-500/15 hover:border-cyan-400/40 transition"
            >
              <span className="text-lg">{a.emoji}</span>
              <span className="text-[11px] text-white/70 font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Top coins */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Top Coins</h2>
          <button
            type="button"
            className="text-xs text-cyan-400"
            onClick={() => navigate({ to: '/markets' })}
          >
            View All
          </button>
        </div>
        <div className="space-y-2">
          {DEMO_COINS.map((c) => (
            <button
              key={c.symbol}
              type="button"
              onClick={() => navigate({ to: '/markets' })}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#12122a]/90 border border-blue-500/10 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center text-xs font-bold">
                {c.symbol.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-xs text-white/40">{c.symbol}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">
                  ${c.price.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-400">+{c.change}%</div>
              </div>
            </button>
          ))}
        </div>
        {showDemo && (
          <p className="mt-2 text-[10px] text-white/30 text-center">Sample market data for UI preview</p>
        )}
      </section>

      <section className="grid gap-2">
        <Button variant="outline" fullWidth onClick={() => navigate({ to: '/rewards' })}>
          XP & Rewards
        </Button>
        <Button variant="ghost" fullWidth onClick={() => navigate({ to: '/status' })}>
          System status
        </Button>
      </section>
    </div>
  );
}

export default Home;
