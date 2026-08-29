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
    sessionUser?.referralCode || (tgUser ? `CRY${String(tgUser.id).slice(-6)}` : 'LOGIN'),
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
    <div className="px-4 pb-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Referral</h1>
        <p className="text-xs text-white/45 mt-0.5">Invite friends · earn XP</p>
      </div>

      <Card padded className="border-cyan-500/20 text-center">
        <div className="text-xs text-white/50">Your code</div>
        <div className="text-3xl font-bold tracking-widest my-2 gradient-text">{code}</div>
        <p className="text-[11px] text-white/45 break-all mb-3">{link}</p>
        <Button
          fullWidth
          onClick={() => {
            void navigator.clipboard?.writeText(link);
            setMessage('Link copied');
          }}
        >
          Copy link
        </Button>
      </Card>

      {loading && <Skeleton height={40} />}

      <div className="flex gap-2 flex-wrap">
        <Badge variant="neutral">Total {stats?.total ?? '—'}</Badge>
        <Badge variant="success">Active {stats?.active ?? '—'}</Badge>
        <Badge variant="neutral">Pending {stats?.pending ?? '—'}</Badge>
      </div>

      {token && (
        <Card padded className="space-y-2">
          <div className="text-sm font-semibold">Have a code?</div>
          <input
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value)}
            placeholder="Enter referral code"
            className="w-full rounded-xl bg-black/30 border border-blue-500/20 px-3 py-2.5 text-sm text-white"
          />
          <Button fullWidth variant="secondary" onClick={() => void handleApply()}>
            Apply code
          </Button>
        </Card>
      )}

      {list.length > 0 && (
        <p className="text-xs text-white/40">{list.length} referral record(s)</p>
      )}
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

export default Referral;
