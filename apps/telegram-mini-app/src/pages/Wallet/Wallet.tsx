import { useEffect, useState } from 'react';
import { Card, Button, Badge, Skeleton } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet } from '../../lib/api';

interface SwapRow {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string | null;
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

export function Wallet() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const address = useWalletStore((s) => s.address);
  const provider = useWalletStore((s) => s.provider);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);
  const token = useSessionStore((s) => s.token);

  const [swaps, setSwaps] = useState<SwapRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'activity' | 'wallet'>('wallet');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [s, o] = await Promise.all([
          apiGet<{ success: boolean; data: SwapRow[] }>('/api/v1/swaps', token),
          apiGet<{ success: boolean; data: OrderRow[] }>('/api/v1/orders', token),
        ]);
        if (!cancelled) {
          setSwaps(Array.isArray(s.data) ? s.data : []);
          setOrders(Array.isArray(o.data) ? o.data : []);
        }
      } catch {
        if (!cancelled) {
          setSwaps([]);
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
                MetaMask · Phantom · TON Connect · WalletConnect
              </p>
              <Button fullWidth onClick={() => void connect()}>
                Connect wallet
              </Button>
              <p style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                Demo mode until chain adapters are wired
              </p>
            </Card>
          ) : (
            <Card padded>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Connected</div>
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
            </Card>
          )}

          {token ? (
            <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              Session active — activity loads from API
            </p>
          ) : (
            <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              Open from Telegram to load on-chain activity history
            </p>
          )}
        </>
      )}

      {tab === 'activity' && (
        <>
          {!token && (
            <Card padded>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Login via Telegram Mini App to see history.</p>
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
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                No swaps or orders yet. Try Trade → Get quote.
              </p>
            </Card>
          )}

          {swaps.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Swaps</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {swaps.slice(0, 20).map((s) => (
                  <Card key={s.id} padded>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {s.fromToken.slice(0, 6)}… → {s.toToken.slice(0, 6)}…
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                          {s.protocol ?? '—'} · {new Date(s.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge
                        variant={
                          s.status === 'CONFIRMED' || s.status === 'SUBMITTED'
                            ? 'success'
                            : s.status === 'FAILED'
                              ? 'error'
                              : 'neutral'
                        }
                      >
                        {s.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {orders.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Orders</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {orders.slice(0, 20).map((o) => (
                  <Card key={o.id} padded>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {o.side} {o.symbol} · {o.size}
                          {o.leverage ? ` · ${o.leverage}x` : ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                          {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={o.status === 'FILLED' ? 'success' : 'neutral'}>{o.status}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Wallet;
