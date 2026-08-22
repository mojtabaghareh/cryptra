import { Card, Button, Badge } from '../../lib/ui';
import { useSessionStore } from '../../store/sessionStore';
import { useTelegram } from '../../telegram/telegram';

export function Referral() {
  const sessionUser = useSessionStore((s) => s.user);
  const { user: tgUser } = useTelegram();

  const code =
    sessionUser?.referralCode ||
    (tgUser ? `CRY${String(tgUser.id).slice(-6)}` : 'LOGIN');
  const link = `https://t.me/Cryptrabot?start=${code}`;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Referral</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Invite friends. When they trade, you earn XP.
      </p>
      <Card padded>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Your code</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, margin: '8px 0' }}>{code}</div>
        <div style={{ fontSize: 12, wordBreak: 'break-all', color: 'rgba(255,255,255,0.6)' }}>{link}</div>
        <div style={{ marginTop: 12 }}>
          <Button
            fullWidth
            onClick={() => {
              void navigator.clipboard?.writeText(link);
            }}
          >
            Copy link
          </Button>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Badge variant={sessionUser ? 'success' : 'neutral'}>
          {sessionUser ? 'Synced' : 'Local preview'}
        </Badge>
      </div>
    </div>
  );
}

export default Referral;
