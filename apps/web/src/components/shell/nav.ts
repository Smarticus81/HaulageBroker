import {
  Activity,
  BookOpenText,
  Compass,
  FileStack,
  Inbox,
  Landmark,
  Settings2,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem { href: string; label: string; icon: LucideIcon; hint?: string; key?: string }
export interface NavGroup { label?: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    items: [
      { href: '/app', label: 'Today', icon: Compass, hint: 'What Autopilot did and what needs you', key: '1' },
      { href: '/app/loads', label: 'Loads', icon: Truck, hint: 'Every haul, from booked to paid', key: '2' },
      { href: '/app/inbox', label: 'Inbox', icon: Inbox, hint: 'Paperwork as it arrives', key: '3' },
      { href: '/app/money', label: 'Money', icon: Landmark, hint: 'Invoices, cash and settlements', key: '4' },
      { href: '/app/compliance', label: 'Compliance', icon: ShieldCheck, hint: 'Drivers, trucks, filings', key: '5' },
    ],
  },
  {
    label: 'Run the business',
    items: [
      { href: '/app/autopilot', label: 'Autopilot', icon: Sparkles, hint: 'Policies and the activity ledger', key: '6' },
      { href: '/app/plan', label: 'Plan', icon: BookOpenText, hint: 'Your living business plan', key: '7' },
      { href: '/app/audit', label: 'Audit', icon: FileStack, hint: 'Every change, forever', key: '8' },
    ],
  },
  {
    items: [{ href: '/app/settings', label: 'Settings', icon: Settings2 }],
  },
];

export const ALL_NAV = NAV.flatMap((g) => g.items);
export const ACTIVITY_ICON = Activity;
