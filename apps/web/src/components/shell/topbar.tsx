'use client';

import Link from 'next/link';
import { Bell, Moon, Search, Sparkles, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/lib/theme';
import { demoUser, autopilotEvents } from '@/lib/data';
import { useSession } from '@/lib/store';
import { LogoMark } from '@/components/brand/logo';

export function Topbar({
  onOpenPalette,
  onOpenCopilot,
  copilotOpen,
}: {
  onOpenPalette: () => void;
  onOpenCopilot: () => void;
  copilotOpen: boolean;
}) {
  const { resolved, toggle } = useTheme();
  const resolvedEvents = useSession((s) => s.resolvedEvents);
  const needsYou = autopilotEvents.filter((e) => e.outcome === 'needs_you' && !resolvedEvents.includes(e.id)).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <Link href="/app" className="lg:hidden" aria-label="Home">
        <LogoMark size={26} />
      </Link>

      <button
        onClick={onOpenPalette}
        className="group flex h-9 flex-1 items-center gap-2 rounded-[12px] border border-line bg-surface px-3 text-left text-[13px] text-ink-3 transition-colors hover:border-line-strong sm:max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate">Search loads, docs, invoices, or tell Autopilot what to do</span>
        <span className="hidden items-center gap-0.5 sm:inline-flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Link href="/app?focus=needs-you" className="relative">
          <Button variant="ghost" size="icon" aria-label="Needs you">
            <Bell className="h-[17px] w-[17px]" />
          </Button>
          {needsYou > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-signal px-1 font-mono text-[10px] font-semibold text-signal-ink">
              {needsYou}
            </span>
          )}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {resolved === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
        </Button>
        <Button
          variant={copilotOpen ? 'soft' : 'secondary'}
          size="sm"
          onClick={onOpenCopilot}
          className={cn('gap-1.5', copilotOpen && 'text-mind')}
        >
          <Sparkles className="h-4 w-4 text-mind" />
          <span className="hidden sm:inline">Copilot</span>
        </Button>
        <Link href="/app/settings" className="ml-1">
          <Avatar name={demoUser.name} size="sm" />
        </Link>
      </div>
    </header>
  );
}
