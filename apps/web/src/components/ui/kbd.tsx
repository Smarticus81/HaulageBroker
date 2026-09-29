import { cn } from '@/lib/utils';

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-line bg-surface px-1.5 font-mono text-[10.5px] font-medium text-ink-3 shadow-[0_1px_0_var(--line)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
