'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn, hoursLabel } from '@/lib/utils';
import { Wordmark, LogoMark } from '@/components/brand/logo';
import { AutopilotOrb } from '@/components/ui/orb';
import { Tooltip } from '@/components/ui/tooltip';
import { NAV } from './nav';
import { useSession } from '@/lib/store';
import { autopilotSummary } from '@/lib/data';

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const mode = useSession((s) => s.policies.mode);
  const summary = autopilotSummary();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-bg-deep/70 backdrop-blur-xl transition-[width] duration-300 ease-[var(--ease-out-expo)] lg:flex',
        collapsed ? 'w-[72px]' : 'w-[248px]',
      )}
    >
      <div className={cn('flex h-16 items-center px-4', collapsed && 'justify-center px-0')}>
        <Link href="/app" aria-label="Haulage home">
          {collapsed ? <LogoMark size={28} /> : <Wordmark size="md" />}
        </Link>
      </div>

      {/* Autopilot status */}
      <Link
        href="/app/autopilot"
        className={cn(
          'group mx-3 mb-3 flex items-center gap-3 rounded-[14px] border border-line bg-surface px-3 py-2.5 transition-colors hover:border-line-strong',
          collapsed && 'mx-2 justify-center px-0',
        )}
      >
        <AutopilotOrb mode={mode} size={10} />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="text-[12.5px] font-semibold text-ink">Autopilot on</div>
            <div className="truncate font-mono text-[10.5px] text-ink-3">
              {summary.events_7d} actions · {hoursLabel(summary.saved_minutes_7d)} saved this week
            </div>
          </div>
        )}
      </Link>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-3 no-scrollbar">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <div className="mb-1 px-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-4">{group.label}</div>
            )}
            {group.label && collapsed && <div className="mx-auto my-2 h-px w-6 bg-line" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href);
                const Icon = item.icon;
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group relative flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[13.5px] font-medium transition-colors',
                      active ? 'text-ink' : 'text-ink-3 hover:bg-surface-2 hover:text-ink-2',
                      collapsed && 'justify-center px-0',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-[10px] bg-surface shadow-[var(--shadow-card)] border border-line"
                        transition={{ type: 'spring', stiffness: 500, damping: 42 }}
                      />
                    )}
                    <Icon className={cn('h-[17px] w-[17px] shrink-0', active && 'text-signal')} strokeWidth={active ? 2.2 : 1.9} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.key && (
                      <span className="ml-auto font-mono text-[10px] text-ink-4 opacity-0 transition-opacity group-hover:opacity-100">{item.key}</span>
                    )}
                  </Link>
                );
                return collapsed ? (
                  <Tooltip key={item.href} label={item.label} side="right" className="w-full">
                    {link}
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={onToggle}
          className={cn('flex h-9 w-full items-center gap-2 rounded-[10px] px-2.5 text-[12.5px] text-ink-3 hover:bg-surface-2 hover:text-ink-2', collapsed && 'justify-center px-0')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  const items = NAV[0].items.slice(0, 4).concat(NAV[1].items[0]);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line glass pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map((item) => {
        const active = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn('flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium', active ? 'text-signal' : 'text-ink-3')}>
            <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
