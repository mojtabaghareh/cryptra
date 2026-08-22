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

export function Profile() {
  const { user: tgUser } = useTelegram();
  const sessionUser = useSessionStore((s) => s.user);
  const token = useSessionStore((s) => s.token);
  const isLoading = useSessionStore((s) => s.isLoading);
  const error = useSessionStore((s) => s.error);

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const name =
    sessionUser?.firstName ||
    (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Guest');

  const username = sessionUser?.username || tgUser?.username;
  const xp = sessionUser?.xp ?? 0;
  const level = sessionUser?.level ?? 1;
  const feeTier = sessionUser?.feeTier ?? 0;
  const referralCode = sessionUser?.referralCode;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadNotifs() {
      setNotifLoading(true);
      try {
        const res = await apiGet<{ success: boolean; data: Notif[] }>(
          '/api/v1/notifications',
          token,
        );
        if (!cancelled && res.success) setNotifs(res.data ?? []);
      } catch {
        if (!cancelled) setNotifs([]);
      } finally {
        if (!cancelled) setNotifLoading(false);
      }
    }

    void loadNotifs();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function markRead(id: string) {
    if (!token) return;
    try {
      await apiPost(`/api/v1/notifications/${id}/read`, {}, token);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n)),
      );
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Profile</h1>

      {isLoading && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Authenticating…</p>
      )}
      {error && <p style={{ color: '#ff5252', fontSize: 13, marginBottom: 8 }}>{error}</p>}

      <Card padded>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          {username ? `@${username}` : tgUser ? `ID ${tgUser.id}` : 'Open inside Telegram'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Badge variant="success">Level {level}</Badge>
          <Badge variant="neutral">{xp} XP</Badge>
          <Badge variant="neutral">Fee tier {feeTier}</Badge>
          {token ? <Badge variant="success">Authenticated</Badge> : <Badge variant="neutral">Guest</Badge>}
        </div>
        {referralCode && (
          <div style={{ marginTop: 12, fontSize: 13 }}>
            Referral: <code>{referralCode}</code>
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <Link to="/reflection">
          <Card padded>
            <div style={{ fontWeight: 600 }}>Reflection</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Weekly decision patterns
            </div>
          </Card>
        </Link>
        <Link to="/referral">
          <Card padded>
            <div style={{ fontWeight: 600 }}>Referral</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Invite friends · earn XP</div>
          </Card>
        </Link>
        <Link to="/rewards">
          <Card padded>
            <div style={{ fontWeight: 600 }}>Rewards & Achievements</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Unlock badges</div>
          </Card>
        </Link>
        <Link to="/leaderboard">
          <Card padded>
            <div style={{ fontWeight: 600 }}>Leaderboard</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>XP · Trading · Referral</div>
          </Card>
        </Link>
        <Link to="/status">
          <Card padded>
            <div style={{ fontWeight: 600 }}>System status</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Postgres · Redis · API health
            </div>
          </Card>
        </Link>
      </div>

      <h2 style={{ fontSize: 14, marginTop: 24, marginBottom: 8, color: 'rgba(255,255,255,0.5)' }}>
        Notifications
      </h2>

      {!token && (
        <Card padded>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Sign in via Telegram to see notifications.
          </p>
        </Card>
      )}

      {notifLoading && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Loading…</p>
      )}

      {token && !notifLoading && notifs.length === 0 && (
        <Card padded>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>No notifications yet.</p>
        </Card>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {notifs.map((n) => (
          <Card key={n.id} padded>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
              <Badge variant={n.status === 'READ' ? 'neutral' : 'success'}>{n.status}</Badge>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '6px 0' }}>{n.body}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {new Date(n.createdAt).toLocaleString()}
              </span>
              {n.status !== 'READ' && (
                <Button size="sm" variant="ghost" onClick={() => void markRead(n.id)}>
                  Mark read
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Profile;
