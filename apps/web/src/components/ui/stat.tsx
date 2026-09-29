'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberTicker } from '@/components/motion/number-ticker';
import { Sparkline } from './sparkline';

export function StatTile({
  label,
  value,
  format,
  suffix,
  prefix,
  delta,
  deltaLabel,
  deltaGoodWhen = 'up',
  spark,
  tone = 'neutral',
  className,
  size = 'md',
  footer,
}: {
  label: string;
  value: number;
  format?: (v: number) => string;
  suffix?: string;
  prefix?: string;
  delta?: number;
  deltaLabel?: string;
  deltaGoodWhen?: 'up' | 'down';
  spark?: number[];
  tone?: 'neutral' | 'signal' | 'good' | 'warn' | 'bad';
  className?: string;
  size?: 'md' | 'lg';
  footer?: React.ReactNode;
}) {
  const dir = delta == null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const good = dir === 'flat' ? null : dir === deltaGoodWhen;
  const toneText = { neutral: 'text-ink', signal: 'text-signal', good: 'text-good', warn: 'text-warn', bad: 'text-bad' }[tone];

  return (
    <div className={cn('surface relative overflow-hidden p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3">{label}</div>
        {dir && (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[10.5px] tabular',
              good === null ? 'bg-surface-2 text-ink-3' : good ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad',
            )}
          >
            {dir === 'up' ? <ArrowUpRight className="h-3 w-3" /> : dir === 'down' ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(delta!)}%
          </div>
        )}
      </div>
      <div className={cn('mt-3 flex items-baseline gap-1 tabular tracking-[-0.03em]', toneText, size === 'lg' ? 'text-[40px]' : 'text-[30px]', 'font-semibold leading-none')}>
        {prefix && <span className="text-[0.6em] font-medium text-ink-3">{prefix}</span>}
        <NumberTicker value={value} format={format} />
        {suffix && <span className="text-[0.5em] font-medium text-ink-3">{suffix}</span>}
      </div>
      {(deltaLabel || footer) && <div className="mt-2 text-xs text-ink-3">{footer ?? deltaLabel}</div>}
      {spark && spark.length > 1 && (
        <div className="pointer-events-none absolute -bottom-1 right-3 h-10 w-28 opacity-70">
          <Sparkline data={spark} tone={tone === 'neutral' ? 'signal' : tone} />
        </div>
      )}
    </div>
  );
}
