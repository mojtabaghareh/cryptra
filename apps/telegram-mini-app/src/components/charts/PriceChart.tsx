import { Card } from '../../lib/ui';

/** Lightweight sparkline-style placeholder (no heavy chart lib). */
export function PriceChart({
  points = [40, 55, 48, 70, 65, 80, 72],
  label = 'Price',
}: {
  points?: number[];
  label?: string;
}) {
  const max = Math.max(...points, 1);
  return (
    <Card padded>
      <div className="text-xs text-white/45 mb-2">{label}</div>
      <div className="flex items-end gap-1 h-24">
        {points.map((p, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-violet-500/70"
            style={{ height: `${(p / max) * 100}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

export default PriceChart;
