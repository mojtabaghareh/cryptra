import { Card, Badge } from '../../lib/ui';

export function QuotePreview({
  protocol,
  toAmount,
  feePercent,
}: {
  protocol?: string;
  toAmount?: string;
  feePercent?: number;
}) {
  if (!protocol && !toAmount) return null;
  return (
    <Card padded className="text-sm space-y-1">
      {protocol && <Badge variant="success">{protocol}</Badge>}
      {toAmount && (
        <div>
          Out: <b>{toAmount}</b>
        </div>
      )}
      {feePercent != null && <div>Fee: {feePercent}%</div>}
    </Card>
  );
}

export default QuotePreview;
