'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, FileText, Search, ShieldAlert, ShieldCheck, Upload } from 'lucide-react';
import { cn, fmtDate } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, DataTable, Eyebrow, EmptyState, Input, Segmented, Sheet, StatusPill, Switch, Tooltip, type Column } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/lib/store';
import { compliance, docById, type ComplianceItem } from '@/lib/data';

const DAY = 864e5;
const HORIZON = 120;
const daysOut = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / DAY);

type SubjectFilter = 'all' | 'driver' | 'truck' | 'trailer' | 'carrier';
type StatusFilter = 'all' | 'expiring_soon' | 'expired' | 'active';

const LANES: { key: ComplianceItem['subjectType']; label: string }[] = [
  { key: 'driver', label: 'Drivers' },
  { key: 'truck', label: 'Trucks' },
  { key: 'trailer', label: 'Trailers' },
  { key: 'carrier', label: 'Carrier' },
];

const toneOf = (c: ComplianceItem) => (c.status === 'expired' ? 'bad' : c.status === 'expiring_soon' ? 'warn' : 'good');
const shortSubject = (c: ComplianceItem) => (c.subjectType === 'driver' ? c.subjectName.split(' ')[0] : c.subjectType === 'carrier' ? '' : c.subjectName.replace(/^(Truck|Trailer)\s+/, ''));

/** "in 9d" / "4d ago" mono tag with the status tone. */
function DaysTag({ c }: { c: ComplianceItem }) {
  const d = daysOut(c.expiresAt);
  const tone = toneOf(c);
  return (
    <span className={cn('rounded-[6px] px-1.5 py-0.5 font-mono text-[10.5px] tabular', tone === 'bad' ? 'bg-bad-soft text-bad' : tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-ink-3')}>
      {d === 0 ? 'today' : d < 0 ? `${-d}d ago` : `in ${d}d`}
    </span>
  );
}

function SubjectMark({ c, size = 'sm' }: { c: ComplianceItem; size?: 'xs' | 'sm' | 'md' }) {
  if (c.subjectType === 'driver') return <Avatar name={c.subjectName} size={size} />;
  if (c.subjectType === 'carrier')
    return (
      <span className={cn('grid shrink-0 place-items-center rounded-full bg-surface-inverse text-ink-inverse', size === 'md' ? 'h-9 w-9' : size === 'sm' ? 'h-7 w-7' : 'h-6 w-6')}>
        <ShieldCheck className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </span>
    );
  return (
    <span className={cn('inline-grid shrink-0 place-items-center rounded-[8px] border border-line bg-surface-2 font-mono font-semibold text-ink-2', size === 'md' ? 'h-9 min-w-9 px-2 text-[11px]' : size === 'sm' ? 'h-7 min-w-7 px-1.5 text-[10.5px]' : 'h-6 min-w-6 px-1 text-[10px]')}>
      {shortSubject(c)}
    </span>
  );
}

export default function CompliancePage() {
  return (
    <Suspense fallback={null}>
      <Compliance />
    </Suspense>
  );
}

function Compliance() {
  const params = useSearchParams();
  const subjectParam = params.get('subject');
  const preselected = useMemo(() => compliance.filter((c) => c.subjectId === subjectParam), [subjectParam]);

  const [subject, setSubject] = useState<SubjectFilter>(preselected[0]?.subjectType ?? 'all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [q, setQ] = useState(preselected[0]?.subjectName ?? '');
  const [openId, setOpenId] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState<Record<string, boolean>>(() => Object.fromEntries(compliance.map((c) => [c.id, c.autoRenew])));
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!preselected.length) return;
    setSubject(preselected[0].subjectType);
    setQ(preselected[0].subjectName);
    const t = setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => clearTimeout(t);
  }, [preselected]);

  const expired = compliance.filter((c) => c.status === 'expired');
  const expiring = compliance.filter((c) => c.status === 'expiring_soon');
  const horizonItems = compliance.filter((c) => c.status !== 'active' || daysOut(c.expiresAt) <= HORIZON);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return compliance
      .filter((c) => subject === 'all' || c.subjectType === subject)
      .filter((c) => status === 'all' || c.status === status)
      .filter((c) => !needle || c.subjectName.toLowerCase().includes(needle) || c.type.toLowerCase().includes(needle))
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  }, [subject, status, q]);

  const open = compliance.find((c) => c.id === openId) ?? null;
  const highlightId = openId ?? (preselected.length ? rows.find((r) => r.subjectId === subjectParam)?.id ?? null : null);

  const toggleRenew = (c: ComplianceItem, v: boolean) => {
    setAutoRenew((a) => ({ ...a, [c.id]: v }));
    toast.success(v ? 'Auto-renew on' : 'Auto-renew off', v ? `Autopilot will file ${c.type.toLowerCase()} for ${c.subjectName} before it lapses.` : `You will get reminders for ${c.subjectName}, nothing more.`);
  };

  const columns: Column<ComplianceItem>[] = [
    {
      key: 'subject',
      header: 'Subject',
      sortValue: (r) => r.subjectName,
      render: (r) => (
        <span className="flex items-center gap-2.5">
          <SubjectMark c={r} />
          <span className="min-w-0">
            <span className="block truncate text-ink">{r.subjectName}</span>
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-4">{r.subjectType}</span>
          </span>
        </span>
      ),
    },
    { key: 'type', header: 'Item', sortValue: (r) => r.type, render: (r) => <span className="text-ink">{r.type}</span> },
    {
      key: 'expires',
      header: 'Expires',
      sortValue: (r) => r.expiresAt,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[12px] text-ink-2">{fmtDate(r.expiresAt, 'MMM d, yyyy')}</span>
          <DaysTag c={r} />
        </span>
      ),
    },
    { key: 'status', header: 'Status', hideBelow: 'sm', sortValue: (r) => r.status, render: (r) => <StatusPill status={r.status} size="sm" /> },
    {
      key: 'evidence',
      header: 'Evidence',
      hideBelow: 'md',
      render: (r) => {
        const d = r.evidenceDocId ? docById(r.evidenceDocId) : null;
        return d ? (
          <Link href={`/app/inbox/${d.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-2 hover:text-ink hover:underline">
            <FileText className="h-3.5 w-3.5 text-ink-3" /> {d.filename}
          </Link>
        ) : (
          <span className="text-[12.5px] text-ink-4">Missing</span>
        );
      },
    },
    {
      key: 'renew',
      header: 'Auto-renew',
      align: 'right',
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Switch size="sm" checked={autoRenew[r.id]} onChange={(v) => toggleRenew(r, v)} label={`Auto-renew ${r.type} for ${r.subjectName}`} />
        </span>
      ),
    },
  ];

  const countSubject = (s: SubjectFilter) => (s === 'all' ? compliance.length : compliance.filter((c) => c.subjectType === s).length);

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Nothing expires without warning."
        summary={
          <>
            {expired.length ? (
              <>
                <span className="font-medium text-bad">{expired.length} expired</span>,{' '}
              </>
            ) : (
              'Nothing expired, '
            )}
            <span className="font-medium text-warn">{expiring.length} expiring</span> in the next 30 days, {compliance.length - expired.length - expiring.length} current. Autopilot renews what it can and warns you about the rest.
          </>
        }
        actions={
          <Button size="sm" onClick={() => toast.success('Uploader open', 'Drop a card, cert or inspection report. Autopilot files it against the right subject.')}>
            <Upload className="h-4 w-4" /> Upload evidence
          </Button>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
        <Item className="lg:col-span-12">
          <Card>
            <CardHeader
              eyebrow="Horizon"
              title={`Next ${HORIZON} days`}
              description="Every item that lapses in this window, by who or what it belongs to. Expired items sit at today."
              aside={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {(['bad', 'warn', 'good'] as const).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 text-xs text-ink-3">
                      <span className={cn('h-2 w-2 rounded-full', t === 'bad' ? 'bg-bad' : t === 'warn' ? 'bg-warn' : 'bg-good')} />
                      {t === 'bad' ? 'Expired' : t === 'warn' ? 'Within 30 days' : 'Current'}
                    </span>
                  ))}
                </div>
              }
            />
            <CardBody className="pt-1">
              <Horizon items={horizonItems} onPick={(c) => setOpenId(c.id)} />
            </CardBody>
          </Card>
        </Item>

        <Item className="lg:col-span-12">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Segmented<SubjectFilter>
                value={subject}
                onChange={setSubject}
                options={[
                  { value: 'all', label: 'All', count: countSubject('all') },
                  { value: 'driver', label: 'Drivers', count: countSubject('driver') },
                  { value: 'truck', label: 'Trucks', count: countSubject('truck') },
                  { value: 'trailer', label: 'Trailers', count: countSubject('trailer') },
                  { value: 'carrier', label: 'Carrier', count: countSubject('carrier') },
                ]}
              />
              <Segmented<StatusFilter>
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'expiring_soon', label: 'Expiring', count: expiring.length },
                  { value: 'expired', label: 'Expired', count: expired.length },
                  { value: 'active', label: 'Current' },
                ]}
              />
            </div>
            <div className="w-full lg:w-72">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a driver, unit or item" leading={<Search className="h-4 w-4" />} />
            </div>
          </div>
        </Item>

        <Item className="lg:col-span-12">
          <div ref={tableRef} className="scroll-mt-24">
            <Card>
              <DataTable
                rows={rows}
                columns={columns}
                onRowClick={(r) => setOpenId(r.id)}
                selectedId={highlightId}
                empty={<EmptyState icon={ShieldCheck} title="Nothing to renew" description="No items match these filters." />}
              />
            </Card>
          </div>
        </Item>
      </Stagger>

      <ItemSheet item={open} autoRenew={open ? autoRenew[open.id] : false} onToggleRenew={(v) => open && toggleRenew(open, v)} onClose={() => setOpenId(null)} />
    </>
  );
}

// ─── Horizon ─────────────────────────────────────────────────────────────────

type Placed = { c: ComplianceItem; x: number; row: number; flip: boolean; days: number };

function Horizon({ items, onPick }: { items: ComplianceItem[]; onPick: (c: ComplianceItem) => void }) {
  const ticks = [0, 30, 60, 90, 120];
  const lanes = LANES.map((lane) => {
    const mine = items.filter((c) => c.subjectType === lane.key).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
    const placed: Placed[] = [];
    let lastX = -Infinity;
    let lastRow = 1;
    for (const c of mine) {
      const d = daysOut(c.expiresAt);
      const x = Math.max(0, Math.min(HORIZON, d)) / HORIZON;
      // Two rows per lane; alternate when a label would collide with its neighbour.
      const row = x - lastX < 0.2 ? (lastRow === 0 ? 1 : 0) : 0;
      placed.push({ c, x, row, flip: x > 0.8, days: d });
      lastX = x;
      lastRow = row;
    }
    return { ...lane, placed, twoRows: placed.some((p) => p.row === 1) };
  });

  return (
    <div className="grid grid-cols-[72px_1fr] gap-x-3 sm:grid-cols-[88px_1fr]">
      {/* Axis */}
      <div />
      <div className="relative h-5">
        {ticks.map((t) => (
          <span key={t} className={cn('absolute top-0 font-mono text-[10.5px] tabular text-ink-4', t === 0 ? 'left-0' : t === HORIZON ? 'right-0' : '-translate-x-1/2')} style={t === 0 || t === HORIZON ? undefined : { left: `${(t / HORIZON) * 100}%` }}>
            {t === 0 ? 'Today' : `+${t}d`}
          </span>
        ))}
      </div>

      {lanes.map((lane) => (
        <LaneRow key={lane.key} lane={lane} ticks={ticks} onPick={onPick} />
      ))}
    </div>
  );
}

function LaneRow({ lane, ticks, onPick }: { lane: { key: string; label: string; placed: Placed[]; twoRows: boolean }; ticks: number[]; onPick: (c: ComplianceItem) => void }) {
  const h = lane.twoRows ? 'h-[76px]' : 'h-[46px]';
  return (
    <>
      <div className={cn('flex items-center border-t border-line-soft', h)}>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{lane.label}</span>
        <span className="ml-1.5 font-mono text-[10.5px] tabular text-ink-4">{lane.placed.length || ''}</span>
      </div>
      <div className={cn('relative border-t border-line-soft', h)}>
        {/* 30-day warning window */}
        <div className="absolute inset-y-0 left-0 bg-warn-soft/40" style={{ width: `${(30 / HORIZON) * 100}%` }} />
        {/* Tick hairlines */}
        {ticks.map((t) => (
          <div key={t} className={cn('absolute inset-y-0 w-px', t === 0 ? 'bg-line-strong' : 'bg-line-soft')} style={{ left: `calc(${(t / HORIZON) * 100}% - ${t === HORIZON ? 1 : 0}px)` }} />
        ))}
        {lane.placed.length === 0 && <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[10.5px] text-ink-4">nothing in this window</span>}
        {lane.placed.map((p) => {
          const tone = toneOf(p.c);
          const top = lane.twoRows ? (p.row === 0 ? '28%' : '72%') : '50%';
          return (
            <button
              key={p.c.id}
              type="button"
              onClick={() => onPick(p.c)}
              className={cn('group absolute flex -translate-y-1/2 items-center gap-2 rounded-[8px] py-1 pr-2 pl-1 transition-colors hover:bg-surface-2', p.flip ? '-translate-x-full flex-row-reverse pl-2 pr-1' : '')}
              style={{ left: `${p.x * 100}%`, top, transform: `translate(${p.flip ? '-100%' : '-9px'}, -50%)` }}
              aria-label={`${p.c.subjectName}: ${p.c.type}, ${p.days < 0 ? `${-p.days} days ago` : `in ${p.days} days`}`}
            >
              <span className="relative grid h-[18px] w-[18px] shrink-0 place-items-center">
                {p.days < 0 && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-bad/30" />}
                <span className={cn('h-2.5 w-2.5 rounded-full ring-2 ring-surface', tone === 'bad' ? 'bg-bad' : tone === 'warn' ? 'bg-warn' : 'bg-good')} />
              </span>
              <span className={cn('whitespace-nowrap font-mono text-[11px] leading-none', p.flip && 'text-right')}>
                <span className="text-ink">{p.c.type}</span>
                {shortSubject(p.c) && <span className="text-ink-3"> · {shortSubject(p.c)}</span>}
                <span className={cn('ml-1.5 tabular', tone === 'bad' ? 'text-bad' : tone === 'warn' ? 'text-warn' : 'text-ink-4')}>{p.days < 0 ? `${-p.days}d ago` : `${p.days}d`}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Sheet ───────────────────────────────────────────────────────────────────

function ItemSheet({ item, autoRenew, onToggleRenew, onClose }: { item: ComplianceItem | null; autoRenew: boolean; onToggleRenew: (v: boolean) => void; onClose: () => void }) {
  const { policies } = useSession();
  const c = item;
  const d = c ? daysOut(c.expiresAt) : 0;
  const doc = c?.evidenceDocId ? docById(c.evidenceDocId) : null;
  const schedule = c
    ? [...policies.compliance_alert_days]
        .sort((a, b) => b - a)
        .map((days) => {
          const at = new Date(new Date(c.expiresAt).getTime() - days * DAY);
          const passed = at.getTime() <= Date.now();
          return { days, at, passed };
        })
    : [];

  return (
    <Sheet
      open={!!c}
      onClose={onClose}
      title={c ? c.type : undefined}
      description={c ? `${c.subjectName} · ${c.subjectType}` : undefined}
      footer={
        c && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px] text-ink-2">
              <Switch size="sm" checked={autoRenew} onChange={onToggleRenew} label="Auto-renew" /> Auto-renew
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => toast.success('Uploader open', `Drop the new ${c.type.toLowerCase()} and Autopilot will file it against ${c.subjectName}.`)}>
                <Upload className="h-3.5 w-3.5" /> Upload evidence
              </Button>
              <Button size="sm" onClick={() => { toast.success('Marked renewed', `${c.type} for ${c.subjectName} is current again. Reminders reset.`); onClose(); }}>
                <Check className="h-3.5 w-3.5" /> Mark renewed
              </Button>
            </div>
          </div>
        )
      }
    >
      {c && (
        <div className="space-y-6">
          <div className="surface-2 flex items-center gap-4 p-4">
            <SubjectMark c={c} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[15px] font-semibold text-ink">{c.subjectName}</span>
                <StatusPill status={c.status} size="sm" />
              </div>
              <div className="mt-0.5 font-mono text-[12px] text-ink-3">
                {c.status === 'expired' ? 'Expired' : 'Expires'} {fmtDate(c.expiresAt, 'EEEE, MMM d, yyyy')}
              </div>
            </div>
            <div className="text-right">
              <div className={cn('tabular text-[30px] font-semibold leading-none tracking-[-0.03em]', d < 0 ? 'text-bad' : d <= 30 ? 'text-warn' : 'text-ink')}>{Math.abs(d)}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{d < 0 ? 'days ago' : 'days left'}</div>
            </div>
          </div>

          <div>
            <Eyebrow>Alert schedule</Eyebrow>
            <p className="mb-3 text-[13px] text-ink-3">From your policy: warn {policies.compliance_alert_days.join(', ')} days before expiry.</p>
            <ol className="relative ml-1.5 border-l border-line pl-5">
              {schedule.map((s) => (
                <li key={s.days} className="relative pb-3.5 last:pb-0">
                  <span className={cn('absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full border-2 bg-bg', s.passed ? 'border-signal' : 'border-line-strong')}>{s.passed && <span className="h-1 w-1 rounded-full bg-signal" />}</span>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={cn('text-[13px]', s.passed ? 'font-medium text-ink' : 'text-ink-3')}>
                      {s.days === 1 ? 'Day before' : `${s.days} days out`}
                      {s.passed ? ' · sent' : ''}
                    </span>
                    <span className="font-mono text-[11.5px] tabular text-ink-3">{fmtDate(s.at)}</span>
                  </div>
                </li>
              ))}
              <li className="relative">
                <span className={cn('absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 bg-bg', d < 0 ? 'border-bad bg-bad' : 'border-line-strong')} />
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn('text-[13px] font-medium', d < 0 ? 'text-bad' : 'text-ink')}>Expires</span>
                  <span className="font-mono text-[11.5px] tabular text-ink-3">{fmtDate(c.expiresAt)}</span>
                </div>
              </li>
            </ol>
          </div>

          <div>
            <Eyebrow>Evidence</Eyebrow>
            {doc ? (
              <Link href={`/app/inbox/${doc.id}`} className="flex items-center gap-3 rounded-[14px] border border-line p-3 transition-colors hover:bg-surface-2">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-good-soft text-good">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[12.5px] text-ink">{doc.filename}</span>
                  <span className="block text-xs text-ink-3">
                    {doc.pages} pages · {Math.round(doc.confidence * 100)}% confidence
                  </span>
                </span>
                <Badge tone="good" size="sm">On file</Badge>
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-[14px] border border-dashed border-line p-3">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-surface-2 text-ink-3">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <span className="text-[13px] text-ink-3">No document on file. Upload the renewed {c.type.toLowerCase()} and this closes itself.</span>
              </div>
            )}
          </div>

          {autoRenew && (
            <p className="text-xs text-ink-4">
              <Tooltip label="Autopilot files renewals it can complete and asks you to pay when a fee is due.">
                <span className="underline decoration-dotted underline-offset-2">Auto-renew is on.</span>
              </Tooltip>{' '}
              Autopilot will start the renewal at the {Math.max(...policies.compliance_alert_days)}-day mark.
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
