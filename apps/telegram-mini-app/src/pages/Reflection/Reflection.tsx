import { useEffect, useState } from 'react';
import { Card, Badge, Button, Skeleton } from '../../lib/ui';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet } from '../../lib/api';

interface PatternHit {
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface ReflectionReport {
  userId: string;
  periodDays: number;
  swapCount: number;
  orderCount: number;
  patterns: PatternHit[];
  summary: string;
  generatedAt: string;
}

export function Reflection() {
  const token = useSessionStore((s) => s.token);
  const [report, setReport] = useState<ReflectionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  async function load(period = days) {
    if (!token) {
      setError('Open from Telegram to load your reflection.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ success: boolean; data: ReflectionReport }>(
        `/api/v1/reflection/weekly?days=${period}`,
        token,
      );
      if (res.success) setReport(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(7);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const severityVariant = (s: string) =>
    s === 'high' ? 'error' : s === 'medium' ? 'neutral' : 'success';

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Reflection</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Understand how you decide — weekly behavioral patterns
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[7, 14, 30].map((d) => (
          <Button
            key={d}
            size="sm"
            variant={days === d ? 'primary' : 'secondary'}
            onClick={() => {
              setDays(d);
              void load(d);
            }}
          >
            {d}d
          </Button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton height={80} />
          <Skeleton height={56} />
        </div>
      )}

      {error && (
        <Card padded>
          <p style={{ color: '#ff5252', fontSize: 13 }}>{error}</p>
          <div style={{ marginTop: 8 }}>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {!loading && report && (
        <>
          <Card padded>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              Last {report.periodDays} days · {report.swapCount} swaps · {report.orderCount} orders
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.5 }}>{report.summary}</p>
          </Card>

          <h2 style={{ fontSize: 14, marginTop: 20, marginBottom: 8, color: 'rgba(255,255,255,0.5)' }}>
            Patterns
          </h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {report.patterns.map((p, i) => (
              <Card key={`${p.pattern}-${i}`} padded>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{p.pattern.replace(/_/g, ' ')}</span>
                  <Badge variant={severityVariant(p.severity) as 'error' | 'neutral' | 'success'}>
                    {p.severity}
                  </Badge>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{p.message}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Reflection;
