import { Badge } from '../../lib/ui';

export function RankBadge({ rank }: { rank: number }) {
  const variant = rank <= 3 ? 'success' : 'neutral';
  return <Badge variant={variant}>#{rank}</Badge>;
}

export default RankBadge;
