import React from 'react';
import { Wallet } from 'lucide-react';

export interface WalletIconProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'neon' | 'outline';
}

export const WalletIcon: React.FC<WalletIconProps> = ({
  size = 24,
  className,
  variant = 'default',
}) => {
  const variants = {
    default: 'text-cryptra-foreground',
    neon: 'text-cryptra-neon-blue drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]',
    outline: 'text-cryptra-muted-foreground',
  };

  return <Wallet size={size} className={variants[variant] + (className ? ' ' + className : '')} />;
};

