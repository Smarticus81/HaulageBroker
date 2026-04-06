'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Truck,
  Shield,
  Receipt,
  Calculator,
  Zap,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Document Inbox', href: '/documents', icon: Inbox },
  { label: 'Load Records', href: '/loads', icon: Truck },
  { label: 'Compliance Center', href: '/compliance', icon: Shield },
  { label: 'Billing', href: '/billing', icon: Receipt },
  { label: 'Settlements', href: '/settlements', icon: Calculator },
  { label: 'Automations', href: '/automations', icon: Zap },
  { label: 'Audit Logs', href: '/audit', icon: ScrollText },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-30 transition-all duration-200',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sidebar-text-active font-semibold text-sm truncate">
              CarrierBackOffice
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 sidebar-scroll overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                isActive
                  ? 'bg-sidebar-active text-sidebar-text-active'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active',
                collapsed && 'justify-center px-0',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 mx-2 mb-2 rounded-lg text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>

      {/* User info */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 border-t border-slate-700',
          collapsed && 'justify-center px-2',
        )}
      >
        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
          JD
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-text-active truncate">
              John Doe
            </p>
            <p className="text-xs text-sidebar-text truncate">Admin</p>
          </div>
        )}
      </div>
    </aside>
  );
}
