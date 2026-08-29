import { useEffect, useState } from 'react';
import { Card, Badge, Skeleton, Button } from '../../lib/ui';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet } from '../../lib/api';
import { Link } from '@tanstack/react-router';

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

const DEMO_BADGES = [
  { title: 'First Trade', emoji: '🥇' },
  { title: '30 Days', emoji: '🛡️' },
  { title: 'Decision Master', emoji: '⭐' },
];

const DEMO_LB = [
  { rank: 1, name: 'CryptoKing', xp: 12450 },
  { rank: 2, name: 'TokenMaster', xp: 10320 },
  { rank: 3, name: 'DeFiPro', xp: 9876 },
];

export function Rewards() {
  const token = useSessionStore((s) => s.token);
  const sessionUser = useSessionStore((s) => s.user);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(false);

  const xp = sessionUser?.xp ?? 2450;
  const level = sessionUser?.level ?? 27;
  const nextLevelXp = Math.max(5000, xp + 500);
  const progress = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const ach = await apiGet<{
          success: boolean;
          data: { all: Achievement[]; unlocked: UserAchievement[] };
        }>('/api/v1/rewards/achievements', token);
        if (cancelled) return;
        setAchievements(ach.data?.all ?? []);
        setUnlocked(ach.data?.unlocked ?? []);
      } catch {
        /* demo */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  return (
    <div className="px-4 pb-6 space-y-4">
      <h1 className="text-xl font-bold">Growth</h1>

      <Card padded className="border-amber-400/30 bg-gradient-to-r from-amber-500/15 to-orange-600/10 text-center">
        <div className="text-sm font-semibold text-amber-300">🔥 15-Day Streak</div>
      </Card>

      <Card padded className="border-cyan-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Trader Level {level}</span>
          <Badge variant="neutral">
            {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
          </Badge>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card padded className="text-center">
          <div className="text-cyan-300 text-lg font-bold">+320</div>
          <div className="text-[11px] text-white/45">XP Today</div>
        </Card>
        <Card padded className="text-center">
          <div className="text-amber-300 text-lg font-bold">12</div>
          <div className="text-[11px] text-white/45">Achievements</div>
        </Card>
        <Card padded className="text-center">
          <div className="text-lg font-bold">4</div>
          <div className="text-[11px] text-white/45">Badges</div>
        </Card>
        <Card padded className="text-center">
          <div className="text-lg font-bold">#128</div>
          <div className="text-[11px] text-white/45">Global Rank</div>
        </Card>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">Recent Badges</h2>
        <div className="flex gap-3">
          {DEMO_BADGES.map((b) => (
            <div
              key={b.title}
              className="flex-1 rounded-2xl border border-blue-500/20 bg-[#12122a] py-3 text-center"
            >
              <div className="text-2xl">{b.emoji}</div>
              <div className="text-[10px] text-white/55 mt-1">{b.title}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Leaderboard</h2>
          <Link to="/leaderboard" className="text-xs text-cyan-400">
            View All
          </Link>
        </div>
        <Card padded className="space-y-2">
          {DEMO_LB.map((r) => (
            <div key={r.rank} className="flex items-center gap-3 text-sm">
              <span className="w-5 text-white/40">{r.rank}</span>
              <span className="flex-1 font-medium">{r.name}</span>
              <span className="text-emerald-400 text-xs">+{r.xp.toLocaleString()} XP</span>
            </div>
          ))}
        </Card>
      </section>

      {loading && <Skeleton height={48} />}

      {achievements.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">All achievements</h2>
          {achievements.map((a) => (
            <Card key={a.id} padded className="flex justify-between items-center">
              <div>
                <div className="font-medium text-sm">{a.name}</div>
                <div className="text-xs text-white/40">{a.description || a.code}</div>
              </div>
              <Badge variant={unlockedIds.has(a.id) ? 'success' : 'neutral'}>
                {unlockedIds.has(a.id) ? 'Unlocked' : `+${a.xpReward} XP`}
              </Badge>
            </Card>
          ))}
        </section>
      )}

      {!token && (
        <Card padded>
          <p className="text-sm text-white/55 mb-2">Open in Telegram to sync real XP & badges.</p>
          <Button fullWidth variant="outline" onClick={() => undefined}>
            Demo growth view active
          </Button>
        </Card>
      )}
    </div>
  );
}

export default Rewards;
