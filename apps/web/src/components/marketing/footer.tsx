import Link from 'next/link';
import { Wordmark } from '@/components/brand/logo';

const cols = [
  { h: 'Product', items: [['Autopilot', '/#autopilot'], ['Inbox', '/#product'], ['Money', '/#product'], ['Compliance', '/#product'], ['Driver app', '/driver'], ['Pricing', '/pricing']] },
  { h: 'Company', items: [['Business model', '/pricing#model'], ['Design system', '/pricing#model'], ['Security', '/pricing#faq'], ['Status', '/pricing#faq']] },
  { h: 'Start', items: [['Set up with your voice', '/start'], ['Sign in', '/login'], ['Try the demo', '/login?demo=1']] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-deep/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Wordmark size="md" />
          <p className="mt-4 max-w-sm text-[14px] text-ink-3 text-pretty">The autonomous back office for carriers. Paperwork, billing, compliance and cash planning that run themselves, with a receipt for everything.</p>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-4">Built for 1 to 50 trucks · US carriers</p>
        </div>
        {cols.map((c) => (
          <div key={c.h} className="md:col-span-2">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">{c.h}</div>
            <ul className="mt-3 space-y-2">
              {c.items.map(([l, h]) => (
                <li key={l}><Link href={h} className="text-[13.5px] text-ink-2 hover:text-ink">{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-5 font-mono text-[11px] text-ink-4">
          <span>© {new Date().getFullYear()} Haulage. Signal design system v1.</span>
          <span>No sales calls. No per-document fees. Cancel any time.</span>
        </div>
      </div>
    </footer>
  );
}
