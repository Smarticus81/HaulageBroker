'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, FileQuestion, Link2, ShieldCheck, TriangleAlert, Upload, Wand2, X } from 'lucide-react';
import type { Doc } from '@/lib/data';
import { autopilotEvents, customerById, docById, documents, driverById, loadById } from '@/lib/data';
import { ago, cn, fmtDateTime } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Select, StatusPill, toast } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { EventRow } from '@/components/app/event-row';
import { DocDots, DOC_SOURCE_ICON, DOC_SOURCE_LABEL, docTypeLabel } from '@/components/app/doc-dots';
import { useSession } from '@/lib/store';

const RECLASSIFY: Doc['type'][] = ['RateConf', 'BOL', 'POD', 'Lumper', 'ScaleTicket', 'FuelReceipt', 'DetentionForm', 'InsuranceCert', 'CDL', 'MedCard'];
const COMPLIANCE_TYPES: Doc['type'][] = ['InsuranceCert', 'CDL', 'MedCard'];

// ── Shared pieces (also used by the Inbox list) ─────────────────────────────

/** A stylised stand-in for the scanned page: paper, faint rules, the type stamped in mono. */
export function DocPreview({ doc, className, size = 'md' }: { doc: Doc; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const photo = doc.source === 'photo';
  const unknown = doc.type === 'Unknown';
  const stampTone = unknown ? 'text-ink-4 border-ink-4' : doc.status === 'invalid' ? 'text-bad border-bad' : doc.status === 'needs_review' ? 'text-warn border-warn' : 'text-good border-good';
  const fields = Object.entries(doc.extracted);
  const scale = size === 'sm' ? 'text-[7.5px] leading-[1.7]' : size === 'lg' ? 'text-[11px] leading-[1.8]' : 'text-[9px] leading-[1.75]';
  return (
    <div className={cn('relative w-full overflow-hidden rounded-[14px] border border-line bg-surface-3/70 p-[7%]', photo ? 'aspect-[4/3]' : 'aspect-[8.5/10]', className)} aria-hidden>
      <div className={cn('relative h-full w-full overflow-hidden rounded-[6px] border border-line bg-surface shadow-[var(--shadow-card)]', photo && '-rotate-[1.5deg] scale-[0.96]')}>
        {/* ruled paper */}
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 21px, var(--line-soft) 21px 22px)' }} />
        {/* letterhead */}
        <div className="absolute left-[8%] right-[8%] top-[7%] flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="h-2 w-24 rounded-full bg-ink/15" />
            <div className="h-1.5 w-16 rounded-full bg-ink/8" />
            <div className="h-1.5 w-20 rounded-full bg-ink/8" />
          </div>
          <div className={cn('rotate-[-7deg] rounded-[5px] border-[1.5px] px-1.5 py-0.5 font-mono font-semibold uppercase tracking-[0.16em]', size === 'sm' ? 'text-[8px]' : 'text-[10px]', stampTone)}>
            {unknown ? '?' : doc.type}
          </div>
        </div>
        {/* printed fields */}
        <div className={cn('absolute left-[8%] right-[8%] top-[26%] font-mono text-ink-3', scale)}>
          {fields.length ? (
            fields.slice(0, 6).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-line-soft">
                <span className="uppercase tracking-[0.08em] opacity-70">{k}</span>
                <span className="truncate text-ink-2">{v}</span>
              </div>
            ))
          ) : (
            <div className="space-y-2 pt-1">
              {[92, 78, 85, 40, 70].map((w, i) => (
                <div key={i} className="h-1.5 rounded-full bg-ink/8" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
        </div>
        {/* signature */}
        {!unknown && (
          <div className="absolute bottom-[12%] left-[8%] right-[8%] flex items-end justify-between">
            <div className="w-2/5 border-b border-ink/30 pb-0.5">
              <svg viewBox="0 0 100 20" className="h-3 w-16 text-ink/50" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M2 14c8-12 12-8 14 0s6 6 12-4 8-2 10 4 6 2 14-6 8 0 12 6 10-2 18-6 8 4 14 4" />
              </svg>
            </div>
            <span className={cn('font-mono text-ink-4', size === 'sm' ? 'text-[7px]' : 'text-[9px]')}>{doc.pages > 1 ? `1 / ${doc.pages}` : '1 / 1'}</span>
          </div>
        )}
        {/* filename strip */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-line-soft bg-surface-2/90 px-2.5 py-1 font-mono text-[9.5px] text-ink-3">
          <span className="truncate">{doc.filename}</span>
          <span className="shrink-0 tabular">{doc.pages} {doc.pages === 1 ? 'page' : 'pages'}</span>
        </div>
      </div>
    </div>
  );
}

export function Confidence({ value, threshold, className }: { value: number; threshold: number; className?: string }) {
  const good = value >= threshold;
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-surface-3">
        <span className={cn('block h-full rounded-full', good ? 'bg-good' : value < 0.6 ? 'bg-bad' : 'bg-warn')} style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className={cn('font-mono text-[11px] tabular', good ? 'text-ink-2' : 'text-warn')}>{Math.round(value * 100)}</span>
    </span>
  );
}

export function DocFields({ doc, className }: { doc: Doc; className?: string }) {
  const entries = Object.entries(doc.extracted);
  if (!entries.length) {
    return <p className={cn('rounded-[12px] border border-dashed border-line px-3 py-4 text-center text-xs text-ink-3', className)}>Nothing extracted. Autopilot could not read a known layout.</p>;
  }
  return (
    <dl className={cn('grid grid-cols-[minmax(0,auto)_1fr] gap-x-4 gap-y-2 text-[13px]', className)}>
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-mono text-[10.5px] uppercase leading-5 tracking-[0.12em] text-ink-3">{k}</dt>
          <dd className={cn('truncate leading-5 text-ink', /unreadable|missing/i.test(v) && 'text-warn')}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DocIssues({ doc, className }: { doc: Doc; className?: string }) {
  if (!doc.issues?.length) return null;
  const bad = doc.status === 'invalid';
  return (
    <ul className={cn('space-y-1.5', className)}>
      {doc.issues.map((i) => (
        <li key={i} className={cn('flex items-start gap-2 rounded-[12px] px-3 py-2 text-[12.5px]', bad ? 'bg-bad-soft text-bad' : 'bg-warn-soft text-warn')}>
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="text-pretty">{i}</span>
        </li>
      ))}
    </ul>
  );
}

export function DocActions({ doc, compact, onDone }: { doc: Doc; compact?: boolean; onDone?: () => void }) {
  const [type, setType] = useState<Doc['type']>(doc.type === 'Unknown' ? 'RateConf' : doc.type);
  const load = doc.loadId ? loadById(doc.loadId) : undefined;
  const settled = doc.status === 'valid' && !!doc.loadId;

  const confirm = () => {
    toast.success(load ? `Linked to ${load.number}` : 'Linked to load', load ? `${docTypeLabel(doc.type)} added to the packet. Autopilot is finishing the rest.` : 'Autopilot will pick the matching load from the reference number.');
    onDone?.();
  };
  const reclassify = (t: Doc['type']) => {
    setType(t);
    if (t !== doc.type) toast.success(`Re-classified as ${docTypeLabel(t)}`, `${doc.filename} · Autopilot re-ran extraction with the new layout.`);
  };
  const reject = () => {
    toast.info('Rejected', `${doc.filename} moved out of the inbox. Autopilot will not link it.`);
    onDone?.();
  };

  return (
    <div className={cn('space-y-3', compact ? '' : 'sm:flex sm:items-end sm:gap-3 sm:space-y-0')}>
      <div className={cn('min-w-0 flex-1', !compact && 'sm:max-w-xs')}>
        <label className="mb-1.5 block text-[11px] font-medium text-ink-3">Re-classify as</label>
        <Select value={type} onChange={(e) => reclassify(e.target.value as Doc['type'])} className="h-9 text-[13px]">
          {RECLASSIFY.map((t) => (
            <option key={t} value={t}>
              {docTypeLabel(t)}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={reject} className="text-ink-3 hover:text-bad">
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
        <Button size="sm" onClick={confirm} disabled={settled} className="flex-1 sm:flex-none">
          <Check className="h-3.5 w-3.5" /> {settled ? 'Linked' : load ? `Confirm & link to ${load.number}` : 'Confirm & link to load'}
        </Button>
      </div>
    </div>
  );
}

/** The preview + fields + issues + actions, as one column. Used in the Inbox side panel and bottom sheet. */
export function DocPanel({ doc, onDone }: { doc: Doc; onDone?: () => void }) {
  const { policies } = useSession();
  const load = doc.loadId ? loadById(doc.loadId) : undefined;
  const Icon = DOC_SOURCE_ICON[doc.source];
  return (
    <div className="space-y-5">
      <DocPreview doc={doc} size="sm" className="mx-auto max-w-[300px]" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" /> {DOC_SOURCE_LABEL[doc.source]} · {doc.uploadedBy}
        </span>
        <span className="font-mono">{ago(doc.uploadedAt)}</span>
        <Confidence value={doc.confidence} threshold={policies.auto_link_confidence} className="ml-auto" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3">What Autopilot read</span>
          <Badge tone="outline" size="sm">{docTypeLabel(doc.type)}</Badge>
        </div>
        <DocFields doc={doc} />
      </div>
      <DocIssues doc={doc} />
      {load && (
        <Link href={`/app/loads/${load.id}`} className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface-2/60 px-3 py-2.5 transition-colors hover:border-line-strong">
          <span className="min-w-0">
            <span className="block font-mono text-[12.5px] font-semibold text-ink">{load.number}</span>
            <span className="block truncate text-xs text-ink-3">
              {customerById(load.customerId).name} · {load.origin} → {load.destination}
            </span>
          </span>
          <DocDots docs={load.docs} />
        </Link>
      )}
      <div className="border-t border-line pt-4">
        <DocActions doc={doc} compact onDone={onDone} />
      </div>
      <Link href={`/app/inbox/${doc.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-ink">
        Open full page <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ── Full page ────────────────────────────────────────────────────────────────

export function DocDetail({ id }: { id: string }) {
  const doc = docById(id);
  if (!doc) {
    return (
      <Card className="mx-auto mt-10 max-w-lg">
        <EmptyState
          icon={FileQuestion}
          title="No document by that id"
          description={`Nothing in the inbox matches “${id}”. It may have been rejected or merged into another packet.`}
          action={
            <Link href="/app/inbox">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to inbox
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }
  return <DocDetailInner doc={doc} />;
}

type TrailState = 'done' | 'pending' | 'failed' | 'skipped';
interface TrailStep { key: string; title: string; meta: string; state: TrailState; icon: React.ElementType }

function DocDetailInner({ doc }: { doc: Doc }) {
  const { policies } = useSession();
  const load = doc.loadId ? loadById(doc.loadId) : undefined;
  const customer = load ? customerById(load.customerId) : null;
  const driver = load ? driverById(load.driverId) : null;
  const events = autopilotEvents.filter((e) => e.entity_type === 'document' && e.entity_id === doc.id);
  const pct = Math.round(doc.confidence * 100);
  const auto = doc.confidence >= policies.auto_link_confidence;
  const compliance = COMPLIANCE_TYPES.includes(doc.type);
  const SourceIcon = DOC_SOURCE_ICON[doc.source];
  const siblings = load ? documents.filter((d) => d.loadId === load.id && d.id !== doc.id) : [];

  const trail: TrailStep[] = [
    { key: 'uploaded', title: `Arrived by ${DOC_SOURCE_LABEL[doc.source].toLowerCase()}`, meta: `${doc.uploadedBy} · ${fmtDateTime(doc.uploadedAt)}`, state: 'done', icon: Upload },
    doc.type === 'Unknown'
      ? { key: 'classified', title: 'Could not classify', meta: `${pct}% on the best guess. Pick a type and Autopilot re-reads it.`, state: 'failed', icon: Wand2 }
      : { key: 'classified', title: `Read as ${docTypeLabel(doc.type).toLowerCase()}`, meta: `${pct}% confidence${auto ? `, above your ${Math.round(policies.auto_link_confidence * 100)}% threshold` : `, below your ${Math.round(policies.auto_link_confidence * 100)}% threshold`}`, state: 'done', icon: Wand2 },
    load
      ? { key: 'linked', title: `Linked to ${load.number}`, meta: auto ? `Matched automatically on ${doc.extracted['Ref #'] ? 'reference number' : 'lane and dates'}` : 'Matched with your confirmation', state: 'done', icon: Link2 }
      : compliance
        ? { key: 'linked', title: 'Filed under compliance', meta: 'Not tied to a load. Evidence for the carrier file.', state: 'done', icon: Link2 }
        : { key: 'linked', title: 'Not linked to a load', meta: doc.type === 'Unknown' ? 'Waiting on classification' : 'Autopilot needs a reference number or your pick', state: 'pending', icon: Link2 },
    doc.status === 'valid'
      ? { key: 'validated', title: 'Checks out', meta: load ? 'Amounts and parties agree with the rate confirmation' : 'Readable, dated and signed where required', state: 'done', icon: ShieldCheck }
      : doc.status === 'invalid'
        ? { key: 'validated', title: 'Failed validation', meta: doc.issues?.[0] ?? 'Does not agree with the rate confirmation', state: 'failed', icon: ShieldCheck }
        : { key: 'validated', title: 'Waiting on you', meta: doc.issues?.[0] ?? 'Validation runs once the document is linked', state: 'pending', icon: ShieldCheck },
  ];

  return (
    <>
      <Link href="/app/inbox" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-3 transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Inbox
      </Link>
      <PageHeader
        eyebrow={`Inbox · ${DOC_SOURCE_LABEL[doc.source]} from ${doc.uploadedBy}`}
        title={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              {docTypeLabel(doc.type)}
              {load && (
                <>
                  {' '}for <span style={{ fontFamily: 'var(--font-mono)' }} className="font-medium tracking-[-0.04em]">{load.number}</span>
                </>
              )}
            </span>
            <span className="font-sans tracking-normal">
              <StatusPill status={doc.status} size="lg" />
            </span>
          </span>
        }
        summary={
          <>
            <span className="font-mono text-ink-2">{doc.filename}</span> · {doc.pages} {doc.pages === 1 ? 'page' : 'pages'} · arrived {ago(doc.uploadedAt)}. Confidence{' '}
            <span className={cn('font-medium tabular', auto ? 'text-ink' : 'text-warn')}>{pct}%</span>.
          </>
        }
        actions={
          <>
            {load && (
              <Link href={`/app/loads/${load.id}`}>
                <Button variant="secondary" size="sm">
                  Open {load.number} <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
        <Item className="space-y-4 lg:col-span-8">
          <Card>
            <CardBody className="grid grid-cols-1 gap-6 pt-5 md:grid-cols-[minmax(0,300px)_1fr]">
              <DocPreview doc={doc} size="md" />
              <div className="min-w-0 space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3">What Autopilot read</span>
                    <Confidence value={doc.confidence} threshold={policies.auto_link_confidence} />
                  </div>
                  <DocFields doc={doc} />
                </div>
                {doc.issues?.length ? (
                  <div>
                    <div className="mb-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3">Issues</div>
                    <DocIssues doc={doc} />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 text-xs text-ink-3">
                  <span className="inline-flex items-center gap-1.5">
                    <SourceIcon className="h-3.5 w-3.5" /> {DOC_SOURCE_LABEL[doc.source]}
                  </span>
                  <span>{doc.uploadedBy}</span>
                  <span className="font-mono">{fmtDateTime(doc.uploadedAt)}</span>
                  <span className="font-mono">{doc.id}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader eyebrow="Decide" title={doc.status === 'valid' && load ? 'Nothing to decide' : 'What should happen to it'} description={doc.status === 'valid' && load ? 'Autopilot linked and validated this one. You can still move it.' : 'Confirm the link, change the type, or throw it out.'} />
            <CardBody>
              <DocActions doc={doc} />
            </CardBody>
          </Card>
        </Item>

        <Item className="space-y-4 lg:col-span-4">
          <Card>
            <CardHeader eyebrow="Where it went" title="Uploaded to validated" />
            <CardBody className="pt-0">
              <ol className="relative ml-3 border-l border-line pl-6">
                {trail.map((s, i) => {
                  const Icon = s.icon;
                  const tone = s.state === 'done' ? 'border-good bg-good-soft text-good' : s.state === 'failed' ? 'border-bad bg-bad-soft text-bad' : 'border-dashed border-line-strong bg-surface text-ink-4';
                  return (
                    <li key={s.key} className={cn('relative', i < trail.length - 1 && 'pb-5')}>
                      <span className={cn('absolute -left-[37px] top-0 grid h-6 w-6 place-items-center rounded-full border ring-4 ring-surface', tone)}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <p className={cn('text-[13px] font-medium leading-snug', s.state === 'pending' ? 'text-ink-3' : 'text-ink')}>{s.title}</p>
                      <p className="mt-0.5 text-xs text-ink-3 text-pretty">{s.meta}</p>
                    </li>
                  );
                })}
              </ol>
              {events.length > 0 && (
                <div className="mt-4 divide-y divide-line-soft border-t border-line">
                  {events.map((e) => (
                    <EventRow key={e.id} e={e} dense />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {load && customer && driver ? (
            <Card>
              <CardHeader eyebrow="Linked load" title={load.number} aside={<StatusPill status={load.status} size="sm" />} />
              <CardBody className="pt-0">
                <p className="text-[13px] text-ink-2">
                  {load.origin} → {load.destination}
                </p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {customer.name} · {driver.name} · Ref {load.ref}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="text-xs text-ink-3">Packet</span>
                  <DocDots docs={load.docs} size="md" />
                </div>
                {siblings.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-line pt-3">
                    {siblings.map((d) => (
                      <li key={d.id}>
                        <Link href={`/app/inbox/${d.id}`} className="flex items-center justify-between gap-2 rounded-[8px] px-1 py-1 text-xs transition-colors hover:bg-surface-2">
                          <span className="truncate font-mono text-ink-2">{d.filename}</span>
                          <Badge tone="outline" size="sm">{docTypeLabel(d.type)}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/app/loads/${load.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-ink">
                  Open the load <ArrowUpRight className="h-3 w-3" />
                </Link>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader eyebrow="Linked load" title={compliance ? 'Carrier file' : 'None yet'} />
              <CardBody className="pt-0 text-[13px] text-ink-3 text-pretty">
                {compliance ? (
                  <>
                    Evidence for compliance, not a load.{' '}
                    <Link href="/app/compliance" className="font-medium text-ink-2 hover:text-ink">
                      See compliance →
                    </Link>
                  </>
                ) : (
                  'Confirm a type and Autopilot will look for a matching reference number across open loads.'
                )}
              </CardBody>
            </Card>
          )}
        </Item>
      </Stagger>
    </>
  );
}
