'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLAN_CATALOG, monthlyPrice } from '@haulage/core';
import { cn, money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/card';
import { NumberTicker } from '@/components/motion/number-ticker';
import { Reveal, Stagger, Item } from '@/components/motion/reveal';

export function PricingSection({ compact }: { compact?: boolean }) {
  const [trucks, setTrucks] = useState(3);
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      {!compact && (
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center">Pricing</Eyebrow>
          <h2 className="display text-balance text-[40px] sm:text-[56px]">One number you already think in.</h2>
          <p className="mt-4 text-[16px] text-ink-3 text-pretty">Per truck, per month. No seats, no per-document fees, no sales call. Start free with one truck.</p>
        </Reveal>
      )}

      <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-[20px] border border-line bg-surface p-4">
        <div className="flex w-full items-center justify-between">
          <span className="text-[13px] font-medium text-ink-2">How many trucks?</span>
          <span className="tabular font-mono text-[13px] text-ink">{trucks}</span>
        </div>
        <input type="range" min={1} max={50} value={trucks} onChange={(e) => setTrucks(+e.target.value)} className="w-full accent-[var(--signal)]" aria-label="Trucks" />
        <div className="flex w-full justify-between font-mono text-[10px] text-ink-4"><span>1</span><span>10</span><span>25</span><span>50</span></div>
      </div>

      <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
        {PLAN_CATALOG.map((p, i) => {
          const price = monthlyPrice(p.id, trucks);
          const featured = p.id === 'fleet';
          const unavailable = p.limits.trucks != null && trucks > p.limits.trucks;
          return (
            <Item key={p.id}>
              <div className={cn('relative flex h-full flex-col rounded-[24px] border p-6', featured ? 'border-transparent bg-surface-inverse text-ink-inverse shadow-[var(--shadow-float)]' : 'surface')}>
                {featured && <Badge tone="signal" className="absolute right-5 top-5">Most carriers</Badge>}
                <div className={cn('font-mono text-[10.5px] uppercase tracking-[0.14em]', featured ? 'opacity-60' : 'text-ink-3')}>{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="tabular text-[44px] font-semibold leading-none tracking-[-0.04em]">
                    {price === 0 ? 'Free' : <><span className="text-2xl opacity-60">$</span><NumberTicker value={price} /></>}
                  </span>
                  {price > 0 && <span className={cn('text-sm', featured ? 'opacity-60' : 'text-ink-3')}>/ mo</span>}
                </div>
                <div className={cn('mt-1 text-[12.5px]', featured ? 'opacity-60' : 'text-ink-3')}>
                  {p.price_per_truck_month === 0 ? 'for one truck, forever' : `$${p.price_per_truck_month} per truck · ${trucks} trucks`}
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.included.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px]">
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', featured ? 'text-signal' : 'text-good')} />
                      <span className={featured ? 'opacity-90' : 'text-ink-2'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className={cn('mt-6 rounded-[12px] px-3 py-2 font-mono text-[11px]', featured ? 'bg-white/10' : 'bg-surface-2 text-ink-3')}>
                  Autopilot: {p.autopilot_scope === 'suggest' ? 'suggests, you approve' : p.autopilot_scope === 'act' ? 'acts within your limits' : 'full autonomy within policy'}
                </div>
                <Link href="/start" className="mt-4">
                  <Button className="w-full" size="lg" variant={featured ? 'primary' : i === 0 ? 'secondary' : 'inverse'} disabled={unavailable}>
                    {unavailable ? `Solo is for 1 truck` : p.id === 'solo' ? 'Start free' : `Start ${p.name}`}
                  </Button>
                </Link>
              </div>
            </Item>
          );
        })}
      </Stagger>
      <p className="mt-6 text-center text-[12.5px] text-ink-4">Quick-pay routing is paid by the factoring partner, never marked up to you. Prices in USD.</p>
    </section>
  );
}
