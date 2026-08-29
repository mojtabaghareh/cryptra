import { Card, Badge } from '../../lib/ui';

export interface AssetCardProps {
  symbol: string;
  name?: string;
  balance?: string;
  valueUsd?: number;
  change24h?: number;
  chain?: string;
  onClick?: () => void;
}

export function AssetCard({
  symbol,
  name,
  balance,
  valueUsd,
  change24h,
  chain,
  onClick,
}: AssetCardProps) {
  const up = change24h != null && change24h >= 0;
  return (
    <Card padded className="cursor-pointer active:scale-[0.99] transition" >
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left flex items-center justify-between gap-3 bg-transparent border-0 p-0 text-inherit"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
            {symbol.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{symbol}</div>
            <div className="text-xs text-white/50 truncate">
              {name || chain || 'Asset'}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          {balance != null && <div className="font-medium text-sm">{balance}</div>}
          {valueUsd != null && (
            <div className="text-xs text-white/50">
              ${valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          )}
          {change24h != null && (
            <Badge variant={up ? 'success' : 'error'} size="sm">
              {up ? '+' : ''}
              {change24h.toFixed(2)}%
            </Badge>
          )}
        </div>
      </button>
    </Card>
  );
}

export default AssetCard;
