'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Plus, Search } from 'lucide-react';
import type { Load } from '@/lib/data';
import { customerById, customers, driverById, loads, missingDocs } from '@/lib/data';
import { ago, cn, fmtDate, int, money } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Avatar, Button, Card, DataTable, Field, Input, Select, Sheet, StatTile, StatusPill, Segmented, toast, type Column } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { RouteRibbon } from '@/components/app/route-ribbon';
import { DocDots } from '@/components/app/doc-dots';
import { useSession } from '@/lib/store';

type Segment = 'all' | 'moving' | 'paperwork' | 'ready' | 'invoiced' | 'paid';

const SEGMENT_FROM_STATUS: Record<string, Segment> = {
  all: 'all',
  moving: 'moving',
  in_transit: 'moving',
  paperwork: 'paperwork',
  docs_pending: 'paperwork',
  validation_failed: 'paperwork',
  delivered: 'paperwork',
  ready: 'ready',
  ready_to_invoice: 'ready',
  invoiced: 'invoiced',
  paid: 'paid',
};

const waitingOnPaperwork = (l: Load) => l.deliveredAt !== null && missingDocs(l).length > 0;

const inSegment = (l: Load, s: Segment) => {
  switch (s) {
    case 'all': return true;
    case 'moving': return l.status === 'in_transit';
    case 'paperwork': return l.status === 'docs_pending' || l.status === 'validation_failed' || (l.status === 'delivered' && missingDocs(l).length > 0);
    case 'ready': return l.status === 'ready_to_invoice';
    case 'invoiced': return l.status === 'invoiced';
    case 'paid': return l.status === 'paid';
  }
};

const transitProgress = (l: Load) => {
  const start = new Date(l.pickupAt).getTime();
  const end = new Date(l.deliverAt).getTime();
  // Quantised so server and client render the same marker position.
  return Math.round(Math.max(0.06, Math.min(0.94, (Date.now() - start) / (end - start))) * 50) / 50;
};

export default function LoadsPage() {
  return (
    <Suspense fallback={null}>
      <LoadsInner />
    </Suspense>
  );
}

function LoadsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [segment, setSegment] = useState<Segment>(() => SEGMENT_FROM_STATUS[params.get('status') ?? 'all'] ?? 'all');
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState('all');
  const [booking, setBooking] = useState(params.get('new') === '1');

  useEffect(() => {
    setBooking(params.get('new') === '1');
  }, [params]);

  const closeBooking = useCallback(() => {
    setBooking(false);
    if (params.get('new')) router.replace('/app/loads');
  }, [params, router]);

  // ── Header numbers ────────────────────────────────────────────────────────
  const moving = loads.filter((l) => l.status === 'in_transit');
  const waiting = loads.filter(waitingOnPaperwork).sort((a, b) => a.deliveredAt!.localeCompare(b.deliveredAt!));
  const ready = loads.filter((l) => l.status === 'ready_to_invoice');
  const readyTotal = ready.reduce((a, l) => a + l.rate + l.accessorials, 0);

  const billed = loads.filter((l) => l.status === 'paid' || l.status === 'invoiced').sort((a, b) => a.pickupAt.localeCompare(b.pickupAt));
  const rpm = billed.reduce((a, l) => a + l.rate, 0) / Math.max(1, billed.reduce((a, l) => a + l.miles, 0));
  const rpmSeries = billed.map((l) => l.rate / l.miles);

  const counts = useMemo(() => {
    const c: Record<Segment, number> = { all: 0, moving: 0, paperwork: 0, ready: 0, invoiced: 0, paid: 0 };
    for (const l of loads) for (const s of Object.keys(c) as Segment[]) if (inSegment(l, s)) c[s]++;
    return c;
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loads.filter((l) => {
      if (!inSegment(l, segment)) return false;
      if (customer !== 'all' && l.customerId !== customer) return false;
      if (!q) return true;
      const hay = [l.number, l.ref, l.origin, l.destination, l.commodity, customerById(l.customerId).name, driverById(l.driverId).name].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [segment, query, customer]);

  const columns: Column<Load>[] = [
    {
      key: 'load',
      header: 'Load',
      width: '200px',
      sortValue: (l) => l.number,
      render: (l) => (
        <div className="min-w-0">
          <div className="font-mono text-[12.5px] font-semibold text-ink">{l.number}</div>
          <div className="truncate text-xs text-ink-3">{customerById(l.customerId).name}</div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      hideBelow: 'md',
      render: (l) =>
        l.status === 'in_transit' ? (
          <div className="min-w-[200px] max-w-[280px]">
            <div className="flex justify-between font-mono text-[10.5px] text-ink-3">
              <span>{l.origin}</span>
              <span>{l.destination}</span>
            </div>
            <RouteRibbon compact origin={l.origin} destination={l.destination} progress={transitProgress(l)} />
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-ink-2">
            {l.origin}
            <ArrowRight className="h-3 w-3 text-ink-4" />
            {l.destination}
          </span>
        ),
    },
    {
      key: 'driver',
      header: 'Driver',
      hideBelow: 'lg',
      sortValue: (l) => driverById(l.driverId).name,
      render: (l) => {
        const d = driverById(l.driverId);
        return (
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px]">
            <Avatar name={d.name} size="xs" />
            {d.name}
          </span>
        );
      },
    },
    {
      key: 'dates',
      header: 'Dates',
      hideBelow: 'xl',
      sortValue: (l) => l.pickupAt,
      render: (l) => (
        <span className="whitespace-nowrap font-mono text-[11.5px] tabular text-ink-2">
          {fmtDate(l.pickupAt)} <span className="text-ink-4">→</span> {fmtDate(l.deliverAt)}
        </span>
      ),
    },
    {
      key: 'docs',
      header: 'Paperwork',
      hideBelow: 'sm',
      sortValue: (l) => missingDocs(l).length,
      render: (l) => <DocDots docs={l.docs} />,
    },
    {
      key: 'rate',
      header: 'Rate',
      align: 'right',
      sortValue: (l) => l.rate + l.accessorials,
      render: (l) => (
        <div className="whitespace-nowrap">
          <div className="tabular text-[13px] font-medium text-ink">{money(l.rate)}</div>
          {l.accessorials > 0 && <div className="font-mono text-[10.5px] tabular text-ink-3">+{money(l.accessorials)}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (l) => l.status,
      render: (l) => <StatusPill status={l.status} size="sm" />,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Loads"
        title={
          <>
            {loads.length} loads, <em>{moving.length}</em> moving.
          </>
        }
        summary={
          <>
            <span className="font-medium text-ink">{waiting.length}</span> {waiting.length === 1 ? 'is' : 'are'} missing paperwork and{' '}
            <span className="font-medium text-ink">{ready.length}</span> {ready.length === 1 ? 'is' : 'are'} ready to bill, worth{' '}
            <span className="font-medium text-good">{money(readyTotal)}</span>.
          </>
        }
        actions={
          <Button size="sm" onClick={() => setBooking(true)}>
            <Plus className="h-4 w-4" /> Book a load
          </Button>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
        <Item className="lg:col-span-4">
          <StatTile
            label="Ready to bill"
            value={readyTotal}
            format={(v) => money(v)}
            tone="good"
            footer={
              <>
                {ready.length} {ready.length === 1 ? 'packet' : 'packets'} complete ·{' '}
                <button onClick={() => setSegment('ready')} className="font-medium text-ink-2 hover:text-ink">
                  Show them
                </button>
              </>
            }
          />
        </Item>
        <Item className="lg:col-span-4">
          <StatTile
            label="Waiting on paperwork"
            value={waiting.length}
            tone={waiting.length ? 'warn' : 'neutral'}
            suffix={waiting.length === 1 ? 'load' : 'loads'}
            footer={
              waiting.length ? (
                <>
                  Oldest is <span className="font-mono text-ink-2">{waiting[0].number}</span>, delivered {ago(waiting[0].deliveredAt!)}
                </>
              ) : (
                'Every delivered load has its packet.'
              )
            }
          />
        </Item>
        <Item className="lg:col-span-4">
          <StatTile
            label="Rate per mile this month"
            value={rpm}
            prefix="$"
            suffix="/mi"
            format={(v) => v.toFixed(2)}
            spark={rpmSeries}
            footer={`Across ${billed.length} invoiced and paid loads, ${int(billed.reduce((a, l) => a + l.miles, 0))} miles`}
          />
        </Item>

        <Item className="lg:col-span-12">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
              <Segmented<Segment>
                value={segment}
                onChange={setSegment}
                options={(
                  [
                    ['all', 'All'],
                    ['moving', 'Moving'],
                    ['paperwork', 'Needs paperwork'],
                    ['ready', 'Ready to bill'],
                    ['invoiced', 'Invoiced'],
                    ['paid', 'Paid'],
                  ] as [Segment, string][]
                ).map(([value, label]) => ({ value, label: <span className="whitespace-nowrap">{label}</span>, count: counts[value] }))}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 lg:w-64">
                <Input leading={<Search className="h-4 w-4" />} placeholder="Search loads, refs, lanes" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="w-44 shrink-0 sm:w-52">
                <Select value={customer} onChange={(e) => setCustomer(e.target.value)} aria-label="Customer">
                  <option value="all">All customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden">
            <DataTable
              rows={rows}
              columns={columns}
              onRowClick={(l) => router.push(`/app/loads/${l.id}`)}
              initialSort={{ key: 'dates', dir: 'desc' }}
              empty={
                <div className="px-4 py-14 text-center">
                  <p className="text-[15px] font-semibold text-ink">Nothing matches</p>
                  <p className="mt-1 text-[13px] text-ink-3">Try another segment or clear the search.</p>
                </div>
              }
            />
          </Card>
          <p className="mt-2 px-1 text-xs text-ink-4">
            {rows.length} of {loads.length} loads · click a row to open it
          </p>
        </Item>
      </Stagger>

      <BookLoadSheet open={booking} onClose={closeBooking} />
    </>
  );
}

function BookLoadSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { policies } = useSession();
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const customer = customerById(String(fd.get('customer')));
    const origin = String(fd.get('origin') || '').trim();
    const destination = String(fd.get('destination') || '').trim();
    const rate = Number(fd.get('rate') || 0);
    toast.success('Load booked', `${origin} → ${destination} for ${customer.name}${rate ? ` at ${money(rate)}` : ''}. Autopilot is watching for the rate confirmation.`);
    onClose();
  };

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 864e5).toISOString().slice(0, 10);

  return (
    <Sheet open={open} onClose={onClose} title="Book a load" description="Autopilot will match the rate confirmation when it arrives and text the driver at pickup.">
      <form id="book-load" onSubmit={submit} className="space-y-4">
        <Field label="Customer" htmlFor="bl-customer">
          <Select id="bl-customer" name="customer" defaultValue={customers[0].id} required>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Origin" htmlFor="bl-origin">
            <Input id="bl-origin" name="origin" placeholder="Dallas, TX" required />
          </Field>
          <Field label="Destination" htmlFor="bl-destination">
            <Input id="bl-destination" name="destination" placeholder="Atlanta, GA" required />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pickup date" htmlFor="bl-pickup">
            <Input id="bl-pickup" name="pickup" type="date" defaultValue={tomorrow} className="font-mono text-[13px]" required />
          </Field>
          <Field label="Rate" htmlFor="bl-rate" hint="Linehaul only. Accessorials come from the paperwork.">
            <Input id="bl-rate" name="rate" type="number" inputMode="decimal" min={0} step={10} placeholder="2,140" className="font-mono tabular" leading={<span className="text-sm">$</span>} />
          </Field>
        </div>
        <Field label="Customer reference" htmlFor="bl-ref" hint="From the rate confirmation, if you have it already.">
          <Input id="bl-ref" name="ref" placeholder="GFS-4394" className="font-mono text-[13px]" />
        </Field>
        <div className={cn('rounded-[14px] border border-line bg-surface-2/60 p-3 text-xs text-ink-3')}>
          Under your policies, Autopilot will chase the POD {policies.pod_chase_hours} hours after delivery and send the invoice itself if the packet is complete and the total is under {money(policies.auto_invoice_max_amount)}.
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Book it</Button>
        </div>
      </form>
      <p className="mt-6 text-center text-xs text-ink-4">
        Prefer a spreadsheet?{' '}
        <Link href="/app/settings" className="font-medium text-ink-3 hover:text-ink">
          Import loads
        </Link>
      </p>
    </Sheet>
  );
}
