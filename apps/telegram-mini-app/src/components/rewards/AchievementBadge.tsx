import { Badge } from '../../lib/ui';

export function AchievementBadge({
  title,
  unlocked,
}: {
  title: string;
  unlocked?: boolean;
}) {
  return (
    <Badge variant={unlocked ? 'success' : 'neutral'}>
      {unlocked ? '✓ ' : ''}{title}
    </Badge>
  );
}

export default AchievementBadge;
