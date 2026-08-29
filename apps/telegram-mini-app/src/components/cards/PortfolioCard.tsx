import { Card, PriceDisplay, Badge } from '../../lib/ui';

export interface PortfolioCardProps {
  totalValueUsd: number;
  change24hPercent?: number;
  label?: string;
}

export function PortfolioCard({
  totalValueUsd,
  change24hPercent,
  label = 'Total balance',
}: PortfolioCardProps) {
  const up = change24hPercent != null && change24hPercent >= 0;
  return (
    <Card padded className="bg-gradient-to-br from-violet-600/20 to-cyan-500/10">
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <PriceDisplay value={totalValueUsd} />
      {change24hPercent != null && (
        <div className="mt-2">
          <Badge variant={up ? 'success' : 'error'}>
            {up ? '+' : ''}
            {change24hPercent.toFixed(2)}% 24h
          </Badge>
        </div>
      )}
    </Card>
  );
}

export default PortfolioCard;
