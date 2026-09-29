'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { format, isSameDay, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Download, Infinity as InfinityIcon, Lightbulb, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import type { AutopilotEvent, AutopilotMode, AutopilotPolicies } from '@haulage/types';
import { ago, cn, fmtDateTime, hoursLabel, money } from '@/lib/utils';
import { PageHeader, Section } from '@/components/shell/page-header';
import { AutopilotOrb, Badge, Button, Card, CardBody, CardHeader, EmptyState, Eyebrow, Input, Segmented, Select, toast } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { NumberTicker } from '@/components/motion/number-ticker';
import { EVENT_ICON, eventHref } from '@/components/app/event-row';
import { ChartTooltip } from '@/components/charts/chart-tooltip';
import { useSession } from '@/lib/store';
import { autopilotEvents, autopilotSummary, compliance, customerById, documents, invoices, loads } from '@/lib/data';

/* ─── Vocabulary ────────────────────────────────────────────────────────── */

const OFFICE_RATE = 28; // $ per hour of office time

const MODES: { value: AutopilotMode; label: string; meaning: string; icon: LucideIcon }[] = [
  { value: 'suggest', label: 'Suggest', meaning: 'Drafts everything, sends nothing until you say so.', icon: Lightbulb },
  { value: 'act', label: 'Act', meaning: 'Sends, chases and files inside the limits on the right.', icon: Zap },
  { value: 'full', label: 'Full autonomy', meaning: 'Does everything policy allows, including quick-pay routing.', icon: InfinityIcon },
];

const MODE_TONE: Record<AutopilotMode, { tile: string; icon: string; text: string }> = {
  suggest: { tile: 'border-info/40 bg-info-soft', icon: 'bg-info text-white', text: 'text-info' },
  act: { tile: 'border-signal/40 bg-signal-soft', icon: 'bg-signal text-signal-ink', text: 'text-signal' },
  full: { tile: 'border-mind/40 bg-mind-soft', icon: 'bg-mind text-white', text: 'text-mind' },
};

const MODE_LABEL: Record<AutopilotMode, string> = { suggest: 'Suggest', act: 'Act', full: 'Full autonomy' };

const KIND_LABEL: Record<AutopilotEvent['kind'], string> = {
  invoice_sent: 'Invoice sent',
  pod_chased: 'POD chased',
  document_linked: 'Document linked',
  document_classified: 'Document classified',
  compliance_alert: 'Compliance alert',
  quick_pay_routed: 'Quick-pay routed',
  settlement_generated: 'Settlement drafted',
  exception_raised: 'Exception',
  rate_mismatch: 'Rate mismatch',
  payment_received: 'Payment received',
};

const DAYS: AutopilotPolicies['settlement_day'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const firstWord = (s: string) => s.split(' ')[0];

type Outcome = AutopilotEvent['outcome'];
type OutcomeFilter = 'all' | Outcome;

/** The one-line justification for an event, derived from the live policy values. */
function why(e: AutopilotEvent, p: AutopilotPolicies): string {
  const threshold = Math.round(p.auto_link_confidence * 100);
  switch (e.kind) {
    case 'invoice_sent': {
      const inv = invoices.find((i) => i.id === e.entity_id);
      if (!inv) return `Packet complete and under your ${money(p.auto_invoice_max_amount)} auto-send limit`;
      return inv.amount <= p.auto_invoice_max_amount
        ? `Packet complete and ${money(inv.amount)} is under your ${money(p.auto_invoice_max_amount)} limit`
        : `${money(inv.amount)} is over your ${money(p.auto_invoice_max_amount)} limit, so this would wait for you today`;
    }
    case 'quick_pay_routed': {
      const inv = invoices.find((i) => i.id === e.entity_id);
      const c = inv ? customerById(inv.customerId) : null;
      if (!c) return `Customer terms exceed your ${p.quick_pay_min_days}-day quick-pay threshold`;
      return c.termsDays > p.quick_pay_min_days
        ? `${firstWord(c.name)}’s ${c.termsDays}-day terms exceed your ${p.quick_pay_min_days}-day quick-pay threshold`
        : `${firstWord(c.name)}’s ${c.termsDays}-day terms sit inside your ${p.quick_pay_min_days}-day threshold, so this would not route today`;
    }
    case 'document_linked': {
      const doc = documents.filter((d) => d.loadId === e.entity_id).sort((a, b) => b.confidence - a.confidence)[0];
      if (!doc) return `Match confidence cleared your ${threshold}% threshold`;
      const conf = Math.round(doc.confidence * 100);
      return conf >= threshold ? `Confidence ${conf}% is above your ${threshold}% threshold` : `Confidence ${conf}% is under your ${threshold}% threshold, so this would wait for you today`;
    }
    case 'document_classified': {
      const doc = documents.find((d) => d.id === e.entity_id);
      if (!doc) return `Classification compared against your ${threshold}% threshold`;
      const conf = Math.round(doc.confidence * 100);
      if (e.outcome === 'needs_you') return `Confidence ${conf}% is under your ${threshold}% threshold, so it waits for you`;
      return conf >= threshold ? `Confidence ${conf}% clears your ${threshold}% threshold` : `Filed without linking: ${conf}% is under your ${threshold}% link threshold`;
    }
    case 'pod_chased': {
      const l = loads.find((x) => x.id === e.entity_id);
      const hrs = l?.deliveredAt ? Math.max(1, Math.round((new Date(e.created_at).getTime() - new Date(l.deliveredAt).getTime()) / 36e5)) : null;
      return `${hrs ? `Delivered ${hrs}h before this reminder. ` : ''}You chase ${p.pod_chase_hours}h after delivery, then every ${p.pod_chase_cadence_hours}h, outside ${p.quiet_hours}`;
    }
    case 'compliance_alert': {
      const item = compliance.filter((c) => c.subjectId === e.entity_id).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))[0];
      const windows = [...p.compliance_alert_days].sort((a, b) => b - a);
      if (!item) return `Inside one of your ${windows.join('/')}-day alert windows`;
      const days = Math.round((new Date(item.expiresAt).getTime() - Date.now()) / 864e5);
      if (days < 0) return `Expired ${-days} days ago. You asked to be told at ${windows.join(', ')} days out`;
      const win = [...windows].reverse().find((w) => w >= days);
      return win ? `Expires in ${days} days, inside your ${win}-day alert window` : `Expires in ${days} days, outside your alert windows (${windows.join('/')})`;
    }
    case 'settlement_generated':
      return `Drafted for your ${cap(p.settlement_day)} settlement day`;
    case 'payment_received':
      return 'Matched to an open invoice by amount and customer. Bookkeeping, not a policy call';
    case 'rate_mismatch':
      return 'The POD and rate confirmation disagree on money. Amount changes always wait for you';
    case 'exception_raised':
      return `Nothing matched above your ${threshold}% threshold, so it waits for you`;
  }
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function AutopilotPage() {
  const { policies, setPolicies, resolvedEvents, resolveEvent } = useSession();
  const summary = autopilotSummary();
  const hours30 = summary.saved_minutes_30d / 60;
  const dollars = Math.round(hours30 * OFFICE_RATE);

  const perDay = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = startOfDay(subDays(new Date(), 6 - i));
        return { day: format(d, 'EEE'), minutes: autopilotEvents.filter((e) => isSameDay(new Date(e.created_at), d)).reduce((a, e) => a + e.saved_minutes, 0) };
      }),
    [],
  );

  const byKind = useMemo(() => {
    const m = new Map<AutopilotEvent['kind'], number>();
    for (const e of autopilotEvents) m.set(e.kind, (m.get(e.kind) ?? 0) + e.saved_minutes);
    const total = [...m.values()].reduce((a, b) => a + b, 0) || 1;
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([kind, minutes]) => ({ kind, minutes, share: minutes / total }));
  }, []);

  const inThisMode: Record<AutopilotMode, string[]> = {
    suggest: ['Invoices are drafted. You press send', 'POD reminders are queued for your approval', 'Renewals are prepared, never paid'],
    act: [`Invoices under ${money(policies.auto_invoice_max_amount)} go out on their own`, `Drivers are texted for PODs after ${policies.pod_chase_hours}h`, 'Anything over a limit waits for you'],
    full: ['Invoices go out at any amount once the packet is complete', 'Quick-pay is routed without asking', 'Only money disputes wait for you'],
  };

  const setMode = (mode: AutopilotMode) => {
    if (mode === policies.mode) return;
    setPolicies({ mode });
    toast.success(`Autopilot set to ${MODE_LABEL[mode]}`, MODES.find((m) => m.value === mode)?.meaning);
  };

  return (
    <>
      <PageHeader
        eyebrow="Autopilot · the automated business plane"
        title={
          <>
            Your back office, <em className="italic">on autopilot.</em>
          </>
        }
        summary={
          <>
            <span className="font-medium text-ink">{summary.events_7d} actions</span> this week, <span className="font-medium text-ink">{hoursLabel(summary.saved_minutes_7d)}</span> given back. Running in{' '}
            <span className={cn('font-medium', MODE_TONE[policies.mode].text)}>{MODE_LABEL[policies.mode].toLowerCase()}</span> mode, inside the policies you set here.
          </>
        }
        actions={
          <Button variant="secondary" size="sm" onClick={() => toast.info('Export queued', 'The ledger CSV will land in your inbox in a minute.')}>
            <Download className="h-4 w-4" /> Export ledger
          </Button>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
        {/* Mode */}
        <Item className="lg:col-span-4">
          <Card className="relative h-full overflow-hidden">
            <CardHeader eyebrow="Mode" title="How much it may do" description="One tile. Everything else follows from it." />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4 rounded-[14px] border border-line bg-surface-2/60 px-4 py-3">
                <AutopilotOrb mode={policies.mode} size={18} />
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold tracking-tight text-ink">{MODE_LABEL[policies.mode]}</div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">live · {summary.events_7d} actions this week</div>
                </div>
              </div>

              <div className="space-y-2" role="radiogroup" aria-label="Autopilot mode">
                {MODES.map((m) => {
                  const active = policies.mode === m.value;
                  const tone = MODE_TONE[m.value];
                  return (
                    <button
                      key={m.value}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMode(m.value)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-200 active:scale-[0.99]',
                        active ? tone.tile : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
                      )}
                    >
                      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-[11px] transition-colors', active ? tone.icon : 'bg-surface-2 text-ink-3')}>
                        <m.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold text-ink">{m.label}</span>
                        <span className="block text-xs leading-snug text-ink-3 text-pretty">{m.meaning}</span>
                      </span>
                      <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors', active ? cn('border-transparent', tone.icon) : 'border-line-strong')}>
                        {active && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-line pt-4">
                <Eyebrow>In this mode</Eyebrow>
                <ul className="space-y-1.5">
                  {inThisMode[policies.mode].map((line) => (
                    <li key={line} className="flex items-start gap-2 text-[13px] text-ink-2">
                      <span className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full', MODE_TONE[policies.mode].icon)} />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>
        </Item>

        {/* Hours given back */}
        <Item className="lg:col-span-4">
          <Card className="relative h-full overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-signal/10 blur-3xl" />
            <CardHeader eyebrow="Hours given back" title="Last 30 days" aside={<Badge tone="good" dot>Trending up</Badge>} />
            <CardBody>
              <div className="flex items-baseline gap-1.5 tabular text-[56px] font-semibold leading-none tracking-[-0.04em] text-ink">
                <NumberTicker value={hours30} format={(v) => v.toFixed(1)} />
                <span className="text-2xl font-medium text-ink-3">h</span>
              </div>
              <p className="mt-2 text-[13px] text-ink-3 text-pretty">
                That is about <span className="font-medium tabular text-ink">{money(dollars)}</span> a month at ${OFFICE_RATE}/hour of office time.
              </p>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <Eyebrow className="mb-0">This week, minutes a day</Eyebrow>
                  <span className="font-mono text-[10.5px] tabular text-ink-3">{summary.saved_minutes_7d}m</span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perDay} margin={{ top: 6, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
                      <XAxis dataKey="day" tickLine={false} axisLine={false} interval={0} height={18} />
                      <Tooltip cursor={{ fill: 'var(--line-soft)' }} content={<ChartTooltip format={(v) => `${v} min`} />} />
                      <Bar dataKey="minutes" name="Saved" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <Eyebrow>Where the time went</Eyebrow>
                <div className="space-y-2.5">
                  {byKind.map((k) => (
                    <div key={k.kind}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]">
                        <span className="text-ink-2">{KIND_LABEL[k.kind]}</span>
                        <span className="font-mono text-[11px] tabular text-ink-3">{k.minutes}m</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                        <motion.div className="h-full rounded-full" style={{ background: 'var(--series-1)' }} initial={{ width: 0 }} animate={{ width: `${Math.round(k.share * 100)}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </Item>

        {/* Policies */}
        <Item className="lg:col-span-4">
          <PoliciesCard policies={policies} setPolicies={setPolicies} />
        </Item>

        {/* Ledger */}
        <Item className="lg:col-span-12">
          <Ledger policies={policies} resolvedEvents={resolvedEvents} resolveEvent={resolveEvent} />
        </Item>
      </Stagger>

      <Section className="mt-8">
        <Link href="/app/plan" className="group flex items-center justify-between gap-4 rounded-[20px] border border-line bg-surface-inverse px-5 py-4 text-ink-inverse transition-transform hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-ink-inverse/10">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[14px] font-semibold">Autopilot feeds the plan.</div>
              <div className="text-[12.5px] opacity-70">Every closed load updates your cost per mile and cash forecast.</div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 opacity-60 transition-transform group-hover:translate-x-1" />
        </Link>
      </Section>
    </>
  );
}

/* ─── Policies ──────────────────────────────────────────────────────────── */

function PolicyRow({ label, hint, children, stacked }: { label: string; hint?: string; children: React.ReactNode; stacked?: boolean }) {
  return (
    <div className={cn('py-3.5 first:pt-1 last:pb-0', stacked ? 'space-y-2.5' : 'flex items-center justify-between gap-4')}>
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink">{label}</div>
        {hint && <div className="mt-0.5 text-xs leading-snug text-ink-3 text-pretty">{hint}</div>}
      </div>
      <div className={cn(!stacked && 'shrink-0')}>{children}</div>
    </div>
  );
}

const selectCls = 'h-9 text-[13px] tabular';

function PoliciesCard({ policies, setPolicies }: { policies: AutopilotPolicies; setPolicies: (p: Partial<AutopilotPolicies>) => void }) {
  const [amount, setAmount] = useState(String(policies.auto_invoice_max_amount));
  const [quiet, setQuiet] = useState(policies.quiet_hours);
  const confTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setAmount(String(policies.auto_invoice_max_amount)), [policies.auto_invoice_max_amount]);
  useEffect(() => setQuiet(policies.quiet_hours), [policies.quiet_hours]);
  useEffect(() => () => { if (confTimer.current) clearTimeout(confTimer.current); }, []);

  const commit = (patch: Partial<AutopilotPolicies>, title: string, body?: string) => {
    setPolicies(patch);
    toast.success(title, body);
  };

  const commitAmount = () => {
    const n = Math.max(0, Math.round(Number(amount.replace(/[^0-9.]/g, '')) || 0));
    setAmount(String(n));
    if (n === policies.auto_invoice_max_amount) return;
    commit({ auto_invoice_max_amount: n }, `Auto-send limit is now ${money(n)}`, n > policies.auto_invoice_max_amount ? 'Bigger invoices will go out without asking.' : 'More invoices will wait for you.');
  };

  const commitQuiet = () => {
    const q = quiet.trim();
    if (!q || q === policies.quiet_hours) return setQuiet(policies.quiet_hours);
    commit({ quiet_hours: q }, `Quiet hours set to ${q}`, 'No texts or emails go out in that window.');
  };

  const setConfidence = (v: number) => {
    setPolicies({ auto_link_confidence: v });
    if (confTimer.current) clearTimeout(confTimer.current);
    confTimer.current = setTimeout(() => toast.success(`Auto-link above ${Math.round(v * 100)}% confidence`, v < 0.9 ? 'More documents will link on their own. Check the ledger for misses.' : 'Fewer documents link alone. More will wait for you.'), 700);
  };

  const toggleDay = (d: number) => {
    const has = policies.compliance_alert_days.includes(d);
    const next = has ? policies.compliance_alert_days.filter((x) => x !== d) : [...policies.compliance_alert_days, d];
    if (next.length === 0) return toast.warn('Keep at least one alert window');
    next.sort((a, b) => b - a);
    commit({ compliance_alert_days: next }, has ? `Dropped the ${d}-day alert` : `Added a ${d}-day alert`, `You will hear at ${next.join(', ')} days out.`);
  };

  return (
    <Card className="h-full">
      <CardHeader eyebrow="Policies" title="Where the limits are" description="Plain English on the left. The number Autopilot obeys on the right." />
      <CardBody className="divide-y divide-line-soft">
        <PolicyRow label="Send invoices on their own" hint="When the packet is complete and the total is under">
          <div className="w-32">
            <Input
              leading={<span className="font-mono text-[12px]">$</span>}
              inputMode="numeric"
              type="number"
              step={500}
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={commitAmount}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="h-9 pl-8 text-[13px] tabular"
              aria-label="Auto-send limit"
            />
          </div>
        </PolicyRow>

        <PolicyRow label="Start chasing a POD" hint="Hours after delivery with no POD">
          <div className="w-28">
            <Select className={selectCls} value={policies.pod_chase_hours} onChange={(e) => commit({ pod_chase_hours: Number(e.target.value) }, `POD chase starts ${e.target.value}h after delivery`)} aria-label="POD chase delay">
              {[6, 12, 24, 48].map((h) => (
                <option key={h} value={h}>{h} hours</option>
              ))}
            </Select>
          </div>
        </PolicyRow>

        <PolicyRow label="Chase again every" hint="Until the POD arrives">
          <div className="w-28">
            <Select className={selectCls} value={policies.pod_chase_cadence_hours} onChange={(e) => commit({ pod_chase_cadence_hours: Number(e.target.value) }, `Reminders repeat every ${e.target.value}h`)} aria-label="POD chase cadence">
              {[12, 24, 48].map((h) => (
                <option key={h} value={h}>{h} hours</option>
              ))}
            </Select>
          </div>
        </PolicyRow>

        <PolicyRow label="Route to quick-pay" hint="When a customer’s terms are longer than">
          <div className="w-28">
            <Select className={selectCls} value={policies.quick_pay_min_days} onChange={(e) => commit({ quick_pay_min_days: Number(e.target.value) }, `Quick-pay above ${e.target.value}-day terms`, 'Slow payers get factored. Fast ones do not.')} aria-label="Quick-pay threshold">
              {[30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </Select>
          </div>
        </PolicyRow>

        <PolicyRow label="Compliance alerts" hint="Days before a card, inspection or filing expires" stacked>
          <div className="flex flex-wrap gap-1.5">
            {[60, 30, 14, 7, 1].map((d) => {
              const on = policies.compliance_alert_days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(d)}
                  className={cn(
                    'h-8 rounded-full border px-3 font-mono text-[11.5px] tabular transition-colors',
                    on ? 'border-signal/30 bg-signal-soft text-signal' : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink',
                  )}
                >
                  {d}d
                </button>
              );
            })}
          </div>
        </PolicyRow>

        <PolicyRow label="Link documents on their own" hint="Only when the match is at least this sure" stacked>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.8}
              max={0.99}
              step={0.01}
              value={policies.auto_link_confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              aria-label="Auto-link confidence"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full accent-signal [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-signal [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_var(--line-strong)] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-signal"
              style={{ background: `linear-gradient(to right, var(--signal) 0%, var(--signal) ${((policies.auto_link_confidence - 0.8) / 0.19) * 100}%, var(--surface-3) ${((policies.auto_link_confidence - 0.8) / 0.19) * 100}%, var(--surface-3) 100%)` }}
            />
            <span className="w-11 shrink-0 text-right font-mono text-[13px] font-medium tabular text-ink">{Math.round(policies.auto_link_confidence * 100)}%</span>
          </div>
        </PolicyRow>

        <PolicyRow label="Settlement day" hint="Driver pay is drafted each week on">
          <div className="w-32">
            <Select className={selectCls} value={policies.settlement_day} onChange={(e) => commit({ settlement_day: e.target.value as AutopilotPolicies['settlement_day'] }, `Settlements now draft on ${cap(e.target.value)}s`)} aria-label="Settlement day">
              {DAYS.map((d) => (
                <option key={d} value={d}>{cap(d)}</option>
              ))}
            </Select>
          </div>
        </PolicyRow>

        <PolicyRow label="Quiet hours" hint="No texts or emails in this window">
          <div className="w-32">
            <Input
              value={quiet}
              onChange={(e) => setQuiet(e.target.value)}
              onBlur={commitQuiet}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              placeholder="21:00-06:00"
              className="h-9 font-mono text-[12.5px] tabular"
              aria-label="Quiet hours"
            />
          </div>
        </PolicyRow>
      </CardBody>
    </Card>
  );
}

/* ─── Ledger ────────────────────────────────────────────────────────────── */

function dayLabel(d: Date) {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
}

function Ledger({ policies, resolvedEvents, resolveEvent }: { policies: AutopilotPolicies; resolvedEvents: string[]; resolveEvent: (id: string) => void }) {
  const [outcome, setOutcome] = useState<OutcomeFilter>('all');
  const [kind, setKind] = useState<'all' | AutopilotEvent['kind']>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const effective = (e: AutopilotEvent): Outcome => (resolvedEvents.includes(e.id) ? 'done' : e.outcome);
  const byKindPool = kind === 'all' ? autopilotEvents : autopilotEvents.filter((e) => e.kind === kind);
  const count = (o: Outcome) => byKindPool.filter((e) => effective(e) === o).length;

  const rows = byKindPool.filter((e) => outcome === 'all' || effective(e) === outcome);
  const groups = useMemo(() => {
    const m = new Map<string, { date: Date; events: AutopilotEvent[] }>();
    for (const e of rows) {
      const d = startOfDay(new Date(e.created_at));
      const k = d.toISOString();
      if (!m.has(k)) m.set(k, { date: d, events: [] });
      m.get(k)!.events.push(e);
    }
    return [...m.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [rows]);

  const resolve = (e: AutopilotEvent) => {
    resolveEvent(e.id);
    toast.success('Handled', e.summary.length > 80 ? e.summary.slice(0, 77) + '…' : e.summary);
  };

  const kinds = [...new Set(autopilotEvents.map((e) => e.kind))];

  return (
    <Card>
      <CardHeader
        eyebrow="Ledger"
        title="Everything it did, and why"
        description="Each row is a receipt. Open one to see the policy it acted under."
        aside={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Segmented<OutcomeFilter>
              size="sm"
              value={outcome}
              onChange={setOutcome}
              options={[
                { value: 'all', label: 'All', count: byKindPool.length },
                { value: 'done', label: 'Done', count: count('done') },
                { value: 'needs_you', label: 'Needs you', count: count('needs_you') },
                { value: 'skipped', label: 'Skipped', count: count('skipped') },
              ]}
            />
            <div className="w-44">
              <Select className="h-9 text-[13px]" value={kind} onChange={(e) => setKind(e.target.value as 'all' | AutopilotEvent['kind'])} aria-label="Filter by kind">
                <option value="all">Every kind</option>
                {kinds.map((k) => (
                  <option key={k} value={k}>{KIND_LABEL[k]}</option>
                ))}
              </Select>
            </div>
          </div>
        }
      />
      <CardBody className="pt-0">
        {groups.length === 0 && (
          <EmptyState title={outcome === 'skipped' ? 'Nothing skipped' : 'Nothing here yet'} description={outcome === 'skipped' ? 'Autopilot has not had to skip anything under your current policies.' : 'Widen the filters to see more of the ledger.'} />
        )}
        {groups.map((g) => (
          <div key={g.date.toISOString()}>
            <div className="sticky top-16 z-10 -mx-5 flex items-center gap-3 bg-surface/90 px-5 py-2 backdrop-blur">
              <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3">{dayLabel(g.date)}</span>
              <span className="h-px flex-1 bg-line" />
              <span className="font-mono text-[10.5px] tabular text-ink-4">{g.events.length} · saved {g.events.reduce((a, e) => a + e.saved_minutes, 0)}m</span>
            </div>
            <div className="divide-y divide-line-soft">
              {g.events.map((e) => (
                <LedgerRow key={e.id} e={e} outcome={effective(e)} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} onResolve={() => resolve(e)} policies={policies} />
              ))}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function LedgerRow({ e, outcome, open, onToggle, onResolve, policies }: { e: AutopilotEvent; outcome: Outcome; open: boolean; onToggle: () => void; onResolve: () => void; policies: AutopilotPolicies }) {
  const Icon = EVENT_ICON[e.kind];
  const href = eventHref(e);
  const tone = outcome === 'needs_you' ? 'text-warn bg-warn-soft' : outcome === 'skipped' ? 'text-ink-3 bg-surface-2' : 'text-good bg-good-soft';
  const wasResolvedHere = e.outcome === 'needs_you' && outcome === 'done';

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(k) => {
          if (k.key === 'Enter' || k.key === ' ') {
            k.preventDefault();
            onToggle();
          }
        }}
        className="group -mx-2 flex cursor-pointer items-start gap-3 rounded-[12px] px-2 py-3 transition-colors hover:bg-surface-2/70"
      >
        <span className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[9px]', tone)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug text-ink">{e.summary}</p>
          <p className="mt-0.5 font-mono text-[10.5px] text-ink-3">
            {ago(e.created_at)} · {KIND_LABEL[e.kind]}
            {wasResolvedHere && <span className="text-good"> · you handled it</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {e.saved_minutes > 0 && (
            <span className="hidden rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] tabular text-ink-3 sm:inline-block">saved {e.saved_minutes}m</span>
          )}
          {outcome === 'needs_you' ? (
            <Button
              size="xs"
              onClick={(ev) => {
                ev.stopPropagation();
                onResolve();
              }}
            >
              <Check className="h-3 w-3" /> Resolve
            </Button>
          ) : (
            <Badge tone={outcome === 'skipped' ? 'neutral' : 'good'} size="sm">
              {outcome === 'skipped' ? 'Skipped' : 'Done'}
            </Badge>
          )}
          <ChevronDown className={cn('h-4 w-4 text-ink-4 transition-transform duration-300', open && 'rotate-180')} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="receipt" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 38 }} className="overflow-hidden">
            <div className="mb-3 ml-10 rounded-[14px] border border-line bg-surface-2/60 px-4 py-3">
              <dl className="grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-[72px_1fr]">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3 sm:pt-0.5">Why</dt>
                <dd className="text-ink text-pretty">{why(e, policies)}.</dd>
                {e.detail && (
                  <>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3 sm:pt-0.5">Detail</dt>
                    <dd className="text-ink-2 text-pretty">{e.detail}</dd>
                  </>
                )}
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3 sm:pt-0.5">When</dt>
                <dd className="font-mono text-[12px] tabular text-ink-2">{fmtDateTime(e.created_at)}</dd>
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3 sm:pt-0.5">Saved</dt>
                <dd className="font-mono text-[12px] tabular text-ink-2">{e.saved_minutes > 0 ? `${e.saved_minutes} minutes of office time` : 'Waiting on you, so nothing yet'}</dd>
              </dl>
              {href && (
                <div className="mt-3 border-t border-dashed border-line pt-3">
                  <Link href={href} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-2 hover:text-ink">
                    Open the record <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
