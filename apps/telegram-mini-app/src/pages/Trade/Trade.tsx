import { useState, type CSSProperties } from 'react';
import { Card, Button, Badge } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import {
  requestSwapQuote,
  buildSwapTx,
  executeSwap,
  placeOrder,
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
    label: 'ETH → USDC (1inch)',
    fromChain: 'ethereum',
    toChain: 'ethereum',
    fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 18,
    unit: 'ETH',
  },
] as const;

const inputStyle: CSSProperties = {
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

export function Trade() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const walletAddress = useWalletStore((s) => s.address);
  const walletProvider = useWalletStore((s) => s.provider);
  const connect = useWalletStore((s) => s.connect);
  const token = useSessionStore((s) => s.token);

  const [tab, setTab] = useState<'swap' | 'perp'>('swap');
  const [pairId, setPairId] = useState<(typeof PAIRS)[number]['id']>('sol-usdc');
  const [fromAmount, setFromAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState<SwapQuoteResult | null>(null);
  const [builtTx, setBuiltTx] = useState<unknown>(null);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [perpSide, setPerpSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [perpSize, setPerpSize] = useState('');
  const [leverage, setLeverage] = useState(5);

  const pair = PAIRS.find((p) => p.id === pairId)!;

  async function handleQuote() {
    setError(null);
    setMessage(null);
    setQuote(null);
    setBuiltTx(null);
    setTxHash('');

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
      setError('Connect a wallet address first (Phantom for Solana / MetaMask for EVM)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await buildSwapTx(token, {
        quoteId: quote.quoteId,
        userAddress: walletAddress,
      });
      setBuiltTx(res.data.transaction);
      setMessage(`Transaction built (${res.data.protocol}). You can Sign & send or paste hash.`);
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
      setMessage(`Broadcast ✓ ${hash.slice(0, 16)}… — now Execute to record on Cryptra`);
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
        Quote → Build → Sign & send → Execute
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
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

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Amount ({pair.unit})
            </label>
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
            <div style={{ marginBottom: 8 }}>
              <Button fullWidth variant="secondary" onClick={() => void connect()}>
                Connect wallet
              </Button>
            </div>
          )}

          {isConnected && walletAddress && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              Signer: {walletProvider} · {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </p>
          )}

          <Button fullWidth disabled={loading || !fromAmount} onClick={() => void handleQuote()}>
            {loading ? 'Loading…' : '1. Get quote'}
          </Button>

          {quote && (
            <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.6 }}>
              <Badge variant="success">{quote.protocol}</Badge>
              <div style={{ marginTop: 8 }}>
                Out: <b>{quote.toAmount}</b>
              </div>
              <div>
                Fee: {quote.feePercent}% (~{quote.feeAmount})
              </div>
              {quote.priceImpactBps != null && (
                <div>Impact: {(quote.priceImpactBps / 100).toFixed(2)}%</div>
              )}

              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <Button fullWidth variant="secondary" disabled={loading} onClick={() => void handleBuild()}>
                  {loading ? 'Building…' : '2. Build transaction'}
                </Button>

                {builtTx != null && (
                  <Button fullWidth variant="primary" disabled={loading} onClick={() => void handleSignAndSend()}>
                    {loading ? 'Waiting wallet…' : '3. Sign & send in wallet'}
                  </Button>
                )}

                <input
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="tx hash (auto-filled after sign)"
                  style={{ ...inputStyle, fontSize: 13, marginBottom: 0 }}
                />

                <Button fullWidth variant="outline" disabled={loading} onClick={() => void handleExecute()}>
                  {loading ? 'Submitting…' : '4. Record on Cryptra (Execute)'}
                </Button>
              </div>
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

      {message && <p style={{ marginTop: 12, fontSize: 13, color: '#00c853' }}>{message}</p>}
      {error && <p style={{ marginTop: 12, fontSize: 13, color: '#ff5252' }}>{error}</p>}
    </div>
  );
}

export default Trade;
