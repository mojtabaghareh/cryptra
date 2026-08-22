import { useState } from 'react';
import { Card, Button, Badge } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import { requestSwapQuote, executeSwap, placeOrder, type SwapQuoteResult } from '../../lib/api';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_SOL = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export function Trade() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const connect = useWalletStore((s) => s.connect);
  const token = useSessionStore((s) => s.token);

  const [tab, setTab] = useState<'swap' | 'perp'>('swap');
  const [fromAmount, setFromAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState<SwapQuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Perp
  const [perpSide, setPerpSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [perpSize, setPerpSize] = useState('');
  const [leverage, setLeverage] = useState(5);

  async function handleQuote() {
    setError(null);
    setMessage(null);
    setQuote(null);

    if (!token) {
      setError('Authenticate inside Telegram first (session required).');
      return;
    }
    if (!fromAmount || Number(fromAmount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Amount in base units for SOL (9 decimals) — demo uses human amount * 1e9
      const lamports = String(Math.floor(Number(fromAmount) * 1e9));
      const res = await requestSwapQuote(token, {
        fromToken: SOL_MINT,
        toToken: USDC_SOL,
        fromAmount: lamports,
        fromChain: 'solana',
        toChain: 'solana',
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

  async function handleExecute() {
    if (!token || !quote) return;
    setLoading(true);
    setError(null);
    try {
      const res = await executeSwap(token, { quoteId: quote.quoteId });
      setMessage(`Swap ${res.data.status} · id ${res.data.swapId}`);
      setQuote(null);
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
        symbol: 'BTC',
        side: perpSide,
        type: 'MARKET',
        size: perpSize,
        leverage,
      });
      setMessage(`Order placed · ${JSON.stringify(res.data).slice(0, 120)}…`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Trade</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Swap (Jupiter / 1inch) · Perps (Hyperliquid)
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button variant={tab === 'swap' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('swap')}>
          Swap
        </Button>
        <Button variant={tab === 'perp' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('perp')}>
          Perps
        </Button>
      </div>

      {!token && (
        <Card padded>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            Open this Mini App from Telegram so session auth can run.
          </p>
          <Badge variant="neutral">No JWT session</Badge>
        </Card>
      )}

      {tab === 'swap' ? (
        <Card padded>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>From (SOL → USDC)</label>
            <input
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Slippage: {slippageBps / 100}%
            </label>
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={slippageBps}
              onChange={(e) => setSlippageBps(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {!isConnected && (
            <Button fullWidth variant="secondary" onClick={() => void connect()} style={{ marginBottom: 8 } as any}>
              Connect wallet (demo)
            </Button>
          )}

          <Button fullWidth disabled={loading || !fromAmount} onClick={() => void handleQuote()}>
            {loading ? 'Loading…' : 'Get quote'}
          </Button>

          {quote && (
            <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.6 }}>
              <div>
                <Badge variant="success">{quote.protocol}</Badge>
              </div>
              <div style={{ marginTop: 8 }}>
                Out: <b>{quote.toAmount}</b>
              </div>
              <div>
                Fee: {quote.feePercent}% (~{quote.feeAmount})
              </div>
              {quote.priceImpactBps != null && (
                <div>Impact: {(quote.priceImpactBps / 100).toFixed(2)}%</div>
              )}
              <Button
                fullWidth
                variant="primary"
                disabled={loading}
                onClick={() => void handleExecute()}
                className=""
              >
                {loading ? 'Submitting…' : 'Execute swap'}
              </Button>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                Execute records the swap server-side; on-chain signing comes with wallet adapters.
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card padded>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
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

          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Size (BTC)</label>
          <input
            value={perpSize}
            onChange={(e) => setPerpSize(e.target.value)}
            placeholder="0.01"
            style={inputStyle}
          />

          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Leverage: {leverage}x</label>
          <input
            type="range"
            min={1}
            max={20}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            style={{ width: '100%', marginBottom: 12 }}
          />

          <Button fullWidth disabled={loading || !perpSize} onClick={() => void handlePerp()}>
            {loading ? 'Submitting…' : `Open ${perpSide}`}
          </Button>
        </Card>
      )}

      {message && (
        <p style={{ marginTop: 12, fontSize: 13, color: '#00c853' }}>{message}</p>
      )}
      {error && (
        <p style={{ marginTop: 12, fontSize: 13, color: '#ff5252' }}>{error}</p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 4,
  marginBottom: 12,
  padding: '12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.3)',
  color: 'white',
  fontSize: 18,
};

export default Trade;
