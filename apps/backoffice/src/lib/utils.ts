import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, fmt: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

export const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  valid: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  complete: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  paid: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },

  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'pending_review': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'needs_review': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  expiring: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  draft: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },

  invalid: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  expired: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  overdue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },

  info: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'in_transit': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },

  inactive: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
  cancelled: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export function getStatusColor(status: string) {
  const normalized = status.toLowerCase().replace(/[\s-]/g, '_');
  return statusColors[normalized] || { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };
}
