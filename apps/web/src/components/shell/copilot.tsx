'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, Check, Mic, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { cn, money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useVoice } from '@/lib/hooks/use-voice';
import { autopilotEvents, compliance, customerById, invoices, loads, missingDocs } from '@/lib/data';
import { useSession } from '@/lib/store';
import { toast } from '@/components/ui/toast';

interface Msg {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  links?: { label: string; href: string }[];
  proposal?: { label: string; onConfirm: () => void };
}

let seq = 1;

/** Deterministic, data-grounded answers so the demo never lies. */
function answer(q: string, resolved: string[]): Omit<Msg, 'id' | 'role'> {
  const s = q.toLowerCase();
  const needs = autopilotEvents.filter((e) => e.outcome === 'needs_you' && !resolved.includes(e.id));
  if (/need|todo|to do|waiting|blocked/.test(s)) {
    return {
      text: needs.length ? `${needs.length} things are waiting on you:\n${needs.map((e) => `• ${e.summary}`).join('\n')}` : 'Nothing is waiting on you. Autopilot has the rest.',
      links: [{ label: 'Open Today', href: '/app' }],
    };
  }
  if (/cash|money|owed|receivable|paid/.test(s)) {
    const open = invoices.filter((i) => i.status !== 'paid');
    const total = open.reduce((a, i) => a + i.amount, 0);
    const overdue = open.filter((i) => i.status === 'overdue');
    return {
      text: `You have ${money(total)} outstanding across ${open.length} invoices. ${overdue.length ? `${overdue.length} is overdue: ${overdue.map((i) => `${i.number} from ${customerById(i.customerId).name} (${money(i.amount)})`).join(', ')}.` : 'Nothing is overdue.'} ${money(invoices.filter((i) => i.status === 'quick_pay').reduce((a, i) => a + i.amount, 0))} lands tomorrow via quick-pay.`,
      links: [{ label: 'Open Money', href: '/app/money' }],
      proposal: overdue.length ? { label: `Send a polite reminder to ${customerById(overdue[0].customerId).name}`, onConfirm: () => toast.success('Reminder sent', `${overdue[0].number} reminder emailed to ${customerById(overdue[0].customerId).apEmail}.`) } : undefined,
    };
  }
  if (/pod|missing|paperwork|doc/.test(s)) {
    const m = loads.filter((l) => missingDocs(l).length && l.deliveredAt);
    return {
      text: m.length ? `${m.length} delivered loads are still missing paperwork:\n${m.map((l) => `• ${l.number}: ${missingDocs(l).join(', ')}`).join('\n')}` : 'Every delivered load has its paperwork.',
      links: [{ label: 'Open Inbox', href: '/app/inbox' }],
      proposal: m.length ? { label: 'Chase all of them now', onConfirm: () => toast.success('Reminders sent', 'Drivers were texted for the missing PODs.') } : undefined,
    };
  }
  if (/expir|compliance|cdl|medical|inspection/.test(s)) {
    const soon = compliance.filter((c) => c.status !== 'active');
    return {
      text: `${soon.length} compliance items need attention:\n${soon.map((c) => `• ${c.subjectName}: ${c.type} (${c.status === 'expired' ? 'expired' : `expires ${c.expiresAt}`})`).join('\n')}`,
      links: [{ label: 'Open Compliance', href: '/app/compliance' }],
    };
  }
  if (/margin|profit|plan|break.?even|cost per mile/.test(s)) {
    return {
      text: 'Your plan runs at a 6% margin with a break-even of about 25,600 miles a month. The two levers that matter most are rate per mile and the cash gap on Midwest and Redline. I keep the plan up to date as loads close.',
      links: [{ label: 'Open the plan', href: '/app/plan' }],
    };
  }
  if (/ld-?\d{4}/.test(s)) {
    const n = s.match(/ld-?(\d{4})/)![1];
    const l = loads.find((x) => x.number.endsWith(n));
    if (l) {
      const miss = missingDocs(l);
      return {
        text: `${l.number}: ${l.origin} → ${l.destination} for ${customerById(l.customerId).name}, ${money(l.rate)}. Status ${l.status.replace(/_/g, ' ')}. ${miss.length ? `Missing ${miss.join(', ')}.` : 'Paperwork is complete.'}`,
        links: [{ label: `Open ${l.number}`, href: `/app/loads/${l.id}` }],
      };
    }
  }
  return {
    text: 'I can answer from your loads, documents, invoices, compliance and the business plan. Try “what needs me”, “how much are we owed”, “which loads are missing PODs”, or a load number.',
  };
}

export function CopilotDrawer({ open, onClose, seed }: { open: boolean; onClose: () => void; seed?: string | null }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, role: 'assistant', text: 'Morning. Two things need you and I sent one invoice overnight. Ask me anything about the business, or tell me what to do.' },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const resolved = useSession((s) => s.resolvedEvents);
  const voice = useVoice();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, thinking]);

  useEffect(() => {
    if (seed && open) send(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, open]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { id: seq++, role: 'user', text: t }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const a = answer(t, resolved);
      setMsgs((m) => [...m, { id: seq++, role: 'assistant', ...a }]);
      setThinking(false);
      if (!voice.muted && voice.supported.speak) voice.speak(a.text.replace(/\n•/g, '.').slice(0, 320));
    }, 600 + Math.random() * 500);
  };

  const talk = async () => {
    if (voice.listening) return voice.stopListening();
    if (!voice.supported.listen) return toast.info('Voice input is not available in this browser');
    const t = await voice.listen(8000);
    if (t) send(t);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[400px] flex-col border-l border-line bg-bg shadow-[var(--shadow-float)]"
        >
          <div className="flex h-16 items-center gap-3 border-b border-line px-4">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-mind-soft text-mind">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <div className="text-[13.5px] font-semibold">Copilot</div>
              <div className="font-mono text-[10.5px] text-ink-3">grounded in your data · confirms before acting</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => voice.setMuted(!voice.muted)} aria-label="Toggle voice replies">
                {voice.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {msgs.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[88%] whitespace-pre-line rounded-[18px] px-4 py-2.5 text-[13.5px] leading-relaxed',
                    m.role === 'user' ? 'rounded-br-[6px] bg-surface-inverse text-ink-inverse' : 'rounded-bl-[6px] border border-line bg-surface text-ink',
                  )}
                >
                  {m.text}
                  {m.links && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} onClick={onClose} className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2 hover:text-ink">
                          {l.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                  {m.proposal && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-[12px] border border-mind/30 bg-mind-soft px-3 py-2">
                      <span className="text-xs font-medium text-ink">{m.proposal.label}</span>
                      <Button size="xs" variant="inverse" onClick={() => { m.proposal!.onConfirm(); setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, proposal: undefined, text: x.text + '\n\nDone.' } : x))); }}>
                        <Check className="h-3 w-3" /> Confirm
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-1.5 px-2 text-ink-3">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-current" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.18 }} />
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-line p-3"
          >
            <div className="flex items-end gap-2 rounded-[16px] border border-line bg-surface p-1.5 focus-within:border-signal">
              <button type="button" onClick={talk} className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 hover:text-ink', voice.listening && 'bg-signal-soft text-signal')} aria-label="Talk">
                <Mic className="h-4 w-4" />
              </button>
              <textarea
                value={voice.listening && voice.interim ? voice.interim : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                rows={1}
                placeholder={voice.listening ? 'Listening…' : 'Ask or instruct…'}
                className="max-h-32 flex-1 resize-none bg-transparent py-2 text-[13.5px] outline-none placeholder:text-ink-4"
              />
              <Button type="submit" size="icon-sm" className="shrink-0 rounded-full" aria-label="Send" disabled={!input.trim()}>
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
