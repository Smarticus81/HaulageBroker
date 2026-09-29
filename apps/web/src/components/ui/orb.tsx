'use client';

import { cn } from '@/lib/utils';

/**
 * The Autopilot orb: the one piece of chrome that tells you the system is alive.
 * mode → color; active → breathing rings.
 */
export function AutopilotOrb({
  mode = 'act',
  active = true,
  size = 12,
  className,
}: {
  mode?: 'suggest' | 'act' | 'full' | 'off';
  active?: boolean;
  size?: number;
  className?: string;
}) {
  const color = { suggest: 'var(--info)', act: 'var(--signal)', full: 'var(--mind)', off: 'var(--ink-4)' }[mode];
  return (
    <span className={cn('relative inline-grid place-items-center', className)} style={{ width: size * 2.2, height: size * 2.2 }}>
      {active && mode !== 'off' && (
        <>
          <span className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: color, opacity: 0.35 }} />
          <span className="absolute inset-0 rounded-full animate-pulse-ring [animation-delay:0.8s]" style={{ background: color, opacity: 0.25 }} />
        </>
      )}
      <span
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 30%, white 0%, ${color} 45%, color-mix(in oklch, ${color} 70%, black) 100%)`,
          boxShadow: `0 0 ${size}px ${color}`,
        }}
      />
    </span>
  );
}
