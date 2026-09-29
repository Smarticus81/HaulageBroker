import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-2 text-ink-2 border-line-soft',
        signal: 'bg-signal-soft text-signal border-transparent',
        good: 'bg-good-soft text-good border-transparent',
        warn: 'bg-warn-soft text-warn border-transparent',
        bad: 'bg-bad-soft text-bad border-transparent',
        info: 'bg-info-soft text-info border-transparent',
        mind: 'bg-mind-soft text-mind border-transparent',
        outline: 'bg-transparent text-ink-2 border-line',
        inverse: 'bg-surface-inverse text-ink-inverse border-transparent',
      },
      size: {
        sm: 'h-5 px-2 text-[10.5px]',
        md: 'h-6 px-2.5 text-[11.5px]',
        lg: 'h-7 px-3 text-xs',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

export type Tone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ className, tone, size, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
