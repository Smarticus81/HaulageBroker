'use client';

import Link from 'next/link';
import type { AutopilotEvent } from '@haulage/types';
import { AlertTriangle, ArrowUpRight, CheckCircle2, FileCheck2, FileSearch, Landmark, MessageSquareText, ShieldAlert, Wallet, Zap } from 'lucide-react';
import { ago, cn } from '@/lib/utils';
import { loads } from '@/lib/data';

export const EVENT_ICON: Record<AutopilotEvent['kind'], React.ElementType> = {
  invoice_sent: Landmark,
  pod_chased: MessageSquareText,
  document_linked: FileCheck2,
  document_classified: FileSearch,
  compliance_alert: ShieldAlert,
  quick_pay_routed: Zap,
  settlement_generated: Wallet,
  exception_raised: AlertTriangle,
  rate_mismatch: AlertTriangle,
  payment_received: CheckCircle2,
};

export function eventHref(e: AutopilotEvent): string | null {
  if (!e.entity_type || !e.entity_id) return null;
  switch (e.entity_type) {
    case 'load': return `/app/loads/${e.entity_id}`;
    case 'document': return `/app/inbox/${e.entity_id}`;
    case 'invoice': return '/app/money';
    case 'settlement': return '/app/money?tab=settlements';
    case 'driver': case 'truck': case 'trailer': return `/app/compliance?subject=${e.entity_id}`;
    default: return null;
  }
}

export function loadNumberFor(e: AutopilotEvent): string | null {
  if (e.entity_type === 'load') return loads.find((l) => l.id === e.entity_id)?.number ?? null;
  return null;
}

export function EventRow({ e, dense }: { e: AutopilotEvent; dense?: boolean }) {
  const Icon = EVENT_ICON[e.kind];
  const href = eventHref(e);
  const tone = e.outcome === 'needs_you' ? 'text-warn bg-warn-soft' : e.outcome === 'skipped' ? 'text-ink-3 bg-surface-2' : 'text-good bg-good-soft';
  const body = (
    <div className={cn('group flex items-start gap-3', dense ? 'py-2' : 'py-3')}>
      <span className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[9px]', tone)}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-ink">{e.summary}</p>
        <p className="mt-0.5 font-mono text-[10.5px] text-ink-3">
          {ago(e.created_at)}
          {e.saved_minutes > 0 && <> · saved {e.saved_minutes}m</>}
        </p>
      </div>
      {href && <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}
