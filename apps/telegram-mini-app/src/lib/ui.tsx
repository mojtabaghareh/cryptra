import React from 'react';
import clsx from 'clsx';

export function Card({
  children,
  className,
  padded = false,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/5',
        padded && 'p-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-violet-600 text-white hover:bg-violet-500',
    secondary: 'bg-white/10 text-white hover:bg-white/15',
    outline: 'border border-white/20 text-white hover:bg-white/5',
    ghost: 'text-white/70 hover:bg-white/5',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-40',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className,
}: {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}) {
  const variants: Record<string, string> = {
    success: 'bg-emerald-500/15 text-emerald-400',
    error: 'bg-red-500/15 text-red-400',
    neutral: 'bg-white/10 text-white/60',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({
  width,
  height,
  className,
}: {
  variant?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <div
      className={clsx('animate-pulse rounded-md bg-white/10', className)}
      style={{ width, height }}
    />
  );
}

export function PriceDisplay({
  value,
  currency = 'USD',
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
  return <div className={clsx('text-3xl font-bold tracking-tight', className)}>{formatted}</div>;
}

export function AssetIcon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const map: Record<string, string> = {
    wallet: '👛',
    swap: '🔄',
    send: '📤',
    receive: '📥',
    buy: '💳',
    chart: '📊',
  };
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {map[name] ?? '•'}
    </span>
  );
}
