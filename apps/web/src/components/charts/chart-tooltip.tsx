'use client';

import { cn } from '@/lib/utils';

export function ChartTooltip({
  active,
  payload,
  label,
  format = (v: number) => v.toLocaleString(),
  labelFormat = (l: unknown) => String(l),
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; dataKey?: string }[];
  label?: unknown;
  format?: (v: number) => string;
  labelFormat?: (l: unknown) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[12px] border border-line bg-surface px-3 py-2 shadow-[var(--shadow-float)]">
      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{labelFormat(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2 text-[12.5px]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-3">{p.name}</span>
          <span className={cn('ml-auto pl-4 font-medium tabular text-ink')}>{format(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-xs text-ink-3">
          <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
