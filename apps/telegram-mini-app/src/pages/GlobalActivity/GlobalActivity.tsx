import { useEffect, useState } from 'react';
import { Card, Badge, Skeleton, Button } from '../../lib/ui';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet } from '../../lib/api';

interface ActivityItem {
  id: string;
  kind: 'swap' | 'order' | 'xp';
  title: string;
  subtitle: string;
  status?: string;
  at: string;
}

export function GlobalActivity() {
  const token = useSessionStore((s) => s.token);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [hist, xp] = await Promise.all([
        apiGet<{
          success: boolean;
          data: {
            swaps: Array<{
              id: string;
              fromToken: string;
              toToken: string;
              status: string;
              protocol: string | null;
              createdAt: string;
            }>;
            orders: Array<{
              id: string;
              symbol: string;
              side: string;
              size: string;
              status: string;
              createdAt: string;
            }>;
          };
        }>('/api/v1/portfolio/history', token),
        apiGet<{ success: boolean; data: Array<{ id: string; source: string; amount: number; createdAt: string; description?: string }> }>(
          '/api/v1/xp/history',
          token,
        ).catch(() => ({ success: false, data: [] as Array<{ id: string; source: string; amount: number; createdAt: string }> })),
      ]);

      const feed: ActivityItem[] = [];

      for (const s of hist.data?.swaps ?? []) {
        feed.push({
          id: `swap-${s.id}`,
          kind: 'swap',
          title: `Swap ${s.fromToken.slice(0, 4)}… → ${s.toToken.slice(0, 4)}…`,
          subtitle: s.protocol ?? 'DEX',
          status: s.status,
          at: s.createdAt,
        });
      }
      for (const o of hist.data?.orders ?? []) {
        feed.push({
          id: `order-${o.id}`,
          kind: 'order',
          title: `${o.side} ${o.symbol}`,
          subtitle: `Size ${o.size}`,
          status: o.status,
          at: o.createdAt,
        });
      }
      for (const e of xp.data ?? []) {
        feed.push({
          id: `xp-${e.id}`,
          kind: 'xp',
          title: `+${e.amount} XP`,
          subtitle: e.source,
          at: e.createdAt,
        });
      }

      feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setItems(feed.slice(0, 50));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Activity</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Swaps, orders and XP events
      </p>

      {!token && (
        <Card padded>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Open from Telegram to load your personal activity feed.
          </p>
        </Card>
      )}

      {loading && (
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton height={56} />
          <Skeleton height={56} />
        </div>
      )}

      {error && (
        <Card padded>
          <p style={{ color: '#ff5252', fontSize: 13 }}>{error}</p>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && token && items.length === 0 && (
        <Card padded>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            No activity yet. Start trading to fill this feed.
          </p>
        </Card>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => (
          <Card key={item.id} padded>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                  {item.subtitle} · {new Date(item.at).toLocaleString()}
                </div>
              </div>
              <Badge
                variant={
                  item.kind === 'xp'
                    ? 'success'
                    : item.status === 'FAILED' || item.status === 'REJECTED'
                      ? 'error'
                      : 'neutral'
                }
              >
                {item.kind === 'xp' ? 'XP' : item.status ?? item.kind}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default GlobalActivity;
