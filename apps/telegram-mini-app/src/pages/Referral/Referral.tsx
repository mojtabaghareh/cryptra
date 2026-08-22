import { useEffect, useState } from 'react';
import { Card, Button, Badge, Skeleton } from '../../lib/ui';
import { useSessionStore } from '../../store/sessionStore';
import { useTelegram } from '../../telegram/telegram';
import { apiGet, apiPost } from '../../lib/api';

interface ReferralStats {
  total?: number;
  active?: number;
  pending?: number;
  [key: string]: unknown;
}

export function Referral() {
  const sessionUser = useSessionStore((s) => s.user);
  const token = useSessionStore((s) => s.token);
  const { user: tgUser } = useTelegram();

  const [code, setCode] = useState(
    sessionUser?.referralCode ||
      (tgUser ? `CRY${String(tgUser.id).slice(-6)}` : 'LOGIN'),
  );
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [list, setList] = useState<unknown[]>([]);
  const [applyCode, setApplyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const link = `https://t.me/Cryptrabot?start=${code}`;

  useEffect(() => {
    if (sessionUser?.referralCode) setCode(sessionUser.referralCode);
  }, [sessionUser?.referralCode]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [me, lst] = await Promise.all([
          apiGet<{ success: boolean; data: { code: string; stats: ReferralStats } }>(
            '/api/v1/referral/me',
            token,
          ),
          apiGet<{ success: boolean; data: unknown[] }>('/api/v1/referral/list', token),
        ]);
        if (cancelled) return;
        if (me.data?.code) setCode(me.data.code);
        setStats(me.data?.stats ?? null);
        setList(Array.isArray(lst.data) ? lst.data : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleApply() {
    if (!token || !applyCode.trim()) return;
    setError(null);
    setMessage(null);
    try {
      await apiPost('/api/v1/referral/apply', { code: applyCode.trim() }, token);
      setMessage('Referral code applied');
      setApplyCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed');
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Referral</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Invite friends. When they trade, you earn XP.
      </p>

      <Card padded>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Your code</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, margin: '8px 0' }}>{code}</div>
        <div style={{ fontSize: 12, wordBreak: 'break-all', color: 'rgba(255,255,255,0.6)' }}>
          {link}
        </div>
        <div style={{ marginTop: 12 }}>
          <Button
            fullWidth
            onClick={() => {
              void navigator.clipboard?.writeText(link);
              setMessage('Link copied');
            }}
          >
            Copy link
          </Button>
        </div>
      </Card>

      {loading && <Skeleton height={40} />}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Badge variant="neutral">Total {stats?.total ?? '—'}</Badge>
        <Badge variant="success">Active {stats?.active ?? '—'}</Badge>
        <Badge variant="neutral">Pending {stats?.pending ?? '—'}</Badge>
        <Badge variant={token ? 'success' : 'neutral'}>{token ? 'Synced' : 'Local'}</Badge>
      </div>

      {token && (
        <Card padded>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Have a code?</div>
          <input
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value)}
            placeholder="Enter referral code"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              marginBottom: 8,
            }}
          />
          <Button fullWidth variant="secondary" onClick={() => void handleApply()}>
            Apply code
          </Button>
        </Card>
      )}

      {list.length > 0 && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          {list.length} referral record(s) on file
        </p>
      )}

      {message && <p style={{ marginTop: 12, fontSize: 13, color: '#00c853' }}>{message}</p>}
      {error && <p style={{ marginTop: 12, fontSize: 13, color: '#ff5252' }}>{error}</p>}
    </div>
  );
}

export default Referral;
