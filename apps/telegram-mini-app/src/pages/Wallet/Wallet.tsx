import { useEffect, useState } from 'react';
import { Card, Button, Badge, Skeleton, PriceDisplay, Sparkline } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet, apiPost } from '../../lib/api';
import { buildLinkMessage, isMetaMaskAvailable, personalSign } from '../../lib/ethereum';
import {
  buildSolanaLinkMessage,
  isPhantomAvailable,
  signPhantomMessage,
} from '../../lib/solana';

interface SwapRow {
  id: string;
  fromToken: string;
  toToken: string;
  status: string;
  protocol: string | null;
  createdAt: string;
}

interface OrderRow {
  id: string;
  symbol: string;
  side: string;
  size: string;
  status: string;
  leverage: number | null;
  createdAt: string;
}

interface LinkedWallet {
  id: string;
  address: string;
  chainType: string;
  provider: string;
  isPrimary: boolean;
  label: string | null;
}

interface WalletBalance {
  walletId: string;
  address: string;
  chainType: string;
  isPrimary: boolean;
  symbol: string;
  balanceFormatted: string;
  error?: string;
}

const DEMO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', value: 68432, pct: 40 },
  { symbol: 'ETH', name: 'Ethereum', value: 3254, pct: 30 },
  { symbol: 'TON', name: 'Toncoin', value: 5.42, pct: 20 },
  { symbol: 'SOL', name: 'Solana', value: 142.56, pct: 10 },
];

export function Wallet() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const address = useWalletStore((s) => s.address);
  const provider = useWalletStore((s) => s.provider);
  const chainId = useWalletStore((s) => s.chainId);
  const chainType = useWalletStore((s) => s.chainType);
  const connectMetaMask = useWalletStore((s) => s.connectMetaMask);
  const connectPhantom = useWalletStore((s) => s.connectPhantom);
  const connectTon = useWalletStore((s) => s.connectTon);
  const connectDemo = useWalletStore((s) => s.connectDemo);
  const disconnect = useWalletStore((s) => s.disconnect);
  const token = useSessionStore((s) => s.token);

  const [swaps, setSwaps] = useState<SwapRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [linked, setLinked] = useState<LinkedWallet[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [tab, setTab] = useState<'portfolio' | 'wallet' | 'activity'>('portfolio');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);
  const [tonAddress, setTonAddress] = useState('');

  useEffect(() => {
    setHasMetaMask(isMetaMaskAvailable());
    setHasPhantom(isPhantomAvailable());
  }, []);

  async function loadActivity() {
    if (!token) return;
    setLoading(true);
    try {
      const [s, o, w, b] = await Promise.all([
        apiGet<{ success: boolean; data: SwapRow[] }>('/api/v1/swaps', token),
        apiGet<{ success: boolean; data: OrderRow[] }>('/api/v1/orders', token),
        apiGet<{ success: boolean; data: LinkedWallet[] }>('/api/v1/wallets', token),
        apiGet<{ success: boolean; data: WalletBalance[] }>('/api/v1/wallets/balances/all', token).catch(
          () => ({ success: false, data: [] as WalletBalance[] }),
        ),
      ]);
      setSwaps(Array.isArray(s.data) ? s.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
      setLinked(Array.isArray(w.data) ? w.data : []);
      setBalances(Array.isArray(b.data) ? b.data : []);
    } catch {
      setSwaps([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function linkToAccount() {
    const state = useWalletStore.getState();
    const addr = state.address;
    const prov = state.provider;
    const ctype = state.chainType;
    if (!token || !addr) {
      setError('Need Telegram session + connected wallet');
      return;
    }
    setLinking(true);
    setError(null);
    setMessage(null);
    try {
      if (prov === 'metamask') {
        const msg = buildLinkMessage(addr);
        const signature = await personalSign(addr, msg);
        const res = await apiPost<{ success: boolean; linked: boolean }>(
          '/api/v1/wallets/connect',
          {
            address: addr,
            chainType: 'EVM',
            provider: 'metamask',
            message: msg,
            signature,
            label: 'MetaMask',
          },
          token,
        );
        setMessage(res.linked ? 'MetaMask linked ✓' : 'Already linked');
      } else if (prov === 'phantom') {
        const msg = buildSolanaLinkMessage(addr);
        const signature = await signPhantomMessage(msg);
        const res = await apiPost<{ success: boolean; linked: boolean }>(
          '/api/v1/wallets/connect',
          {
            address: addr,
            chainType: 'SOLANA',
            provider: 'phantom',
            message: msg,
            signature,
            label: 'Phantom',
          },
          token,
        );
        setMessage(res.linked ? 'Phantom linked ✓' : 'Already linked');
      } else if (prov === 'ton' || ctype === 'TON') {
        const res = await apiPost<{ success: boolean; linked: boolean }>(
          '/api/v1/wallets/connect',
          {
            address: addr,
            chainType: 'TON',
            provider: 'tonconnect',
            skipSignature: true,
            label: 'TON',
          },
          token,
        );
        setMessage(res.linked ? 'TON linked' : 'Already linked');
      } else {
        const res = await apiPost<{ success: boolean; linked: boolean }>(
          '/api/v1/wallets/connect',
          {
            address: addr,
            chainType: 'EVM',
            provider: 'demo',
            skipSignature: true,
            label: 'Demo wallet',
          },
          token,
        );
        setMessage(res.linked ? 'Demo linked' : 'Already linked');
      }
      await loadActivity();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Link failed');
    } finally {
      setLinking(false);
    }
  }

  const balByAddress = new Map<string, WalletBalance>();
  for (const b of balances) {
    balByAddress.set(b.address, b);
    balByAddress.set(b.address.toLowerCase(), b);
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      <h1 className="text-xl font-bold">Portfolio</h1>

      <div className="flex gap-2">
        {(['portfolio', 'wallet', 'activity'] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)}>
            {t === 'portfolio' ? 'Assets' : t === 'wallet' ? 'Connect' : 'Activity'}
          </Button>
        ))}
      </div>

      {tab === 'portfolio' && (
        <>
          <Card padded className="border-cyan-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 to-transparent pointer-events-none" />
            <div className="relative flex justify-between items-start gap-3">
              <div>
                <div className="text-xs text-white/50">Portfolio Value</div>
                <PriceDisplay value={10000} className="text-[28px]" />
                <div className="text-sm text-emerald-400 font-medium mt-1">+5.6% Today</div>
              </div>
              <Sparkline positive />
            </div>
            <div className="relative mt-4 flex gap-2 flex-wrap">
              <Badge variant="neutral">Assets 12</Badge>
              <Badge variant="neutral">Chains 4</Badge>
              <Badge variant="neutral">NFTs 2</Badge>
            </div>
          </Card>

          <div className="space-y-2">
            {DEMO_ASSETS.map((a) => (
              <Card key={a.symbol} padded className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/20 flex items-center justify-center text-xs font-bold">
                  {a.symbol.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{a.name}</div>
                  <div className="text-xs text-white/40">{a.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">${a.value.toLocaleString()}</div>
                  <div className="text-xs text-white/40">{a.pct}%</div>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-[10px] text-center text-white/30">
            Demo allocation · live balances after wallet link
          </p>
        </>
      )}

      {tab === 'wallet' && (
        <>
          {!isConnected ? (
            <Card padded className="space-y-2">
              <p className="text-sm text-white/60 mb-2">MetaMask · Phantom · TON · Demo</p>
              <Button
                fullWidth
                disabled={!hasMetaMask}
                onClick={() => {
                  setError(null);
                  void connectMetaMask().catch((e) =>
                    setError(e instanceof Error ? e.message : 'MetaMask failed'),
                  );
                }}
              >
                {hasMetaMask ? 'Connect MetaMask' : 'MetaMask not detected'}
              </Button>
              <Button
                fullWidth
                variant="secondary"
                disabled={!hasPhantom}
                onClick={() => {
                  setError(null);
                  void connectPhantom().catch((e) =>
                    setError(e instanceof Error ? e.message : 'Phantom failed'),
                  );
                }}
              >
                {hasPhantom ? 'Connect Phantom' : 'Phantom not detected'}
              </Button>
              <input
                value={tonAddress}
                onChange={(e) => setTonAddress(e.target.value)}
                placeholder="TON address"
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white"
              />
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  setError(null);
                  void connectTon(tonAddress || undefined).catch((e) =>
                    setError(e instanceof Error ? e.message : 'TON failed'),
                  );
                }}
              >
                Connect TON
              </Button>
              <Button
                fullWidth
                variant="outline"
                onClick={() => {
                  setError(null);
                  void connectDemo();
                }}
              >
                Connect demo wallet
              </Button>
            </Card>
          ) : (
            <Card padded>
              <div className="flex justify-between items-center gap-2">
                <div>
                  <div className="text-xs text-white/50">Connected</div>
                  <code className="text-sm">
                    {address && address.length > 16
                      ? `${address.slice(0, 8)}…${address.slice(-6)}`
                      : address}
                  </code>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <Badge variant="success">{provider ?? 'wallet'}</Badge>
                    {chainType && <Badge variant="neutral">{chainType}</Badge>}
                    {chainId != null && <Badge variant="neutral">chain {chainId}</Badge>}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </div>
              {token && (
                <Button className="mt-3" fullWidth disabled={linking} onClick={() => void linkToAccount()}>
                  {linking ? 'Signing…' : 'Sign & link to account'}
                </Button>
              )}
            </Card>
          )}

          {linked.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-sm text-white/50">Linked</h2>
                <Button size="sm" variant="ghost" onClick={() => void loadActivity()}>
                  Refresh
                </Button>
              </div>
              {linked.map((w) => {
                const bal =
                  balByAddress.get(w.address) || balByAddress.get(w.address.toLowerCase());
                return (
                  <Card key={w.id} padded>
                    <div className="font-semibold text-sm">
                      {w.address.slice(0, 8)}…{w.address.slice(-6)}
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="neutral">{w.chainType}</Badge>
                      {w.isPrimary && <Badge variant="success">Primary</Badge>}
                    </div>
                    {bal && (
                      <div className="mt-2 text-sm">
                        {bal.balanceFormatted} {bal.symbol}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {message && <p className="text-sm text-emerald-400">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </>
      )}

      {tab === 'activity' && (
        <>
          {!token && (
            <Card padded>
              <p className="text-white/60 text-sm">Login via Telegram to see history.</p>
            </Card>
          )}
          {loading && (
            <div className="space-y-2">
              <Skeleton height={64} />
              <Skeleton height={64} />
            </div>
          )}
          {!loading && token && swaps.length === 0 && orders.length === 0 && (
            <Card padded>
              <p className="text-white/60 text-sm">No activity yet.</p>
            </Card>
          )}
          {swaps.slice(0, 15).map((s) => (
            <Card key={s.id} padded className="flex justify-between">
              <span className="text-sm">Swap · {s.protocol ?? 'DEX'}</span>
              <Badge variant={s.status === 'SUBMITTED' ? 'success' : 'neutral'}>{s.status}</Badge>
            </Card>
          ))}
          {orders.slice(0, 15).map((o) => (
            <Card key={o.id} padded className="flex justify-between">
              <span className="text-sm">
                {o.side} {o.symbol}
              </span>
              <Badge variant="neutral">{o.status}</Badge>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

export default Wallet;
