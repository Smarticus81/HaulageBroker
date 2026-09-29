'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Copy, FileText, Landmark, MessageSquareText, PackageCheck, PackageOpen, Send, Truck } from 'lucide-react';
import type { AutopilotEvent, AutopilotPolicies } from '@haulage/types';
import type { DocType, Load } from '@/lib/data';
import { autopilotEvents, customerById, documents, driverById, invoices, loadById, missingDocs, REQUIRED_DOCS, trailers, truckById } from '@/lib/data';
import { ago, cn, fmtDate, fmtDateTime, int, money, moneyExact } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Avatar, AutopilotOrb, Badge, Button, Card, CardBody, CardHeader, EmptyState, Eyebrow, StatusPill, toast } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { RouteRibbon } from '@/components/app/route-ribbon';
import { EventRow } from '@/components/app/event-row';
import { DocDots, DOC_SOURCE_ICON, DOC_TAG, docTypeLabel } from '@/components/app/doc-dots';
import { useSession } from '@/lib/store';

type MilestoneState = 'done' | 'pending' | 'failed';
interface Milestone { key: string; at: string | null; title: string; meta: string; state: MilestoneState; icon: React.ElementType }
type TimelineEntry = { at: number; kind: 'milestone'; m: Milestone } | { at: number; kind: 'event'; e: AutopilotEvent };

const routeProgress = (l: Load) => {
  if (l.status === 'created') return 0;
  if (l.status !== 'in_transit') return 1;
  const start = new Date(l.pickupAt).getTime();
  const end = new Date(l.deliverAt).getTime();
  return Math.round(Math.max(0.06, Math.min(0.94, (Date.now() - start) / (end - start))) * 50) / 50;
};

export function LoadDetail({ id }: { id: string }) {
  const load = loadById(id);
  if (!load) {
    return (
      <Card className="mx-auto mt-10 max-w-lg">
        <EmptyState
          icon={Truck}
          title="No load by that number"
          description={`Nothing in your loads matches “${id}”. It may have been merged or you may have an old link.`}
          action={
            <Link href="/app/loads">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to loads
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }
  return <LoadDetailInner load={load} />;
}

function LoadDetailInner({ load }: { load: Load }) {
  const { policies } = useSession();
  const customer = customerById(load.customerId);
  const driver = driverById(load.driverId);
  const truck = truckById(load.truckId);
  const trailer = trailers.find((t) => t.id === load.trailerId);
  const invoice = invoices.find((i) => i.loadId === load.id) ?? null;
  const docs = documents.filter((d) => d.loadId === load.id);
  const missing = missingDocs(load);
  const complete = missing.length === 0;
  const total = load.rate + load.accessorials;
  const rpm = load.rate / load.miles;
  const delivered = load.deliveredAt !== null;
  const events = useMemo(
    () =>
      autopilotEvents.filter((e) => {
        if (e.entity_type === 'load') return e.entity_id === load.id;
        if (e.entity_type === 'invoice') return invoice?.id === e.entity_id;
        if (e.entity_type === 'document') return docs.some((d) => d.id === e.entity_id);
        return false;
      }),
    [load.id, invoice, docs],
  );
  const chases = events.filter((e) => e.kind === 'pod_chased').sort((a, b) => b.created_at.localeCompare(a.created_at));

  // ── Timeline ──────────────────────────────────────────────────────────────
  const milestones: Milestone[] = [
    { key: 'booked', at: null, title: `Booked with ${customer.name}`, meta: `Ref ${load.ref} · ${money(load.rate)} linehaul`, state: 'done', icon: FileText },
    {
      key: 'pickup',
      at: load.pickupAt,
      title: load.status === 'created' ? `Picks up in ${load.origin}` : `Picked up in ${load.origin}`,
      meta: fmtDateTime(load.pickupAt),
      state: load.status === 'created' ? 'pending' : 'done',
      icon: PackageOpen,
    },
    {
      key: 'delivered',
      at: load.deliveredAt,
      title: delivered ? `Delivered to ${load.destination}` : `Delivering to ${load.destination}`,
      meta: delivered ? fmtDateTime(load.deliveredAt!) : `Expected ${fmtDateTime(load.deliverAt)}`,
      state: delivered ? 'done' : 'pending',
      icon: PackageCheck,
    },
    {
      key: 'docs',
      at: complete ? docs.map((d) => d.uploadedAt).sort().at(-1) ?? load.deliveredAt : null,
      title: load.status === 'validation_failed' ? 'Packet complete, but the POD does not match' : complete ? 'Packet complete' : `Waiting on ${missing.map(docTypeLabel).join(' and ')}`,
      meta: complete ? `${REQUIRED_DOCS.map(docTypeLabel).join(', ')} on file` : delivered ? `Autopilot is chasing ${driver.name.split(' ')[0]} every ${policies.pod_chase_cadence_hours}h` : `Autopilot asks ${policies.pod_chase_hours}h after delivery`,
      state: load.status === 'validation_failed' ? 'failed' : complete ? 'done' : 'pending',
      icon: FileText,
    },
    {
      key: 'invoice',
      at: invoice ? (invoice.paidAt ?? invoice.issuedAt) : null,
      title: invoice?.paidAt ? `${customer.name} paid ${invoice.number}` : invoice ? `Sent ${invoice.number} to ${customer.name}` : 'Invoice',
      meta: invoice?.paidAt
        ? `${money(invoice.amount)} · ${fmtDate(invoice.paidAt)}, ${Math.round((new Date(invoice.paidAt).getTime() - new Date(invoice.issuedAt).getTime()) / 864e5)} days after sending`
        : invoice
          ? `${money(invoice.amount)} · due ${fmtDate(invoice.dueAt)} · expected ${fmtDate(invoice.expectedAt)}`
          : complete && load.status === 'ready_to_invoice'
            ? total <= policies.auto_invoice_max_amount
              ? `Autopilot will send ${money(total)}, under your ${money(policies.auto_invoice_max_amount)} limit`
              : `${money(total)} is over your ${money(policies.auto_invoice_max_amount)} limit, so it waits for you`
            : 'Goes out once the packet is complete',
      state: invoice ? 'done' : 'pending',
      icon: Landmark,
    },
  ];

  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    let last = 0;
    for (const m of milestones) {
      if (m.state === 'pending' && !m.at) continue;
      const at = m.at ? new Date(m.at).getTime() : last - 1;
      last = at;
      entries.push({ at, kind: 'milestone', m });
    }
    for (const e of events) entries.push({ at: new Date(e.created_at).getTime(), kind: 'event', e });
    entries.sort((a, b) => a.at - b.at);
    for (const m of milestones) if (m.state === 'pending' && !m.at) entries.push({ at: Infinity, kind: 'milestone', m });
    return entries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load.id, events]);

  const copyPacket = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/app/loads/${load.id}`);
      toast.success('Packet link copied', `${load.number} · ${customer.name} can open it without signing in.`);
    } catch {
      toast.info('Packet link', `${location.origin}/app/loads/${load.id}`);
    }
  };

  const requestDocs = () =>
    toast.success(`Asked ${driver.name.split(' ')[0]} for the ${missing.map(docTypeLabel).join(' and ')}`, `Texted ${driver.phone}. Autopilot will keep chasing every ${policies.pod_chase_cadence_hours}h.`);

  const sendInvoice = () => toast.success(`Invoice sent to ${customer.name}`, `${load.number} · ${money(total)} to ${customer.apEmail}. Expected in about ${customer.avgDaysToPay} days.`);

  const autopilotNext = autopilotCopy(load, { customer: customer.name, driver: driver.name.split(' ')[0], missing, total, invoice, policies, lastChase: chases[0]?.created_at ?? null, chaseCount: chases.length, quickPay: customer.quickPay, terms: customer.termsDays });

  return (
    <>
      <Link href="/app/loads" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-3 transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Loads
      </Link>
      <PageHeader
        eyebrow={`${customer.name} · Ref ${load.ref}`}
        title={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-2">
            <span style={{ fontFamily: 'var(--font-mono)' }} className="font-medium tracking-[-0.04em]">
              {load.number}
            </span>
            <span className="font-sans tracking-normal">
              <StatusPill status={load.status} size="lg" />
            </span>
          </span>
        }
        summary={
          <>
            {load.origin} → {load.destination} · <span className="tabular">{int(load.miles)}</span> mi · {load.commodity}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={copyPacket}>
              <Copy className="h-3.5 w-3.5" /> Copy packet link
            </Button>
            {!complete && (
              <Button variant="secondary" size="sm" onClick={requestDocs}>
                <MessageSquareText className="h-3.5 w-3.5" /> Request missing docs
              </Button>
            )}
            {invoice ? (
              <Link href="/app/money">
                <Button variant="secondary" size="sm">
                  <Landmark className="h-3.5 w-3.5" /> Open {invoice.number}
                </Button>
              </Link>
            ) : (
              <Button size="sm" disabled={!complete || load.status === 'validation_failed'} onClick={sendInvoice} title={complete ? undefined : `Missing ${missing.join(', ')}`}>
                <Send className="h-3.5 w-3.5" /> Send invoice
              </Button>
            )}
          </>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
        <Item className="space-y-4 lg:col-span-8">
          {/* Route */}
          <Card>
            <CardHeader
              eyebrow="Route"
              title={`${load.origin} to ${load.destination}`}
              description={load.status === 'in_transit' ? `${driver.name.split(' ')[0]} is on the road. Delivery expected ${fmtDateTime(load.deliverAt)}.` : load.status === 'created' ? `Picks up ${fmtDateTime(load.pickupAt)}.` : `Delivered ${ago(load.deliveredAt!)}.`}
              aside={<span className="font-mono text-[11.5px] tabular text-ink-3">{int(load.miles)} mi</span>}
            />
            <CardBody>
              <RouteRibbon origin={load.origin} destination={load.destination} progress={routeProgress(load)} className="px-1" />
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stop kind="Pickup" city={load.origin} at={load.pickupAt} done={load.status !== 'created'} />
                <Stop kind="Delivery" city={load.destination} at={load.deliveredAt ?? load.deliverAt} done={delivered} expected={!delivered} />
              </div>
            </CardBody>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader eyebrow="What happened" title="From booked to paid" description="Milestones from the load, receipts from Autopilot." />
            <CardBody>
              <ol className="relative ml-3.5 border-l border-line pl-6">
                {timeline.map((t, i) => (
                  <li key={t.kind === 'milestone' ? t.m.key : t.e.id} className={cn('relative', i < timeline.length - 1 && 'pb-5')}>
                    {t.kind === 'milestone' ? <MilestoneRow m={t.m} /> : (
                      <>
                        <span className="absolute -left-[30px] top-3 h-2 w-2 rounded-full border-2 border-surface bg-ink-4 ring-1 ring-line" />
                        <div className="-my-1 rounded-[12px] px-3 transition-colors hover:bg-surface-2/70">
                          <EventRow e={t.e} dense />
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          {/* Paperwork */}
          <Card>
            <CardHeader
              eyebrow="Paperwork packet"
              title={complete ? 'Packet complete' : `${missing.length} of ${REQUIRED_DOCS.length} still missing`}
              description={complete ? 'Everything the customer needs to pay is on file.' : `Autopilot asks ${driver.name.split(' ')[0]} for missing documents, then keeps asking every ${policies.pod_chase_cadence_hours} hours.`}
              aside={<DocDots docs={load.docs} size="md" />}
            />
            <CardBody className="divide-y divide-line-soft pt-0">
              {REQUIRED_DOCS.map((type) => (
                <PacketRow key={type} type={type} load={load} onRequest={requestDocs} />
              ))}
              {[...new Set<DocType>([...load.docs, ...docs.map((d) => d.type).filter((t): t is DocType => t in DOC_TAG)])]
                .filter((t) => !REQUIRED_DOCS.includes(t))
                .map((type) => (
                  <PacketRow key={type} type={type} load={load} extra onRequest={requestDocs} />
                ))}
            </CardBody>
          </Card>
        </Item>

        <Item className="space-y-4 lg:col-span-4">
          {/* Facts */}
          <Card>
            <CardHeader eyebrow="Facts" title="Who, what, how far" />
            <CardBody className="pt-0">
              <div className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-2/60 p-3">
                <Avatar name={driver.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-ink">{driver.name}</div>
                  <div className="truncate font-mono text-[11px] text-ink-3">{driver.phone}</div>
                </div>
                <Link href={`/app/compliance?subject=${driver.id}`} className="text-ink-4 hover:text-ink">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                <Fact label="Truck" value={`Unit ${truck.unit}`} sub={`${truck.year} ${truck.make} ${truck.model}`} />
                <Fact label="Trailer" value={trailer ? trailer.unit : '—'} sub={trailer ? `${trailer.type} · ${trailer.year}` : undefined} />
                <Fact label="Miles" value={int(load.miles)} mono />
                <Fact label="Weight" value={`${int(load.weightLbs)} lbs`} mono />
                <Fact label="Commodity" value={load.commodity} className="col-span-2" />
              </dl>
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
                <MoneyRow label="Linehaul" value={load.rate} />
                <MoneyRow label="Accessorials" value={load.accessorials} muted={load.accessorials === 0} />
                <MoneyRow label="Total" value={total} strong />
                <div className="flex items-baseline justify-between text-xs text-ink-3">
                  <dt>Rate per mile</dt>
                  <dd className="font-mono tabular">${rpm.toFixed(2)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader eyebrow="Customer" title={customer.name} aside={<Badge tone="outline" size="sm">{customer.type}</Badge>} />
            <CardBody className="pt-0">
              <dl className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Terms" value={`${customer.termsDays}d`} />
                <Stat label="Pays in" value={`${customer.avgDaysToPay}d`} tone={customer.avgDaysToPay > customer.termsDays + 7 ? 'warn' : 'ink'} />
                <Stat label="Quick-pay" value={customer.quickPay ? 'Yes' : 'No'} tone={customer.quickPay ? 'good' : 'ink'} />
              </dl>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-ink-3">
                <span className="truncate font-mono">{customer.apEmail}</span>
                <span className="shrink-0 tabular">{customer.loads90d} loads · 90d</span>
              </div>
            </CardBody>
          </Card>

          {/* Autopilot */}
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-signal/10 blur-3xl" />
            <CardHeader
              eyebrow="Autopilot on this load"
              title={autopilotNext.title}
              aside={<AutopilotOrb mode={policies.mode} size={10} active={autopilotNext.active} />}
            />
            <CardBody className="pt-0">
              <p className="text-[13px] leading-relaxed text-ink-2 text-pretty">{autopilotNext.body}</p>
              {autopilotNext.steps.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {autopilotNext.steps.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-xs text-ink-3">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/app/autopilot" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-ink">
                Policies <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardBody>
          </Card>
        </Item>
      </Stagger>
    </>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────────

function Stop({ kind, city, at, done, expected }: { kind: string; city: string; at: string; done: boolean; expected?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-line bg-surface-2/60 p-3">
      <span className={cn('mt-0.5 h-3 w-3 shrink-0 rounded-full border-2', done ? 'border-signal bg-signal' : 'border-line-strong bg-surface')} />
      <div className="min-w-0">
        <Eyebrow className="mb-0.5">{kind}</Eyebrow>
        <div className="truncate text-[13.5px] font-medium text-ink">{city}</div>
        <div className="font-mono text-[11px] tabular text-ink-3">
          {expected && 'ETA '}
          {fmtDateTime(at)}
        </div>
      </div>
    </div>
  );
}

function MilestoneRow({ m }: { m: Milestone }) {
  const Icon = m.icon;
  const tone = m.state === 'done' ? 'border-good bg-good-soft text-good' : m.state === 'failed' ? 'border-bad bg-bad-soft text-bad' : 'border-dashed border-line-strong bg-surface text-ink-4';
  return (
    <div className="flex items-start gap-3">
      <span className={cn('absolute -left-[38px] top-0 grid h-6 w-6 place-items-center rounded-full border ring-4 ring-surface', tone)}>
        <Icon className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn('text-[13.5px] font-medium leading-snug', m.state === 'pending' ? 'text-ink-3' : 'text-ink')}>{m.title}</p>
        <p className="mt-0.5 text-xs text-ink-3 text-pretty">{m.meta}</p>
      </div>
      {m.state === 'pending' && <Badge tone="outline" size="sm">Next</Badge>}
    </div>
  );
}

function PacketRow({ type, load, extra, onRequest }: { type: DocType; load: Load; extra?: boolean; onRequest: () => void }) {
  const doc = documents.find((d) => d.loadId === load.id && d.type === type);
  const onFile = doc !== undefined || load.docs.includes(type);
  const Icon = doc ? DOC_SOURCE_ICON[doc.source] : FileText;
  const body = (
    <div className="flex items-center gap-3 py-3">
      <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-[10px]', onFile ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn')}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-ink">{docTypeLabel(type)}</span>
          {extra && <Badge tone="outline" size="sm">Extra</Badge>}
        </div>
        <div className="truncate font-mono text-[11px] text-ink-3">
          {doc ? `${doc.filename} · ${doc.uploadedBy} · ${ago(doc.uploadedAt)}` : onFile ? 'On file' : 'Not received'}
        </div>
      </div>
      {onFile ? (
        doc ? (
          <span className="inline-flex items-center gap-1.5">
            <StatusPill status={doc.status} size="sm" />
            <ArrowUpRight className="h-3.5 w-3.5 text-ink-4" />
          </span>
        ) : (
          <Badge tone="good" size="sm" dot>On file</Badge>
        )
      ) : (
        <Button variant="secondary" size="xs" onClick={onRequest}>
          Request
        </Button>
      )}
    </div>
  );
  return doc ? (
    <Link href={`/app/inbox/${doc.id}`} className="-mx-2 block rounded-[12px] px-2 transition-colors hover:bg-surface-2">
      {body}
    </Link>
  ) : (
    body
  );
}

function Fact({ label, value, sub, mono, className }: { label: string; value: string; sub?: string; mono?: boolean; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{label}</dt>
      <dd className={cn('mt-0.5 truncate font-medium text-ink', mono && 'font-mono tabular text-[12.5px]')}>{value}</dd>
      {sub && <dd className="truncate text-xs text-ink-3">{sub}</dd>}
    </div>
  );
}

function MoneyRow({ label, value, strong, muted }: { label: string; value: number; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between', muted && 'text-ink-4')}>
      <dt className={cn(strong ? 'font-medium text-ink' : 'text-ink-3')}>{label}</dt>
      <dd className={cn('tabular', strong ? 'text-[15px] font-semibold text-ink' : 'text-ink-2')}>{moneyExact(value)}</dd>
    </div>
  );
}

function Stat({ label, value, tone = 'ink' }: { label: string; value: string; tone?: 'ink' | 'good' | 'warn' }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface-2/60 px-2 py-2.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">{label}</dt>
      <dd className={cn('mt-1 text-[17px] font-semibold tabular tracking-[-0.02em]', tone === 'good' ? 'text-good' : tone === 'warn' ? 'text-warn' : 'text-ink')}>{value}</dd>
    </div>
  );
}

// ── Autopilot copy ───────────────────────────────────────────────────────────

function autopilotCopy(
  load: Load,
  ctx: {
    customer: string;
    driver: string;
    missing: DocType[];
    total: number;
    invoice: (typeof invoices)[number] | null;
    policies: AutopilotPolicies;
    lastChase: string | null;
    chaseCount: number;
    quickPay: boolean;
    terms: number;
  },
): { title: string; body: string; steps: string[]; active: boolean } {
  const { policies: p } = ctx;
  const limit = money(p.auto_invoice_max_amount);
  const underLimit = ctx.total <= p.auto_invoice_max_amount;
  const missingLabel = ctx.missing.map(docTypeLabel).join(' and ');
  switch (load.status) {
    case 'created':
      return {
        title: 'Waiting for pickup',
        body: `Will text ${ctx.driver} for the bill of lading at pickup and start the clock on delivery. Nothing for you to do yet.`,
        steps: [`Ask for the POD ${p.pod_chase_hours}h after delivery`, `Send the invoice itself if under ${limit}`],
        active: true,
      };
    case 'in_transit':
      return {
        title: 'Tracking delivery',
        body: `Delivery is expected ${fmtDateTime(load.deliverAt)}. ${ctx.missing.length ? `Once ${ctx.driver} delivers, Autopilot asks for the ${missingLabel} ${p.pod_chase_hours} hours later and every ${p.pod_chase_cadence_hours} hours after that.` : 'The packet is already complete, so the invoice goes out as soon as delivery is confirmed.'}`,
        steps: [underLimit ? `Send ${money(ctx.total)} automatically, under the ${limit} limit` : `Hold ${money(ctx.total)} for your approval, over the ${limit} limit`],
        active: true,
      };
    case 'delivered':
    case 'docs_pending':
      return {
        title: `Chasing the ${missingLabel}`,
        body: ctx.lastChase
          ? `Asking ${ctx.driver} every ${p.pod_chase_cadence_hours} hours since delivery. Last reminder ${ago(ctx.lastChase)}, ${ctx.chaseCount} so far. Next one in ${p.pod_chase_cadence_hours} hours unless the ${missingLabel} arrives.`
          : `Will ask ${ctx.driver} for the ${missingLabel} every ${p.pod_chase_cadence_hours} hours until it arrives.`,
        steps: [`Link the ${missingLabel} when it lands`, underLimit ? `Then send ${money(ctx.total)} to ${ctx.customer}, under the ${limit} limit` : `Then hold ${money(ctx.total)} for your approval, over the ${limit} limit`],
        active: true,
      };
    case 'validation_failed':
      return {
        title: 'Paused for your call',
        body: `The POD amount does not match the rate confirmation. Autopilot will not invoice a number it cannot prove. Approve the lower amount or dispute it with ${ctx.customer} from Today.`,
        steps: ['Sends the invoice the moment you decide'],
        active: false,
      };
    case 'ready_to_invoice':
      return {
        title: underLimit ? 'Sending the invoice' : 'Needs your approval',
        body: underLimit
          ? `Packet is complete. Will send ${money(ctx.total)} to ${ctx.customer} automatically, under the ${limit} limit, on the next run.`
          : `Packet is complete, but ${money(ctx.total)} is over your ${limit} auto-send limit. Send it yourself or raise the limit.`,
        steps: ctx.quickPay && ctx.terms >= p.quick_pay_min_days ? [`Route to quick-pay, ${ctx.customer} averages ${ctx.terms}-day terms`] : [],
        active: underLimit,
      };
    case 'invoiced':
      return {
        title: 'Watching for payment',
        body: ctx.invoice
          ? `${ctx.invoice.number} went out ${ago(ctx.invoice.issuedAt)}${ctx.invoice.status === 'quick_pay' ? ' and was routed to quick-pay' : ''}. Expected ${fmtDate(ctx.invoice.expectedAt)}${ctx.invoice.status === 'overdue' ? ', and it is overdue' : ''}. Autopilot matches the payment when it lands and closes the load.`
          : 'Autopilot matches the payment when it lands and closes the load.',
        steps: ctx.invoice?.status === 'overdue' ? [`Nudge ${ctx.customer} AP again tomorrow`] : [],
        active: true,
      };
    case 'paid':
      return {
        title: 'Done',
        body: ctx.invoice?.paidAt ? `${ctx.customer} paid ${ctx.invoice.number} ${ago(ctx.invoice.paidAt)}. Matched, closed, and in ${ctx.driver}’s settlement. Nothing left to do.` : 'Paid and closed. Nothing left to do.',
        steps: [],
        active: false,
      };
  }
}
