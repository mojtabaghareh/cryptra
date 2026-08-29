import { useEffect, useState, type CSSProperties } from 'react';
import { Card, Button, Badge, Sparkline } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import {
  requestSwapQuote,
  buildSwapTx,
  executeSwap,
  placeOrder,
  apiGet,
  type SwapQuoteResult,
} from '../../lib/api';
import { signAndSendJupiterSwap } from '../../lib/solana';
import { sendOneInchTransaction } from '../../lib/ethereum';

const PAIRS = [
  {
    id: 'sol-usdc',
    label: 'SOL → USDC',
    fromChain: 'solana',
    toChain: 'solana',
    fromToken: 'So11111111111111111111111111111111111111112',
    toToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 9,
    unit: 'SOL',
  },
  {
    id: 'eth-usdc',
    label: 'ETH → USDC',
    fromChain: 'ethereum',
    toChain: 'ethereum',
    fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 18,
    unit: 'ETH',
  },
] as const;

const PERP_SYMBOLS = ['BTC', 'ETH', 'SOL'] as const;

const inputStyle: CSSProperties = {
  width: '100%',
  marginTop: 4,
  marginBottom: 12,
  padding: '14px 16px',
  borderRadius: 14,
  border: '1px solid rgba(59,130,246,0.25)',
  background: 'rgba(12,12,26,0.9)',
  color: 'white',
  fontSize: 18,
};

export function Trade() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const walletAddress = useWalletStore((s) => s.address);
  const walletProvider = useWalletStore((s) => s.provider);
  const connect = useWalletStore((s) => s.connect);
  const token = useSessionStore((s) => s.token);

  const [tab, setTab] = useState<'swap' | 'perp'>('swap');
  const [pairId, setPairId] = useState<(typeof PAIRS)[number]['id']>('eth-usdc');
  const [fromAmount, setFromAmount] = useState('100');
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState<SwapQuoteResult | null>(null);
  const [builtTx, setBuiltTx] = useState<unknown>(null);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [perpSide, setPerpSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [perpSymbol, setPerpSymbol] = useState<(typeof PERP_SYMBOLS)[number]>('ETH');
  const [perpSize, setPerpSize] = useState('');
  const [leverage, setLeverage] = useState(5);
  const [hlMids, setHlMids] = useState<Record<string, number>>({});

  const pair = PAIRS.find((p) => p.id === pairId)!;
  const demoPrice = pairId === 'eth-usdc' ? 3254 : 142.56;

  useEffect(() => {
    if (!token || tab !== 'perp') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet<{ success: boolean; data: Array<{ symbol: string; mid: number }> }>(
          '/api/v1/orders/markets',
          token,
        );
        if (cancelled || !res.data) return;
        const map: Record<string, number> = {};
        for (const row of res.data) map[row.symbol] = row.mid;
        setHlMids(map);
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tab]);

  async function handleQuote() {
    setError(null);
    setMessage(null);
    setQuote(null);
    setBuiltTx(null);
    setTxHash('');
    if (!token) {
      setError('Open from Telegram for live quotes (session required).');
      return;
    }
    if (!fromAmount || Number(fromAmount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const raw = String(Math.floor(Number(fromAmount) * 10 ** pair.decimals));
      const res = await requestSwapQuote(token, {
        fromToken: pair.fromToken,
        toToken: pair.toToken,
        fromAmount: raw,
        fromChain: pair.fromChain,
        toChain: pair.toChain,
        slippageBps,
      });
      if (res.success) {
        setQuote(res.data);
        setMessage(`Quote via ${res.data.protocol}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quote failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuild() {
    if (!token || !quote) return;
    if (!walletAddress) {
      setError('Connect a wallet address first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await buildSwapTx(token, { quoteId: quote.quoteId, userAddress: walletAddress });
      setBuiltTx(res.data.transaction);
      setMessage(`Transaction built (${res.data.protocol}).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Build failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignAndSend() {
    if (!builtTx || !walletAddress) {
      setError('Build a transaction first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let hash: string;
      const protocol = quote?.protocol?.toLowerCase() ?? '';
      if (protocol.includes('jupiter') || pair.fromChain === 'solana') {
        if (walletProvider !== 'phantom') {
          setError('Connect Phantom for Solana swaps');
          setLoading(false);
          return;
        }
        hash = await signAndSendJupiterSwap(builtTx);
      } else {
        if (walletProvider !== 'metamask') {
          setError('Connect MetaMask for EVM swaps');
          setLoading(false);
          return;
        }
        hash = await sendOneInchTransaction(builtTx, walletAddress);
      }
      setTxHash(hash);
      setMessage(`Broadcast ✓ ${hash.slice(0, 16)}…`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign/send failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute() {
    if (!token || !quote) return;
    setLoading(true);
    setError(null);
    try {
      const res = await executeSwap(token, {
        quoteId: quote.quoteId,
        txHash: txHash.trim() || undefined,
      });
      setMessage(
        `Swap ${res.data.status}` +
          (res.data.txHash ? ` · tx ${res.data.txHash.slice(0, 12)}…` : '') +
          ` · id ${res.data.swapId.slice(0, 8)}`,
      );
      setQuote(null);
      setBuiltTx(null);
      setTxHash('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Execute failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePerp() {
    if (!token) {
      setError('Authenticate inside Telegram first');
      return;
    }
    if (!perpSize) {
      setError('Enter size');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await placeOrder(token, {
        protocol: 'hyperliquid',
        symbol: perpSymbol,
        side: perpSide,
        type: 'MARKET',
        size: perpSize,
        leverage,
      });
      const data = res.data as {
        order?: { avgFillPrice?: string };
        market?: { mid?: number };
        note?: string;
      };
      const px = data.market?.mid ?? data.order?.avgFillPrice;
      setMessage(
        `${perpSide} ${perpSymbol} · size ${perpSize} · fill ~${px ?? '?'}` +
          (data.note ? ` · ${data.note.slice(0, 60)}…` : ''),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Trade</h1>
          <p className="text-xs text-white/45 mt-0.5">Swap · Perps · Smart route</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">ETH / USDT</div>
          <div className="text-lg font-bold">${demoPrice.toLocaleString()}</div>
          <div className="text-xs text-emerald-400">+2.14%</div>
        </div>
      </div>

      <Card padded className="border-cyan-500/15">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-white/45">Chart preview</span>
          <div className="flex gap-1 text-[10px] text-white/40">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((t) => (
              <span
                key={t}
                className={`px-1.5 py-0.5 rounded ${t === '1h' ? 'bg-blue-600/40 text-cyan-200' : ''}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-center py-2">
          <Sparkline points={[30, 34, 32, 40, 38, 45, 42, 50, 48, 55]} positive />
        </div>
      </Card>

      <div className="flex gap-2">
        <Button size="sm" variant={tab === 'swap' ? 'primary' : 'secondary'} onClick={() => setTab('swap')}>
          Swap
        </Button>
        <Button size="sm" variant={tab === 'perp' ? 'primary' : 'secondary'} onClick={() => setTab('perp')}>
          Perps
        </Button>
      </div>

      {!token && (
        <Card padded>
          <p className="text-sm text-white/60 mb-2">
            Live quotes need Telegram session. UI works in demo mode.
          </p>
          <Badge variant="neutral">No JWT</Badge>
        </Card>
      )}

      {tab === 'swap' ? (
        <Card padded className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {PAIRS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={pairId === p.id ? 'primary' : 'secondary'}
                onClick={() => {
                  setPairId(p.id);
                  setQuote(null);
                  setBuiltTx(null);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div>
            <label className="text-xs text-white/45">You Pay ({pair.unit === 'ETH' ? 'USDT' : pair.unit})</label>
            <input
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              style={inputStyle}
            />
          </div>

          <div className="text-center text-white/30 text-sm">↓</div>

          <div>
            <label className="text-xs text-white/45">You Receive</label>
            <div className="rounded-xl border border-blue-500/20 bg-[#0c0c1a] px-4 py-3 text-lg font-semibold">
              {quote?.toAmount ??
                (fromAmount && pairId === 'eth-usdc'
                  ? (Number(fromAmount) / demoPrice).toFixed(4)
                  : '—')}{' '}
              <span className="text-sm text-white/40">{pair.unit}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/45">Slippage {slippageBps / 100}%</label>
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={slippageBps}
              onChange={(e) => setSlippageBps(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {!isConnected && (
            <Button fullWidth variant="secondary" onClick={() => void connect()}>
              Connect wallet
            </Button>
          )}

          {isConnected && walletAddress && (
            <p className="text-[11px] text-white/40">
              {walletProvider} · {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </p>
          )}

          <Button fullWidth disabled={loading || !fromAmount} onClick={() => void handleQuote()}>
            {loading ? 'Loading…' : token ? '1. Get live quote' : 'Preview / Get quote'}
          </Button>

          {quote && (
            <div className="space-y-2 text-sm">
              <Badge variant="success">{quote.protocol}</Badge>
              <div>
                Fee: {quote.feePercent}% (~{quote.feeAmount})
              </div>
              <Button fullWidth variant="secondary" disabled={loading} onClick={() => void handleBuild()}>
                2. Build transaction
              </Button>
              {builtTx != null && (
                <Button fullWidth disabled={loading} onClick={() => void handleSignAndSend()}>
                  3. Sign & send
                </Button>
              )}
              <input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="tx hash"
                style={{ ...inputStyle, fontSize: 13, marginBottom: 0 }}
              />
              <Button fullWidth variant="outline" disabled={loading} onClick={() => void handleExecute()}>
                4. Record on Cryptra
              </Button>
            </div>
          )}

          <Button fullWidth className="mt-1" disabled={loading}>
            ⚡ Swap Now
          </Button>
          <p className="text-[10px] text-center text-white/35">Route fee ~0.09%</p>
        </Card>
      ) : (
        <Card padded className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {PERP_SYMBOLS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={perpSymbol === s ? 'primary' : 'secondary'}
                onClick={() => setPerpSymbol(s)}
              >
                {s}
                {hlMids[s] != null ? ` $${hlMids[s].toLocaleString()}` : ''}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant={perpSide === 'LONG' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPerpSide('LONG')}
            >
              Long
            </Button>
            <Button
              variant={perpSide === 'SHORT' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPerpSide('SHORT')}
            >
              Short
            </Button>
          </div>
          <input
            value={perpSize}
            onChange={(e) => setPerpSize(e.target.value)}
            placeholder="Size"
            style={inputStyle}
          />
          <label className="text-xs text-white/45">Leverage {leverage}x</label>
          <input
            type="range"
            min={1}
            max={20}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full"
          />
          <Button fullWidth disabled={loading || !perpSize} onClick={() => void handlePerp()}>
            {loading ? 'Submitting…' : `Open ${perpSide} ${perpSymbol}`}
          </Button>
        </Card>
      )}

      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

export default Trade;
