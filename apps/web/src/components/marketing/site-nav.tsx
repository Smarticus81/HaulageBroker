'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

const links = [
  { href: '/#autopilot', label: 'Autopilot' },
  { href: '/#product', label: 'Product' },
  { href: '/#voice', label: 'Voice' },
  { href: '/pricing', label: 'Pricing' },
];

export function SiteNav() {
  const { resolved, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav className={cn('mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-[18px] px-3 transition-all duration-300 sm:px-4', scrolled ? 'glass shadow-[var(--shadow-card)]' : 'border border-transparent')}>
        <Link href="/" aria-label="Haulage"><Wordmark size="sm" /></Link>
        <div className="mx-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-[10px] px-3 py-1.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label="Toggle theme">
            {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link href="/login" className="hidden sm:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/start"><Button size="sm">Start free</Button></Link>
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>
      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-[18px] glass p-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-ink-2 hover:bg-surface-2">
              {l.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} className="block rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-ink-2 hover:bg-surface-2">Sign in</Link>
        </div>
      )}
    </div>
  );
}
