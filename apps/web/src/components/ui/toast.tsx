'use client';

import { create } from 'zustand';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Kind = 'success' | 'info' | 'warn' | 'error';
interface Toast { id: number; kind: Kind; title: string; body?: string }

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let seq = 1;
export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, body?: string) => useToasts.getState().push({ kind: 'success', title, body }),
  info: (title: string, body?: string) => useToasts.getState().push({ kind: 'info', title, body }),
  warn: (title: string, body?: string) => useToasts.getState().push({ kind: 'warn', title, body }),
  error: (title: string, body?: string) => useToasts.getState().push({ kind: 'error', title, body }),
};

const icons = { success: CheckCircle2, info: Info, warn: TriangleAlert, error: XCircle };
const tones = { success: 'text-good', info: 'text-info', warn: 'text-warn', error: 'text-bad' };

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[16px] glass px-4 py-3 shadow-[var(--shadow-float)]"
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tones[t.kind])} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink">{t.title}</div>
                {t.body && <div className="mt-0.5 text-xs text-ink-3">{t.body}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-ink-4 hover:text-ink" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
