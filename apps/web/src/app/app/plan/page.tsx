'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import type { OnboardingProfile } from '@haulage/types';
import { computePlan } from '@haulage/core';
import { cn, int, money, fmtDate } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardBody, CardHeader, Eyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ProgressRing } from '@/components/ui/ring';
import { NumberTicker } from '@/components/motion/number-ticker';
import { Stagger, Item } from '@/components/motion/reveal';
import { ChartTooltip, Legend } from '@/components/charts/chart-tooltip';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/lib/store';

type Lever = 'rate_per_loaded_mile' | 'deadhead_pct' | 'miles_per_truck_per_week' | 'fuel_price' | 'payment_terms_days' | 'trucks';

const LEVERS: { key: Lever; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { key: 'rate_per_loaded_mile', label: 'Rate per loaded mile', min: 1.2, max: 4.5, step: 0.05, fmt: (v) => `$${v.toFixed(2)}` },
  { key: 'deadhead_pct', label: 'Empty miles', min: 0, max: 0.45, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'miles_per_truck_per_week', label: 'Miles per truck per week', min: 800, max: 3600, step: 50, fmt: (v) => `${int(v)} mi` },
  { key: 'fuel_price', label: 'Diesel per gallon', min: 2.5, max: 6.5, step: 0.05, fmt: (v) => `$${v.toFixed(2)}` },
  { key: 'payment_terms_days', label: 'Days to get paid', min: 1, max: 90, step: 1, fmt: (v) => `${v}d` },
  { key: 'trucks', label: 'Trucks', min: 1, max: 25, step: 1, fmt: (v) => `${v}` },
];

export default function PlanPage() {
  const { profile, setProfile, businessPlan } = useSession();
  const baseline = useMemo(() => computePlan(profile, 'recompute'), [profile]);
  const [scenario, setScenario] = useState<Partial<OnboardingProfile>>({});
  const merged = useMemo(() => ({ ...profile, ...scenario, trailers: scenario.trucks ?? profile.trailers, drivers: scenario.trucks ?? profile.drivers }), [profile, scenario]);
  const what = useMemo(() => computePlan(merged, 'preview'), [merged]);
  const dirty = Object.keys(scenario).length > 0;

  const b = baseline.results;
  const w = what.results;

  const costMix = [
    { name: 'Fuel', value: w.fuel, color: 'var(--series-1)' },
    { name: 'Driver pay', value: w.driver_pay, color: 'var(--series-2)' },
    { name: 'Maintenance', value: w.maintenance, color: 'var(--series-3)' },
    { name: 'Fixed', value: w.fixed, color: 'var(--series-4)' },
    ...(w.factoring_fee > 0 ? [{ name: 'Factoring', value: w.factoring_fee, color: 'var(--series-5)' }] : []),
  ];
  const cashSeries = baseline.projection.map((p, i) => ({ m: `M${p.month}`, baseline: p.cash, scenario: what.projection[i].cash }));
  const utilization = w.break_even_miles ? Math.min(100, (w.total_miles / w.break_even_miles) * 100) : 100;

  const narrative = [
    `${profile.company_name || 'Your fleet'} runs ${merged.trucks} truck${merged.trucks === 1 ? '' : 's'} about ${int(w.total_miles)} miles a month, ${Math.round(merged.deadhead_pct * 100)}% of them empty, at $${merged.rate_per_loaded_mile.toFixed(2)} per loaded mile. That is ${money(w.revenue)} of revenue against ${money(w.total_cost)} of cost.`,
    w.margin_pct < 8
      ? `Margin is ${w.margin_pct.toFixed(1)}%, which is thin. Break-even is ${w.break_even_miles ? int(w.break_even_miles) : '—'} miles a month, so you have ${w.break_even_miles ? int(Math.max(0, w.total_miles - w.break_even_miles)) : '—'} miles of cushion.`
      : `Margin is ${w.margin_pct.toFixed(1)}%. You clear break-even (${w.break_even_miles ? int(w.break_even_miles) : '—'} miles) with ${w.break_even_miles ? int(w.total_miles - w.break_even_miles) : '—'} miles to spare.`,
    merged.factoring_enabled
      ? `Factoring costs ${money(w.factoring_fee)} a month and keeps your cash gap at ${Math.round(w.cash_gap_days)} days.`
      : `Customers pay in about ${merged.payment_terms_days} days, so you float ${money(w.working_capital_need)} of receivables. Cash on hand covers ${(w.runway_months * 30).toFixed(0)} days of costs.`,
  ];

  return (
    <>
      <PageHeader
        eyebrow={`Living business plan · v${businessPlan?.version ?? 1} · updated ${fmtDate(baseline.generated_at, 'MMM d, h:mm a')}`}
        title={<>The plan, as of <em className="text-signal">today</em>.</>}
        summary="Written by Autopilot from your onboarding answers and every load that closes. Drag a lever to see what changes, then keep it or reset."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Plan exported', 'A PDF with this version is in your downloads.')}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Recomputed from live data', 'Rate per mile and days-to-cash refreshed from the last 30 days.')}><RefreshCw className="h-4 w-4" /> Recompute</Button>
          </>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
        {/* Health + narrative */}
        <Item className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader eyebrow="Summary" title="In plain English" aside={dirty && <Badge tone="signal" dot>Scenario</Badge>} />
            <CardBody className="grid gap-6 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={what.health} size={124} stroke={9} tone={what.health >= 70 ? 'good' : what.health >= 40 ? 'warn' : 'bad'}>
                  <div className="text-center">
                    <div className="tabular text-[34px] font-semibold tracking-[-0.04em] leading-none"><NumberTicker value={what.health} /></div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">health</div>
                  </div>
                </ProgressRing>
                {dirty && <div className={cn('font-mono text-[11px] tabular', what.health >= baseline.health ? 'text-good' : 'text-bad')}>{what.health >= baseline.health ? '+' : ''}{what.health - baseline.health} vs plan</div>}
              </div>
              <div className="space-y-3 text-[14.5px] leading-relaxed text-ink-2">
                {narrative.map((p, i) => <p key={i} className="text-pretty">{p}</p>)}
              </div>
            </CardBody>
            <CardBody className="pt-0">
              <div className="mt-2 border-t border-line pt-4">
                <Eyebrow tone="signal">What to do about it</Eyebrow>
                <div className="grid gap-2 sm:grid-cols-2">
                  {what.recommendations.map((r, i) => (
                    <div key={r.id} className={cn('rounded-[14px] border p-3', i === 0 ? 'border-signal/40 bg-signal-soft/40' : 'border-line bg-surface-2/50')}>
                      <div className="flex items-start gap-2">
                        <Sparkles className={cn('mt-0.5 h-4 w-4 shrink-0', i === 0 ? 'text-signal' : 'text-ink-4')} />
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold text-ink">{r.title}</div>
                          <p className="mt-0.5 text-[12.5px] text-ink-3 text-pretty">{r.message}</p>
                          {r.impact_per_month != null && <div className="mt-1.5 font-mono text-[11px] tabular text-good">+{money(r.impact_per_month)} / mo</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </Item>

        {/* Key numbers */}
        <Item className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader eyebrow="Unit economics" title="Per month" />
            <CardBody>
              <dl className="divide-y divide-line-soft">
                {[
                  ['Revenue', money(w.revenue), b.revenue],
                  ['Profit', money(w.profit), b.profit],
                  ['Margin', `${w.margin_pct.toFixed(1)}%`, b.margin_pct],
                  ['Revenue / mile', `$${w.revenue_per_mile.toFixed(2)}`, b.revenue_per_mile],
                  ['Cost / mile', `$${w.cost_per_mile.toFixed(2)}`, b.cost_per_mile],
                  ['Break-even', w.break_even_miles ? `${int(w.break_even_miles)} mi` : '—', b.break_even_miles ?? 0],
                  ['Working capital', money(w.working_capital_need), b.working_capital_need],
                ].map(([l, v, base]) => {
                  const cur = typeof v === 'string' ? v : '';
                  const numeric = l === 'Revenue' ? w.revenue : l === 'Profit' ? w.profit : l === 'Margin' ? w.margin_pct : l === 'Revenue / mile' ? w.revenue_per_mile : l === 'Cost / mile' ? w.cost_per_mile : l === 'Break-even' ? (w.break_even_miles ?? 0) : w.working_capital_need;
                  const delta = numeric - Number(base);
                  const goodWhenUp = !['Cost / mile', 'Break-even', 'Working capital'].includes(String(l));
                  const good = delta === 0 ? null : (delta > 0) === goodWhenUp;
                  return (
                    <div key={String(l)} className="flex items-center justify-between py-2.5 text-[13.5px]">
                      <dt className="text-ink-3">{l}</dt>
                      <dd className="flex items-center gap-2 tabular font-medium text-ink">
                        {dirty && Math.abs(delta) > 0.004 && <span className={cn('font-mono text-[10.5px]', good ? 'text-good' : 'text-bad')}>{delta > 0 ? '▲' : '▼'}</span>}
                        {cur}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </CardBody>
          </Card>
        </Item>

        {/* Levers */}
        <Item className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader eyebrow="What if" title="Pull a lever" description="Everything on this page recomputes as you drag." aside={dirty && <Button variant="ghost" size="xs" onClick={() => setScenario({})}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>} />
            <CardBody className="space-y-4">
              {LEVERS.map((l) => {
                const v = (merged[l.key] as number) ?? 0;
                const base = profile[l.key] as number;
                const changed = scenario[l.key] != null && scenario[l.key] !== base;
                return (
                  <div key={l.key}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="text-ink-2">{l.label}</span>
                      <span className={cn('tabular font-mono', changed ? 'text-signal' : 'text-ink')}>{l.fmt(v)}{changed && <span className="ml-1 text-ink-4">was {l.fmt(base)}</span>}</span>
                    </div>
                    <input type="range" min={l.min} max={l.max} step={l.step} value={v} onChange={(e) => setScenario((s) => ({ ...s, [l.key]: +e.target.value }))} className="w-full accent-[var(--signal)]" aria-label={l.label} />
                  </div>
                );
              })}
              <div className="flex items-center justify-between rounded-[12px] border border-line bg-surface-2/60 px-3 py-2.5">
                <div>
                  <div className="text-[13px] font-medium text-ink">Factor invoices</div>
                  <div className="text-xs text-ink-3">{merged.factoring_rate_pct}% fee, {merged.factoring_advance_pct}% advance</div>
                </div>
                <Switch checked={!!merged.factoring_enabled} onChange={(v) => setScenario((s) => ({ ...s, factoring_enabled: v }))} label="Factoring" />
              </div>
              {dirty && (
                <Button className="w-full" onClick={() => { setProfile(scenario); setScenario({}); toast.success('Plan updated', 'Autopilot will use these assumptions from now on.'); }}>
                  Make this the plan
                </Button>
              )}
            </CardBody>
          </Card>
        </Item>

        {/* Cash projection */}
        <Item className="lg:col-span-7">
          <Card className="flex h-full flex-col">
            <CardHeader eyebrow="Twelve months" title="Cash in the bank" description={dirty ? 'Plan vs scenario, month by month.' : 'Month by month, at today’s numbers.'} aside={<Legend items={[{ label: 'Plan', color: 'var(--series-2)' }, ...(dirty ? [{ label: 'Scenario', color: 'var(--series-1)' }] : [])]} />} />
            <CardBody className="flex-1">
              <div className="h-full min-h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--series-2)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--series-2)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="ps" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <XAxis dataKey="m" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `${v < 0 ? '-' : ''}$${Math.abs(v / 1000).toFixed(0)}k`} />
                    <ReferenceLine y={0} stroke="var(--line-strong)" />
                    <Tooltip content={<ChartTooltip format={(v) => money(v)} />} cursor={{ stroke: 'var(--line-strong)' }} />
                    <Area type="monotone" dataKey="baseline" name="Plan" stroke="var(--series-2)" strokeWidth={2} fill="url(#pb)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />
                    {dirty && <Area type="monotone" dataKey="scenario" name="Scenario" stroke="var(--series-1)" strokeWidth={2} fill="url(#ps)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </Item>

        {/* Cost mix */}
        <Item className="lg:col-span-6">
          <Card className="h-full">
            <CardHeader eyebrow="Where the money goes" title={`${money(w.total_cost)} a month`} />
            <CardBody>
              <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
                {costMix.map((c) => <span key={c.name} style={{ width: `${(c.value / w.total_cost) * 100}%`, background: c.color }} className="h-full first:rounded-l-full last:rounded-r-full" />)}
              </div>
              <ul className="mt-4 space-y-2">
                {costMix.map((c) => (
                  <li key={c.name} className="flex items-center gap-2 text-[13px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    <span className="text-ink-3">{c.name}</span>
                    <span className="ml-auto font-mono text-[11px] text-ink-4">{Math.round((c.value / w.total_cost) * 100)}%</span>
                    <span className="w-20 text-right tabular font-medium text-ink">{money(c.value)}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </Item>

        {/* Break-even */}
        <Item className="lg:col-span-6">
          <Card className="h-full">
            <CardHeader eyebrow="Break-even" title="Miles vs break-even" description="Monthly miles you run against the miles that cover fixed costs." />
            <CardBody>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Break-even', v: w.break_even_miles ?? 0 }, { name: 'You run', v: w.total_miles }]} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap={10}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={88} />
                    <Tooltip content={<ChartTooltip format={(v) => `${int(v)} mi`} />} cursor={{ fill: 'var(--line-soft)' }} />
                    <Bar dataKey="v" name="Miles" radius={[0, 4, 4, 0]} barSize={22}>
                      <Cell fill="var(--ink-4)" />
                      <Cell fill={utilization >= 100 ? 'var(--series-3)' : 'var(--series-1)'} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[13px] text-ink-3 text-pretty">
                {w.break_even_miles && w.total_miles >= w.break_even_miles
                  ? `You run ${int(w.total_miles - w.break_even_miles)} miles past break-even. Each of those miles earns about $${w.contribution_per_mile.toFixed(2)}.`
                  : w.break_even_miles ? `You are ${int(w.break_even_miles - w.total_miles)} miles short of break-even.` : 'Contribution per mile is not positive at these numbers.'}
              </p>
            </CardBody>
          </Card>
        </Item>

        {/* Assumptions */}
        <Item className="lg:col-span-12">
          <Card>
            <CardHeader eyebrow="Assumptions" title="What the plan believes" description="From onboarding. Autopilot replaces these with observed values as loads close." />
            <CardBody>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
                {([
                  ['Trucks', `${profile.trucks}`], ['Drivers', `${profile.drivers}`], ['Trailers', `${profile.trailers}`],
                  ['Miles / truck / wk', int(profile.miles_per_truck_per_week)], ['Empty miles', `${Math.round(profile.deadhead_pct * 100)}%`], ['Rate / loaded mi', `$${profile.rate_per_loaded_mile.toFixed(2)}`],
                  ['Fuel mpg', `${profile.fuel_mpg}`], ['Diesel', `$${profile.fuel_price.toFixed(2)}`], ['Driver pay / mi', `$${profile.driver_pay_per_mile.toFixed(2)}`],
                  ['Insurance / truck', money(profile.insurance_per_truck_month)], ['Truck payment', money(profile.truck_payment_per_month)], ['Trailer payment', money(profile.trailer_payment_per_month)],
                  ['Maintenance / mi', `$${profile.maintenance_per_mile.toFixed(2)}`], ['Tires / mi', `$${profile.tires_per_mile.toFixed(2)}`], ['Tolls / truck', money(profile.tolls_permits_per_truck_month)],
                  ['Overhead', money(profile.overhead_per_month)], ['Terms', `${profile.payment_terms_days} days`], ['Cash on hand', money(profile.starting_cash)],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="border-t border-line-soft pt-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">{l}</div>
                    <div className="tabular text-[14px] font-medium text-ink">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Eyebrow className="mb-0">History</Eyebrow>
                <div className="flex flex-wrap gap-2">
                  {[['v1', 'onboarding', profile.completed_at ?? baseline.generated_at], ...(businessPlan ? [['v2', 'recompute', baseline.generated_at]] : [])].map(([v, by, at]) => (
                    <span key={v} className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] text-ink-3">{v} · {by} · {fmtDate(at, 'MMM d')}</span>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </Item>
      </Stagger>
    </>
  );
}
