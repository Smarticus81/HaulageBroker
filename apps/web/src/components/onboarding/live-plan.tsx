'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { computePlan, suggestPlan, planById, monthlyPrice } from '@haulage/core';
import type { OnboardingProfile } from '@haulage/types';
import { cn, money, int } from '@/lib/utils';
import { Eyebrow } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/ring';
import { Sparkline } from '@/components/ui/sparkline';
import { NumberTicker } from '@/components/motion/number-ticker';
import { Badge } from '@/components/ui/badge';
import type { Answers } from '@/lib/onboarding-steps';

const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };

export function LivePlan({ answers, reveal, className }: { answers: Answers; reveal: { company: boolean; fleet: boolean; economics: boolean; money: boolean; autopilot: boolean }; className?: string }) {
  const plan = useMemo(() => computePlan(answers as Partial<OnboardingProfile>), [answers]);
  const r = plan.results;
  const tier = suggestPlan(answers.trucks ?? 1, answers.mode === 'full');
  const cash = plan.projection.map((p) => p.cash);

  return (
    <div className={cn('flex h-full flex-col gap-3', className)}>
      <div className="flex items-center justify-between px-1">
        <Eyebrow className="mb-0">Your plan, building live</Eyebrow>
        <span className="font-mono text-[10.5px] text-ink-4">recomputes on every answer</span>
      </div>

      <AnimatePresence mode="popLayout">
        {reveal.company && (
          <motion.div key="company" layout {...fadeUp} className="surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold text-ink">{answers.company_name || 'Your company'}</div>
                <div className="mt-0.5 font-mono text-[11px] text-ink-3">
                  {answers.dot_number ? `DOT ${answers.dot_number} · authority active` : 'DOT pending'} · {answers.stage === 'starting' ? 'starting up' : 'operating'}
                </div>
              </div>
              {answers.dot_number && <Badge tone="good" dot>FMCSA matched</Badge>}
            </div>
          </motion.div>
        )}

        {reveal.fleet && (
          <motion.div key="fleet" layout {...fadeUp} className="surface grid grid-cols-3 divide-x divide-line p-0">
            {[
              ['Trucks', answers.trucks ?? 1],
              ['Drivers', answers.drivers ?? answers.trucks ?? 1],
              ['Trailers', answers.trailers ?? answers.trucks ?? 1],
            ].map(([l, v]) => (
              <div key={String(l)} className="px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{l}</div>
                <div className="tabular text-2xl font-semibold tracking-tight"><NumberTicker value={Number(v)} /></div>
              </div>
            ))}
          </motion.div>
        )}

        {reveal.economics && (
          <motion.div key="econ" layout {...fadeUp} className="surface p-4">
            <div className="flex items-start justify-between">
              <div>
                <Eyebrow>Monthly, at today’s numbers</Eyebrow>
                <div className="tabular text-[32px] font-semibold leading-none tracking-[-0.03em]">
                  <span className="text-lg text-ink-3">$</span>
                  <NumberTicker value={r.revenue} />
                </div>
                <div className="mt-1 text-xs text-ink-3">revenue on {int(r.total_miles)} miles</div>
              </div>
              <ProgressRing value={plan.health} size={64} stroke={6} tone={plan.health >= 70 ? 'good' : plan.health >= 40 ? 'warn' : 'bad'}>
                <span className="tabular text-sm font-semibold">{plan.health}</span>
              </ProgressRing>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-[12.5px]">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Margin</dt>
                <dd className={cn('mt-0.5 font-semibold tabular', r.margin_pct < 8 ? 'text-warn' : 'text-good')}>{r.margin_pct.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Cost / mile</dt>
                <dd className="mt-0.5 font-semibold tabular">${r.cost_per_mile.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Break-even</dt>
                <dd className="mt-0.5 font-semibold tabular">{r.break_even_miles ? `${int(r.break_even_miles)} mi` : '—'}</dd>
              </div>
            </dl>
          </motion.div>
        )}

        {reveal.money && (
          <motion.div key="money" layout {...fadeUp} className="surface p-4">
            <div className="flex items-center justify-between">
              <Eyebrow className="mb-0">Cash, next 12 months</Eyebrow>
              <span className={cn('font-mono text-[11px] tabular', cash[11] > (answers.starting_cash ?? 0) ? 'text-good' : 'text-bad')}>
                ends at {money(cash[11])}
              </span>
            </div>
            <div className="mt-2 h-14">
              <Sparkline data={cash} tone={cash.some((c) => c < 0) ? 'bad' : 'good'} />
            </div>
            <p className="mt-2 text-xs text-ink-3 text-pretty">
              {answers.factoring_enabled
                ? `Factoring costs ${money(r.factoring_fee)} a month and closes the gap to ${Math.round(r.cash_gap_days)} days.`
                : `You float ${Math.round(r.cash_gap_days)} days of receivables, about ${money(r.working_capital_need)}.`}
            </p>
          </motion.div>
        )}

        {reveal.autopilot && (
          <motion.div key="auto" layout {...fadeUp} className="rounded-[20px] bg-surface-inverse p-4 text-ink-inverse">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">Suggested plan</div>
                <div className="mt-1 text-lg font-semibold">{planById(tier).name}</div>
              </div>
              <div className="text-right">
                <div className="tabular text-2xl font-semibold">{monthlyPrice(tier, answers.trucks ?? 1) === 0 ? 'Free' : money(monthlyPrice(tier, answers.trucks ?? 1))}</div>
                <div className="font-mono text-[10px] opacity-60">{monthlyPrice(tier, answers.trucks ?? 1) === 0 ? 'forever, for one truck' : `per month · ${answers.trucks} trucks`}</div>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-[12.5px] opacity-80">
              {plan.recommendations.slice(0, 2).map((rec) => (
                <li key={rec.id}>• {rec.title}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {!reveal.company && (
        <div className="flex flex-1 items-center justify-center rounded-[20px] border border-dashed border-line p-6 text-center text-sm text-ink-4">
          Your business plan appears here as you answer.
        </div>
      )}
    </div>
  );
}
