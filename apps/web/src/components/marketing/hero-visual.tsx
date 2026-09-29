'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, FileCheck2, Landmark, MessageSquareText, ShieldAlert, Zap } from 'lucide-react';
import { RouteRibbon } from '@/components/app/route-ribbon';
import { AutopilotOrb } from '@/components/ui/orb';
import { Sparkline } from '@/components/ui/sparkline';
import { NumberTicker } from '@/components/motion/number-ticker';
import { cashSeries } from '@/lib/data';

const receipts = [
  { icon: FileCheck2, text: 'Linked rate confirmation PCL-4380 to LD-2040', meta: '98% match · saved 6m' },
  { icon: Landmark, text: 'Sent INV-1045 to Pacific Coast ($1,450)', meta: 'packet complete · under your limit' },
  { icon: MessageSquareText, text: 'Texted Marcus for the POD on LD-2037', meta: '3rd reminder · next in 24h' },
  { icon: Zap, text: 'Routed INV-1043 to quick-pay (60-day terms)', meta: 'lands tomorrow · 2.5% fee' },
  { icon: ShieldAlert, text: 'Medical card expires in 9 days. Clinic request drafted', meta: 'Marcus Reed' },
  { icon: CheckCircle2, text: 'Midwest paid INV-1042 ($2,390). Load closed', meta: 'matched automatically' },
];

/** The hero instrument: a live ledger, a moving load, and cash, composed like a dashboard tile stack. */
export function HeroVisual() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % receipts.length), 2600);
    return () => clearInterval(t);
  }, []);
  const shown = [0, 1, 2].map((k) => receipts[(i + k) % receipts.length]);

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-signal/10 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 24, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} className="relative grid gap-3">
        {/* ledger */}
        <div className="surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <AutopilotOrb mode="act" size={9} />
            <span className="text-[13px] font-semibold">Autopilot ledger</span>
            <span className="ml-auto font-mono text-[10.5px] text-ink-3">live</span>
          </div>
          <div className="relative h-[168px] overflow-hidden">
            <AnimatePresence initial={false}>
              {shown.map((r, k) => {
                const Icon = r.icon;
                return (
                  <motion.div
                    key={r.text}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1 - k * 0.3, y: k * 56 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute inset-x-0 top-0 flex items-start gap-3 rounded-[12px] border border-line bg-surface-2/60 px-3 py-2.5"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-good-soft text-good"><Icon className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium text-ink">{r.text}</span>
                      <span className="block font-mono text-[10px] text-ink-3">{r.meta}</span>
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <div className="surface col-span-3 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold">LD-2041</span>
              <span className="tabular text-[12.5px] font-medium">$2,140</span>
            </div>
            <RouteRibbon origin="Dallas, TX" destination="Atlanta, GA" progress={0.62} />
          </div>
          <div className="surface col-span-2 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Cash</div>
            <div className="tabular mt-1 text-[22px] font-semibold leading-none tracking-tight"><span className="text-sm text-ink-3">$</span><NumberTicker value={21300} /></div>
            <div className="mt-2 h-7"><Sparkline data={cashSeries} /></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
