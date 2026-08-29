import { Card } from '../../lib/ui';

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card padded className="flex-1 min-w-[120px]">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-white/40">{hint}</div>}
    </Card>
  );
}

export default StatCard;
