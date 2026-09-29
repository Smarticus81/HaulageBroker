'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CornerDownLeft, FileText, Landmark, Mic, MicOff, Search, Sparkles, Truck, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';
import { ALL_NAV } from './nav';
import { customerById, documents, drivers, invoices, loads } from '@/lib/data';
import { useVoice } from '@/lib/hooks/use-voice';
import { toast } from '@/components/ui/toast';

type Item = { id: string; group: string; label: string; sub?: string; icon: React.ElementType; run: () => void; kbd?: string };

export function CommandPalette({ open, onClose, onAskCopilot }: { open: boolean; onClose: () => void; onAskCopilot: (q: string) => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const voice = useVoice();

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      voice.stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const items = useMemo<Item[]>(() => {
    const s = q.trim().toLowerCase();
    const nav: Item[] = ALL_NAV.map((n) => ({ id: `nav-${n.href}`, group: 'Go to', label: n.label, sub: n.hint, icon: n.icon, run: () => go(n.href), kbd: n.key }));
    const actions: Item[] = [
      { id: 'a-invoice', group: 'Actions', label: 'Send every ready invoice', sub: '2 packets are complete', icon: Landmark, run: () => { onClose(); toast.success('Autopilot is sending 2 invoices', 'INV-1046 and INV-1047 will go out in the next minute.'); } },
      { id: 'a-chase', group: 'Actions', label: 'Chase all missing PODs now', sub: 'Skips quiet hours', icon: Truck, run: () => { onClose(); toast.success('Reminders sent', 'Marcus and Tomas were texted about LD-2037 and LD-2038.'); } },
      { id: 'a-settle', group: 'Actions', label: 'Run settlements early', sub: 'Draft for all drivers through today', icon: UserRound, run: () => go('/app/money?tab=settlements') },
    ];
    const loadItems: Item[] = loads
      .filter((l) => !s || l.number.toLowerCase().includes(s) || l.origin.toLowerCase().includes(s) || l.destination.toLowerCase().includes(s) || customerById(l.customerId).name.toLowerCase().includes(s))
      .slice(0, s ? 6 : 3)
      .map((l) => ({ id: l.id, group: 'Loads', label: l.number, sub: `${l.origin} → ${l.destination} · ${customerById(l.customerId).name}`, icon: Truck, run: () => go(`/app/loads/${l.id}`) }));
    const docItems: Item[] = documents
      .filter((d) => s && (d.filename.toLowerCase().includes(s) || d.type.toLowerCase().includes(s)))
      .slice(0, 5)
      .map((d) => ({ id: d.id, group: 'Documents', label: d.filename, sub: `${d.type}${d.loadId ? ` · ${loads.find((l) => l.id === d.loadId)?.number}` : ''}`, icon: FileText, run: () => go(`/app/inbox/${d.id}`) }));
    const invItems: Item[] = invoices
      .filter((i) => s && (i.number.toLowerCase().includes(s) || customerById(i.customerId).name.toLowerCase().includes(s)))
      .slice(0, 5)
      .map((i) => ({ id: i.id, group: 'Invoices', label: i.number, sub: `${customerById(i.customerId).name} · $${i.amount.toLocaleString()}`, icon: Landmark, run: () => go('/app/money') }));
    const drvItems: Item[] = drivers
      .filter((d) => s && d.name.toLowerCase().includes(s))
      .map((d) => ({ id: d.id, group: 'Drivers', label: d.name, sub: d.homeBase, icon: UserRound, run: () => go('/app/compliance?subject=' + d.id) }));

    const filtered = (arr: Item[]) => (s ? arr.filter((i) => i.label.toLowerCase().includes(s) || i.sub?.toLowerCase().includes(s)) : arr);
    const list = [...filtered(nav), ...filtered(actions), ...loadItems, ...docItems, ...invItems, ...drvItems];
    if (s.length > 2) {
      list.push({ id: 'ask', group: 'Copilot', label: `Ask Copilot: “${q.trim()}”`, sub: 'Answers from your loads, docs and money', icon: Sparkles, run: () => { onClose(); onAskCopilot(q.trim()); } });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => setIdx(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); items[idx]?.run(); }
  };

  const startVoice = async () => {
    if (voice.listening) return voice.stopListening();
    if (!voice.supported.listen) return toast.info('Voice input is not available in this browser', 'Try Chrome, Edge or Safari.');
    const t = await voice.listen(7000);
    if (t) setQ(t);
  };

  const groups = items.reduce<Record<string, Item[]>>((acc, it) => ((acc[it.group] ??= []).push(it), acc), {});
  let flat = -1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/35 backdrop-blur-[3px] dark:bg-black/60" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ type: 'spring', stiffness: 460, damping: 36 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[22px] border border-line bg-surface shadow-[var(--shadow-float)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-4.5 w-4.5 text-ink-3" />
              <input
                ref={inputRef}
                value={voice.listening && voice.interim ? voice.interim : q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder={voice.listening ? 'Listening…' : 'Type a load, a customer, or an instruction'}
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-4"
              />
              <button
                onClick={startVoice}
                className={cn('relative grid h-9 w-9 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:text-ink', voice.listening && 'border-signal text-signal')}
                aria-label="Speak"
              >
                {voice.listening && <span className="absolute inset-0 rounded-full bg-signal/30" style={{ transform: `scale(${1 + voice.level * 0.9})`, transition: 'transform 80ms' }} />}
                {voice.supported.listen ? <Mic className="relative h-4 w-4" /> : <MicOff className="relative h-4 w-4" />}
              </button>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {items.length === 0 && <div className="px-4 py-10 text-center text-sm text-ink-3">No matches. Press Enter to ask Copilot.</div>}
              {Object.entries(groups).map(([g, arr]) => (
                <div key={g} className="mb-1">
                  <div className="px-3 pb-1 pt-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-4">{g}</div>
                  {arr.map((it) => {
                    flat += 1;
                    const i = flat;
                    const Icon = it.icon;
                    const active = i === idx;
                    return (
                      <button
                        key={it.id}
                        onMouseEnter={() => setIdx(i)}
                        onClick={it.run}
                        className={cn('flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors', active ? 'bg-surface-2' : 'hover:bg-surface-2/60')}
                      >
                        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-line bg-surface', it.group === 'Copilot' && 'text-mind')}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-ink">{it.label}</span>
                          {it.sub && <span className="block truncate text-xs text-ink-3">{it.sub}</span>}
                        </span>
                        {it.kbd && <Kbd>{it.kbd}</Kbd>}
                        {active && <ArrowRight className="h-4 w-4 text-ink-3" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 border-t border-line bg-surface-2/50 px-4 py-2 font-mono text-[10.5px] text-ink-4">
              <span className="inline-flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span>
              <span className="inline-flex items-center gap-1"><Kbd><CornerDownLeft className="h-3 w-3" /></Kbd> open</span>
              <span className="inline-flex items-center gap-1"><Kbd>esc</Kbd> close</span>
              <span className="ml-auto hidden sm:inline">Voice: tap the mic and talk</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
