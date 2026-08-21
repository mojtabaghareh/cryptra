import { Card, Badge } from '../../lib/ui';

export function Leaderboard() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Leaderboard</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        XP · Trading volume · Referrals
      </p>
      <Card padded>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>#1 — Coming soon</span>
          <Badge variant="neutral">XP</Badge>
        </div>
      </Card>
    </div>
  );
}

export default Leaderboard;
