'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const base =
  'w-full bg-surface text-ink placeholder:text-ink-4 border border-line rounded-[12px] px-3.5 text-sm transition-[border-color,box-shadow] duration-200 ' +
  'hover:border-line-strong focus:border-signal focus:outline-none focus:ring-4 focus:ring-signal/15 disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode }>(
  function Input({ className, leading, trailing, ...props }, ref) {
    if (!leading && !trailing) return <input ref={ref} className={cn(base, 'h-10', className)} {...props} />;
    return (
      <div className="relative">
        {leading && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">{leading}</span>}
        <input ref={ref} className={cn(base, 'h-10', leading && 'pl-10', trailing && 'pr-10', className)} {...props} />
        {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3">{trailing}</span>}
      </div>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(base, 'min-h-24 py-2.5 resize-y', className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(base, 'h-10 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
});

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-2">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-bad">{error}</p> : hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}
