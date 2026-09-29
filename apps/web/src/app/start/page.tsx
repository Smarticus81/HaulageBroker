'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Keyboard, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { computePlan, suggestPlan, withDefaults } from '@haulage/core';
import type { AutopilotMode, DocChannel, OnboardingProfile } from '@haulage/types';
import { cn, money } from '@/lib/utils';
import { Wordmark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Toaster, toast } from '@/components/ui/toast';
import { VoiceVisualizer } from '@/components/onboarding/voice-visualizer';
import { LivePlan } from '@/components/onboarding/live-plan';
import { useVoice } from '@/lib/hooks/use-voice';
import { useSession } from '@/lib/store';
import { ack, CHAPTERS, parseAnswer, STEPS, type Answers, type Step } from '@/lib/onboarding-steps';
import { policies as defaultPolicies } from '@/lib/data';

interface Turn { id: number; q: string; a: string }

export default function StartPage() {
  const router = useRouter();
  const voice = useVoice({ rate: 1.02 });
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const setPolicies = useSession((s) => s.setPolicies);

  const [voiceMode, setVoiceMode] = useState<boolean | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [input, setInput] = useState('');
  const [retry, setRetry] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [launching, setLaunching] = useState(false);
  const turnRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => STEPS.filter((s) => !s.skipIf || !s.skipIf(answers)), [answers]);
  const step: Step = visible[Math.min(idx, visible.length - 1)];
  const chapterIdx = CHAPTERS.indexOf(step.chapter);
  const progress = idx / (visible.length - 1);

  const reveal = {
    company: !!answers.company_name,
    fleet: answers.trucks != null,
    economics: answers.rate_per_loaded_mile != null,
    money: answers.payment_terms_days != null,
    autopilot: !!answers.mode,
  };

  const numericDefault = (s: Step): number | undefined => {
    const d = withDefaults(answers as Partial<OnboardingProfile>);
    const v = d[s.key as keyof OnboardingProfile];
    return typeof v === 'number' ? v : undefined;
  };

  const advance = useCallback(() => {
    setRetry(null);
    setInput('');
    setIdx((i) => Math.min(i + 1, visible.length - 1));
  }, [visible.length]);

  const commit = useCallback(
    (s: Step, value: unknown, display: string) => {
      setAnswers((a) => ({ ...a, [s.key]: value }));
      setTurns((t) => [...t, { id: Date.now(), q: s.title, a: display }].slice(-4));
    },
    [],
  );

  /** Handle a raw answer (typed or spoken). Returns the spoken acknowledgement or a retry line. */
  const submit = useCallback(
    (raw: string): { ok: boolean; say: string } => {
      const parsed = parseAnswer(step, raw, answers);
      if (!parsed.ok) {
        setRetry(parsed.retry ?? 'Try again.');
        return { ok: false, say: parsed.retry ?? 'Try again.' };
      }
      if (parsed.skipped) {
        setTurns((t) => [...t, { id: Date.now(), q: step.title, a: 'Skipped' }].slice(-4));
        advance();
        return { ok: true, say: 'No problem.' };
      }
      commit(step, parsed.value, parsed.display ?? String(parsed.value));
      const say = ack(step, parsed.display, { ...answers, [step.key]: parsed.value } as Answers);
      advance();
      return { ok: true, say };
    },
    [step, answers, advance, commit],
  );

  /** One spoken turn: say the prompt, listen, parse, acknowledge. */
  useEffect(() => {
    if (!voiceMode || step.kind === 'review') return;
    const myTurn = ++turnRef.current;
    let cancelled = false;
    (async () => {
      await voice.speak(step.prompt);
      let tries = 0;
      while (!cancelled && myTurn === turnRef.current && tries < 2) {
        const heard = await voice.listen(9000);
        if (cancelled || myTurn !== turnRef.current) return;
        if (!heard) {
          tries += 1;
          if (tries < 2) await voice.speak('Take your time. You can also type.');
          continue;
        }
        const res = submit(heard);
        if (res.ok) {
          await voice.speak(res.say);
          return;
        }
        await voice.speak(res.say);
        tries += 1;
      }
    })();
    return () => {
      cancelled = true;
      voice.stopListening();
      voice.stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, voiceMode]);

  useEffect(() => {
    if (voiceMode === false) setTimeout(() => inputRef.current?.focus(), 50);
  }, [idx, voiceMode]);

  useEffect(() => {
    if (step.kind === 'review' && voiceMode) voice.speak(step.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.kind]);

  const begin = (withVoice: boolean) => {
    if (withVoice && !voice.supported.listen) {
      toast.info('Voice input is not available in this browser', 'I will still talk you through it. Type your answers.');
    }
    setVoiceMode(withVoice && voice.supported.listen);
    if (withVoice && !voice.supported.listen && voice.supported.speak) voice.speak(STEPS[1].prompt);
    setIdx(1);
  };

  const back = () => {
    turnRef.current += 1;
    voice.stopListening();
    voice.stopSpeaking();
    setRetry(null);
    setIdx((i) => Math.max(1, i - 1));
  };

  const pick = (value: string) => {
    turnRef.current += 1;
    voice.stopListening();
    const opt = step.options!.find((o) => o.value === value)!;
    commit(step, value, opt.label);
    if (voiceMode) voice.speak(ack(step, opt.label, { ...answers, [step.key]: value } as Answers));
    advance();
  };

  const toggleMulti = (value: string) => {
    const cur = (answers.doc_channels ?? []) as string[];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    setAnswers((a) => ({ ...a, doc_channels: next as DocChannel[] }));
  };

  const launch = () => {
    setLaunching(true);
    const profile = withDefaults({ ...(answers as Partial<OnboardingProfile>), voice_used: voiceMode === true, completed_at: new Date().toISOString() });
    const tier = suggestPlan(profile.trucks, answers.mode === 'full');
    const plan = computePlan(profile, 'onboarding');
    setPolicies({ ...defaultPolicies, mode: (answers.mode as AutopilotMode) ?? 'act' });
    if (voiceMode) voice.speak(`Welcome to Haulage, ${profile.company_name.split(' ')[0]}. Your back office is live.`);
    setTimeout(() => {
      completeOnboarding(profile, tier, plan);
      router.push('/app');
    }, 1400);
  };

  const listeningNow = voice.listening;

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <Toaster />
      {/* top bar */}
      <header className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <Link href="/"><Wordmark size="sm" /></Link>
        <div className="mx-auto hidden items-center gap-1 md:flex">
          {CHAPTERS.map((c, i) => (
            <div key={c} className="flex items-center gap-1">
              <span className={cn('rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors', i < chapterIdx ? 'text-good' : i === chapterIdx ? 'bg-surface-inverse text-ink-inverse' : 'text-ink-4')}>
                {i < chapterIdx ? <Check className="inline h-3 w-3" /> : null} {c}
              </span>
              {i < CHAPTERS.length - 1 && <span className="h-px w-3 bg-line-strong" />}
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {voiceMode !== null && (
            <>
              <Button variant="ghost" size="icon-sm" onClick={() => voice.setMuted(!voice.muted)} aria-label="Mute guide">
                {voice.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { turnRef.current += 1; voice.stopListening(); voice.stopSpeaking(); setVoiceMode((v) => !v); }}>
                {voiceMode ? <><Keyboard className="h-4 w-4" /> Type instead</> : <><Mic className="h-4 w-4" /> Use voice</>}
              </Button>
            </>
          )}
          <Link href="/login"><Button variant="ghost" size="icon-sm" aria-label="Exit"><X className="h-4 w-4" /></Button></Link>
        </div>
      </header>
      <div className="h-px w-full bg-line">
        <motion.div className="h-px bg-signal" animate={{ width: `${progress * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 24 }} />
      </div>

      <main className="mx-auto grid w-full max-w-[1280px] flex-1 grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-12">
        {/* Conversation */}
        <section className="flex flex-col lg:col-span-7">
          <div className="mx-auto w-full max-w-xl">
            <div className="flex justify-center">
              <VoiceVisualizer speaking={voice.speaking} listening={listeningNow} level={voice.level} size={voiceMode === null ? 130 : 96} />
            </div>

            {/* trail */}
            <div className="min-h-6 space-y-1 text-center">
              <AnimatePresence initial={false}>
                {turns.slice(-2).map((t) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[12.5px] text-ink-4">
                    <span className="text-ink-3">{t.q}</span> <span className="mx-1">·</span> <span className="font-medium text-ink-2">{t.a}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="mt-6 text-center">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">{step.chapter}{step.kind !== 'intro' && step.kind !== 'review' && ` · ${idx} of ${visible.length - 2}`}</div>
                <h1 className="display mt-3 text-balance text-[34px] text-ink sm:text-[44px]">{step.title}</h1>
                {step.hint && <p className="mt-3 text-[14px] text-ink-3 text-pretty">{step.hint}</p>}
                {retry && <p className="mt-3 text-[13.5px] font-medium text-warn">{retry}</p>}
                {voiceMode && (voice.interim || listeningNow) && (
                  <p className="mt-3 min-h-6 text-[15px] text-ink-2">{voice.interim || <span className="text-ink-4">Listening…</span>}</p>
                )}

                {/* Inputs */}
                <div className="mt-8">
                  {step.kind === 'intro' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button onClick={() => begin(true)} className="group surface lift flex flex-col items-start gap-3 p-5 text-left">
                        <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-signal text-signal-ink"><Mic className="h-5 w-5" /></span>
                        <span className="text-[15px] font-semibold text-ink">Talk me through it</span>
                        <span className="text-[13px] text-ink-3">I’ll ask, you answer out loud. About seven minutes.</span>
                        {!voice.supported.listen && <span className="font-mono text-[10.5px] text-warn">Mic input needs Chrome, Edge or Safari</span>}
                      </button>
                      <button onClick={() => begin(false)} className="group surface lift flex flex-col items-start gap-3 p-5 text-left">
                        <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-surface-2 text-ink"><Keyboard className="h-5 w-5" /></span>
                        <span className="text-[15px] font-semibold text-ink">I’ll type</span>
                        <span className="text-[13px] text-ink-3">Same questions, quiet mode. You can switch any time.</span>
                      </button>
                    </div>
                  )}

                  {(step.kind === 'choice') && (
                    <div className="grid gap-2 sm:grid-cols-1">
                      {step.options!.map((o, i) => (
                        <button key={o.value} onClick={() => pick(o.value)} className={cn('surface lift flex items-center gap-4 px-4 py-3.5 text-left', answers[step.key as keyof Answers] === o.value && 'border-signal')}>
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line font-mono text-[11px] text-ink-3">{i + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14.5px] font-semibold text-ink">{o.label}</span>
                            {o.sub && <span className="block text-[12.5px] text-ink-3">{o.sub}</span>}
                          </span>
                          <ArrowRight className="h-4 w-4 text-ink-4" />
                        </button>
                      ))}
                    </div>
                  )}

                  {step.kind === 'multi' && (
                    <div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {step.options!.map((o) => {
                          const on = ((answers.doc_channels ?? []) as string[]).includes(o.value);
                          return (
                            <button key={o.value} onClick={() => toggleMulti(o.value)} className={cn('surface flex items-center gap-3 px-4 py-3 text-left transition-colors', on && 'border-signal bg-signal-soft/40')}>
                              <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border', on ? 'border-signal bg-signal text-signal-ink' : 'border-line-strong')}>{on && <Check className="h-3 w-3" />}</span>
                              <span className="min-w-0">
                                <span className="block text-[14px] font-semibold text-ink">{o.label}</span>
                                {o.sub && <span className="block text-[12px] text-ink-3">{o.sub}</span>}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <Button className="mt-4 w-full" size="lg" disabled={!(answers.doc_channels?.length)} onClick={() => { turnRef.current += 1; voice.stopListening(); setTurns((t) => [...t, { id: Date.now(), q: step.title, a: (answers.doc_channels ?? []).join(', ') }]); advance(); }}>
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {step.kind === 'yesno' && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['Yes', true],
                        ['No', false],
                      ].map(([l, v]) => (
                        <button key={String(l)} onClick={() => { turnRef.current += 1; voice.stopListening(); commit(step, v, String(l)); if (voiceMode) voice.speak(ack(step, String(l), { ...answers, [step.key]: v } as Answers)); advance(); }} className="surface lift px-4 py-5 text-[16px] font-semibold text-ink">
                          {String(l)}
                        </button>
                      ))}
                    </div>
                  )}

                  {['text', 'id', 'number', 'rate', 'money', 'percent'].includes(step.kind) && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        turnRef.current += 1;
                        voice.stopListening();
                        const res = submit(input);
                        if (res.ok && voiceMode) voice.speak(res.say);
                      }}
                      className="space-y-3"
                    >
                      <div className="relative">
                        <input
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          inputMode={step.kind === 'text' ? 'text' : 'decimal'}
                          placeholder={step.placeholder ?? (numericDefault(step) != null ? `${step.kind === 'percent' ? Math.round((numericDefault(step) ?? 0) * 100) : numericDefault(step)}` : '')}
                          className="h-16 w-full rounded-[18px] border border-line bg-surface px-5 pr-32 text-center text-[24px] font-semibold tabular tracking-tight text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-signal focus:ring-4 focus:ring-signal/15"
                          autoFocus
                        />
                        {step.unit && <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-mono text-[12px] text-ink-3">{step.unit}</span>}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Button type="submit" size="lg" className="min-w-40">Continue <ArrowRight className="h-4 w-4" /></Button>
                        {step.skippable && (
                          <Button type="button" variant="ghost" size="lg" onClick={() => { turnRef.current += 1; voice.stopListening(); setTurns((t) => [...t, { id: Date.now(), q: step.title, a: 'Skipped' }]); advance(); }}>
                            Skip
                          </Button>
                        )}
                        {numericDefault(step) != null && !input && step.kind !== 'text' && step.kind !== 'id' && (
                          <Button type="button" variant="ghost" size="lg" onClick={() => { turnRef.current += 1; voice.stopListening(); const d = numericDefault(step)!; const disp = step.kind === 'percent' ? `${Math.round(d * 100)}%` : step.kind === 'money' ? money(d) : step.kind === 'rate' ? `$${d.toFixed(2)}` : `${d}`; commit(step, d, disp); advance(); }}>
                            Use typical
                          </Button>
                        )}
                      </div>
                      <p className="text-center font-mono text-[10.5px] text-ink-4"><Kbd>↵</Kbd> to continue{voiceMode ? ' · or just say it' : ''}</p>
                    </form>
                  )}

                  {step.kind === 'review' && <Review answers={answers} launching={launching} onLaunch={launch} />}
                </div>

                {step.kind !== 'intro' && step.kind !== 'review' && (
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button onClick={back} className="inline-flex items-center gap-1 text-[12.5px] text-ink-3 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                    {voiceMode && !listeningNow && !voice.speaking && (
                      <button onClick={async () => { turnRef.current += 1; const heard = await voice.listen(9000); if (heard) { const res = submit(heard); voice.speak(res.say); } }} className="inline-flex items-center gap-1 text-[12.5px] text-signal hover:underline">
                        <Mic className="h-3.5 w-3.5" /> Say it again
                      </button>
                    )}
                    {voiceMode && !voice.supported.listen && <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-4"><MicOff className="h-3.5 w-3.5" /> mic unavailable</span>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Live plan */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-8">
            <LivePlan answers={answers} reveal={reveal} className="min-h-[360px]" />
          </div>
        </aside>
      </main>
    </div>
  );
}

function Review({ answers, launching, onLaunch }: { answers: Answers; launching: boolean; onLaunch: () => void }) {
  const profile = withDefaults(answers as Partial<OnboardingProfile>);
  const plan = computePlan(profile);
  const rows: [string, string][] = [
    ['Company', profile.company_name || '—'],
    ['Fleet', `${profile.trucks} trucks · ${profile.drivers} drivers · ${profile.trailers} trailers`],
    ['Economics', `$${profile.rate_per_loaded_mile.toFixed(2)}/mi · ${Math.round(profile.deadhead_pct * 100)}% empty · ${profile.miles_per_truck_per_week.toLocaleString()} mi/wk`],
    ['Money', `${profile.payment_terms_days}-day terms · ${profile.factoring_enabled ? `factoring at ${profile.factoring_rate_pct}%` : 'no factoring'} · ${money(profile.starting_cash)} cash`],
    ['Autopilot', `${answers.mode === 'full' ? 'Full autonomy' : answers.mode === 'suggest' ? 'Suggest only' : 'Act within limits'} · paperwork via ${(profile.doc_channels ?? []).join(', ')}`],
  ];
  return (
    <div className="text-left">
      <div className="surface divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start gap-4 px-4 py-3">
            <span className="w-24 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{k}</span>
            <span className="text-[13.5px] text-ink">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[18px] bg-signal-soft/60 p-4 text-[13.5px] text-ink">
        <span className="font-semibold">First thing Autopilot will do:</span> {plan.recommendations[0].title.toLowerCase()} — {plan.recommendations[0].message}
      </div>
      <Button size="xl" className="mt-5 w-full" onClick={onLaunch} loading={launching}>
        {launching ? 'Setting up your workspace' : 'Launch my back office'} {!launching && <ArrowRight className="h-4 w-4" />}
      </Button>
      <p className="mt-3 text-center text-xs text-ink-4">No card needed. Change any answer later in Settings.</p>
    </div>
  );
}
