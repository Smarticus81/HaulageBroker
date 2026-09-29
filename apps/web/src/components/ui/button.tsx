'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    'font-medium tracking-[-0.01em] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out',
    'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-signal text-signal-ink border border-transparent',
          'shadow-[0_1px_0_oklch(100%_0_0/0.25)_inset,0_8px_20px_-10px_var(--signal-glow)]',
          'hover:bg-signal-strong',
        ],
        inverse: 'bg-surface-inverse text-ink-inverse border border-transparent hover:opacity-90',
        secondary: 'bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-2 shadow-[var(--shadow-inset)]',
        soft: 'bg-surface-2 text-ink border border-transparent hover:bg-surface-3',
        ghost: 'bg-transparent text-ink-2 hover:text-ink hover:bg-surface-2 border border-transparent',
        danger: 'bg-bad-soft text-bad border border-transparent hover:bg-bad hover:text-white',
        link: 'bg-transparent text-signal underline-offset-4 hover:underline border-0 h-auto p-0',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-[8px]',
        sm: 'h-8 px-3 text-[13px] rounded-[10px]',
        md: 'h-10 px-4 text-sm rounded-[12px]',
        lg: 'h-12 px-5 text-[15px] rounded-[14px]',
        xl: 'h-14 px-7 text-base rounded-[16px]',
        icon: 'h-9 w-9 rounded-[10px]',
        'icon-sm': 'h-8 w-8 rounded-[9px]',
        'icon-lg': 'h-11 w-11 rounded-[12px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, children, disabled, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
