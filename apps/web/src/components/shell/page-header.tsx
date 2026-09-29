import { cn } from '@/lib/utils';
import { Eyebrow } from '@/components/ui/card';

/**
 * Every app screen opens with this: a small mono eyebrow, a serif display
 * title, an optional one-line summary, and actions on the right.
 */
export function PageHeader({
  eyebrow,
  title,
  summary,
  actions,
  className,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="display text-[34px] text-ink sm:text-[42px]">{title}</h1>
        {summary && <p className="mt-2 max-w-2xl text-[14px] text-ink-3 text-pretty sm:text-[15px]">{summary}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Section({ title, aside, children, className }: { title?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-3', className)}>
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3 px-0.5">
          {title && <h2 className="text-[13px] font-semibold tracking-tight text-ink-2">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
