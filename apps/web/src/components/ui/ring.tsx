'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  tone = 'signal',
  className,
  children,
  track = true,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  tone?: 'signal' | 'good' | 'warn' | 'bad' | 'info' | 'mind' | 'ink';
  className?: string;
  children?: React.ReactNode;
  track?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {track && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`var(--${tone})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (v / 100) * c }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}
