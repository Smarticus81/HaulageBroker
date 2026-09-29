'use client';

import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = 'md',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const w = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const k = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const t = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors duration-200 disabled:opacity-50',
        w,
        checked ? 'bg-signal' : 'bg-surface-3',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block translate-x-0.5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-[var(--ease-spring)]',
          k,
          checked && t,
        )}
      />
    </button>
  );
}
