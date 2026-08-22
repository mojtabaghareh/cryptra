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

function statusColor(s: string): string {
  if (s === 'up' || s === 'healthy') return '#00c853';
  if (s === 'degraded') return '#ffab00';
  return '#ff5252';
}

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
      const res = await fetch(`${BASE}/health`, {
        headers: { Accept: 'application/json' },
      });
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
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>System status</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Live checks · auto-refresh 15s · helps spot outages fast
      </p>

      <div style={{ marginBottom: 12 }}>
        <Button size="sm" variant="secondary" disabled={loading} onClick={() => void load()}>
          {loading ? 'Refreshing…' : 'Refresh now'}
        </Button>
      </div>

      {error && (
        <Card padded>
          <p style={{ color: '#ff5252', fontSize: 14 }}>{error}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
            Is the API running? Try <code>pnpm smoke</code> on the server.
          </p>
        </Card>
      )}

      {report && (
        <>
          <Card padded>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: statusColor(report.status),
                  display: 'inline-block',
                }}
              />
              <strong style={{ fontSize: 18, textTransform: 'uppercase' }}>{report.status}</strong>
              {httpCode != null && (
                <Badge variant={httpCode === 503 ? 'error' : 'neutral'}>HTTP {httpCode}</Badge>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              uptime {Math.round(report.uptime)}s · {report.timestamp}
            </div>
          </Card>

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {report.checks.map((c) => (
              <Card key={c.name} padded>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.message && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                        {c.message}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge variant={badgeVariant(c.status)}>{c.status}</Badge>
                    {c.latencyMs != null && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                        {c.latencyMs}ms
                      </div>
                    )}
                  </div>
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
