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
import { sendEvmSwapTransaction } from '../../lib/ethereum';
import { executeSwapEndToEnd } from '../../lib/executeSwap';

const PAIRS = [
  {
    id: 'sol-usdc',
    label: 'SOL → USDC',
    fromChain: 'solana',
    toChain: 'solana',
    fromToken: 'So11111111111111111111111111111111111111112',
    toToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 9,
    payUnit: 'SOL',
    receiveUnit: 'USDC',
    wallet: 'phantom' as const,
  },
  {
    id: 'eth-usdc',
    label: 'ETH → USDC',
    fromChain: 'ethereum',
    toChain: 'ethereum',
    fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 18,
    payUnit: 'ETH',
    receiveUnit: 'USDC',
    wallet: 'evm' as const,
  },
  {
    id: 'usdc-eth',
    label: 'USDC → ETH',
    fromChain: 'ethereum',
    toChain: 'ethereum',
    fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    toToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 6,
    payUnit: 'USDC',
    receiveUnit: 'ETH',
    wallet: 'evm' as const,
  },
] as const;

const PERP_SYMBOLS = ['BTC', 'ETH', 'SOL', 'DOGE', 'ARB'] as const;
const PERP_PROTOCOLS = [
  { id: 'hyperliquid', label: 'Hyperliquid' },
  { id: 'dydx', label: 'dYdX' },
  { id: 'gmx', label: 'GMX' },
  { id: 'drift', label: 'Drift' },
] as const;

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
  const [pairId, setPairId] = useState<(typeof PAIRS)[number]['id']>('sol-usdc');
  const [fromAmount, setFromAmount] = useState('0.05');
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState<SwapQuoteResult | null>(null);
  const [builtTx, setBuiltTx] = useState<unknown>(null);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [perpSide, setPerpSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [perpSymbol, setPerpSymbol] = useState<(typeof PERP_SYMBOLS)[number]>('ETH');
  const [perpProtocol, setPerpProtocol] = useState<string>('hyperliquid');
  const [perpSize, setPerpSize] = useState('');
  const [leverage, setLeverage] = useState(5);
  const [hlMids, setHlMids] = useState<Record<string, number>>({});

  const pair = PAIRS.find((p) => p.id === pairId)!;

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
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tab]);

  async function handleSwapNow() {
    setError(null);
    setMessage(null);
    setStatusLine(null);
    if (!token) {
      setError('Open Cryptra inside Telegram so session JWT is set.');
      return;
    }
    if (!isConnected || !walletAddress) {
      setError('Connect Phantom (SOL) or MetaMask/Trust (ETH) first.');
      return;
    }
    setLoading(true);
    try {
      const result = await executeSwapEndToEnd({
        token,
        walletAddress,
        walletProvider,
        fromToken: pair.fromToken,
        toToken: pair.toToken,
        fromAmountHuman: fromAmount,
        decimals: pair.decimals,
        fromChain: pair.fromChain,
        toChain: pair.toChain,
        slippageBps,
        onStatus: (s) => setStatusLine(s),
      });
      setQuote(result.quote);
      setTxHash(result.txHash);
      setMessage(
        `✓ Real swap submitted · ${result.protocol} · ${result.status} · tx ${result.txHash.slice(0, 14)}…`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Swap failed');
    } finally {
      setLoading(false);
      setStatusLine(null);
    }
  }

  async function handleQuote() {
    setError(null);
    setMessage(null);
    setQuote(null);
    setBuiltTx(null);
    setTxHash('');
    if (!token) {
      setError('Telegram session required for live quotes');
      return;
    }
    if (!fromAmount || Number(fromAmount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const raw = String(
        BigInt(Math.floor(Number(fromAmount) * 10 ** Math.min(pair.decimals, 8))) *
          10n ** BigInt(Math.max(0, pair.decimals - 8)),
      );
      // Prefer precise conversion via string path for display quote only
      const [i, f = ''] = fromAmount.split('.');
      const frac = (f + '0'.repeat(pair.decimals)).slice(0, pair.decimals);
      const precise = (BigInt(i || '0') * 10n ** BigInt(pair.decimals) + BigInt(frac || '0')).toString();

      const res = await requestSwapQuote(token, {
        fromToken: pair.fromToken,
        toToken: pair.toToken,
        fromAmount: precise !== '0' ? precise : raw,
        fromChain: pair.fromChain,
        toChain: pair.toChain,
        slippageBps,
      });
      if (res.success) {
        setQuote(res.data);
        setMessage(`Best route: ${res.data.protocol}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quote failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuild() {
    if (!token || !quote || !walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const res = await buildSwapTx(token, { quoteId: quote.quoteId, userAddress: walletAddress });
      setBuiltTx(res.data.transaction);
      setMessage(`Tx built (${res.data.protocol}) — confirm in wallet next`);
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
      const protocol = quote?.protocol?.toLowerCase() ?? '';
      let hash: string;
      if (protocol.includes('jupiter') || pair.fromChain === 'solana') {
        if (walletProvider !== 'phantom') throw new Error('Connect Phantom for Solana');
        hash = await signAndSendJupiterSwap(builtTx);
      } else {
        hash = await sendEvmSwapTransaction(builtTx, walletAddress, pair.fromChain === 'ethereum' ? 1 : undefined);
      }
      setTxHash(hash);
      setMessage(`Broadcast on-chain ✓ ${hash.slice(0, 18)}…`);
      if (token && quote) {
        await executeSwap(token, { quoteId: quote.quoteId, txHash: hash });
        setMessage((m) => `${m} · recorded on Cryptra`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign/send failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePerp() {
    if (!token) {
      setError('Open inside Telegram first');
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
        protocol: perpProtocol,
        symbol: perpSymbol,
        side: perpSide,
        type: 'MARKET',
        size: perpSize,
        leverage,
      });
      const data = res.data as {
        order?: { avgFillPrice?: string; id?: string };
        market?: { mid?: number };
        agent?: { mode?: string; executed?: boolean; message?: string };
        note?: string;
      };
      const px = data.market?.mid ?? data.order?.avgFillPrice;
      const live = data.agent?.executed ? 'LIVE on venue' : data.agent?.mode || 'tracked';
      setMessage(
        `${perpSide} ${perpSymbol} @ ${perpProtocol} · size ${perpSize} · ~${px ?? '?'} · ${live}`,
      );
      if (data.note) setStatusLine(data.note.slice(0, 120));
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
          <p className="text-xs text-white/45 mt-0.5">Real on-chain swap · Perps</p>
        </div>
        {hlMids.ETH != null && (
          <div className="text-right">
            <div className="text-sm font-semibold">ETH</div>
            <div className="text-lg font-bold">${hlMids.ETH.toLocaleString()}</div>
          </div>
        )}
      </div>

      <Card padded className="border-cyan-500/15">
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
          <p className="text-sm text-white/60">Open from Telegram Mini App for live quotes & orders.</p>
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
            <label className="text-xs text-white/45">You pay ({pair.payUnit})</label>
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
            <label className="text-xs text-white/45">You receive ({pair.receiveUnit})</label>
            <div className="rounded-xl border border-blue-500/20 bg-[#0c0c1a] px-4 py-3 text-lg font-semibold">
              {quote?.toAmount ?? '—'}
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
              {pair.wallet === 'phantom' ? ' · need Phantom' : ' · need MetaMask/Trust'}
            </p>
          )}

          <Button fullWidth disabled={loading || !fromAmount} onClick={() => void handleSwapNow()}>
            {loading ? statusLine || 'Working…' : '⚡ Swap Now (real on-chain)'}
          </Button>

          <p className="text-[10px] text-center text-white/35">
            Jupiter · 1inch · Uniswap · Pancake · Kyber · STON.fi — best quote wins
          </p>

          <details className="text-xs text-white/40">
            <summary className="cursor-pointer">Advanced steps</summary>
            <div className="mt-2 space-y-2">
              <Button fullWidth size="sm" variant="secondary" disabled={loading} onClick={() => void handleQuote()}>
                1. Quote only
              </Button>
              {quote && (
                <>
                  <Badge variant="success">{quote.protocol}</Badge>
                  <Button fullWidth size="sm" variant="secondary" disabled={loading} onClick={() => void handleBuild()}>
                    2. Build
                  </Button>
                  {builtTx != null && (
                    <Button fullWidth size="sm" disabled={loading} onClick={() => void handleSignAndSend()}>
                      3. Sign & send
                    </Button>
                  )}
                  {txHash && <code className="block break-all text-[10px]">{txHash}</code>}
                </>
              )}
            </div>
          </details>
        </Card>
      ) : (
        <Card padded className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {PERP_PROTOCOLS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={perpProtocol === p.id ? 'primary' : 'secondary'}
                onClick={() => setPerpProtocol(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERP_SYMBOLS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={perpSymbol === s ? 'primary' : 'secondary'}
                onClick={() => setPerpSymbol(s)}
              >
                {s}
                {hlMids[s] != null ? ` $${Number(hlMids[s]).toLocaleString()}` : ''}
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
          <p className="text-[10px] text-white/35">
            Hyperliquid live needs agent key on server or client-signed action. Others track + record on Cryptra until
            venue SDK signing is enabled.
          </p>
        </Card>
      )}

      {statusLine && <p className="text-xs text-cyan-300/80">{statusLine}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

export default Trade;
