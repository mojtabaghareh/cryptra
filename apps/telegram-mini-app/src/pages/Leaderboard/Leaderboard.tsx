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

const DEMO: Entry[] = [
  { rank: 1, userId: '1', username: 'CryptoKing', firstName: null, value: 12450, level: 40 },
  { rank: 2, userId: '2', username: 'TokenMaster', firstName: null, value: 10320, level: 35 },
  { rank: 3, userId: '3', username: 'DeFiPro', firstName: null, value: 9876, level: 33 },
  { rank: 4, userId: '4', username: 'Mojtaba', firstName: null, value: 2450, level: 27 },
];

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
        if (!cancelled) setRows(res.data?.length ? res.data : DEMO);
      } catch (e) {
        if (!cancelled) {
          setRows(DEMO);
          setError(e instanceof Error ? e.message : null);
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
    <div className="px-4 pb-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <p className="text-xs text-white/45 mt-0.5">Global rankings</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['xp', 'referral', 'trading'] as Kind[]).map((k) => (
          <Button key={k} size="sm" variant={kind === k ? 'primary' : 'secondary'} onClick={() => setKind(k)}>
            {k === 'xp' ? 'XP' : k === 'referral' ? 'Referral' : 'Trading'}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton height={48} />
          <Skeleton height={48} />
        </div>
      )}

      {error && (
        <p className="text-[11px] text-white/35">API offline · showing demo ranks</p>
      )}

      <div className="space-y-2">
        {rows.map((e) => {
          const name = e.username ? `@${e.username}` : e.firstName || e.userId.slice(0, 8);
          const medal =
            e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`;
          return (
            <Card key={e.userId} padded className="flex justify-between items-center">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 text-center">{medal}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{name}</div>
                  {e.level != null && <div className="text-[11px] text-white/40">L{e.level}</div>}
                </div>
              </div>
              <Badge variant={e.rank <= 3 ? 'success' : 'neutral'}>
                {e.value.toLocaleString()} {valueLabel}
              </Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Leaderboard;
