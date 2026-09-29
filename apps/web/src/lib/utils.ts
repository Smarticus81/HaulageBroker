import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const money = (v: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...opts,
  }).format(v);

export const moneyExact = (v: number) => money(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const compact = (v: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export const pct = (v: number, digits = 0) => `${v.toFixed(digits)}%`;

export const int = (v: number) => new Intl.NumberFormat('en-US').format(Math.round(v));

export function fmtDate(d: string | Date, f = 'MMM d'): string {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, f);
}

export function fmtDateTime(d: string | Date): string {
  return fmtDate(d, 'MMM d, h:mm a');
}

export function ago(d: string | Date): string {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

export function hoursLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = minutes / 60;
  return h >= 10 ? `${Math.round(h)}h` : `${h.toFixed(1).replace(/\.0$/, '')}h`;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
