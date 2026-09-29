'use client';

import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string; count?: number }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex items-center gap-1 border-b border-line', className)} role="tablist">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative -mb-px flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-[13px] font-medium transition-colors',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {t.label}
            {t.count != null && <span className="font-mono text-[10.5px] tabular text-ink-4">{t.count}</span>}
            {active && (
              <motion.span layoutId={`tab-${id}`} className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-signal" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
