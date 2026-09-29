'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * The guide's presence: a soft orb that breathes while speaking and a bar
 * field that follows the microphone level while listening.
 */
export function VoiceVisualizer({ speaking, listening, level, size = 120, className }: { speaking: boolean; listening: boolean; level: number; size?: number; className?: string }) {
  const bars = 24;
  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size * 2.4, height: size * 1.4 }}>
      {/* halo */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: size * 1.6, height: size * 1.6, background: 'radial-gradient(circle, var(--signal-glow) 0%, transparent 65%)' }}
        animate={{ scale: speaking ? [1, 1.15, 1] : listening ? 1 + level * 0.6 : 1, opacity: speaking || listening ? 1 : 0.5 }}
        transition={speaking ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } : { type: 'spring', stiffness: 200, damping: 20 }}
      />
      {/* orb */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: 'radial-gradient(circle at 32% 28%, oklch(99% 0.01 60) 0%, var(--signal) 38%, var(--signal-strong) 75%, oklch(from var(--signal-strong) calc(l - 0.2) c h) 100%)',
          boxShadow: '0 20px 60px -20px var(--signal-glow), inset 0 -10px 30px oklch(0% 0 0 / 0.25)',
        }}
        animate={{ scale: speaking ? [1, 1.06, 0.98, 1.04, 1] : listening ? 1 + level * 0.25 : 1 }}
        transition={speaking ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { type: 'spring', stiffness: 260, damping: 18 }}
      />
      {/* bars */}
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex h-8 items-end justify-center gap-[3px]">
        {Array.from({ length: bars }).map((_, i) => {
          const center = Math.abs(i - (bars - 1) / 2) / ((bars - 1) / 2);
          const base = 3 + (1 - center) * 6;
          const live = listening ? level * 26 * (1 - center * 0.7) * (0.7 + Math.sin(i * 1.7) * 0.3 + 0.3) : speaking ? 8 * (1 - center) : 0;
          return (
            <motion.span
              key={i}
              className="w-[3px] rounded-full bg-signal"
              animate={{ height: base + live, opacity: listening || speaking ? 0.9 : 0.25 }}
              transition={speaking ? { repeat: Infinity, repeatType: 'mirror', duration: 0.35 + (i % 5) * 0.08 } : { duration: 0.08 }}
            />
          );
        })}
      </div>
    </div>
  );
}
