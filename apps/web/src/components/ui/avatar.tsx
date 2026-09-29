import { cn, initials } from '@/lib/utils';

const palettes = ['bg-signal-soft text-signal', 'bg-info-soft text-info', 'bg-good-soft text-good', 'bg-mind-soft text-mind', 'bg-warn-soft text-warn'];

export function Avatar({ name, size = 'md', className, src }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string; src?: string | null }) {
  const s = { xs: 'h-6 w-6 text-[10px]', sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' }[size];
  const p = palettes[(name.charCodeAt(0) + name.length) % palettes.length];
  return (
    <span className={cn('inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold ring-1 ring-line-soft', s, p, className)}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}
