import { Card, Button, Badge } from '../../lib/ui';

export function RewardItem({
  title,
  description,
  claimed,
  onClaim,
}: {
  title: string;
  description?: string;
  claimed?: boolean;
  onClaim?: () => void;
}) {
  return (
    <Card padded className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{title}</span>
        <Badge variant={claimed ? 'success' : 'neutral'}>
          {claimed ? 'Claimed' : 'Available'}
        </Badge>
      </div>
      {description && <p className="text-sm text-white/50">{description}</p>}
      {!claimed && onClaim && (
        <Button size="sm" onClick={onClaim}>
          Claim
        </Button>
      )}
    </Card>
  );
}

export default RewardItem;
