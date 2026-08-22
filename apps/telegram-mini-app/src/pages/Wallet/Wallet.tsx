import { useEffect, useState } from 'react';
import { Card, Button, Badge, Skeleton } from '../../lib/ui';
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

export function Wallet() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const address = useWalletStore((s) => s.address);
  const provider = useWalletStore((s) => s.provider);
  const chainId = useWalletStore((s) => s.chainId);
  const chainType = useWalletStore((s) => s.chainType);
  const connectMetaMask = useWalletStore((s) => s.connectMetaMask);
  const connectPhantom = useWalletStore((s) => s.connectPhantom);
  const connectDemo = useWalletStore((s) => s.connectDemo);
  const disconnect = useWalletStore((s) => s.disconnect);
  const token = useSessionStore((s) => s.token);

  const [swaps, setSwaps] = useState<SwapRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [linked, setLinked] = useState<LinkedWallet[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [tab, setTab] = useState<'wallet' | 'activity'>('wallet');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);

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
        setMessage(res.linked ? 'MetaMask linked with signature ✓' : 'Already linked');
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
        setMessage(res.linked ? 'Phantom linked with signature ✓' : 'Already linked');
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
        setMessage(res.linked ? 'Demo wallet linked' : 'Already linked');
      }
      await loadActivity();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Link failed');
    } finally {
      setLinking(false);
    }
  }

  const balByAddress = new Map(balances.map((b) => [b.address.toLowerCase(), b]));

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Wallet</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button
          variant={tab === 'wallet' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('wallet')}
        >
          Wallet
        </Button>
        <Button
          variant={tab === 'activity' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('activity')}
        >
          Activity
        </Button>
      </div>

      {tab === 'wallet' && (
        <>
          {!isConnected ? (
            <Card padded>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                Connect MetaMask (EVM), Phantom (Solana), or demo for testing.
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
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
              </div>
            </Card>
          ) : (
            <Card padded>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Connected</div>
                  <code style={{ fontSize: 13 }}>
                    {address && address.length > 16
                      ? `${address.slice(0, 8)}…${address.slice(-6)}`
                      : address}
                  </code>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
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
                <div style={{ marginTop: 12 }}>
                  <Button fullWidth disabled={linking} onClick={() => void linkToAccount()}>
                    {linking
                      ? 'Signing…'
                      : provider === 'metamask' || provider === 'phantom'
                        ? 'Sign & link to account'
                        : 'Link demo to account'}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {linked.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h2 style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  Linked + balances
                </h2>
                <Button size="sm" variant="ghost" onClick={() => void loadActivity()}>
                  Refresh
                </Button>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {linked.map((w) => {
                  const bal = balByAddress.get(w.address.toLowerCase());
                  return (
                    <Card key={w.id} padded>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {w.address.slice(0, 8)}…{w.address.slice(-6)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <Badge variant="neutral">{w.chainType}</Badge>
                        <Badge variant="neutral">{w.provider}</Badge>
                        {w.isPrimary && <Badge variant="success">Primary</Badge>}
                      </div>
                      {bal && (
                        <div style={{ marginTop: 8, fontSize: 14 }}>
                          {bal.balanceFormatted} {bal.symbol}
                          {bal.error && (
                            <span style={{ marginLeft: 8, fontSize: 11, color: '#ff5252' }}>
                              ({bal.error})
                            </span>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {message && <p style={{ marginTop: 12, color: '#00c853', fontSize: 13 }}>{message}</p>}
          {error && <p style={{ marginTop: 12, color: '#ff5252', fontSize: 13 }}>{error}</p>}
        </>
      )}

      {tab === 'activity' && (
        <>
          {!token && (
            <Card padded>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Login via Telegram to see history.</p>
            </Card>
          )}
          {loading && (
            <div style={{ display: 'grid', gap: 8 }}>
              <Skeleton height={64} />
              <Skeleton height={64} />
            </div>
          )}
          {!loading && token && swaps.length === 0 && orders.length === 0 && (
            <Card padded>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>No activity yet.</p>
            </Card>
          )}
          {swaps.slice(0, 15).map((s) => (
            <Card key={s.id} padded>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>Swap · {s.protocol ?? 'DEX'}</span>
                <Badge variant={s.status === 'SUBMITTED' ? 'success' : 'neutral'}>{s.status}</Badge>
              </div>
            </Card>
          ))}
          {orders.slice(0, 15).map((o) => (
            <Card key={o.id} padded>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>
                  {o.side} {o.symbol}
                </span>
                <Badge variant="neutral">{o.status}</Badge>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

export default Wallet;
