import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

export interface SwapIconProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'neon' | 'outline';
}

export const SwapIcon: React.FC<SwapIconProps> = ({
  size = 24,
  className,
  variant = 'default',
}) => {
  const variants = {
    default: 'text-cryptra-foreground',
    neon: 'text-cryptra-neon-pink drop-shadow-[0_0_8px_rgba(255,0,255,0.5)]',
    outline: 'text-cryptra-muted-foreground',
  };

  return <ArrowLeftRight size={size} className={variants[variant] + (className ? ' ' + className : '')} />;
};

