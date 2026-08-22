import { useEffect, useState } from 'react';
import { Card, Button, Badge, Skeleton } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet, apiPost } from '../../lib/api';

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

export function Wallet() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const address = useWalletStore((s) => s.address);
  const provider = useWalletStore((s) => s.provider);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);
  const token = useSessionStore((s) => s.token);

  const [swaps, setSwaps] = useState<SwapRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [linked, setLinked] = useState<LinkedWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [tab, setTab] = useState<'wallet' | 'activity'>('wallet');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadActivity() {
    if (!token) return;
    setLoading(true);
    try {
      const [s, o, w] = await Promise.all([
        apiGet<{ success: boolean; data: SwapRow[] }>('/api/v1/swaps', token),
        apiGet<{ success: boolean; data: OrderRow[] }>('/api/v1/orders', token),
        apiGet<{ success: boolean; data: LinkedWallet[] }>('/api/v1/wallets', token),
      ]);
      setSwaps(Array.isArray(s.data) ? s.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
      setLinked(Array.isArray(w.data) ? w.data : []);
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

  async function handleConnectAndLink() {
    setError(null);
    setMessage(null);
    await connect();
  }

  async function linkToAccount() {
    const addr = useWalletStore.getState().address;
    if (!token || !addr) {
      setError('Need Telegram session + local wallet connect');
      return;
    }
    setLinking(true);
    setError(null);
    try {
      const res = await apiPost<{ success: boolean; data: LinkedWallet; linked: boolean }>(
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
      setMessage(res.linked ? 'Wallet linked to your account' : 'Wallet already linked');
      await loadActivity();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Link failed');
    } finally {
      setLinking(false);
    }
  }

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
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>
                Connect a demo wallet, then link it to your Telegram account.
              </p>
              <Button fullWidth onClick={() => void handleConnectAndLink()}>
                Connect wallet (demo)
              </Button>
            </Card>
          ) : (
            <Card padded>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Local session</div>
                  <code style={{ fontSize: 13 }}>
                    {address?.slice(0, 8)}…{address?.slice(-6)}
                  </code>
                  <div style={{ marginTop: 6 }}>
                    <Badge variant="success">{provider ?? 'wallet'}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </div>
              {token && (
                <div style={{ marginTop: 12 }}>
                  <Button fullWidth disabled={linking} onClick={() => void linkToAccount()}>
                    {linking ? 'Linking…' : 'Link to Cryptra account'}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {linked.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                Linked on server
              </h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {linked.map((w) => (
                  <Card key={w.id} padded>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {w.address.slice(0, 8)}…{w.address.slice(-6)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <Badge variant="neutral">{w.chainType}</Badge>
                      <Badge variant="neutral">{w.provider}</Badge>
                      {w.isPrimary && <Badge variant="success">Primary</Badge>}
                    </div>
                  </Card>
                ))}
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
                <span style={{ fontSize: 13 }}>
                  Swap · {s.protocol ?? 'DEX'}
                </span>
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
