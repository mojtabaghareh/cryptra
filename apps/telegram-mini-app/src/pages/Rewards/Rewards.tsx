import { useEffect, useState } from 'react';
import { Card, Badge, Button, Skeleton } from '../../lib/ui';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet } from '../../lib/api';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  xpReward: number;
  icon: string | null;
}

interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: string;
  achievement: Achievement;
}

interface Reward {
  id: string;
  code: string;
  type: string;
  name: string;
  description: string | null;
  value: string | null;
}

interface UserReward {
  id: string;
  rewardId: string;
  claimedAt: string;
  reward: Reward;
}

export function Rewards() {
  const token = useSessionStore((s) => s.token);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [catalog, setCatalog] = useState<Reward[]>([]);
  const [claimed, setClaimed] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [rew, ach] = await Promise.all([
          apiGet<{ success: boolean; data: { catalog: Reward[]; claimed: UserReward[] } }>(
            '/api/v1/rewards',
            token,
          ),
          apiGet<{
            success: boolean;
            data: { all: Achievement[]; unlocked: UserAchievement[] };
          }>('/api/v1/rewards/achievements', token),
        ]);
        if (cancelled) return;
        setCatalog(rew.data?.catalog ?? []);
        setClaimed(rew.data?.claimed ?? []);
        setAchievements(ach.data?.all ?? []);
        setUnlocked(ach.data?.unlocked ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const claimedIds = new Set(claimed.map((c) => c.rewardId));

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Rewards</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Achievements & rewards from the platform
      </p>

      {!token && (
        <Card padded>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Open from Telegram to sync achievements with your account.
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
        </Card>
      )}

      <h2 style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '16px 0 8px' }}>
        Achievements
      </h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {(achievements.length > 0 ? achievements : []).map((a) => {
          const done = unlockedIds.has(a.id);
          return (
            <Card key={a.id} padded>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {a.icon ? `${a.icon} ` : ''}{a.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                    {a.description || a.code}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant={done ? 'success' : 'neutral'}>
                    {done ? 'Unlocked' : `+${a.xpReward} XP`}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
        {!loading && token && achievements.length === 0 && (
          <Card padded>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              No achievements seeded yet. Run <code>pnpm db:seed</code>.
            </p>
          </Card>
        )}
      </div>

      <h2 style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '20px 0 8px' }}>
        Reward catalog
      </h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {catalog.map((r) => (
          <Card key={r.id} padded>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                  {r.description || r.code} · {r.type}
                </div>
              </div>
              <Badge variant={claimedIds.has(r.id) ? 'success' : 'neutral'}>
                {claimedIds.has(r.id) ? 'Claimed' : r.value ?? '—'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Rewards;
