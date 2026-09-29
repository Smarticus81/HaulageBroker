'use client';

import { useMemo, useRef, useState, type DragEvent } from 'react';
import { Inbox as InboxIcon, Minus, UploadCloud } from 'lucide-react';
import type { Doc } from '@/lib/data';
import { documents, loadById } from '@/lib/data';
import { ago, cn } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Badge, Card, CardBody, CardHeader, DataTable, EmptyState, Sheet, StatusPill, Tabs, toast, type Column } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { DOC_SOURCE_ICON, DOC_SOURCE_LABEL, docTypeLabel } from '@/components/app/doc-dots';
import { Confidence, DocPanel } from './[id]/doc-detail';
import { useSession } from '@/lib/store';

type Tab = 'needs' | 'all' | 'linked' | 'unlinked';

const needsYou = (d: Doc) => d.status === 'needs_review' || d.status === 'invalid';
const inTab = (d: Doc, t: Tab) => (t === 'all' ? true : t === 'needs' ? needsYou(d) : t === 'linked' ? d.loadId !== null : d.loadId === null);

export default function InboxPage() {
  const { policies } = useSession();
  const [tab, setTab] = useState<Tab>('needs');
  const [selectedId, setSelectedId] = useState<string | null>(() => documents.find(needsYou)?.id ?? documents[0]?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selected = selectedId ? documents.find((d) => d.id === selectedId) ?? null : null;
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = documents.filter((d) => new Date(d.uploadedAt).getTime() > weekAgo);
  const autoLinked = thisWeek.filter((d) => d.loadId !== null && d.confidence >= policies.auto_link_confidence);
  const needs = documents.filter(needsYou);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { needs: 0, all: 0, linked: 0, unlinked: 0 };
    for (const d of documents) for (const t of Object.keys(c) as Tab[]) if (inTab(d, t)) c[t]++;
    return c;
  }, []);
  const rows = useMemo(() => documents.filter((d) => inTab(d, tab)), [tab]);

  const pick = (d: Doc) => {
    setSelectedId(d.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSheetOpen(true);
  };

  const columns: Column<Doc>[] = [
    {
      key: 'file',
      header: 'File',
      sortValue: (d) => d.filename,
      render: (d) => {
        const Icon = DOC_SOURCE_ICON[d.source];
        return (
          <span className="flex min-w-0 items-center gap-3">
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-[10px]', needsYou(d) ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-ink-3')} title={DOC_SOURCE_LABEL[d.source]}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block max-w-[150px] truncate font-mono text-[12.5px] font-medium text-ink">{d.filename}</span>
              <span className="block whitespace-nowrap text-xs text-ink-3">
                {DOC_SOURCE_LABEL[d.source]} · {d.pages} {d.pages === 1 ? 'page' : 'pages'}
              </span>
            </span>
          </span>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      hideBelow: 'sm',
      sortValue: (d) => d.type,
      render: (d) => (
        <Badge tone={d.type === 'Unknown' ? 'warn' : 'outline'} size="sm">
          {docTypeLabel(d.type)}
        </Badge>
      ),
    },
    {
      key: 'load',
      header: 'Load',
      hideBelow: 'md',
      sortValue: (d) => d.loadId ?? '',
      render: (d) => {
        const l = d.loadId ? loadById(d.loadId) : undefined;
        return l ? <span className="whitespace-nowrap font-mono text-[12px] font-medium text-ink">{l.number}</span> : <Minus className="h-3.5 w-3.5 text-ink-4" />;
      },
    },
    {
      key: 'arrived',
      header: <span className="whitespace-nowrap">Arrived · from</span>,
      hideBelow: 'md',
      sortValue: (d) => d.uploadedAt,
      render: (d) => (
        <span className="block whitespace-nowrap">
          <span className="block font-mono text-[11.5px] text-ink-2">{ago(d.uploadedAt)}</span>
          <span className="block text-xs text-ink-3">{d.uploadedBy}</span>
        </span>
      ),
    },
    {
      key: 'confidence',
      header: 'Confidence',
      hideBelow: 'lg',
      sortValue: (d) => d.confidence,
      render: (d) => <Confidence value={d.confidence} threshold={policies.auto_link_confidence} />,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (d) => d.status,
      render: (d) => <StatusPill status={d.status} size="sm" />,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title={
          <>
            Paperwork, <em>sorted</em>.
          </>
        }
        summary={
          <>
            <span className="font-medium text-ink">{thisWeek.length} documents</span> arrived this week. Autopilot linked{' '}
            <span className="font-medium text-ink">{autoLinked.length}</span> to loads on its own.{' '}
            {needs.length ? (
              <>
                <span className="font-medium text-signal">{needs.length}</span> need you.
              </>
            ) : (
              'Nothing needs you.'
            )}
          </>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
        <Item className="lg:col-span-8">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto px-5 pt-4 no-scrollbar">
              <Tabs<Tab>
                className="w-max min-w-full"
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: 'needs', label: 'Needs you', count: counts.needs },
                  { value: 'all', label: 'All', count: counts.all },
                  { value: 'linked', label: 'Linked', count: counts.linked },
                  { value: 'unlinked', label: 'Unlinked', count: counts.unlinked },
                ]}
              />
            </div>
            <DataTable
              rows={rows}
              columns={columns}
              onRowClick={pick}
              selectedId={selected?.id ?? null}
              initialSort={{ key: 'arrived', dir: 'desc' }}
              empty={<EmptyState icon={InboxIcon} title="Nothing to sort" description="Every document here is classified, linked and checked." className="py-12" />}
            />
          </Card>
        </Item>

        <Item className="hidden space-y-4 lg:col-span-4 lg:block">
          <DropZone />
          {selected ? (
            <Card>
              <CardHeader eyebrow="Selected" title={<span className="font-mono text-[14px]">{selected.filename}</span>} aside={<StatusPill status={selected.status} size="sm" />} />
              <CardBody>
                <DocPanel doc={selected} />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <EmptyState icon={InboxIcon} title="Pick a document" description="Click a row to read what Autopilot extracted and decide where it goes." />
            </Card>
          )}
        </Item>

        <Item className="lg:hidden">
          <DropZone />
        </Item>
      </Stagger>

      <Sheet open={sheetOpen && !!selected} onClose={() => setSheetOpen(false)} side="bottom" title={selected ? <span className="font-mono text-[15px]">{selected.filename}</span> : undefined} description={selected ? `${docTypeLabel(selected.type)} · ${DOC_SOURCE_LABEL[selected.source]} · ${ago(selected.uploadedAt)}` : undefined}>
        {selected && <DocPanel doc={selected} onDone={() => setSheetOpen(false)} />}
      </Sheet>
    </>
  );
}

function DropZone() {
  const { profile } = useSession();
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inboxAddress = `docs@${(profile.company_name || 'your-fleet').toLowerCase().replace(/[^a-z0-9]+/g, '')}.haulage.app`;

  const read = (n: number, name?: string) => {
    toast.info(`Autopilot is reading ${n} ${n === 1 ? 'file' : 'files'}`, name ? `${name} · classifying and matching to a load.` : 'Classifying and matching to loads.');
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const files = e.dataTransfer?.files;
    read(Math.max(1, files?.length ?? 1), files?.[0]?.name);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        'group flex cursor-pointer items-center gap-4 rounded-[20px] border border-dashed px-5 py-4 transition-[border-color,background-color,transform] duration-200',
        over ? 'scale-[1.01] border-signal bg-signal-soft' : 'border-line-strong bg-surface-2/50 hover:border-signal/60 hover:bg-surface-2',
      )}
    >
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-[12px] transition-colors', over ? 'bg-signal text-signal-ink' : 'bg-surface text-ink-3 ring-1 ring-line group-hover:text-signal')}>
        <UploadCloud className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{over ? 'Let go, Autopilot has it' : 'Drop paperwork here'}</p>
        <p className="mt-0.5 text-xs text-ink-3">
          or forward email to <span className="font-mono text-ink-2">{inboxAddress}</span>
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files;
          if (f?.length) read(f.length, f[0]?.name);
          e.target.value = '';
        }}
      />
    </div>
  );
}
