'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, BookOpenText, Camera, Inbox, Landmark, Mic, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Eyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Reveal, Stagger, Item } from '@/components/motion/reveal';
import { VoiceVisualizer } from '@/components/onboarding/voice-visualizer';
import { ProgressRing } from '@/components/ui/ring';
import { Sparkline } from '@/components/ui/sparkline';

export function HowItWorks() {
  const steps = [
    { n: '01', t: 'Talk for seven minutes', d: 'Tell it about your trucks, your lanes, your brokers, your cash. It builds your business plan while you speak.', icon: Mic },
    { n: '02', t: 'Autopilot takes the paperwork', d: 'Rate cons, BOLs and PODs get read, linked and chased. Invoices go out the moment a packet is complete.', icon: Sparkles },
    { n: '03', t: 'You make the few real decisions', d: 'A short list each morning. Approve, dispute, renew. Everything else is already done, with a receipt.', icon: ShieldCheck },
  ];
  return (
    <section id="autopilot" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="max-w-2xl">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="display text-balance text-[40px] sm:text-[56px]">Hire the office you never wanted to hire.</h2>
        <p className="mt-4 text-[16px] text-ink-3 text-pretty">Most carriers hire someone for paperwork at truck number four. Haulage does that job from truck number one, and it never forgets a POD.</p>
      </Reveal>
      <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Item key={s.n}>
              <div className="surface h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-ink-4">{s.n}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-signal-soft text-signal"><Icon className="h-4 w-4" /></span>
                </div>
                <h3 className="mt-6 text-[19px] font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-2 text-[14px] text-ink-3 text-pretty">{s.d}</p>
              </div>
            </Item>
          );
        })}
      </Stagger>
    </section>
  );
}

export function ProductBento() {
  return (
    <section id="product" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="max-w-2xl">
        <Eyebrow>The product</Eyebrow>
        <h2 className="display text-balance text-[40px] sm:text-[56px]">Six rooms. One quiet building.</h2>
      </Reveal>
      <Stagger className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
        <Item className="md:col-span-4">
          <Tile icon={Inbox} title="Inbox" kicker="Paperwork reads itself" body="Forward email, snap photos, connect broker portals. Documents are classified, extracted, and linked to the right load with a confidence score you set the bar for.">
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[['RC_PCL-4380.pdf', 'Rate con · 98%'], ['IMG_4471.jpg', 'POD · 71% · needs you'], ['BOL_2034.pdf', 'BOL · 95%']].map(([f, m], i) => (
                <div key={f} className={cn('rounded-[12px] border border-line bg-surface-2/60 p-3', i === 1 && 'border-warn/50')}>
                  <div className="h-16 rounded-[8px] bg-[repeating-linear-gradient(0deg,transparent_0_7px,var(--line)_7px_8px)] border border-line-soft" />
                  <div className="mt-2 truncate font-mono text-[10.5px] text-ink">{f}</div>
                  <div className={cn('font-mono text-[10px]', i === 1 ? 'text-warn' : 'text-ink-3')}>{m}</div>
                </div>
              ))}
            </div>
          </Tile>
        </Item>
        <Item className="md:col-span-2">
          <Tile icon={Landmark} title="Money" kicker="Days to cash, not days to invoice" body="Invoices go out when packets are complete. Slow payers get routed to quick-pay. You see cash by day, not by hope.">
            <div className="mt-6 space-y-2">
              {[['Pacific Coast', 29, 30], ['Global Freight', 34, 30], ['Midwest Mfg', 52, 45], ['Redline', 71, 60]].map(([n, d, t]) => (
                <div key={String(n)} className="flex items-center gap-2 text-[11.5px]">
                  <span className="w-24 truncate text-ink-3">{n}</span>
                  <span className="relative h-1.5 flex-1 rounded-full bg-surface-3">
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(Number(d) / 80) * 100}%`, background: Number(d) > 45 ? 'var(--bad)' : 'var(--series-2)' }} />
                    <span className="absolute inset-y-[-3px] w-px bg-ink-4" style={{ left: `${(Number(t) / 80) * 100}%` }} />
                  </span>
                  <span className="w-7 text-right font-mono tabular text-ink">{d}d</span>
                </div>
              ))}
            </div>
          </Tile>
        </Item>
        <Item className="md:col-span-2">
          <Tile icon={ShieldCheck} title="Compliance" kicker="Nothing expires without warning" body="CDLs, med cards, inspections, IFTA, 2290. Alerts at 30, 14, 7 and 1 days. Renewals pre-filled.">
            <div className="mt-6 flex items-end gap-1.5">
              {[9, 14, 26, 31, 41, 77, 94, 122].map((d) => (
                <div key={d} className="flex flex-1 flex-col items-center gap-1">
                  <span className="w-full rounded-t-[4px]" style={{ height: 8 + (120 - Math.min(d, 120)) * 0.4, background: d <= 14 ? 'var(--warn)' : 'var(--series-2)', opacity: d <= 30 ? 1 : 0.5 }} />
                  <span className="font-mono text-[9px] text-ink-4">{d}d</span>
                </div>
              ))}
            </div>
          </Tile>
        </Item>
        <Item className="md:col-span-2">
          <Tile icon={BookOpenText} title="Plan" kicker="A business plan that stays true" body="Cost per mile, break-even, cash runway and the two levers that matter. Recomputed as loads close.">
            <div className="mt-6 flex items-center gap-4">
              <ProgressRing value={41} size={72} stroke={7} tone="warn"><span className="tabular text-sm font-semibold">41</span></ProgressRing>
              <div className="flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Cash, 12 months</div>
                <div className="mt-1 h-8"><Sparkline data={[15, -46, -42, -38, -34, -30, -26, -22, -18, -14, -10, -6]} tone="warn" /></div>
              </div>
            </div>
          </Tile>
        </Item>
        <Item className="md:col-span-2">
          <Tile icon={Camera} title="Driver app" kicker="Snap. Done." body="Drivers photograph the POD at the dock. Autopilot reads it, links it, and the invoice goes out before they leave the lot.">
            <div className="mt-6 grid place-items-center">
              <div className="relative h-24 w-40 rounded-[14px] bg-surface-inverse">
                {['top-2 left-2 border-t-2 border-l-2', 'top-2 right-2 border-t-2 border-r-2', 'bottom-2 left-2 border-b-2 border-l-2', 'bottom-2 right-2 border-b-2 border-r-2'].map((c) => (
                  <span key={c} className={cn('absolute h-4 w-4 rounded-[3px] border-signal', c)} />
                ))}
                <span className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-signal/70 animate-pulse" />
              </div>
            </div>
          </Tile>
        </Item>
        <Item className="md:col-span-4">
          <Tile icon={Sparkles} title="Copilot" kicker="Ask anything, confirm before it acts" body="“What needs me?” “How much are we owed?” “Which loads are missing PODs?” Grounded in your data, with a confirm step before any action.">
            <div className="mt-6 rounded-[16px] border border-line bg-surface-2/60 p-3">
              <div className="flex items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-2 text-[13px] text-ink-3"><Mic className="h-4 w-4 text-signal" /> how much are we owed <span className="ml-auto flex gap-0.5"><Kbd>⌘</Kbd><Kbd>K</Kbd></span></div>
              <div className="mt-2 rounded-[12px] rounded-tl-[4px] border border-line bg-surface px-3 py-2 text-[13px] text-ink">You have $5,670 outstanding across 4 invoices. INV-1038 from Midwest is 3 days late. $1,010 lands tomorrow via quick-pay.</div>
            </div>
          </Tile>
        </Item>
      </Stagger>
    </section>
  );
}

function Tile({ icon: Icon, title, kicker, body, children }: { icon: React.ElementType; title: string; kicker: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="surface h-full p-6">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-surface-2 text-ink"><Icon className="h-4 w-4" /></span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">{title}</span>
      </div>
      <h3 className="mt-4 text-[20px] font-semibold tracking-tight">{kicker}</h3>
      <p className="mt-2 text-[14px] text-ink-3 text-pretty">{body}</p>
      {children}
    </div>
  );
}

export function VoiceSection() {
  return (
    <section id="voice" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="overflow-hidden rounded-[32px] bg-surface-inverse text-ink-inverse">
        <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] opacity-60">Voice-guided onboarding</div>
            <h2 className="display mt-3 text-balance text-[40px] sm:text-[56px]">Say it. Don’t fill it in.</h2>
            <p className="mt-4 max-w-md text-[16px] opacity-75 text-pretty">Setup is a conversation, not a form. It asks about your trucks, your rate per mile, your brokers and your cash. It listens, confirms, and builds your plan on the right side of the screen while you talk.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start"><Button size="lg">Start talking <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/start"><Button size="lg" variant="ghost" className="text-ink-inverse hover:bg-white/10">Or type, if you’d rather</Button></Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[['7 min', 'average setup'], ['23', 'questions, all skippable'], ['0', 'forms']].map(([v, l]) => (
                <div key={l}><div className="tabular text-2xl font-semibold">{v}</div><div className="font-mono text-[10.5px] uppercase tracking-[0.12em] opacity-60">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="mx-auto max-w-sm rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex justify-center"><VoiceVisualizer speaking listening={false} level={0} size={90} /></div>
              <div className="mt-2 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] opacity-60">Economics · 8 of 21</div>
              <div className="display mt-3 text-center text-[30px]">Average rate per loaded mile?</div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 rounded-[14px] bg-white/10 px-4 py-3 text-center text-[15px]">
                “about two thirty five”
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="mt-3 flex items-center justify-between rounded-[14px] border border-white/10 px-4 py-3 text-[13px]">
                <span className="opacity-70">Revenue, monthly</span><span className="tabular font-semibold text-signal">$64,919</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
      <Reveal className="text-center">
        <h2 className="display text-balance text-[44px] sm:text-[72px]">Your back office starts <em className="text-signal">tonight</em>.</h2>
        <p className="mx-auto mt-4 max-w-xl text-[16px] text-ink-3">Set it up on your phone from the truck stop. Autopilot will have read your inbox by morning.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/start"><Button size="xl">Set up with your voice <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/login?demo=1"><Button size="xl" variant="secondary">See the demo fleet</Button></Link>
        </div>
      </Reveal>
    </section>
  );
}
