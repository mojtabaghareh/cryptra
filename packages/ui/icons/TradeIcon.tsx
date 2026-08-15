import React from 'react';
import { TrendingUp } from 'lucide-react';

export interface TradeIconProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'neon' | 'outline';
}

export const TradeIcon: React.FC<TradeIconProps> = ({
  size = 24,
  className,
  variant = 'default',
}) => {
  const variants = {
    default: 'text-cryptra-foreground',
    neon: 'text-cryptra-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]',
    outline: 'text-cryptra-muted-foreground',
  };

  return <TrendingUp size={size} className={variants[variant] + (className ? ' ' + className : '')} />;
};

