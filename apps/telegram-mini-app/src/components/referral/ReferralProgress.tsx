export function ReferralProgress({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>
          {current} / {target}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-violet-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default ReferralProgress;
