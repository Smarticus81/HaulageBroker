import { cn } from '@/lib/utils';

/**
 * Haulage mark: a route line that resolves into a signal point.
 * Reads as an "H" at small sizes, as a road at large ones.
 */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <rect x="1" y="1" width="30" height="30" rx="9" className="fill-ink" />
      <path
        d="M9 23V9M23 23V9"
        stroke="var(--ink-inverse)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M9 16H20" stroke="var(--ink-inverse)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 4.2" />
      <circle cx="23" cy="16" r="3.4" className="fill-signal" />
    </svg>
  );
}

export function Wordmark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: { mark: 22, text: 'text-[15px]' }, md: { mark: 28, text: 'text-lg' }, lg: { mark: 36, text: 'text-2xl' } }[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-semibold tracking-tight', s.text, className)}>
      <LogoMark size={s.mark} />
      <span>
        haulage<span className="text-signal">.</span>
      </span>
    </span>
  );
}
