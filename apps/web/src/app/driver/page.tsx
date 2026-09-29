'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, Check, CheckCircle2, Circle, Mic, ReceiptText, Send, Square, Wallet, X } from 'lucide-react';
import { cn, fmtDate, money, moneyExact } from '@/lib/utils';
import { AutopilotOrb, Button, Card, CardBody, CardHeader, Eyebrow, Sheet, StatusPill, Textarea, toast } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { RouteRibbon } from '@/components/app/route-ribbon';
import { useVoice } from '@/lib/hooks/use-voice';
import { customerById, drivers, loads, REQUIRED_DOCS, settlements, type DocType, type Load, type LoadStatus } from '@/lib/data';

const ORDER: Record<LoadStatus, number> = { in_transit: 0, created: 1, docs_pending: 2, validation_failed: 3, ready_to_invoice: 4, invoiced: 5, delivered: 2, paid: 9 };

const DOC_WORD: Partial<Record<DocType, string>> = { RateConf: 'rate confirmation', BOL: 'BOL', POD: 'POD', FuelReceipt: 'fuel receipt', Lumper: 'lumper receipt', ScaleTicket: 'scale ticket', DetentionForm: 'detention form' };

type Flow = { load: Load; doc: DocType } | null;
type Stage = 'view' | 'reading' | 'result';

export default function DriverPage() {
  const driver = drivers[0];
  const [uploaded, setUploaded] = useState<Record<string, DocType[]>>({});
  const [flow, setFlow] = useState<Flow>(null);

  const mine = useMemo(
    () => loads.filter((l) => l.driverId === driver.id && l.status !== 'paid').sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.pickupAt.localeCompare(a.pickupAt)),
    [driver.id],
  );
  const docsOf = (l: Load): DocType[] => [...l.docs, ...(uploaded[l.id] ?? [])];
  const missing = (l: Load) => REQUIRED_DOCS.filter((d) => !docsOf(l).includes(d)).filter((d) => d !== 'RateConf');
  const needPaper = mine.filter((l) => l.deliveredAt && missing(l).length).length;

  const settlement = settlements.find((s) => s.driverId === driver.id && s.status !== 'paid') ?? settlements.find((s) => s.driverId === driver.id);

  const confirm = (load: Load, doc: DocType) => {
    setUploaded((u) => ({ ...u, [load.id]: [...(u[load.id] ?? []), doc] }));
    setFlow(null);
    toast.success(`${DOC_WORD[doc] ? cap(DOC_WORD[doc]!) : doc} saved for ${load.number}`, 'Autopilot is checking it against the rate confirmation.');
  };

  return (
    <div className="space-y-5">
      <header className="pt-1">
        <Eyebrow>{format(new Date(), 'EEEE, MMMM d')} · {driver.homeBase}</Eyebrow>
        <h1 className="display text-[38px] text-ink">Your loads</h1>
        <p className="mt-1.5 text-[14px] text-ink-3 text-pretty">
          {needPaper ? (
            <>
              <span className="font-medium text-signal">{needPaper} {needPaper === 1 ? 'load needs' : 'loads need'} paperwork</span> before Friday’s settlement.
            </>
          ) : (
            'Paperwork is in. Nothing to snap right now.'
          )}
        </p>
      </header>

      <Stagger className="space-y-3" stagger={0.06}>
        {mine.map((l, i) => (
          <Item key={l.id}>
            <LoadCard load={l} docs={docsOf(l)} missing={missing(l)} index={i} payPerMile={driver.payPerMile} onSnap={(doc) => setFlow({ load: l, doc })} />
          </Item>
        ))}
      </Stagger>

      <VoiceNote />

      {settlement && (
        <Card>
          <CardHeader
            eyebrow="Settlement"
            title={`${fmtDate(settlement.periodStart)} – ${fmtDate(settlement.periodEnd)}`}
            description={settlement.status === 'paid' ? 'Paid out.' : settlement.status === 'review' ? 'Drafted. Alicia is reviewing it.' : 'Drafting as your PODs come in.'}
            aside={<StatusPill status={settlement.status} size="sm" />}
          />
          <CardBody>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Net to you</div>
                <div className="mt-1 tabular text-[40px] font-semibold leading-none tracking-[-0.035em] text-ink">{moneyExact(settlement.net)}</div>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-good-soft text-good">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[13px]">
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Loads</dt>
                <dd className="mt-1 font-semibold tabular text-ink">{settlement.loads.length}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Miles</dt>
                <dd className="mt-1 font-semibold tabular text-ink">{settlement.miles.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Gross</dt>
                <dd className="mt-1 font-semibold tabular text-ink">{moneyExact(settlement.gross)}</dd>
              </div>
            </dl>
            {settlement.deductions.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-dashed border-line pt-3">
                {settlement.deductions.map((d) => (
                  <li key={d.label} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-ink-3">{d.label}</span>
                    <span className={cn('font-mono tabular', d.amount < 0 ? 'text-good' : 'text-ink-2')}>{d.amount < 0 ? '+' : '−'}{moneyExact(Math.abs(d.amount))}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      <CaptureSheet flow={flow} onClose={() => setFlow(null)} onConfirm={confirm} />
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ─── Load card ─────────────────────────────────────────────────────────── */

function LoadCard({ load: l, docs, missing, index, payPerMile, onSnap }: { load: Load; docs: DocType[]; missing: DocType[]; index: number; payPerMile: number; onSnap: (doc: DocType) => void }) {
  const delivered = !!l.deliveredAt;
  const progress = l.status === 'created' ? 0.02 : delivered ? 1 : (() => {
    const start = new Date(l.pickupAt).getTime();
    const end = new Date(l.deliverAt).getTime();
    return 0.25 + index * 0.2 + Math.min(0.3, Math.max(0, (Date.now() - start) / (end - start)) * 0.3);
  })();
  const next: DocType | null = missing.length ? (delivered ? (missing.includes('POD') ? 'POD' : missing[0]) : missing.includes('BOL') ? 'BOL' : missing[0]) : null;
  const customer = customerById(l.customerId);

  return (
    <Card className={cn('p-4', l.status === 'in_transit' && 'border-signal/30')}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-ink">{l.number}</span>
            <StatusPill status={l.status} size="sm" />
          </div>
          <div className="mt-0.5 truncate text-xs text-ink-3">{customer.name} · {l.commodity}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="tabular text-[15px] font-semibold text-ink">{money(l.miles * payPerMile)}</div>
          <div className="font-mono text-[10.5px] tabular text-ink-3">{l.miles.toLocaleString()} mi</div>
        </div>
      </div>

      <RouteRibbon origin={l.origin} destination={l.destination} progress={progress} />

      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {REQUIRED_DOCS.map((d) => {
          const has = docs.includes(d);
          return (
            <div key={d} className={cn('flex h-9 items-center justify-center gap-1.5 rounded-[10px] border text-[12px] font-medium', has ? 'border-transparent bg-good-soft text-good' : 'border-dashed border-line-strong text-ink-3')}>
              {has ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {d === 'RateConf' ? 'Rate conf' : d}
            </div>
          );
        })}
      </div>

      {next ? (
        <Button size="xl" className="mt-3 w-full" onClick={() => onSnap(next)}>
          <Camera className="h-5 w-5" /> Snap the {next}
        </Button>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-surface-2 text-[13.5px] font-medium text-ink-2">
            <Check className="h-4 w-4 text-good" /> Paperwork complete
          </div>
          <Button variant="secondary" size="lg" className="shrink-0 px-4" onClick={() => onSnap('FuelReceipt')} aria-label="Add a receipt">
            <ReceiptText className="h-4 w-4" /> Receipt
          </Button>
        </div>
      )}
    </Card>
  );
}

/* ─── Camera flow ───────────────────────────────────────────────────────── */

function CaptureSheet({ flow, onClose, onConfirm }: { flow: Flow; onClose: () => void; onConfirm: (load: Load, doc: DocType) => void }) {
  const [stage, setStage] = useState<Stage>('view');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStage('view');
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flow]);

  const shutter = () => {
    setStage('reading');
    timer.current = setTimeout(() => setStage('result'), 1500);
  };

  const word = flow ? DOC_WORD[flow.doc] ?? flow.doc : '';
  const confidence = flow ? 94 - (flow.load.miles % 5) : 94;

  return (
    <Sheet open={!!flow} onClose={onClose} side="bottom" title={flow ? `Snap the ${flow.doc === 'FuelReceipt' ? 'receipt' : flow.doc}` : ''} description={flow ? `${flow.load.number} · ${flow.load.origin} → ${flow.load.destination}` : undefined}>
      {flow && (
        <div className="mx-auto w-full max-w-md pb-2">
          <AnimatePresence mode="wait" initial={false}>
            {stage !== 'result' ? (
              <motion.div key="camera" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ type: 'spring', stiffness: 420, damping: 36 }}>
                <div className="relative aspect-[3/4] max-h-[50dvh] w-full overflow-hidden rounded-[20px] bg-[oklch(13%_0.012_55)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,oklch(0%_0_0/0.55)_100%)]" />
                  {/* the page */}
                  <div className="absolute inset-x-[14%] inset-y-[11%] rounded-[6px] border border-dashed border-white/15" />
                  {/* corner brackets */}
                  {(['left-5 top-5 border-l-2 border-t-2 rounded-tl-[6px]', 'right-5 top-5 border-r-2 border-t-2 rounded-tr-[6px]', 'left-5 bottom-5 border-l-2 border-b-2 rounded-bl-[6px]', 'right-5 bottom-5 border-r-2 border-b-2 rounded-br-[6px]'] as const).map((c) => (
                    <span key={c} className={cn('absolute h-8 w-8 border-signal', c)} />
                  ))}

                  {stage === 'view' ? (
                    <motion.p animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-x-0 bottom-8 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-white/85">
                      Lay the page flat
                    </motion.p>
                  ) : (
                    <>
                      <motion.div className="absolute inset-x-6 h-px bg-signal shadow-[0_0_16px_var(--signal-glow)]" initial={{ top: '12%' }} animate={{ top: ['12%', '88%', '12%'] }} transition={{ duration: 1.5, ease: 'easeInOut' }} />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="flex flex-col items-center gap-2 rounded-[16px] bg-black/40 px-5 py-4 backdrop-blur">
                          <AutopilotOrb mode="act" size={18} />
                          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/85">Reading…</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={shutter}
                    disabled={stage !== 'view'}
                    aria-label="Take the photo"
                    className="grid h-[76px] w-[76px] place-items-center rounded-full border-[3px] border-ink/80 p-1.5 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <span className="block h-full w-full rounded-full bg-ink shadow-[0_0_0_2px_var(--surface)_inset]" />
                  </button>
                </div>
                <p className="mt-3 text-center text-xs text-ink-3">Autopilot reads the load number, receiver and signature.</p>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 36 }} className="space-y-3">
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-good-soft text-good">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Eyebrow tone="signal">Autopilot read it</Eyebrow>
                      <p className="text-[15px] font-semibold leading-snug text-ink">
                        Looks like a {word} for {flow.load.number} · <span className="tabular">{confidence}%</span> sure
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-dashed border-line pt-3 text-[12.5px]">
                    <div>
                      <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{flow.doc === 'POD' ? 'Receiver' : flow.doc === 'BOL' ? 'Shipper' : 'Vendor'}</dt>
                      <dd className="mt-0.5 truncate text-ink">{flow.doc === 'POD' ? flow.load.destination : flow.doc === 'BOL' ? flow.load.origin : 'Pilot #442'}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Reference</dt>
                      <dd className="mt-0.5 font-mono tabular text-ink">{flow.load.ref}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{flow.doc === 'FuelReceipt' ? 'Total' : 'Signature'}</dt>
                      <dd className="mt-0.5 text-ink">{flow.doc === 'FuelReceipt' ? '$570.57' : 'Present'}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Pages</dt>
                      <dd className="mt-0.5 tabular text-ink">1</dd>
                    </div>
                  </dl>
                </Card>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Button size="xl" onClick={() => onConfirm(flow.load, flow.doc)}>
                    <Check className="h-5 w-5" /> Confirm
                  </Button>
                  <Button
                    size="xl"
                    variant="secondary"
                    onClick={() => {
                      setStage('view');
                      toast.info('Kept the photo', 'Snap it again or pick another load.');
                    }}
                  >
                    <X className="h-4 w-4" /> Not this load
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Sheet>
  );
}

/* ─── Voice note ────────────────────────────────────────────────────────── */

function VoiceNote() {
  const voice = useVoice();
  const [note, setNote] = useState('');
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const talk = async () => {
    if (voice.listening) return voice.stopListening();
    if (!voice.supported.listen) {
      toast.info('Voice is not available here', 'Type the note instead.');
      areaRef.current?.focus();
      return;
    }
    const t = await voice.listen(10000);
    if (t) setNote((n) => (n ? `${n} ${t}` : t));
  };

  const send = () => {
    if (!note.trim()) return;
    toast.success('Note sent to dispatch', note.length > 80 ? note.slice(0, 77) + '…' : note);
    setNote('');
  };

  return (
    <Card>
      <CardHeader eyebrow="Voice note" title="Tell dispatch something" description="Detention, a lumper, a late receiver. Say it and it lands on the load." />
      <CardBody className="space-y-3">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={talk}
            aria-pressed={voice.listening}
            className={cn(
              'grid h-14 w-14 shrink-0 place-items-center rounded-[16px] border transition-colors',
              voice.listening ? 'border-signal bg-signal text-signal-ink' : 'border-line bg-surface-2 text-ink hover:border-line-strong',
            )}
            aria-label={voice.listening ? 'Stop listening' : 'Record a voice note'}
          >
            {voice.listening ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-5 w-5" />}
          </button>
          <div className="relative flex-1">
            <Textarea
              ref={areaRef}
              value={voice.listening && voice.interim ? voice.interim : note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={voice.listening ? 'Listening…' : voice.supported.listen ? 'Tap the mic, or type' : 'Type your note'}
              className="min-h-14 resize-none py-3 text-[14px]"
            />
            {voice.listening && (
              <div className="pointer-events-none absolute bottom-2 right-3 flex items-end gap-0.5">
                {[0.4, 0.8, 1, 0.6].map((k, i) => (
                  <motion.span key={i} className="w-1 rounded-full bg-signal" animate={{ height: 4 + Math.max(2, voice.level * 20 * k) }} transition={{ duration: 0.12 }} style={{ height: 4 }} />
                ))}
              </div>
            )}
          </div>
        </div>
        <Button size="lg" variant="inverse" className="w-full" disabled={!note.trim()} onClick={send}>
          <Send className="h-4 w-4" /> Send to dispatch
        </Button>
        {!voice.supported.listen && <p className="text-center text-xs text-ink-4">Voice input needs Chrome or Safari. Typing works everywhere.</p>}
      </CardBody>
    </Card>
  );
}
