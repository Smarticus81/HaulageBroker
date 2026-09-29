'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import type { AutopilotEvent } from '@haulage/types';
import { ago, cn, hoursLabel, sleep } from '@/lib/utils';
import { Wordmark } from '@/components/brand/logo';
import { AutopilotOrb, Button, Field, Input, Toaster, toast } from '@/components/ui';
import { EVENT_ICON } from '@/components/app/event-row';
import { useTheme } from '@/lib/theme';
import { useSession } from '@/lib/store';
import { autopilotEvents, autopilotSummary, demoProfile, demoUser } from '@/lib/data';

export default function LoginPage() {
  const { resolved, toggle } = useTheme();
  const summary = autopilotSummary();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-12">
      {/* Inverse panel */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-surface-inverse px-6 py-6 text-ink-inverse lg:col-span-5 lg:min-h-dvh lg:px-12 lg:py-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-signal/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 dotgrid opacity-[0.18]" />

        <div className="relative flex items-center justify-between gap-4">
          <Wordmark size="sm" className="text-ink-inverse [&_rect]:fill-ink-inverse [&_path]:stroke-ink" />
          <span className="hidden items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-inverse/60 lg:inline-flex">
            <AutopilotOrb mode="act" size={7} /> Autopilot live
          </span>
        </div>

        <div className="relative mt-5 lg:mt-0">
          <h2 className="display text-[30px] leading-[0.98] text-balance sm:text-[36px] lg:text-[54px]">
            The back office that <em className="italic">runs itself.</em>
          </h2>
          <p className="mt-3 hidden max-w-sm text-[14px] text-ink-inverse/70 text-pretty lg:block">
            Paperwork, billing, compliance and cash planning for small carriers. You set the limits. Autopilot works inside them and leaves a receipt for everything.
          </p>
        </div>

        <div className="relative hidden lg:block">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-inverse/60">Just now at {demoProfile.company_name}</span>
            <span className="font-mono text-[10.5px] tabular text-ink-inverse/60">{summary.events_7d} actions · {hoursLabel(summary.saved_minutes_7d)} back this week</span>
          </div>
          <Ticker />
        </div>
      </aside>

      {/* Form */}
      <section className="relative flex min-h-[70dvh] flex-col justify-center px-6 py-10 lg:col-span-7 lg:min-h-dvh lg:px-12">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="absolute right-4 top-4 text-ink-3 lg:right-8 lg:top-8">
          {resolved === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
        </Button>

        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8">
            <div className="mb-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3">Welcome back</div>
            <h1 className="display text-[40px] text-ink sm:text-[46px]">Sign in</h1>
            <p className="mt-2 text-[14px] text-ink-3">Your fleet, exactly where you left it.</p>
          </div>

          <Suspense fallback={<SignInForm next="/app" />}>
            <SignInWithParams />
          </Suspense>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-4">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" size="lg" className="w-full" onClick={() => toast.info('Google sign-in', 'Single sign-on is coming with the Fleet plan.')}>
              <Glyph>G</Glyph> Continue with Google
            </Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => toast.info('Microsoft sign-in', 'Single sign-on is coming with the Fleet plan.')}>
              <Glyph>M</Glyph> Continue with Microsoft
            </Button>
          </div>

          <p className="mt-8 text-center text-[13.5px] text-ink-3">
            New here?{' '}
            <Link href="/start" className="inline-flex items-center gap-1 font-medium text-ink underline-offset-4 hover:underline">
              Set up in 7 minutes with your voice <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </section>
      <Toaster />
    </div>
  );
}

function Glyph({ children }: { children: React.ReactNode }) {
  return <span className="grid h-5 w-5 place-items-center rounded-[6px] bg-surface-2 font-mono text-[11px] font-semibold text-ink-2">{children}</span>;
}

/* ─── Form ──────────────────────────────────────────────────────────────── */

function SignInWithParams() {
  const params = useSearchParams();
  const next = params.get('next');
  return <SignInForm next={next && next.startsWith('/') ? next : '/app'} />;
}

function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const { signIn, loadDemo } = useSession();
  const [email, setEmail] = useState(demoUser.email);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<'signin' | 'demo' | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.warn('Add your email to continue');
    setBusy('signin');
    await sleep(550);
    signIn();
    router.push(next);
  };

  const demo = async () => {
    setBusy('demo');
    await sleep(350);
    loadDemo();
    toast.success('Demo fleet loaded', `${demoProfile.company_name}, 3 trucks, a week of Autopilot history.`);
    router.push('/app');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourfleet.com" className="h-11" />
      </Field>
      <Field
        label={
          <span className="flex items-center justify-between">
            Password
            <button type="button" className="text-xs font-medium text-ink-3 hover:text-ink" onClick={() => toast.info('Reset link sent', `Check ${email || 'your inbox'}.`)}>
              Forgot?
            </button>
          </span>
        }
        htmlFor="password"
      >
        <Input
          id="password"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          className="h-11"
          trailing={
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="grid h-8 w-8 place-items-center rounded-[8px] text-ink-3 hover:text-ink">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={busy === 'signin'} disabled={busy !== null}>
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
      <div className="flex justify-center">
        <Button type="button" variant="ghost" size="sm" onClick={demo} loading={busy === 'demo'} disabled={busy !== null} className="text-ink-3">
          Try the demo fleet
        </Button>
      </div>
    </form>
  );
}

/* ─── Receipt ticker ────────────────────────────────────────────────────── */

function Ticker() {
  const done = useMemo(() => autopilotEvents.filter((e) => e.outcome === 'done'), []);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), 3400);
    return () => clearInterval(t);
  }, []);
  const items = [0, 1, 2].map((k) => done[(i + k) % done.length]);

  return (
    <ul className="space-y-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((e, idx) => (
          <motion.li
            key={e.id}
            layout
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1 - idx * 0.28, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          >
            <Receipt e={e} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function Receipt({ e }: { e: AutopilotEvent }) {
  const Icon = EVENT_ICON[e.kind];
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-ink-inverse/10 bg-ink-inverse/[0.06] px-3.5 py-3">
      <span className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-ink-inverse/10 text-ink-inverse')}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-ink-inverse">{e.summary}</p>
        <p className="mt-0.5 font-mono text-[10.5px] text-ink-inverse/55">
          {ago(e.created_at)}
          {e.saved_minutes > 0 && <> · saved {e.saved_minutes}m</>}
        </p>
      </div>
    </div>
  );
}
