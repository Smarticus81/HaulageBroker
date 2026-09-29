import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteNav } from '@/components/marketing/site-nav';
import { SiteFooter } from '@/components/marketing/footer';
import { HeroVisual } from '@/components/marketing/hero-visual';
import { HowItWorks, ProductBento, VoiceSection, FinalCta } from '@/components/marketing/sections';
import { PricingSection } from '@/components/marketing/pricing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const integrations = ['QuickBooks', 'Gmail', 'Outlook', 'Samsara', 'Motive', 'WEX', 'Triumph', 'DAT'];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 sm:pt-40">
          <div className="pointer-events-none absolute inset-0 dotgrid mask-fade-b opacity-60" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Badge tone="signal" dot pulse className="mb-6">Autopilot is on for 1,204 trucks tonight</Badge>
              <h1 className="display text-balance text-[52px] leading-[0.95] sm:text-[76px] lg:text-[84px]">
                The back office that runs <em className="text-signal">itself</em>.
              </h1>
              <p className="mt-6 max-w-lg text-[17px] text-ink-2 text-pretty sm:text-[19px]">
                Paperwork, billing, compliance and cash planning for carriers with 1 to 50 trucks. Set it up by talking. Then watch the ledger fill.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/start"><Button size="xl">Set up with your voice <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link href="/login?demo=1"><Button size="xl" variant="secondary">See the demo fleet</Button></Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
                <span>Free for one truck</span><span className="h-1 w-1 rounded-full bg-ink-4" /><span>7-minute setup</span><span className="h-1 w-1 rounded-full bg-ink-4" /><span>Every action logged</span>
              </div>
            </div>
            <div className="lg:col-span-6">
              <HeroVisual />
            </div>
          </div>
          <div className="relative mx-auto mt-20 max-w-6xl px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-y border-line py-5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-ink-4">
              <span className="text-ink-3">Runs alongside</span>
              {integrations.map((n) => <span key={n}>{n}</span>)}
            </div>
          </div>
        </section>

        <HowItWorks />
        <ProductBento />
        <VoiceSection />
        <PricingSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
