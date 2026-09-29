import { cn } from '@/lib/utils';

/** Lightweight CSS tooltip. Wrap any element; label shows on hover/focus. */
export function Tooltip({ label, children, side = 'top', className }: { label: string; children: React.ReactNode; side?: 'top' | 'bottom' | 'right'; className?: string }) {
  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-[8px] bg-surface-inverse px-2 py-1 text-[11px] font-medium text-ink-inverse opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          pos,
        )}
      >
        {label}
      </span>
    </span>
  );
}
