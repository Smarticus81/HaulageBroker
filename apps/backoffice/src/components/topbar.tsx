'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Bot,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/documents': 'Document Inbox',
  '/loads': 'Load Records',
  '/compliance': 'Compliance Center',
  '/billing': 'Billing',
  '/settlements': 'Settlements',
  '/automations': 'Automations',
  '/audit': 'Audit Logs',
  '/login': 'Login',
};

interface TopbarProps {
  sidebarCollapsed: boolean;
  copilotOpen: boolean;
  onToggleCopilot: () => void;
}

export function Topbar({ sidebarCollapsed, copilotOpen, onToggleCopilot }: TopbarProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const breadcrumb = breadcrumbMap[pathname] || pathname.split('/').filter(Boolean).pop() || 'Page';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 transition-all duration-200',
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]',
      )}
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-900">{breadcrumb}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search loads, docs..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-3 py-1.5 w-56 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Copilot toggle */}
        <button
          onClick={onToggleCopilot}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            copilotOpen
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">Copilot</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
              JD
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-none">
                Acme Trucking
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50">
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <hr className="my-1 border-slate-200" />
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
