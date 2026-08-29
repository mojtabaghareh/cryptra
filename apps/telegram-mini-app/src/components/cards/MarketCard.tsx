import { Card, Badge } from '../../lib/ui';

export interface MarketCardProps {
  symbol: string;
  price?: number;
  change24h?: number;
  volume?: string;
  onClick?: () => void;
}

export function MarketCard({
  symbol,
  price,
  change24h,
  volume,
  onClick,
}: MarketCardProps) {
  const up = change24h != null && change24h >= 0;
  return (
    <Card padded>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-transparent border-0 p-0 text-inherit"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{symbol}</span>
          {change24h != null && (
            <Badge variant={up ? 'success' : 'error'}>
              {up ? '+' : ''}
              {change24h.toFixed(2)}%
            </Badge>
          )}
        </div>
        {price != null && (
          <div className="mt-1 text-lg font-bold">
            ${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </div>
        )}
        {volume && (
          <div className="mt-1 text-xs text-white/45">Vol {volume}</div>
        )}
      </button>
    </Card>
  );
}

export default MarketCard;
