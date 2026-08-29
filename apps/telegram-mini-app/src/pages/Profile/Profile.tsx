import { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../../lib/ui';
import { useTelegram } from '../../telegram/telegram';
import { useSessionStore } from '../../store/sessionStore';
import { Link } from '@tanstack/react-router';
import { apiGet, apiPost } from '../../lib/api';

interface Notif {
  id: string;
  title: string;
  body: string;
  status: string;
  channel: string;
  createdAt: string;
}

const MENU = [
  { to: '/wallet', label: 'Wallets', emoji: '💼' },
  { to: '/referral', label: 'Referral', emoji: '👥' },
  { to: '/rewards', label: 'Rewards', emoji: '🏆' },
  { to: '/leaderboard', label: 'Leaderboard', emoji: '📊' },
  { to: '/reflection', label: 'Reflection', emoji: '🧠' },
  { to: '/status', label: 'System status', emoji: '🛡️' },
] as const;

export function Profile() {
  const { user: tgUser } = useTelegram();
  const sessionUser = useSessionStore((s) => s.user);
  const token = useSessionStore((s) => s.token);
  const isLoading = useSessionStore((s) => s.isLoading);
  const error = useSessionStore((s) => s.error);

  const [notifs, setNotifs] = useState<Notif[]>([]);

  const name =
    sessionUser?.firstName ||
    (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Mojtaba');
  const username = sessionUser?.username || tgUser?.username || 'cryptra_user';
  const xp = sessionUser?.xp ?? 2450;
  const level = sessionUser?.level ?? 27;
  const referralCode = sessionUser?.referralCode;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet<{ success: boolean; data: Notif[] }>(
          '/api/v1/notifications',
          token,
        );
        if (!cancelled && res.success) setNotifs(res.data ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function markRead(id: string) {
    if (!token) return;
    try {
      await apiPost(`/api/v1/notifications/${id}/read`, {}, token);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n)));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="px-4 pb-6 space-y-5">
      <h1 className="text-xl font-bold">Profile</h1>

      {isLoading && <p className="text-xs text-white/45">Authenticating…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Hero identity */}
      <Card padded className="text-center border-cyan-500/20">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 border-2 border-cyan-400/40 flex items-center justify-center text-2xl shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          {(name[0] || 'C').toUpperCase()}
        </div>
        <div className="mt-3 font-bold text-lg">{name}</div>
        <div className="text-sm text-white/45">@{username}</div>
        <div className="mt-2 flex justify-center gap-2 flex-wrap">
          <Badge variant="success">Pro</Badge>
          {token ? <Badge variant="success">Session</Badge> : <Badge variant="neutral">Guest demo</Badge>}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/5 py-2">
            <div className="text-lg font-bold">{level}</div>
            <div className="text-[10px] text-white/40">Level</div>
          </div>
          <div className="rounded-xl bg-white/5 py-2">
            <div className="text-lg font-bold">{xp.toLocaleString()}</div>
            <div className="text-[10px] text-white/40">XP</div>
          </div>
          <div className="rounded-xl bg-white/5 py-2">
            <div className="text-lg font-bold text-amber-300">15</div>
            <div className="text-[10px] text-white/40">Streak</div>
          </div>
        </div>

        {referralCode && (
          <p className="mt-3 text-xs text-white/50">
            Referral <code className="text-cyan-300">{referralCode}</code>
          </p>
        )}
      </Card>

      {/* Menu */}
      <div className="space-y-2">
        {MENU.map((item) => (
          <Link key={item.to} to={item.to} className="block">
            <Card padded className="flex items-center justify-between active:scale-[0.99] transition">
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <span className="text-white/30">›</span>
            </Card>
          </Link>
        ))}
      </div>

      <Button fullWidth variant="outline" className="border-red-400/30 text-red-300">
        Logout
      </Button>

      <div className="text-center text-xs text-white/40">Join Cryptra Community</div>

      {/* Notifications */}
      {token && (
        <section className="space-y-2">
          <h2 className="text-xs text-white/45 uppercase tracking-wide">Notifications</h2>
          {notifs.length === 0 && (
            <Card padded>
              <p className="text-sm text-white/50">No notifications yet.</p>
            </Card>
          )}
          {notifs.map((n) => (
            <Card key={n.id} padded className="space-y-1">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-sm">{n.title}</span>
                <Badge variant={n.status === 'READ' ? 'neutral' : 'success'}>{n.status}</Badge>
              </div>
              <p className="text-xs text-white/55">{n.body}</p>
              {n.status !== 'READ' && (
                <Button size="sm" variant="ghost" onClick={() => void markRead(n.id)}>
                  Mark read
                </Button>
              )}
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}

export default Profile;
