'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Cog, Download, FileStack, Search, Sparkles } from 'lucide-react';
import { cn, fmtDate } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Avatar, AutopilotOrb, Badge, Button, Card, EmptyState, Input, Segmented } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/lib/store';
import { audit, demoUser, docById, driverById, drivers, loadById, invoices, settlements, type AuditEntry } from '@/lib/data';

type ActorFilter = 'all' | 'user' | 'autopilot' | 'copilot' | 'system';

const ACTOR_LABEL: Record<AuditEntry['actorType'], string> = { user: 'Person', autopilot: 'Autopilot', copilot: 'Copilot', system: 'System' };

/** Human label for an entity id, using the dataset where we can. */
function entityLabel(entity: string, id: string, company: string): string {
  switch (entity) {
    case 'invoice': return invoices.find((i) => i.id === id)?.number ?? id;
    case 'load': return loadById(id)?.number ?? id;
    case 'document': return docById(id)?.filename ?? id;
    case 'settlement': {
      const s = settlements.find((x) => x.id === id);
      return s ? `${driverById(s.driverId).name.split(' ')[0]}’s settlement` : id;
    }
    case 'driver': return drivers.find((d) => d.id === id)?.name ?? id;
    case 'user': return id === demoUser.id ? demoUser.name : id;
    case 'organization': return company;
    case 'autopilot_policy': return 'the Autopilot policy';
    default: return id;
  }
}

const humanField = (k: string) => k.replace(/_/g, ' ');

/** "sent invoice INV-1045", built from action + entity + entityId (+ changes). */
function sentence(e: AuditEntry, company: string): React.ReactNode {
  const label = entityLabel(e.entity, e.entityId, company);
  const Ent = <span className="font-medium text-ink">{label}</span>;
  const ch = e.changes ?? {};
  switch (e.action) {
    case 'document.classified': return <>classified {Ent} as a {ch.type?.to ?? 'document'}</>;
    case 'document.linked': return <>linked {Ent} to {ch.load ? <span className="font-medium text-ink">{ch.load.to}</span> : 'a load'}</>;
    case 'document.uploaded': return <>uploaded {Ent}</>;
    case 'invoice.sent': return <>sent invoice {Ent}</>;
    case 'invoice.quick_pay_routed': return <>routed {Ent} to quick-pay</>;
    case 'payment.matched': return <>matched a payment to {Ent} and closed it</>;
    case 'settlement.drafted': return <>drafted {Ent}</>;
    case 'load.note_added': return <>added a note to load {Ent}</>;
    case 'policy.updated': {
      const [field] = Object.keys(ch);
      return <>changed <span className="font-medium text-ink">{field ? humanField(field) : 'a setting'}</span> on {label}</>;
    }
    case 'auth.login': return <>signed in</>;
    case 'onboarding.completed': return <>completed onboarding for {Ent}</>;
    default: {
      const verb = (e.action.split('.')[1] ?? e.action).replace(/_/g, ' ');
      return <>{verb} {e.entity.replace(/_/g, ' ')} {Ent}</>;
    }
  }
}

function ActorMark({ e }: { e: AuditEntry }) {
  if (e.actorType === 'autopilot') return <span className="grid h-8 w-8 shrink-0 place-items-center"><AutopilotOrb size={9} active={false} /></span>;
  if (e.actorType === 'copilot')
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mind-soft text-mind ring-1 ring-line-soft">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
    );
  if (e.actorType === 'system')
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-3 ring-1 ring-line-soft">
        <Cog className="h-3.5 w-3.5" />
      </span>
    );
  return <Avatar name={e.actor} size="sm" className="h-8 w-8" />;
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}
function dayLabel(key: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  return fmtDate(key, 'EEE, MMM d');
}

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function AuditPage() {
  const { profile } = useSession();
  const [actor, setActor] = useState<ActorFilter>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const company = profile.company_name || 'your organization';
  const actors = new Set(audit.map((a) => a.actor)).size;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return audit
      .filter((e) => actor === 'all' || e.actorType === actor)
      .filter((e) => {
        if (!needle) return true;
        const hay = [e.actor, e.action, e.entity, e.entityId, entityLabel(e.entity, e.entityId, company), ...Object.entries(e.changes ?? {}).flatMap(([k, v]) => [k, v.from, v.to])].join(' ').toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [actor, q, company]);

  const groups = useMemo(() => {
    const map = new Map<string, AuditEntry[]>();
    for (const e of rows) {
      const k = dayKey(e.at);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.entries()];
  }, [rows]);

  const count = (t: ActorFilter) => (t === 'all' ? audit.length : audit.filter((e) => e.actorType === t).length);

  const exportCsv = () => {
    const header = ['id', 'at', 'actor', 'actor_type', 'action', 'entity', 'entity_id', 'changes', 'ip'];
    const lines = audit.map((e) =>
      [
        e.id,
        e.at,
        e.actor,
        e.actorType,
        e.action,
        e.entity,
        e.entityId,
        e.changes ? Object.entries(e.changes).map(([k, v]) => `${k}: ${v.from} -> ${v.to}`).join('; ') : '',
        e.ip ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haulage-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Exported', `${audit.length} entries as CSV.`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Every change, kept."
        summary={
          <>
            <span className="font-medium text-ink">{audit.length} entries</span> by <span className="font-medium text-ink">{actors} actors</span>, people and software alike. Nothing here can be edited or deleted.
          </>
        }
        actions={
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <Stagger className="space-y-4" stagger={0.05}>
        <Item>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Segmented<ActorFilter>
              value={actor}
              onChange={setActor}
              options={[
                { value: 'all', label: 'All', count: count('all') },
                { value: 'user', label: 'People', count: count('user') },
                { value: 'autopilot', label: 'Autopilot', count: count('autopilot') },
                { value: 'copilot', label: 'Copilot', count: count('copilot') },
                { value: 'system', label: 'System', count: count('system') },
              ]}
            />
            <div className="w-full lg:w-72">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions, IDs, values" leading={<Search className="h-4 w-4" />} />
            </div>
          </div>
        </Item>

        <Item>
          <Card className="overflow-hidden">
            {groups.length === 0 && <EmptyState icon={FileStack} title="Nothing recorded" description="No entries match these filters." />}
            {groups.map(([day, entries]) => (
              <section key={day} className="relative">
                <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface/90 px-5 py-2 backdrop-blur">
                  <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3">{dayLabel(day)}</span>
                  <span className="font-mono text-[10.5px] tabular text-ink-4">{fmtDate(day, 'yyyy-MM-dd')}</span>
                  <span className="ml-auto font-mono text-[10.5px] tabular text-ink-4">{entries.length}</span>
                </div>
                <ol>
                  {entries.map((e) => (
                    <LedgerRow key={e.id} e={e} company={company} open={openId === e.id} onToggle={() => setOpenId((o) => (o === e.id ? null : e.id))} />
                  ))}
                </ol>
              </section>
            ))}
          </Card>
        </Item>
      </Stagger>
    </>
  );
}

function LedgerRow({ e, company, open, onToggle }: { e: AuditEntry; company: string; open: boolean; onToggle: () => void }) {
  const changes = Object.entries(e.changes ?? {});
  return (
    <li className="border-b border-line-soft last:border-b-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className={cn('grid w-full grid-cols-[32px_1fr_auto] items-start gap-x-3 px-5 py-3 text-left transition-colors hover:bg-surface-2/70', open && 'bg-surface-2/50')}>
        <ActorMark e={e} />
        <div className="min-w-0">
          <p className="text-[13.5px] leading-snug text-ink-2">
            <span className="font-medium text-ink">{e.actor}</span> {sentence(e, company)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={e.actorType === 'autopilot' ? 'signal' : e.actorType === 'copilot' ? 'mind' : 'outline'} size="sm" className="font-mono normal-case tracking-normal">
              {e.action}
            </Badge>
            {changes.map(([k, v]) => (
              <span key={k} className="inline-flex h-5 items-center gap-1 rounded-full border border-line-soft bg-surface px-2 font-mono text-[10.5px] tabular">
                <span className="text-ink-3">{humanField(k)}</span>
                <span className="text-ink-3 line-through decoration-ink-4">{v.from || '∅'}</span>
                <span className="text-ink-4">→</span>
                <span className="text-ink">{v.to.length > 28 ? v.to.slice(0, 26) + '…' : v.to}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-mono text-[11px] tabular text-ink-3">{fmtDate(e.at, 'h:mm a')}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-ink-4 transition-transform duration-300', open && 'rotate-180')} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 38 }} className="overflow-hidden">
            <div className="grid gap-4 border-t border-line-soft bg-surface-2/40 px-5 py-4 pl-[68px] md:grid-cols-[1fr_220px]">
              <div>
                <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Changes</div>
                {changes.length ? (
                  <table className="w-full border-separate border-spacing-0 font-mono text-[12px]">
                    <thead>
                      <tr className="text-left text-[10.5px] uppercase tracking-[0.1em] text-ink-4">
                        <th className="border-b border-line-soft pb-1.5 pr-4 font-medium">field</th>
                        <th className="border-b border-line-soft pb-1.5 pr-4 font-medium">from</th>
                        <th className="border-b border-line-soft pb-1.5 font-medium">to</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changes.map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-1.5 pr-4 text-ink-2">{k}</td>
                          <td className="py-1.5 pr-4 text-ink-3">{v.from || '∅'}</td>
                          <td className="py-1.5 text-ink">{v.to}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[12.5px] text-ink-4">No field changes. This entry records that the action happened.</p>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[12px] md:grid-cols-1">
                <div>
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-ink-4">Entry</dt>
                  <dd className="mt-0.5 text-ink-2">{e.id}</dd>
                </div>
                <div>
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-ink-4">Entity</dt>
                  <dd className="mt-0.5 text-ink-2">
                    {e.entity} · {e.entityId}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-ink-4">Actor</dt>
                  <dd className="mt-0.5 text-ink-2">{ACTOR_LABEL[e.actorType]}</dd>
                </div>
                <div>
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-ink-4">At</dt>
                  <dd className="mt-0.5 tabular text-ink-2">{fmtDate(e.at, 'yyyy-MM-dd HH:mm:ss')}</dd>
                </div>
                {e.ip && (
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-[0.12em] text-ink-4">IP</dt>
                    <dd className="mt-0.5 tabular text-ink-2">{e.ip}</dd>
                  </div>
                )}
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
