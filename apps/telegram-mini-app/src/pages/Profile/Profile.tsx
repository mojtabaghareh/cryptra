import { Card, Badge, Button } from '../../lib/ui';
import { useTelegram } from '../../telegram/telegram';
import { useSessionStore } from '../../store/sessionStore';
import { Link } from '@tanstack/react-router';

export function Profile() {
  const { user: tgUser } = useTelegram();
  const sessionUser = useSessionStore((s) => s.user);
  const token = useSessionStore((s) => s.token);
  const isLoading = useSessionStore((s) => s.isLoading);
  const error = useSessionStore((s) => s.error);

  const name =
    sessionUser?.firstName ||
    (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Guest');

  const username = sessionUser?.username || tgUser?.username;
  const xp = sessionUser?.xp ?? 0;
  const level = sessionUser?.level ?? 1;
  const feeTier = sessionUser?.feeTier ?? 0;
  const referralCode = sessionUser?.referralCode;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Profile</h1>

      {isLoading && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Authenticating…</p>
      )}
      {error && (
        <p style={{ color: '#ff5252', fontSize: 13, marginBottom: 8 }}>{error}</p>
      )}

      <Card padded>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          {username ? `@${username}` : tgUser ? `ID ${tgUser.id}` : 'Open inside Telegram'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Badge variant="success">Level {level}</Badge>
          <Badge variant="neutral">{xp} XP</Badge>
          <Badge variant="neutral">Fee tier {feeTier}</Badge>
          {token ? (
            <Badge variant="success">Authenticated</Badge>
          ) : (
            <Badge variant="neutral">Guest</Badge>
          )}
        </div>
        {referralCode && (
          <div style={{ marginTop: 12, fontSize: 13 }}>
            Referral: <code>{referralCode}</code>
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
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
      </div>
    </div>
  );
}

export default Profile;
