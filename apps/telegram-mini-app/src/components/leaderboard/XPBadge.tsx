import { Badge } from '../../lib/ui';

export function XPBadge({ xp }: { xp: number }) {
  return <Badge variant="neutral">{xp.toLocaleString()} XP</Badge>;
}

export default XPBadge;
