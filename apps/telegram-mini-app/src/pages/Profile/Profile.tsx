import { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../../lib/ui';
import { useTelegram } from '../../telegram/telegram';
import { Link } from '@tanstack/react-router';

export function Profile() {
  const { user } = useTelegram();
  const [xp] = useState(0);
  const [level] = useState(1);

  const name =
    user
      ? [user.first_name, user.last_name].filter(Boolean).join(' ')
      : 'Guest';

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Profile</h1>

      <Card padded>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          {user?.username ? `@${user.username}` : user ? `ID ${user.id}` : 'Open inside Telegram'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Badge variant="success">Level {level}</Badge>
          <Badge variant="neutral">{xp} XP</Badge>
        </div>
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

      <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        XP/Level sync via GET /api/v1/xp/me when authenticated
      </p>
    </div>
  );
}

export default Profile;
