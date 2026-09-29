'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, Bell, Check, Download, Wallet, Zap } from 'lucide-react';
import { ago, cn, fmtDate, int, money, moneyExact } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, DataTable, Eyebrow, EmptyState, Segmented, Sheet, StatusPill, Switch, Tabs, type Column } from '@/components/ui';
import { Sparkline } from '@/components/ui/sparkline';
import { NumberTicker } from '@/components/motion/number-ticker';
import { Stagger, Item } from '@/components/motion/reveal';
import { EventRow } from '@/components/app/event-row';
import { ChartTooltip, Legend } from '@/components/charts/chart-tooltip';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/lib/store';
import { autopilotEvents, cashSeries, customerById, customers, driverById, invoices, loadById, settlements, type Customer, type Invoice, type Settlement } from '@/lib/data';

type Tab = 'overview' | 'invoices' | 'settlements' | 'customers';
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'settlements', label: 'Settlements' },
  { value: 'customers', label: 'Customers' },
];

const DAY = 864e5;
const daysUntil = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / DAY);

/** "in 3d" / "3d late" / "today" as a mono tag, bad tone when late. */
function RelativeTag({ iso, paid }: { iso: string; paid?: boolean }) {
  const d = daysUntil(iso);
  if (paid) return <span className="font-mono text-[11px] tabular text-ink-4">landed</span>;
  const late = d < 0;
  return (
    <span className={cn('rounded-[6px] px-1.5 py-0.5 font-mono text-[10.5px] tabular', late ? 'bg-bad-soft text-bad' : d <= 3 ? 'bg-good-soft text-good' : 'bg-surface-2 text-ink-3')}>
      {d === 0 ? 'today' : late ? `${-d}d late` : `in ${d}d`}
    </span>
  );
}

export default function MoneyPage() {
  return (
    <Suspense fallback={null}>
      <Money />
    </Suspense>
  );
}

function Money() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tabParam = params.get('tab');
  const tab: Tab = TABS.some((t) => t.value === tabParam) ? (tabParam as Tab) : 'overview';
  const setTab = (t: Tab) => router.replace(t === 'overview' ? pathname : `${pathname}?tab=${t}`, { scroll: false });

  const unpaid = invoices.filter((i) => i.status !== 'paid');
  const outstanding = unpaid.reduce((a, i) => a + i.amount, 0);
  const landingWeek = unpaid.filter((i) => daysUntil(i.expectedAt) <= 7).reduce((a, i) => a + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === 'overdue');

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Cash, invoices, settlements."
        summary={
          <>
            <span className="font-medium text-ink">{money(outstanding)}</span> outstanding across {unpaid.length} invoices.{' '}
            <span className="font-medium text-good">{money(landingWeek)}</span> lands this week.{' '}
            {overdue.length ? (
              <>
                <span className="font-medium text-bad">{overdue.length} overdue</span>.
              </>
            ) : (
              'Nothing overdue.'
            )}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => toast.info('Export started', 'Invoices and settlements as CSV. It will land in your email.')}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setTab('invoices')}>
              Review invoices
            </Button>
          </>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => ({ ...t, count: t.value === 'invoices' ? unpaid.length : t.value === 'settlements' ? settlements.filter((s) => s.status === 'review' || s.status === 'draft').length : undefined }))} className="mb-6" />

      {tab === 'overview' && <Overview unpaid={unpaid} />}
      {tab === 'invoices' && <Invoices />}
      {tab === 'settlements' && <Settlements />}
      {tab === 'customers' && <Customers />}
    </>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function Overview({ unpaid }: { unpaid: Invoice[] }) {
  const { policies } = useSession();
  const cashNow = cashSeries[cashSeries.length - 1] * 1000;

  const forecast = useMemo(() => {
    const rows: { day: number; cash: number }[] = [];
    for (let d = 0; d <= 30; d++) {
      const landed = unpaid.filter((i) => daysUntil(i.expectedAt) <= d).reduce((a, i) => a + i.amount, 0);
      rows.push({ day: d, cash: cashNow + landed });
    }
    return rows;
  }, [unpaid, cashNow]);
  const forecastEnd = forecast[forecast.length - 1].cash;

  const slowest = [...customers].sort((a, b) => b.avgDaysToPay - a.avgDaysToPay);
  const maxDays = Math.max(...customers.map((c) => Math.max(c.avgDaysToPay, c.termsDays))) * 1.1;

  const aging = useMemo(() => {
    const buckets = [
      { label: 'Current', amount: 0, opacity: 1 },
      { label: '1–30', amount: 0, opacity: 0.75 },
      { label: '31–60', amount: 0, opacity: 0.5 },
      { label: '60+', amount: 0, opacity: 0.3 },
    ];
    for (const i of unpaid) {
      const past = -daysUntil(i.dueAt);
      const idx = past <= 0 ? 0 : past <= 30 ? 1 : past <= 60 ? 2 : 3;
      buckets[idx].amount += i.amount;
    }
    return buckets;
  }, [unpaid]);
  const agingTotal = aging.reduce((a, b) => a + b.amount, 0);

  const moneyEvents = autopilotEvents.filter((e) => ['invoice_sent', 'quick_pay_routed', 'payment_received', 'settlement_generated'].includes(e.kind) && new Date(e.created_at) > new Date(Date.now() - 7 * DAY));
  const savedMinutes = moneyEvents.reduce((a, e) => a + e.saved_minutes, 0);

  return (
    <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
      {/* Cash position */}
      <Item className="lg:col-span-5">
        <Card className="relative h-full overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-signal/10 blur-3xl" />
          <CardHeader eyebrow="Cash position" title="In the bank today" description="Twelve weeks behind you, thirty days ahead." />
          <CardBody>
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-baseline gap-1 tabular text-[44px] font-semibold leading-none tracking-[-0.035em] text-ink">
                <span className="text-2xl text-ink-3">$</span>
                <NumberTicker value={cashNow} />
              </div>
              <div className="h-10 w-32 shrink-0 opacity-90">
                <Sparkline data={cashSeries} tone="signal" />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <div>
                <Eyebrow>30-day forecast</Eyebrow>
                <p className="text-[13px] text-ink-3">
                  <span className="font-semibold tabular text-ink">{money(forecastEnd)}</span> if every expected invoice lands on time.
                </p>
              </div>
              <Legend items={[{ label: 'Cash', color: 'var(--series-1)' }]} />
            </div>
            <div className="mt-2 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashfc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} ticks={[0, 7, 14, 21, 30]} tickFormatter={(v: number) => (v === 0 ? 'Today' : `+${v}d`)} />
                  <YAxis tickLine={false} axisLine={false} width={48} domain={['dataMin - 1000', 'dataMax + 1000']} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tickCount={4} />
                  <Tooltip content={<ChartTooltip format={(v) => money(v)} labelFormat={(l) => (Number(l) === 0 ? 'Today' : fmtDate(new Date(Date.now() + Number(l) * DAY)))} />} cursor={{ stroke: 'var(--line-strong)' }} />
                  <Area type="stepAfter" dataKey="cash" name="Cash" stroke="var(--series-1)" strokeWidth={2} fill="url(#cashfc)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </Item>

      {/* Days to cash */}
      <Item className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader
            eyebrow="Days to cash"
            title="Who pays slow"
            description="Average days to pay against their terms. Slowest first."
            aside={<Legend items={[{ label: 'Avg days', color: 'var(--series-2)' }, { label: 'Terms', color: 'var(--ink-3)' }]} />}
          />
          <CardBody className="space-y-4">
            {slowest.map((c) => {
              const slow = c.avgDaysToPay > policies.quick_pay_min_days;
              const over = c.avgDaysToPay - c.termsDays;
              return (
                <div key={c.id}>
                  <div className="mb-1.5 flex items-start justify-between gap-2 text-[13px]">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-ink">{c.name}</span>
                      {slow && !c.quickPay && (
                        <Badge tone="mind" size="sm">
                          <Zap className="h-3 w-3" /> Route to quick-pay
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-[11.5px] tabular text-ink-3">
                      <span className="font-semibold text-ink">{c.avgDaysToPay}d</span>
                      <span className={cn('ml-1.5', over > 0 ? 'text-bad' : 'text-good')}>{over > 0 ? `+${over}` : over}</span>
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-visible rounded-[3px] bg-surface-2">
                    <div className="absolute inset-y-0 left-0 rounded-[3px]" style={{ width: `${(c.avgDaysToPay / maxDays) * 100}%`, background: 'var(--series-2)' }} />
                    <div className="absolute -inset-y-1 w-px bg-ink-3" style={{ left: `${(c.termsDays / maxDays) * 100}%` }} title={`Terms: net ${c.termsDays}`} />
                  </div>
                </div>
              );
            })}
            <p className="pt-1 text-xs text-ink-4">Autopilot routes to quick-pay when terms exceed {policies.quick_pay_min_days} days.</p>
          </CardBody>
        </Card>
      </Item>

      {/* Aging */}
      <Item className="lg:col-span-3">
        <Card className="h-full">
          <CardHeader eyebrow="Aging" title="Unpaid by age" description={`${money(agingTotal)} open`} />
          <CardBody>
            <div className="flex h-4 w-full gap-[2px] overflow-hidden rounded-[4px]">
              {aging.filter((b) => b.amount > 0).map((b) => (
                <div key={b.label} className="h-full rounded-[2px] transition-[width]" style={{ width: `${(b.amount / agingTotal) * 100}%`, background: 'var(--series-2)', opacity: b.opacity }} title={`${b.label}: ${money(b.amount)}`} />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {aging.map((b) => (
                <li key={b.label} className="flex items-center gap-2.5 text-[13px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: 'var(--series-2)', opacity: b.opacity }} />
                  <span className="text-ink-3">{b.label === 'Current' ? 'Current' : `${b.label} days past due`}</span>
                  <span className={cn('ml-auto font-medium tabular', b.amount ? 'text-ink' : 'text-ink-4')}>{b.amount ? money(b.amount) : '—'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-ink-4">
              {aging[0].amount === agingTotal ? 'Nothing past due.' : `${Math.round(((agingTotal - aging[0].amount) / agingTotal) * 100)}% of open money is past due.`}
            </p>
          </CardBody>
        </Card>
      </Item>

      {/* Autopilot money receipts */}
      <Item className="lg:col-span-12">
        <Card>
          <CardHeader
            eyebrow="Autopilot"
            title="What Autopilot did with money this week"
            description={`${moneyEvents.length} actions, ${savedMinutes} minutes you did not spend on billing.`}
            aside={
              <Link href="/app/autopilot" className="text-xs font-medium text-ink-3 hover:text-ink">
                Ledger →
              </Link>
            }
          />
          <CardBody className="grid grid-cols-1 gap-x-8 pt-0 md:grid-cols-2">
            {moneyEvents.length === 0 && <EmptyState title="Nothing moved" description="No invoices, payments or settlements this week." />}
            {moneyEvents.map((e) => (
              <div key={e.id} className="border-b border-line-soft last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
                <EventRow e={e} />
              </div>
            ))}
          </CardBody>
        </Card>
      </Item>
    </Stagger>
  );
}

// ─── Invoices ────────────────────────────────────────────────────────────────

type InvoiceFilter = 'all' | 'sent' | 'quick_pay' | 'overdue' | 'paid';

function Invoices() {
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);
  const open = invoices.find((i) => i.id === openId) ?? null;
  const count = (s: InvoiceFilter) => (s === 'all' ? invoices.length : invoices.filter((i) => i.status === s).length);

  const columns: Column<Invoice>[] = [
    { key: 'number', header: 'Invoice', sortValue: (r) => r.number, render: (r) => <span className="font-mono text-[12.5px] font-semibold text-ink">{r.number}</span> },
    {
      key: 'load',
      header: 'Load',
      hideBelow: 'md',
      render: (r) => {
        const l = loadById(r.loadId);
        return l ? (
          <Link href={`/app/loads/${l.id}`} onClick={(e) => e.stopPropagation()} className="group/l inline-flex items-center gap-1 font-mono text-[12px] text-ink-2 hover:text-ink">
            {l.number}
            <ArrowUpRight className="h-3 w-3 text-ink-4 opacity-0 transition-opacity group-hover/l:opacity-100" />
          </Link>
        ) : (
          <span className="text-ink-4">—</span>
        );
      },
    },
    { key: 'customer', header: 'Customer', sortValue: (r) => customerById(r.customerId).name, render: (r) => <span className="text-ink">{customerById(r.customerId).name}</span> },
    { key: 'amount', header: 'Amount', align: 'right', sortValue: (r) => r.amount, render: (r) => <span className="font-medium tabular text-ink">{money(r.amount)}</span> },
    { key: 'issued', header: 'Issued', hideBelow: 'lg', sortValue: (r) => r.issuedAt, render: (r) => <span className="font-mono text-[12px] text-ink-3">{fmtDate(r.issuedAt)}</span> },
    {
      key: 'expected',
      header: 'Expected',
      sortValue: (r) => r.expectedAt,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[12px] text-ink-2">{fmtDate(r.paidAt ?? r.expectedAt)}</span>
          <RelativeTag iso={r.expectedAt} paid={r.status === 'paid'} />
        </span>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      hideBelow: 'sm',
      render: (r) => (
        <Badge tone={r.channel === 'factor' ? 'mind' : r.channel === 'portal' ? 'info' : 'neutral'} size="sm">
          {r.channel === 'factor' ? 'Factor' : r.channel === 'portal' ? 'Portal' : 'Email'}
        </Badge>
      ),
    },
    { key: 'status', header: 'Status', align: 'right', sortValue: (r) => r.status, render: (r) => <StatusPill status={r.status} size="sm" /> },
  ];

  return (
    <Stagger className="space-y-4" stagger={0.05}>
      <Item>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<InvoiceFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: count('all') },
              { value: 'sent', label: 'Sent', count: count('sent') },
              { value: 'quick_pay', label: 'Quick-pay', count: count('quick_pay') },
              { value: 'overdue', label: 'Overdue', count: count('overdue') },
              { value: 'paid', label: 'Paid', count: count('paid') },
            ]}
          />
          <span className="font-mono text-[11.5px] tabular text-ink-3">
            {rows.length} invoices · {money(rows.reduce((a, i) => a + i.amount, 0))}
          </span>
        </div>
      </Item>
      <Item>
        <Card>
          <DataTable rows={rows} columns={columns} onRowClick={(r) => setOpenId(r.id)} selectedId={openId} initialSort={{ key: 'expected', dir: 'asc' }} empty={<EmptyState title="Nothing to chase" description="No invoices match this filter." />} />
        </Card>
      </Item>
      <InvoiceSheet invoice={open} onClose={() => setOpenId(null)} />
    </Stagger>
  );
}

function InvoiceSheet({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const i = invoice;
  const load = i ? loadById(i.loadId) : undefined;
  const customer = i ? customerById(i.customerId) : null;
  const sentAt = i ? new Date(new Date(i.issuedAt).getTime() + 2 * 3600e3).toISOString() : null;
  const steps = i
    ? [
        { label: 'Issued', at: i.issuedAt, done: true },
        { label: i.channel === 'factor' ? 'Routed to factor' : i.channel === 'portal' ? 'Uploaded to portal' : 'Sent by email', at: sentAt!, done: true },
        { label: 'Expected', at: i.expectedAt, done: i.status === 'paid' || daysUntil(i.expectedAt) < 0, late: i.status !== 'paid' && daysUntil(i.expectedAt) < 0 },
        { label: 'Paid', at: i.paidAt, done: i.status === 'paid' },
      ]
    : [];

  return (
    <Sheet
      open={!!i}
      onClose={onClose}
      title={
        i && (
          <span className="flex items-center gap-2.5">
            <span className="font-mono">{i.number}</span>
            <StatusPill status={i.status} size="sm" />
          </span>
        )
      }
      description={i && customer ? `${customer.name} · ${load?.origin} → ${load?.destination}` : undefined}
      footer={
        i && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {i.status !== 'paid' && (
              <Button variant="secondary" size="sm" onClick={() => toast.success('Reminder queued', `${customer?.name} will get a polite nudge about ${i.number} at 9am.`)}>
                <Bell className="h-3.5 w-3.5" /> Send reminder
              </Button>
            )}
            {i.status !== 'paid' && i.channel !== 'factor' && (
              <Button variant="secondary" size="sm" onClick={() => toast.success('Routed to quick-pay', `${i.number} lands tomorrow for a 2.5% fee (${moneyExact(i.amount * 0.025)}).`)}>
                <Zap className="h-3.5 w-3.5 text-mind" /> Route to quick-pay
              </Button>
            )}
            {i.status !== 'paid' && (
              <Button size="sm" onClick={() => { toast.success('Marked paid', `${money(i.amount)} matched to ${i.number}. ${load?.number ?? ''} is closed.`); onClose(); }}>
                <Check className="h-3.5 w-3.5" /> Mark paid
              </Button>
            )}
          </div>
        )
      }
    >
      {i && customer && (
        <div className="space-y-6">
          <div className="surface-2 flex items-end justify-between gap-4 p-4">
            <div>
              <Eyebrow>Amount</Eyebrow>
              <div className="tabular text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">{money(i.amount)}</div>
            </div>
            <div className="text-right">
              <Eyebrow>{i.status === 'paid' ? 'Landed' : 'Expected'}</Eyebrow>
              <div className="flex items-center justify-end gap-2">
                <span className="font-mono text-[13px] text-ink">{fmtDate(i.paidAt ?? i.expectedAt, 'MMM d, yyyy')}</span>
                <RelativeTag iso={i.expectedAt} paid={i.status === 'paid'} />
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px] sm:grid-cols-3">
            <Fact label="Load">{load ? <Link href={`/app/loads/${load.id}`} className="font-mono text-ink hover:underline">{load.number}</Link> : '—'}</Fact>
            <Fact label="Reference"><span className="font-mono">{load?.ref ?? '—'}</span></Fact>
            <Fact label="Channel"><Badge tone={i.channel === 'factor' ? 'mind' : i.channel === 'portal' ? 'info' : 'neutral'} size="sm">{i.channel === 'factor' ? 'Factor' : i.channel === 'portal' ? 'Portal' : 'Email'}</Badge></Fact>
            <Fact label="Terms"><span className="tabular">Net {customer.termsDays}</span></Fact>
            <Fact label="Due"><span className="font-mono">{fmtDate(i.dueAt, 'MMM d, yyyy')}</span></Fact>
            <Fact label="AP contact"><span className="truncate font-mono text-[12px]">{customer.apEmail}</span></Fact>
            <Fact label="Driver">{load ? driverById(load.driverId).name : '—'}</Fact>
            <Fact label="Miles"><span className="tabular">{load ? int(load.miles) : '—'}</span></Fact>
            <Fact label="Avg days to pay"><span className={cn('tabular', customer.avgDaysToPay > customer.termsDays ? 'text-bad' : 'text-good')}>{customer.avgDaysToPay}d</span></Fact>
          </dl>

          <div>
            <Eyebrow>Timeline</Eyebrow>
            <ol className="relative ml-1.5 border-l border-line pl-5">
              {steps.map((s, idx) => (
                <li key={s.label} className={cn('relative pb-4 last:pb-0', !s.done && 'opacity-70')}>
                  <span className={cn('absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full border-2 bg-bg', s.late ? 'border-bad' : s.done ? 'border-signal' : 'border-line-strong')}>
                    {s.done && !s.late && <span className="h-1 w-1 rounded-full bg-signal" />}
                  </span>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={cn('text-[13px] font-medium', s.done ? 'text-ink' : 'text-ink-3')}>{s.label}</span>
                    <span className="font-mono text-[11.5px] tabular text-ink-3">{s.at ? `${fmtDate(s.at)} · ${idx < 2 ? ago(s.at) : daysUntil(s.at) >= 0 ? `in ${daysUntil(s.at)}d` : ago(s.at)}` : 'not yet'}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {load && (
            <div>
              <Eyebrow>Packet</Eyebrow>
              <div className="flex flex-wrap gap-1.5">
                {load.docs.map((d) => (
                  <Badge key={d} tone="good" size="sm">
                    <Check className="h-3 w-3" /> {d}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{label}</dt>
      <dd className="mt-1 truncate text-ink-2">{children}</dd>
    </div>
  );
}

// ─── Settlements ─────────────────────────────────────────────────────────────

function Settlements() {
  const { policies } = useSession();
  const [approved, setApproved] = useState<string[]>([]);
  const latestStart = settlements.map((s) => s.periodStart).sort().reverse()[0];
  const current = settlements.filter((s) => s.periodStart === latestStart);
  const periodLabel = current.length ? `${fmtDate(current[0].periodStart)} – ${fmtDate(current[0].periodEnd)}` : '';
  const settlementDay = policies.settlement_day.charAt(0).toUpperCase() + policies.settlement_day.slice(1);
  const status = (s: Settlement) => (approved.includes(s.id) ? 'approved' : s.status);

  const approve = (s: Settlement) => {
    setApproved((a) => [...a, s.id]);
    toast.success(`Approved ${money(s.net)}`, `${driverById(s.driverId).name.split(' ')[0]}’s settlement pays out ${settlementDay}.`);
  };

  const columns: Column<Settlement>[] = [
    { key: 'period', header: 'Period', sortValue: (r) => r.periodStart, render: (r) => <span className="font-mono text-[12px] text-ink-2">{fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}</span> },
    {
      key: 'driver',
      header: 'Driver',
      sortValue: (r) => driverById(r.driverId).name,
      render: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={driverById(r.driverId).name} size="xs" />
          <span className="text-ink">{driverById(r.driverId).name}</span>
        </span>
      ),
    },
    { key: 'loads', header: 'Loads', hideBelow: 'md', render: (r) => <span className="font-mono text-[12px] text-ink-3">{r.loads.map((l) => loadById(l)?.number ?? l).join(', ')}</span> },
    { key: 'miles', header: 'Miles', align: 'right', hideBelow: 'sm', sortValue: (r) => r.miles, render: (r) => <span className="tabular">{int(r.miles)}</span> },
    { key: 'gross', header: 'Gross', align: 'right', hideBelow: 'lg', sortValue: (r) => r.gross, render: (r) => <span className="tabular">{moneyExact(r.gross)}</span> },
    { key: 'deductions', header: 'Deductions', align: 'right', hideBelow: 'lg', render: (r) => <span className={cn('tabular', r.deductions.length ? 'text-ink-2' : 'text-ink-4')}>{r.deductions.length ? moneyExact(r.deductions.reduce((a, d) => a + d.amount, 0)) : '—'}</span> },
    { key: 'net', header: 'Net', align: 'right', sortValue: (r) => r.net, render: (r) => <span className="font-medium tabular text-ink">{moneyExact(r.net)}</span> },
    { key: 'status', header: 'Status', align: 'right', render: (r) => <StatusPill status={status(r)} size="sm" /> },
  ];

  return (
    <Stagger className="space-y-4" stagger={0.05}>
      <Item>
        <div className="flex items-center justify-between gap-3 px-0.5">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink-2">This period · {periodLabel}</h2>
          <span className="font-mono text-[11.5px] tabular text-ink-3">{current.length} drivers · {moneyExact(current.reduce((a, s) => a + s.net, 0))} net</span>
        </div>
      </Item>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {current.map((s) => {
          const d = driverById(s.driverId);
          const st = status(s);
          return (
            <Item key={s.id}>
              <Card className="flex h-full flex-col">
                <CardHeader
                  title={
                    <span className="flex items-center gap-2.5">
                      <Avatar name={d.name} size="sm" />
                      {d.name}
                    </span>
                  }
                  description={`${int(s.miles)} mi · ${s.loads.map((l) => loadById(l)?.number ?? l).join(', ')} · ${moneyExact(d.payPerMile)}/mi`}
                  aside={<StatusPill status={st} size="sm" />}
                />
                <CardBody className="flex flex-1 flex-col">
                  <dl className="space-y-1.5 text-[13px]">
                    <div className="flex justify-between">
                      <dt className="text-ink-3">Gross</dt>
                      <dd className="tabular text-ink-2">{moneyExact(s.gross)}</dd>
                    </div>
                    {s.deductions.map((x) => (
                      <div key={x.label} className="flex justify-between">
                        <dt className="text-ink-3">{x.label}</dt>
                        <dd className={cn('tabular', x.amount < 0 ? 'text-good' : 'text-ink-2')}>{x.amount < 0 ? `+${moneyExact(-x.amount)}` : `−${moneyExact(x.amount)}`}</dd>
                      </div>
                    ))}
                    {s.deductions.length === 0 && (
                      <div className="flex justify-between">
                        <dt className="text-ink-3">Deductions</dt>
                        <dd className="tabular text-ink-4">none</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-4 border-t border-line pt-4">
                    <Eyebrow>Net pay</Eyebrow>
                    <div className="tabular text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink">{moneyExact(s.net)}</div>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-5">
                    <Button size="sm" className="flex-1" disabled={st === 'approved' || st === 'paid'} onClick={() => approve(s)}>
                      <Check className="h-3.5 w-3.5" /> {st === 'approved' ? 'Approved' : `Approve ${money(s.net)}`}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.info(`Settlement ${s.id.toUpperCase()}`, 'The itemised statement opens in a new tab in the real app.')}>
                      Open
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Item>
          );
        })}
      </div>

      <Item>
        <div className="flex items-center gap-4 rounded-[16px] border border-line bg-surface-2/60 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-signal-soft text-signal">
            <Wallet className="h-4 w-4" />
          </span>
          <p className="text-[13px] text-ink-2">
            Autopilot drafts settlements every <span className="font-medium text-ink">{settlementDay}</span> from delivered loads and linked receipts. Approve here and drivers are paid the same day; anything waiting on a POD stays in draft.
          </p>
          <Link href="/app/autopilot" className="ml-auto shrink-0 text-xs font-medium text-ink-3 hover:text-ink">
            Policy →
          </Link>
        </div>
      </Item>

      <Item>
        <Card>
          <CardHeader eyebrow="All settlements" title="Every period" />
          <DataTable rows={settlements} columns={columns} initialSort={{ key: 'period', dir: 'desc' }} />
        </Card>
      </Item>
    </Stagger>
  );
}

// ─── Customers ───────────────────────────────────────────────────────────────

function Customers() {
  const [quick, setQuick] = useState<Record<string, boolean>>(() => Object.fromEntries(customers.map((c) => [c.id, c.quickPay])));
  const toggle = (c: Customer, v: boolean) => {
    setQuick((q) => ({ ...q, [c.id]: v }));
    toast.success(v ? 'Quick-pay enabled' : 'Quick-pay off', v ? `Autopilot may route ${c.name} invoices to the factor.` : `${c.name} invoices go out on normal terms.`);
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortValue: (r) => r.name,
      render: (r) => (
        <span className="flex items-center gap-2.5">
          <span className="text-ink">{r.name}</span>
          <Badge tone={r.type === 'broker' ? 'info' : 'neutral'} size="sm">
            {r.type === 'broker' ? 'Broker' : 'Shipper'}
          </Badge>
        </span>
      ),
    },
    { key: 'terms', header: 'Terms', align: 'right', hideBelow: 'sm', sortValue: (r) => r.termsDays, render: (r) => <span className="font-mono text-[12px] tabular">Net {r.termsDays}</span> },
    {
      key: 'avg',
      header: 'Avg days to pay',
      align: 'right',
      sortValue: (r) => r.avgDaysToPay,
      render: (r) => {
        const d = r.avgDaysToPay - r.termsDays;
        return (
          <span className="inline-flex items-center gap-2">
            <span className="font-medium tabular text-ink">{r.avgDaysToPay}d</span>
            <span className={cn('rounded-[6px] px-1.5 py-0.5 font-mono text-[10.5px] tabular', d > 0 ? 'bg-bad-soft text-bad' : 'bg-good-soft text-good')}>{d > 0 ? `+${d}` : d}</span>
          </span>
        );
      },
    },
    { key: 'loads', header: 'Loads · 90d', align: 'right', hideBelow: 'md', sortValue: (r) => r.loads90d, render: (r) => <span className="tabular">{r.loads90d}</span> },
    { key: 'revenue', header: 'Revenue · 90d', align: 'right', sortValue: (r) => r.revenue90d, render: (r) => <span className="font-medium tabular text-ink">{money(r.revenue90d)}</span> },
    { key: 'ap', header: 'AP', hideBelow: 'xl', render: (r) => <span className="font-mono text-[12px] text-ink-3">{r.apEmail}</span> },
    {
      key: 'quick',
      header: 'Quick-pay',
      align: 'right',
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Switch size="sm" checked={quick[r.id]} onChange={(v) => toggle(r, v)} label={`Quick-pay for ${r.name}`} />
        </span>
      ),
    },
  ];

  const total = customers.reduce((a, c) => a + c.revenue90d, 0);

  return (
    <Stagger className="space-y-4" stagger={0.05}>
      <Item>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-ink-3">
            {customers.length} customers · <span className="font-medium tabular text-ink">{money(total)}</span> in the last 90 days. Quick-pay eligibility lets Autopilot route slow payers to the factor.
          </p>
          <span className="font-mono text-[11.5px] tabular text-ink-3">{Object.values(quick).filter(Boolean).length} eligible</span>
        </div>
      </Item>
      <Item>
        <Card>
          <DataTable rows={customers} columns={columns} initialSort={{ key: 'revenue', dir: 'desc' }} />
        </Card>
      </Item>
    </Stagger>
  );
}
