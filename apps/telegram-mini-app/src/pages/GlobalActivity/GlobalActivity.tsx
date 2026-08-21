import { Card } from '../../lib/ui';

export function GlobalActivity() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Activity</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Swaps, orders and XP events
      </p>
      <Card padded>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>No activity yet. Start trading to fill this feed.</p>
      </Card>
    </div>
  );
}

export default GlobalActivity;
