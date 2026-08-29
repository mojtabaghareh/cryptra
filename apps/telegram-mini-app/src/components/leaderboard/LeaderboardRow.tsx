export function LeaderboardRow({
  rank,
  name,
  value,
  highlight,
}: {
  rank: number;
  name: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2 px-2 rounded-xl ${
        highlight ? 'bg-violet-500/15' : ''
      }`}
    >
      <span className="w-6 text-center text-white/50 text-sm">{rank}</span>
      <span className="flex-1 font-medium truncate">{name}</span>
      <span className="text-sm text-white/70">{value}</span>
    </div>
  );
}

export default LeaderboardRow;
