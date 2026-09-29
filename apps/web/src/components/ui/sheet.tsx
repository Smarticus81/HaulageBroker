'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  side = 'right',
  width = 'max-w-xl',
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  side?: 'right' | 'bottom';
  width?: string;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/55"
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={side === 'right' ? { x: '100%' } : { y: '100%' }}
            animate={side === 'right' ? { x: 0 } : { y: 0 }}
            exit={side === 'right' ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            className={cn(
              'absolute flex flex-col bg-bg shadow-[var(--shadow-float)]',
              side === 'right'
                ? cn('inset-y-0 right-0 w-full border-l border-line', width)
                : 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px] border-t border-line',
            )}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
              <div>
                {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
                {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
            {footer && <div className="border-t border-line bg-surface px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
