'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Check, Clock3, MessageSquareWarning, ShieldAlert, Sparkles, X } from 'lucide-react';
import type { AutopilotEvent } from '@haulage/types';
import { computePlan } from '@haulage/core';
import { cn, hoursLabel, money } from '@/lib/utils';
import { PageHeader, Section } from '@/components/shell/page-header';
import { Card, CardBody, CardHeader, Eyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status';
import { ProgressRing } from '@/components/ui/ring';
import { Sparkline } from '@/components/ui/sparkline';
import { NumberTicker } from '@/components/motion/number-ticker';
import { Stagger, Item } from '@/components/motion/reveal';
import { RouteRibbon } from '@/components/app/route-ribbon';
import { EventRow, EVENT_ICON, eventHref } from '@/components/app/event-row';
import { ChartTooltip, Legend } from '@/components/charts/chart-tooltip';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/lib/store';
import { autopilotEvents, autopilotSummary, cashSeries, compliance, customerById, demoUser, driverById, invoices, loads, revenueSeries } from '@/lib/data';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function TodayPage() {
  const { profile, resolvedEvents, resolveEvent, policies } = useSession();
  const summary = autopilotSummary();
  const needs = autopilotEvents.filter((e) => e.outcome === 'needs_you' && !resolvedEvents.includes(e.id));
  const done = autopilotEvents.filter((e) => e.outcome === 'done').slice(0, 7);
  const onRoad = loads.filter((l) => l.status === 'in_transit');
  const plan = useMemo(() => computePlan(profile, 'preview'), [profile]);

  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((a, i) => a + i.amount, 0);
  const landing7 = invoices.filter((i) => i.status !== 'paid' && new Date(i.expectedAt) < new Date(Date.now() + 7 * 864e5)).reduce((a, i) => a + i.amount, 0);
  const cashNow = cashSeries[cashSeries.length - 1] * 1000;
  const weekly = cashSeries.map((c, i) => ({ w: `W${i + 1}`, invoiced: revenueSeries[i], collected: c }));
  const horizon = compliance.filter((c) => c.status !== 'active').sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));

  const act = (e: AutopilotEvent, verb: string) => {
    resolveEvent(e.id);
    toast.success(verb, e.summary.length > 80 ? e.summary.slice(0, 77) + '…' : e.summary);
  };

  return (
    <>
      <PageHeader
        eyebrow={`${format(new Date(), 'EEEE, MMMM d')} · ${profile.company_name || 'Your fleet'}`}
        title={
          <>
            {greeting()}, {demoUser.name.split(' ')[0]}.
          </>
        }
        summary={
          <>
            Autopilot ran <span className="font-medium text-ink">{summary.events_7d} actions</span> this week and gave you back{' '}
            <span className="font-medium text-ink">{hoursLabel(summary.saved_minutes_7d)}</span>.{' '}
            {needs.length ? (
              <>
                <span className="font-medium text-signal">{needs.length} things</span> need you.
              </>
            ) : (
              'Nothing needs you right now.'
            )}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => toast.info('Briefing', 'Copilot can read this out loud. Press ⌘J.')}>
              <Sparkles className="h-4 w-4 text-mind" /> Read my briefing
            </Button>
            <Link href="/app/loads?new=1">
              <Button size="sm">Book a load</Button>
            </Link>
          </>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
        {/* Needs you */}
        <Item className="lg:col-span-8">
          <Card className="h-full" id="needs-you">
            <CardHeader
              eyebrow="Needs you"
              title={needs.length ? `${needs.length} decisions, about ${Math.max(2, needs.length * 1)} minutes` : 'Inbox zero'}
              description="Autopilot got each of these as far as policy allows."
              aside={<Badge tone={needs.length ? 'warn' : 'good'} dot pulse={needs.length > 0}>{needs.length ? 'Waiting' : 'Clear'}</Badge>}
            />
            <CardBody className="space-y-2">
              {needs.length === 0 && (
                <div className="rounded-[14px] border border-dashed border-line px-4 py-8 text-center text-sm text-ink-3">Everything is handled. Enjoy the quiet.</div>
              )}
              {needs.map((e) => {
                const Icon = EVENT_ICON[e.kind];
                const href = eventHref(e);
                const isMoney = e.kind === 'rate_mismatch';
                return (
                  <div key={e.id} className="group flex flex-col gap-3 rounded-[16px] border border-line bg-surface-2/60 p-4 transition-colors hover:border-line-strong sm:flex-row sm:items-center">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-warn-soft text-warn">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium leading-snug text-ink">{e.summary}</p>
                      {e.detail && <p className="mt-0.5 text-xs leading-relaxed text-ink-3 text-pretty">{e.detail}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {href && (
                        <Link href={href}>
                          <Button variant="ghost" size="sm">
                            Open
                          </Button>
                        </Link>
                      )}
                      {isMoney ? (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => act(e, 'Dispute opened with the broker')}>
                            <X className="h-3.5 w-3.5" /> Dispute
                          </Button>
                          <Button size="sm" onClick={() => act(e, 'Approved. Invoice going out at $815')}>
                            <Check className="h-3.5 w-3.5" /> Approve $815
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => act(e, 'Handled. Autopilot is finishing the rest')}>
                          <Check className="h-3.5 w-3.5" /> {e.kind === 'compliance_alert' ? 'Pay & renew' : e.kind === 'document_classified' ? 'Confirm LD-2038' : 'Resolve'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </Item>

        {/* Cash */}
        <Item className="lg:col-span-4">
          <Card className="relative h-full overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-signal/10 blur-3xl" />
            <CardHeader eyebrow="Cash" title="In the bank" aside={<Link href="/app/money" className="text-xs font-medium text-ink-3 hover:text-ink">Money →</Link>} />
            <CardBody>
              <div className="flex items-baseline gap-1 tabular text-[42px] font-semibold leading-none tracking-[-0.035em] text-ink">
                <span className="text-2xl text-ink-3">$</span>
                <NumberTicker value={cashNow} />
              </div>
              <div className="mt-3 h-12">
                <Sparkline data={cashSeries} tone="signal" />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[13px]">
                <div>
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Landing in 7 days</dt>
                  <dd className="mt-1 font-semibold tabular text-good">{money(landing7)}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Outstanding</dt>
                  <dd className="mt-1 font-semibold tabular text-ink">{money(outstanding)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </Item>

        {/* On the road */}
        <Item className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader eyebrow="On the road" title={`${onRoad.length} loads moving`} aside={<Link href="/app/loads" className="text-xs font-medium text-ink-3 hover:text-ink">All loads →</Link>} />
            <CardBody className="space-y-5">
              {onRoad.map((l, i) => {
                const start = new Date(l.pickupAt).getTime();
                const end = new Date(l.deliverAt).getTime();
                const progress = (Date.now() - start) / (end - start);
                return (
                  <Link key={l.id} href={`/app/loads/${l.id}`} className="block rounded-[14px] p-2 -m-2 transition-colors hover:bg-surface-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12.5px] font-semibold text-ink">{l.number}</span>
                        <span className="text-xs text-ink-3">{driverById(l.driverId).name.split(' ')[0]} · Truck {l.truckId.slice(-1).padStart(3, '10')}</span>
                      </div>
                      <span className="tabular text-[13px] font-medium">{money(l.rate)}</span>
                    </div>
                    <RouteRibbon origin={l.origin} destination={l.destination} progress={0.25 + i * 0.35 + Math.min(0.3, Math.max(0, progress) * 0.3)} />
                  </Link>
                );
              })}
              {loads.filter((l) => l.status === 'created').map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-[12px] border border-dashed border-line px-3 py-2 text-xs text-ink-3">
                  <span>
                    <span className="font-mono font-medium text-ink-2">{l.number}</span> picks up tomorrow · {l.origin} → {l.destination}
                  </span>
                  <StatusPill status="created" size="sm" />
                </div>
              ))}
            </CardBody>
          </Card>
        </Item>

        {/* Ledger */}
        <Item className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader eyebrow="Autopilot ledger" title="Done for you" description={`Mode: ${policies.mode === 'full' ? 'full autonomy' : policies.mode} · within your policies`} aside={<Link href="/app/autopilot" className="text-xs font-medium text-ink-3 hover:text-ink">Ledger →</Link>} />
            <CardBody className="divide-y divide-line-soft pt-0">
              {done.map((e) => (
                <EventRow key={e.id} e={e} dense />
              ))}
            </CardBody>
          </Card>
        </Item>

        {/* Plan health */}
        <Item className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader eyebrow="Plan health" title="Living plan" aside={<Link href="/app/plan" className="text-xs font-medium text-ink-3 hover:text-ink">Plan →</Link>} />
            <CardBody className="flex flex-col items-center text-center">
              <ProgressRing value={plan.health} size={132} stroke={9} tone={plan.health >= 70 ? 'good' : plan.health >= 40 ? 'warn' : 'bad'}>
                <div>
                  <div className="tabular text-4xl font-semibold tracking-[-0.04em]"><NumberTicker value={plan.health} /></div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">of 100</div>
                </div>
              </ProgressRing>
              <div className="mt-4 w-full rounded-[14px] border border-line bg-surface-2/60 p-3 text-left">
                <Eyebrow tone="signal">Biggest lever</Eyebrow>
                <p className="text-[13px] font-medium text-ink">{plan.recommendations[0].title}</p>
                <p className="mt-0.5 text-xs text-ink-3 text-pretty">{plan.recommendations[0].message}</p>
              </div>
            </CardBody>
          </Card>
        </Item>

        {/* Weekly pulse */}
        <Item className="lg:col-span-8">
          <Card>
            <CardHeader eyebrow="Twelve weeks" title="Invoiced vs collected" description="Thousands of dollars per week. The gap is your float." aside={<Legend items={[{ label: 'Invoiced', color: 'var(--series-1)' }, { label: 'Collected', color: 'var(--series-2)' }]} />} />
            <CardBody>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--series-2)" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="var(--series-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="w" tickLine={false} axisLine={false} interval={1} />
                    <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${v}k`} />
                    <Tooltip content={<ChartTooltip format={(v) => `$${v.toFixed(1)}k`} />} cursor={{ stroke: 'var(--line-strong)' }} />
                    <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="var(--series-1)" strokeWidth={2} fill="url(#g1)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke="var(--series-2)" strokeWidth={2} fill="url(#g2)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </Item>

        {/* Compliance horizon */}
        <Item className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader eyebrow="Compliance horizon" title="Next 30 days" aside={<Link href="/app/compliance" className="text-xs font-medium text-ink-3 hover:text-ink">All →</Link>} />
            <CardBody className="space-y-2">
              {horizon.map((c) => {
                const days = Math.round((new Date(c.expiresAt).getTime() - Date.now()) / 864e5);
                const expired = days < 0;
                return (
                  <Link key={c.id} href={`/app/compliance?subject=${c.subjectId}`} className="flex items-center gap-3 rounded-[12px] px-2 py-2 -mx-2 transition-colors hover:bg-surface-2">
                    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-[10px]', expired ? 'bg-bad-soft text-bad' : days <= 14 ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-ink-3')}>
                      {expired ? <ShieldAlert className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{c.subjectName}</span>
                      <span className="block truncate text-xs text-ink-3">{c.type}</span>
                    </span>
                    <span className={cn('font-mono text-[11.5px] tabular', expired ? 'text-bad' : days <= 14 ? 'text-warn' : 'text-ink-3')}>{expired ? `${-days}d ago` : `${days}d`}</span>
                  </Link>
                );
              })}
            </CardBody>
          </Card>
        </Item>
      </Stagger>

      <Section className="mt-8">
        <Link href="/app/autopilot" className="group flex items-center justify-between gap-4 rounded-[20px] border border-line bg-surface-inverse px-5 py-4 text-ink-inverse transition-transform hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-white/10">
              <MessageSquareWarning className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[14px] font-semibold">Autopilot is on “{policies.mode}” mode with a {money(policies.auto_invoice_max_amount)} auto-send limit.</div>
              <div className="text-[12.5px] opacity-70">Raise it and Autopilot will send bigger invoices without asking. Everything it does is in the ledger.</div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 opacity-60 transition-transform group-hover:translate-x-1" />
        </Link>
      </Section>
    </>
  );
}
