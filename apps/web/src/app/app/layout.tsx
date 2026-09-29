'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar, MobileTabs } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { CommandPalette } from '@/components/shell/command-palette';
import { CopilotDrawer } from '@/components/shell/copilot';
import { Toaster } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { ALL_NAV } from '@/components/shell/nav';
import { ClientOnly } from '@/components/shell/client-only';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const [copilot, setCopilot] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('haulage.sidebar') === 'collapsed');
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('haulage.sidebar', !c ? 'collapsed' : 'open');
      } catch {}
      return !c;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setCopilot((c) => !c);
      } else if (!typing && !e.metaKey && !e.ctrlKey && /^[1-8]$/.test(e.key)) {
        const item = ALL_NAV.find((n) => n.key === e.key);
        if (item) router.push(item.href);
      } else if (!typing && e.key === '[') {
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, toggle]);

  return (
    <ClientOnly>
    <div className="min-h-dvh">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className={cn('transition-[padding] duration-300 ease-[var(--ease-out-expo)]', collapsed ? 'lg:pl-[72px]' : 'lg:pl-[248px]', copilot && 'xl:pr-[400px]')}>
        <Topbar onOpenPalette={() => setPalette(true)} onOpenCopilot={() => setCopilot((c) => !c)} copilotOpen={copilot} />
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-12">{children}</main>
      </div>
      <MobileTabs />
      <CommandPalette open={palette} onClose={() => setPalette(false)} onAskCopilot={(q) => { setSeed(q + ' '); setCopilot(true); }} />
      <CopilotDrawer open={copilot} onClose={() => setCopilot(false)} seed={seed} />
      <Toaster />
    </div>
    </ClientOnly>
  );
}
