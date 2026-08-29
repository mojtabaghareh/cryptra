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
        'rounded-2xl border border-blue-500/20 bg-[#12122a]/95 shadow-[0_0_24px_rgba(0,0,0,0.35)]',
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
    primary:
      'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:brightness-110',
    secondary: 'bg-white/8 text-white border border-white/10 hover:bg-white/12',
    outline: 'border border-blue-400/30 text-cyan-100 hover:bg-blue-500/10',
    ghost: 'text-white/70 hover:bg-white/5',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3.5 text-base',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-40',
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
    neutral: 'bg-blue-500/15 text-blue-200',
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
      className={clsx('animate-pulse rounded-md bg-blue-500/10', className)}
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
  return (
    <div className={clsx('text-3xl font-bold tracking-tight text-white', className)}>
      {formatted}
    </div>
  );
}

export function AssetIcon({
  name,
  size = 24,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const map: Record<string, string> = {
    wallet: '💼',
    swap: '🔄',
    send: '📤',
    receive: '📥',
    buy: '➕',
    sell: '➖',
    chart: '📈',
  };
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {map[name] ?? '•'}
    </span>
  );
}

export function Sparkline({
  points = [20, 28, 24, 40, 36, 52, 48, 60],
  positive = true,
}: {
  points?: number[];
  positive?: boolean;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = Math.max(max - min, 1);
  const w = 120;
  const h = 36;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={positive ? '#22c55e' : '#ef4444'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
