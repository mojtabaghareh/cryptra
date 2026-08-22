import { useEffect, useState } from 'react';
import { Card, Badge, Button, Skeleton } from '../../lib/ui';
import { apiGet } from '../../lib/api';

interface Entry {
  rank: number;
  userId: string;
  username: string | null;
  firstName: string | null;
  value: number;
  level?: number;
}

type Kind = 'xp' | 'referral' | 'trading';

export function Leaderboard() {
  const [kind, setKind] = useState<Kind>('xp');
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet<{ success: boolean; data: Entry[] }>(
          `/api/v1/leaderboard?kind=${kind}&limit=50`,
        );
        if (!cancelled) setRows(res.data ?? []);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const valueLabel = kind === 'xp' ? 'XP' : kind === 'referral' ? 'refs' : 'trades';

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Leaderboard</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Global rankings
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['xp', 'referral', 'trading'] as Kind[]).map((k) => (
          <Button
            key={k}
            size="sm"
            variant={kind === k ? 'primary' : 'secondary'}
            onClick={() => setKind(k)}
          >
            {k === 'xp' ? 'XP' : k === 'referral' ? 'Referral' : 'Trading'}
          </Button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </div>
      )}

      {error && (
        <Card padded>
          <p style={{ color: '#ff5252', fontSize: 13 }}>{error}</p>
        </Card>
      )}

      {!loading && !error && rows.length === 0 && (
        <Card padded>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>No rankings yet. Earn XP to appear here.</p>
        </Card>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((e) => {
          const name = e.username
            ? `@${e.username}`
            : e.firstName || e.userId.slice(0, 8);
          const medal =
            e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`;
          return (
            <Card key={e.userId} padded>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ marginRight: 8 }}>{medal}</span>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  {e.level != null && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      L{e.level}
                    </span>
                  )}
                </div>
                <Badge variant={e.rank <= 3 ? 'success' : 'neutral'}>
                  {e.value} {valueLabel}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Leaderboard;
