'use client';

import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  count?: number;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[12px] border border-line-soft bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative isolate flex items-center gap-1.5 rounded-[9px] font-medium transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-[9px] bg-surface shadow-[var(--shadow-card)] border border-line-soft"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            {o.label}
            {o.count != null && (
              <span className={cn('tabular font-mono text-[10.5px]', active ? 'text-ink-3' : 'text-ink-4')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
