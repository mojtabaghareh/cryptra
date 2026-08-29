import { Badge } from '../../lib/ui';

export function FeePreview({
  feePercent,
  feeAmount,
  tier,
}: {
  feePercent?: number;
  feeAmount?: string;
  tier?: number;
}) {
  return (
    <div className="text-sm text-white/60 flex flex-wrap gap-2 items-center">
      {tier != null && <Badge variant="neutral">Tier {tier}</Badge>}
      {feePercent != null && <span>Fee {feePercent}%</span>}
      {feeAmount != null && <span>~{feeAmount}</span>}
    </div>
  );
}

export default FeePreview;
