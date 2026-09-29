'use client';

import { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, Building2, CreditCard, Check, Fuel, Landmark, Mail, Monitor, Moon, Palette, Plug, Radio, Sun, Users, type LucideIcon } from 'lucide-react';
import { PLAN_CATALOG, monthlyPrice } from '@haulage/core';
import type { PlanTier } from '@haulage/types';
import { cn, fmtDate, money } from '@/lib/utils';
import { PageHeader } from '@/components/shell/page-header';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Dialog, Eyebrow, Field, Input, Segmented, Switch } from '@/components/ui';
import { Stagger, Item } from '@/components/motion/reveal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/lib/store';
import { useTheme, type Theme } from '@/lib/theme';
import { cashSeries, demoUser, drivers } from '@/lib/data';

type SectionKey = 'workspace' | 'billing' | 'team' | 'notifications' | 'appearance' | 'integrations';
const SECTIONS: { value: SectionKey; label: string; icon: LucideIcon; blurb: string }[] = [
  { value: 'workspace', label: 'Workspace', icon: Building2, blurb: 'Who you are on paper.' },
  { value: 'billing', label: 'Plan & billing', icon: CreditCard, blurb: 'Priced per truck. Change any time.' },
  { value: 'team', label: 'Team', icon: Users, blurb: 'Who can see and do what.' },
  { value: 'notifications', label: 'Notifications', icon: Bell, blurb: 'What reaches you and your drivers.' },
  { value: 'appearance', label: 'Appearance', icon: Palette, blurb: 'Paper by day, asphalt by night.' },
  { value: 'integrations', label: 'Integrations', icon: Plug, blurb: 'Where Autopilot reads and writes.' },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <Settings />
    </Suspense>
  );
}

function Settings() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sp = params.get('section');
  const section: SectionKey = SECTIONS.some((s) => s.value === sp) ? (sp as SectionKey) : 'workspace';
  const setSection = (s: SectionKey) => router.replace(s === 'workspace' ? pathname : `${pathname}?section=${s}`, { scroll: false });
  const meta = SECTIONS.find((s) => s.value === section)!;

  return (
    <>
      <PageHeader eyebrow="Settings" title="Settings" summary="Everything that shapes how Haulage runs for your fleet. Autopilot policies live on their own page." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <nav className="lg:col-span-3">
          <Segmented<SectionKey>
            value={section}
            onChange={setSection}
            className="w-full overflow-x-auto no-scrollbar lg:flex-col lg:items-stretch lg:gap-1 lg:bg-transparent lg:border-transparent lg:p-0"
            options={SECTIONS.map((s) => ({
              value: s.value,
              label: (
                <span className="flex items-center gap-2.5 whitespace-nowrap lg:w-full lg:py-0.5">
                  <s.icon className="h-4 w-4 shrink-0 opacity-70" />
                  {s.label}
                </span>
              ),
            }))}
          />
        </nav>

        <div className="min-w-0 lg:col-span-9">
          <div className="mb-4 px-0.5">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink">{meta.label}</h2>
            <p className="text-[13px] text-ink-3">{meta.blurb}</p>
          </div>
          {section === 'workspace' && <Workspace />}
          {section === 'billing' && <Billing />}
          {section === 'team' && <Team />}
          {section === 'notifications' && <Notifications />}
          {section === 'appearance' && <Appearance />}
          {section === 'integrations' && <Integrations />}
        </div>
      </div>
    </>
  );
}

// ─── Workspace ───────────────────────────────────────────────────────────────

function Workspace() {
  const { profile } = useSession();
  const [form, setForm] = useState({ company_name: profile.company_name, dot_number: profile.dot_number, mc_number: profile.mc_number });
  const dirty = form.company_name !== profile.company_name || form.dot_number !== profile.dot_number || form.mc_number !== profile.mc_number;

  return (
    <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
      <Item className="lg:col-span-8">
        <Card>
          <CardHeader eyebrow="Identity" title="Company" description="Shown on invoices, settlements and the driver app." />
          <CardBody className="space-y-4">
            <Field label="Company name" htmlFor="company">
              <Input id="company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="USDOT number" htmlFor="dot" hint="Verified against FMCSA nightly.">
                <Input id="dot" className="font-mono" value={form.dot_number} onChange={(e) => setForm({ ...form, dot_number: e.target.value })} />
              </Field>
              <Field label="MC number" htmlFor="mc">
                <Input id="mc" className="font-mono" value={form.mc_number} onChange={(e) => setForm({ ...form, mc_number: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <p className="text-xs text-ink-4">{dirty ? 'Unsaved changes.' : 'Everything is saved.'}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={!dirty} onClick={() => setForm({ company_name: profile.company_name, dot_number: profile.dot_number, mc_number: profile.mc_number })}>
                  Reset
                </Button>
                <Button size="sm" disabled={!dirty} onClick={() => toast.success('Saved', `${form.company_name} · DOT ${form.dot_number} · ${form.mc_number}`)}>
                  <Check className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </Item>
      <Item className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader eyebrow="Fleet" title="On the books" />
          <CardBody>
            <dl className="divide-y divide-line-soft text-[13px]">
              {[
                ['Stage', profile.stage === 'operating' ? 'Operating' : 'Starting up'],
                ['Trucks', String(profile.trucks)],
                ['Trailers', String(profile.trailers)],
                ['Drivers', String(profile.drivers)],
                ['Payment terms', `Net ${profile.payment_terms_days}`],
                ['Factoring', profile.factoring_enabled ? `${profile.factoring_rate_pct}% · ${profile.factoring_advance_pct}% advance` : 'Off'],
                ['Onboarded', profile.completed_at ? fmtDate(profile.completed_at, 'MMM d, yyyy') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="tabular font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-ink-4">Change fleet numbers from your business plan so the forecast follows.</p>
          </CardBody>
        </Card>
      </Item>
    </Stagger>
  );
}

// ─── Billing ─────────────────────────────────────────────────────────────────

function Billing() {
  const { plan, profile } = useSession();
  const trucks = Math.max(1, profile.trucks);
  const current = PLAN_CATALOG.find((p) => p.id === plan) ?? PLAN_CATALOG[0];

  return (
    <Stagger className="space-y-4" stagger={0.05}>
      <Item>
        <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface-inverse px-5 py-4 text-ink-inverse sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] opacity-60">Current plan</div>
            <div className="mt-1 text-[15px] font-semibold">
              {current.name} · {trucks} trucks · <span className="tabular">{money(monthlyPrice(current.id, trucks))}</span>/month
            </div>
            <div className="text-[12.5px] opacity-70">Billed monthly. Next invoice {fmtDate(new Date(Date.now() + 12 * 864e5), 'MMM d')}. Add a truck and the price follows the next day.</div>
          </div>
          <Button variant="secondary" size="sm" className="shrink-0" onClick={() => toast.info('Invoices', 'Your billing history opens in the customer portal.')}>
            Billing history
          </Button>
        </div>
      </Item>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLAN_CATALOG.map((p) => {
          const active = p.id === plan;
          const price = monthlyPrice(p.id, trucks);
          return (
            <Item key={p.id}>
              <Card className={cn('relative flex h-full flex-col overflow-hidden', active && 'border-signal/60 ring-1 ring-signal/30')}>
                {active && <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-signal/10 blur-2xl" />}
                <CardHeader
                  eyebrow={p.autopilot_scope === 'suggest' ? 'Suggests' : p.autopilot_scope === 'act' ? 'Acts within limits' : 'Full autonomy'}
                  title={p.name}
                  aside={active ? <Badge tone="signal" dot>Current</Badge> : undefined}
                />
                <CardBody className="flex flex-1 flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="tabular text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">{price === 0 ? 'Free' : money(price)}</span>
                    {price > 0 && <span className="text-[13px] text-ink-3">/month</span>}
                  </div>
                  <p className="mt-1 font-mono text-[11px] tabular text-ink-3">{p.price_per_truck_month === 0 ? 'One truck, always free' : `${money(p.price_per_truck_month)} × ${trucks} trucks`}</p>
                  <ul className="mt-4 space-y-1.5 text-[13px] text-ink-2">
                    {p.included.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-5">
                    <Button
                      variant={active ? 'secondary' : p.id === 'autopilot' ? 'primary' : 'secondary'}
                      size="sm"
                      className="w-full"
                      disabled={active}
                      onClick={() => toast.success(`Switching to ${p.name}`, price === 0 ? 'Applies at the end of your billing period.' : `${money(price)} a month, prorated from today.`)}
                    >
                      {active ? 'Your plan' : `Switch to ${p.name}`}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Item>
          );
        })}
      </div>
      <Item>
        <p className="px-0.5 text-xs text-ink-4">Quick-pay routing goes through a factoring partner. Haulage earns a referral share and never marks up your rate.</p>
      </Item>
    </Stagger>
  );
}

// ─── Team ────────────────────────────────────────────────────────────────────

function Team() {
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState('');
  const members = [
    { id: demoUser.id, name: demoUser.name, detail: demoUser.email, role: 'Owner' as const, since: null as string | null },
    ...drivers.map((d) => ({ id: d.id, name: d.name, detail: d.phone, role: 'Driver' as const, since: d.hiredAt })),
  ];

  const send = () => {
    if (!email.includes('@')) return toast.warn('Check the address', 'That does not look like an email.');
    toast.success('Invite sent', `${email} can join as a dispatcher once they accept.`);
    setEmail('');
    setInvite(false);
  };

  return (
    <Stagger className="space-y-4" stagger={0.05}>
      <Item>
        <Card>
          <CardHeader
            eyebrow="People"
            title={`${members.length} on the team`}
            description="Drivers get the capture app and their own settlements. Owners and dispatchers see everything."
            aside={
              <Button size="sm" onClick={() => setInvite(true)}>
                <Mail className="h-3.5 w-3.5" /> Invite
              </Button>
            }
          />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line-soft">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <Avatar name={m.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-medium text-ink">{m.name}</span>
                      <Badge tone={m.role === 'Owner' ? 'signal' : 'neutral'} size="sm">
                        {m.role}
                      </Badge>
                    </div>
                    <div className="truncate font-mono text-[11.5px] text-ink-3">{m.detail}</div>
                  </div>
                  <span className="hidden font-mono text-[11px] tabular text-ink-4 sm:block">{m.since ? `since ${fmtDate(m.since, 'MMM yyyy')}` : 'you'}</span>
                  <Button variant="ghost" size="xs" onClick={() => toast.info(m.name, m.role === 'Owner' ? 'Owners cannot be removed while they own the workspace.' : 'Driver access, pay rate and truck assignment open here.')}>
                    Manage
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </Item>

      <Dialog open={invite} onClose={() => setInvite(false)}>
        <Eyebrow>Invite</Eyebrow>
        <h3 className="text-lg font-semibold tracking-tight text-ink">Add someone to the workspace</h3>
        <p className="mt-1 text-[13px] text-ink-3">They get an email with a link. Dispatchers see loads, money and compliance; drivers only get the capture app.</p>
        <div className="mt-5 space-y-4">
          <Field label="Email" htmlFor="invite-email">
            <Input id="invite-email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" leading={<Mail className="h-4 w-4" />} onKeyDown={(e) => e.key === 'Enter' && send()} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setInvite(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={send}>
              Send invite
            </Button>
          </div>
        </div>
      </Dialog>
    </Stagger>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────

function Notifications() {
  const { policies } = useSession();
  const [prefs, setPrefs] = useState({ sms: true, briefing: true, needsYou: true, weekly: false });
  const [start, end] = policies.quiet_hours.split('-');
  const set = (k: keyof typeof prefs, label: string) => (v: boolean) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    toast.success(v ? `${label} on` : `${label} off`);
  };

  const rows: { key: keyof typeof prefs; title: string; body: string }[] = [
    { key: 'sms', title: 'SMS to drivers', body: 'POD chases, settlement notices and compliance reminders go to drivers by text.' },
    { key: 'briefing', title: 'Daily briefing email', body: 'What Autopilot did overnight and what needs you, in your inbox at 6am.' },
    { key: 'needsYou', title: 'Push when something needs you', body: 'Rate mismatches, unclassified documents and expired items, as they happen.' },
    { key: 'weekly', title: 'Weekly cash summary', body: 'Invoiced, collected and float, every Monday.' },
  ];

  return (
    <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
      <Item className="lg:col-span-8">
        <Card>
          <CardHeader eyebrow="Channels" title="What reaches you" />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line-soft">
              {rows.map((r) => (
                <li key={r.key} className="flex items-center gap-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-ink">{r.title}</div>
                    <div className="text-[12.5px] text-ink-3 text-pretty">{r.body}</div>
                  </div>
                  <Switch checked={prefs[r.key]} onChange={set(r.key, r.title)} label={r.title} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </Item>
      <Item className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader eyebrow="Quiet hours" title="Nothing pings after dark" />
          <CardBody>
            <div className="flex items-center justify-center gap-3 rounded-[14px] border border-line bg-surface-2/60 py-5">
              <Moon className="h-4 w-4 text-ink-3" />
              <span className="font-mono text-[22px] tabular tracking-[-0.02em] text-ink">{start}</span>
              <span className="text-ink-4">→</span>
              <span className="font-mono text-[22px] tabular tracking-[-0.02em] text-ink">{end}</span>
              <Sun className="h-4 w-4 text-ink-3" />
            </div>
            <p className="mt-3 text-xs text-ink-3 text-pretty">Set by your Autopilot policy. Messages queued in this window go out at {end}. Drivers keep their own quiet hours in the app.</p>
          </CardBody>
        </Card>
      </Item>
    </Stagger>
  );
}

// ─── Appearance ──────────────────────────────────────────────────────────────

const TOKENS = ['bg', 'surface', 'surface-2', 'ink', 'ink-3', 'signal', 'good', 'warn', 'bad'] as const;

function Appearance() {
  const { theme, resolved, setTheme } = useTheme();
  const previewTheme: 'light' | 'dark' = theme === 'system' ? resolved : theme;

  return (
    <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.05}>
      <Item className="lg:col-span-7">
        <Card className="h-full">
          <CardHeader eyebrow="Theme" title="Light, dark or follow the device" description={`Currently ${theme === 'system' ? `following your device (${resolved})` : theme}.`} />
          <CardBody className="space-y-5">
            <Segmented<Theme>
              value={theme}
              onChange={(t) => { setTheme(t); toast.success(`Theme: ${t}`); }}
              options={[
                { value: 'system', label: <span className="flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5" /> System</span> },
                { value: 'light', label: <span className="flex items-center gap-1.5"><Sun className="h-3.5 w-3.5" /> Light</span> },
                { value: 'dark', label: <span className="flex items-center gap-1.5"><Moon className="h-3.5 w-3.5" /> Dark</span> },
              ]}
            />
            <div>
              <Eyebrow>Tokens</Eyebrow>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                {TOKENS.map((t) => (
                  <div key={t} className="min-w-0">
                    <div className="h-9 rounded-[10px] border border-line" style={{ background: `var(--${t})` }} />
                    <div className="mt-1 truncate font-mono text-[10px] text-ink-4">{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </Item>
      <Item className="lg:col-span-5">
        <Card className="h-full overflow-hidden">
          <CardHeader eyebrow="Preview" title="How a card reads" />
          <CardBody>
            <div data-theme={previewTheme} className="rounded-[16px] border border-line p-4" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
              <div className="surface p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: 'var(--ink-3)' }}>Cash</div>
                <div className="mt-1 tabular text-[26px] font-semibold leading-none tracking-[-0.03em]">{money(cashSeries[cashSeries.length - 1] * 1000)}</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: 'var(--signal)' }} />
                  <span className="text-[12px]" style={{ color: 'var(--ink-3)' }}>Signal accent, hairline borders</span>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <span key={n} className="h-1.5 flex-1 rounded-full" style={{ background: `var(--series-${n})` }} />
                  ))}
                </div>
              </div>
              <div className="mt-3 inline-flex h-8 items-center rounded-[10px] px-3 text-[13px] font-medium" style={{ background: 'var(--signal)', color: 'var(--signal-ink)' }}>
                Book a load
              </div>
            </div>
          </CardBody>
        </Card>
      </Item>
    </Stagger>
  );
}

// ─── Integrations ────────────────────────────────────────────────────────────

const INTEGRATIONS: { id: string; name: string; body: string; icon: LucideIcon; connected: boolean; detail: string }[] = [
  { id: 'qb', name: 'QuickBooks', body: 'Invoices and settlements post as they are sent and paid.', icon: Landmark, connected: true, detail: 'Synced 12 minutes ago' },
  { id: 'mail', name: 'Gmail / Outlook docs inbox', body: 'Rate confirmations and PODs read straight out of your mailbox.', icon: Mail, connected: true, detail: 'docs@acmetrucking.com' },
  { id: 'eld', name: 'ELD (Samsara, Motive)', body: 'Miles, HOS and location feed settlements and the route ribbon.', icon: Radio, connected: false, detail: 'Miles are estimated today' },
  { id: 'fuel', name: 'Fuel card', body: 'Receipts match to loads without a photo.', icon: Fuel, connected: false, detail: 'WEX, Comdata, EFS' },
  { id: 'factor', name: 'Factoring partner', body: 'Quick-pay routing. We never mark up your rate.', icon: CreditCard, connected: true, detail: '2.5% · lands next day' },
];

function Integrations() {
  return (
    <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2" stagger={0.05}>
      {INTEGRATIONS.map((i) => (
        <Item key={i.id}>
          <Card className="flex h-full flex-col">
            <CardHeader
              title={
                <span className="flex items-center gap-2.5">
                  <span className={cn('grid h-8 w-8 place-items-center rounded-[10px]', i.connected ? 'bg-good-soft text-good' : 'bg-surface-2 text-ink-3')}>
                    <i.icon className="h-4 w-4" />
                  </span>
                  {i.name}
                </span>
              }
              aside={<Badge tone={i.connected ? "good" : "outline"} size="sm" dot={i.connected}>{i.connected ? "Connected" : "Not connected"}</Badge>}
            />
            <CardBody className="flex flex-1 flex-col">
              <p className="text-[13px] text-ink-3 text-pretty">{i.body}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className="font-mono text-[11px] text-ink-4">{i.detail}</span>
                <Button variant={i.connected ? 'ghost' : 'secondary'} size="sm" onClick={() => toast[i.connected ? 'info' : 'success'](i.connected ? `${i.name} settings` : `Connecting ${i.name}`, i.connected ? 'Sync options and disconnect live here.' : 'A sign-in window opens in the real app.')}>
                  {i.connected ? 'Manage' : 'Connect'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </Item>
      ))}
    </Stagger>
  );
}
