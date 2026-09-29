import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, interactive, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={cn('surface', interactive && 'lift cursor-pointer', className)} {...props} />;
}

export function CardHeader({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-3', className)}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-ink-3 text-pretty">{description}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />;
}

export function Eyebrow({ children, className, tone = 'muted' }: { children: ReactNode; className?: string; tone?: 'muted' | 'signal' }) {
  return (
    <div
      className={cn(
        'mb-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em]',
        tone === 'signal' ? 'text-signal' : 'text-ink-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
