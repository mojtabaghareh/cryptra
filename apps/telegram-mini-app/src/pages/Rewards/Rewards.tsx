import { Card, Badge } from '../../lib/ui';

const ITEMS = [
  { code: 'FIRST_LOGIN', name: 'First Steps', xp: 20 },
  { code: 'FIRST_SWAP', name: 'Swap Starter', xp: 50 },
  { code: 'FIRST_TRADE', name: 'Trader', xp: 75 },
  { code: 'LEVEL_5', name: 'Rising Star', xp: 150 },
];

export function Rewards() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Rewards</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Achievements unlock XP automatically
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {ITEMS.map((a) => (
          <Card key={a.code} padded>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{a.code}</div>
              </div>
              <Badge variant="success">+{a.xp} XP</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Rewards;
