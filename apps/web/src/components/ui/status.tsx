import { Badge, type Tone } from './badge';

const MAP: Record<string, { tone: Tone; label: string }> = {
  // loads
  created: { tone: 'neutral', label: 'Booked' },
  docs_pending: { tone: 'warn', label: 'Docs pending' },
  docs_received: { tone: 'info', label: 'Docs in' },
  validation_failed: { tone: 'bad', label: 'Mismatch' },
  ready_to_invoice: { tone: 'good', label: 'Ready to bill' },
  invoiced: { tone: 'signal', label: 'Invoiced' },
  paid: { tone: 'good', label: 'Paid' },
  closed: { tone: 'neutral', label: 'Closed' },
  in_transit: { tone: 'info', label: 'In transit' },
  delivered: { tone: 'good', label: 'Delivered' },
  // docs
  pending: { tone: 'warn', label: 'Pending' },
  valid: { tone: 'good', label: 'Valid' },
  invalid: { tone: 'bad', label: 'Invalid' },
  needs_review: { tone: 'warn', label: 'Needs you' },
  linked: { tone: 'good', label: 'Linked' },
  unlinked: { tone: 'neutral', label: 'Unlinked' },
  // compliance
  active: { tone: 'good', label: 'Current' },
  expiring_soon: { tone: 'warn', label: 'Expiring' },
  expired: { tone: 'bad', label: 'Expired' },
  // money
  draft: { tone: 'neutral', label: 'Draft' },
  sent: { tone: 'info', label: 'Sent' },
  overdue: { tone: 'bad', label: 'Overdue' },
  approved: { tone: 'good', label: 'Approved' },
  quick_pay: { tone: 'mind', label: 'Quick-pay' },
  disputed: { tone: 'bad', label: 'Disputed' },
  review: { tone: 'warn', label: 'In review' },
  // autopilot
  done: { tone: 'good', label: 'Done' },
  needs_you: { tone: 'warn', label: 'Needs you' },
  skipped: { tone: 'neutral', label: 'Skipped' },
  suggest: { tone: 'info', label: 'Suggest' },
  act: { tone: 'signal', label: 'Act' },
  full: { tone: 'mind', label: 'Full autonomy' },
  // generic
  open: { tone: 'warn', label: 'Open' },
  resolved: { tone: 'good', label: 'Resolved' },
  critical: { tone: 'bad', label: 'Critical' },
  high: { tone: 'warn', label: 'High' },
  medium: { tone: 'info', label: 'Medium' },
  low: { tone: 'neutral', label: 'Low' },
  success: { tone: 'good', label: 'Success' },
  failed: { tone: 'bad', label: 'Failed' },
};

export function statusMeta(status: string) {
  const key = status.toLowerCase().replace(/[\s-]/g, '_');
  return MAP[key] ?? { tone: 'neutral' as Tone, label: status.replace(/_/g, ' ') };
}

export function StatusPill({ status, size = 'md', dot = true }: { status: string; size?: 'sm' | 'md' | 'lg'; dot?: boolean }) {
  const m = statusMeta(status);
  return (
    <Badge tone={m.tone} size={size} dot={dot}>
      {m.label}
    </Badge>
  );
}
