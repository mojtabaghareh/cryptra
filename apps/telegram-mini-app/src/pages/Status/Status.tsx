import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../lib/ui';

interface HealthCheck {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
}

interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
}

const BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  '';

function badgeVariant(s: string): 'success' | 'error' | 'neutral' {
  if (s === 'up' || s === 'healthy') return 'success';
  if (s === 'down' || s === 'unhealthy') return 'error';
  return 'neutral';
}

export function Status() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [httpCode, setHttpCode] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/health`, { headers: { Accept: 'application/json' } });
      setHttpCode(res.status);
      const data = (await res.json()) as HealthReport;
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reach /health');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 15_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="px-4 pb-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">System status</h1>
        <p className="text-xs text-white/45 mt-0.5">Live checks · auto-refresh 15s</p>
      </div>

      <Button size="sm" variant="secondary" disabled={loading} onClick={() => void load()}>
        {loading ? 'Refreshing…' : 'Refresh now'}
      </Button>

      {error && (
        <Card padded>
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-xs text-white/40 mt-2">API offline in Codespace is normal without server.</p>
        </Card>
      )}

      {report && (
        <>
          <Card padded className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                report.status === 'healthy'
                  ? 'bg-emerald-400'
                  : report.status === 'degraded'
                    ? 'bg-amber-400'
                    : 'bg-red-400'
              }`}
            />
            <strong className="uppercase text-sm">{report.status}</strong>
            {httpCode != null && (
              <Badge variant={httpCode === 503 ? 'error' : 'neutral'}>HTTP {httpCode}</Badge>
            )}
          </Card>

          <div className="space-y-2">
            {report.checks.map((c) => (
              <Card key={c.name} padded className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  {c.message && <div className="text-xs text-white/40 mt-0.5">{c.message}</div>}
                </div>
                <div className="text-right">
                  <Badge variant={badgeVariant(c.status)}>{c.status}</Badge>
                  {c.latencyMs != null && (
                    <div className="text-[10px] text-white/35 mt-1">{c.latencyMs}ms</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Status;
