import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/marketing/site-nav';
import { SiteFooter } from '@/components/marketing/footer';
import { PricingSection } from '@/components/marketing/pricing';
import { Eyebrow } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Pricing' };

const faqs = [
  ['What counts as a truck?', 'A power unit that hauled at least one load in the month. Parked trucks are free.'],
  ['Is there a contract?', 'No. Monthly, cancel any time, export everything in one click from Audit.'],
  ['How does quick-pay make money?', 'The factoring partner pays us a referral share. Your rate is theirs, never marked up. Autopilot only routes an invoice when the customer is slower than the threshold you set.'],
  ['What does Autopilot never do?', 'It never sends an invoice over your limit, never approves a rate change, never pays anything, and never deletes a document. Every action is in the ledger and the audit log.'],
  ['Do drivers need accounts?', 'No. They get a link. The driver app works in the browser and needs no login to snap paperwork for their own loads.'],
  ['Where does my data live?', 'US-hosted Postgres with per-organization isolation, encrypted at rest and in transit. Documents live in object storage you can export.'],
];

const model = [
  ['Product-led', 'No sales calls. Landing page to running workspace in under ten minutes.'],
  ['Voice-first', 'Onboarding is a conversation. Talk or type; the app speaks back.'],
  ['Autopilot, not dashboards', '“The system did it, here is the receipt”, not “here is a chart, go do something”.'],
  ['Per-truck pricing', 'One number the owner already thinks in. No seats, no per-document fees.'],
  ['Living business plan', 'Every workspace has a plan that recomputes from real operating data.'],
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main className="pt-32 sm:pt-40">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <Eyebrow className="justify-center">Pricing</Eyebrow>
          <h1 className="display text-balance text-[44px] sm:text-[64px]">Pay per truck. Start with none of them.</h1>
          <p className="mt-4 text-[16px] text-ink-3 text-pretty">Solo is free for one truck, forever. Fleet and Autopilot scale with your power units and nothing else.</p>
        </div>
        <PricingSection compact />

        <section id="model" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow>The lean model</Eyebrow>
              <h2 className="display text-[36px] sm:text-[44px]">Why it can be this cheap.</h2>
              <p className="mt-3 text-[14.5px] text-ink-3 text-pretty">There is no sales team to pay for and no office of ours doing your paperwork by hand. The margin is in software doing the work, and the pricing follows. <Link href="/#autopilot" className="text-signal">See how it works →</Link></p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
              {model.map(([t, d]) => (
                <div key={t} className="surface p-5"><div className="text-[15px] font-semibold">{t}</div><p className="mt-1 text-[13.5px] text-ink-3 text-pretty">{d}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-6 pb-24">
          <Eyebrow>Questions</Eyebrow>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[16px] font-medium text-ink">
                  {q}<span className="ml-4 text-ink-4 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 max-w-2xl text-[14px] text-ink-3 text-pretty">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
