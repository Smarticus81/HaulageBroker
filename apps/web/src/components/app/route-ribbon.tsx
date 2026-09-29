'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/** A load as a route: origin, a moving marker, destination. Progress 0..1. */
export function RouteRibbon({ origin, destination, progress, className, compact }: { origin: string; destination: string; progress: number; className?: string; compact?: boolean }) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-6">
        <div className="absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
        <div className="absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 overflow-hidden">
          <div className="h-full bg-signal" style={{ width: `${p * 100}%` }} />
        </div>
        <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-signal bg-surface" />
        <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-line-strong bg-surface" />
        <motion.span
          className="absolute top-1/2 -translate-y-1/2"
          initial={false}
          animate={{ left: `calc(${p * 100}% - 8px)` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <span className="relative block h-4 w-4">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-signal/40" />
            <span className="absolute inset-[3px] rounded-full bg-signal shadow-[0_0_10px_var(--signal-glow)]" />
          </span>
        </motion.span>
      </div>
      {!compact && (
        <div className="mt-0.5 flex justify-between font-mono text-[10.5px] text-ink-3">
          <span>{origin}</span>
          <span>{destination}</span>
        </div>
      )}
    </div>
  );
}
