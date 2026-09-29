import type { AutopilotMode, DocChannel, OnboardingProfile } from '@haulage/types';
import { parseChoice, parseIdNumber, parseMulti, parseName, parseNumber, parsePercent, parseRate, parseYesNo } from '@haulage/core';

export type StepKind = 'intro' | 'text' | 'id' | 'number' | 'rate' | 'money' | 'percent' | 'yesno' | 'choice' | 'multi' | 'review';

export interface Option<T extends string = string> { value: T; label: string; sub?: string; keywords: string[] }

export interface Step {
  key: keyof OnboardingProfile | 'intro' | 'review' | 'mode';
  chapter: 'Welcome' | 'Company' | 'Fleet' | 'Economics' | 'Money' | 'Autopilot' | 'Launch';
  kind: StepKind;
  title: string;         // on screen
  prompt: string;        // spoken
  hint?: string;
  placeholder?: string;
  unit?: string;
  options?: Option[];
  skippable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** when the step should be skipped based on answers so far */
  skipIf?: (p: Partial<OnboardingProfile>) => boolean;
}

export const STEPS: Step[] = [
  { key: 'intro', chapter: 'Welcome', kind: 'intro', title: 'Let’s set up your back office.', prompt: 'Hi. I’m going to set up your back office in about seven minutes. You can talk to me or type. Whichever is faster for you. First, what is the name of your trucking company?' },
  { key: 'company_name', chapter: 'Company', kind: 'text', title: 'What’s the company called?', prompt: 'What is the name of your trucking company?', placeholder: 'Acme Trucking LLC' },
  { key: 'stage', chapter: 'Company', kind: 'choice', title: 'Already hauling, or just getting started?', prompt: 'Are you already hauling, or just getting started?', options: [
    { value: 'operating', label: 'Already hauling', sub: 'Plan starts at full utilization', keywords: ['already', 'hauling', 'running', 'operating', 'years', 'been'] },
    { value: 'starting', label: 'Just getting started', sub: 'Plan ramps 60 → 80 → 100% over three months', keywords: ['start', 'new', 'just', 'about to', 'soon', 'first'] },
  ] },
  { key: 'dot_number', chapter: 'Company', kind: 'id', title: 'What’s your DOT number?', prompt: 'What is your DOT number? You can say skip.', hint: 'We use it to pull your authority, insurance and inspection history.', placeholder: '3391027', skippable: true },
  { key: 'trucks', chapter: 'Fleet', kind: 'number', title: 'How many trucks do you run?', prompt: 'How many trucks do you run?', min: 0, max: 500, step: 1, unit: 'trucks' },
  { key: 'drivers', chapter: 'Fleet', kind: 'number', title: 'How many drivers, counting you?', prompt: 'How many drivers, including you if you drive?', min: 0, max: 500, step: 1, unit: 'drivers' },
  { key: 'trailers', chapter: 'Fleet', kind: 'number', title: 'And trailers?', prompt: 'And how many trailers?', min: 0, max: 500, step: 1, unit: 'trailers' },
  { key: 'miles_per_truck_per_week', chapter: 'Economics', kind: 'number', title: 'Miles per truck, per week?', prompt: 'Roughly how many miles does each truck run in a week?', hint: 'Most over-the-road trucks run 2,200 to 2,800.', min: 0, max: 5000, step: 50, unit: 'mi / wk' },
  { key: 'rate_per_loaded_mile', chapter: 'Economics', kind: 'rate', title: 'Average rate per loaded mile?', prompt: 'What do you average per loaded mile?', hint: 'Say it like “two thirty five”.', min: 0, max: 10, step: 0.05, unit: '$ / mi' },
  { key: 'deadhead_pct', chapter: 'Economics', kind: 'percent', title: 'What share of miles are empty?', prompt: 'What share of your miles are empty? Fifteen percent is typical.', min: 0, max: 0.6, step: 0.01, unit: '%' },
  { key: 'driver_pay_per_mile', chapter: 'Economics', kind: 'rate', title: 'Driver pay per mile?', prompt: 'What do you pay drivers per mile? If you drive, use what you pay yourself.', min: 0, max: 3, step: 0.01, unit: '$ / mi' },
  { key: 'fuel_price', chapter: 'Economics', kind: 'rate', title: 'What are you paying per gallon?', prompt: 'What are you paying per gallon right now?', min: 1, max: 10, step: 0.05, unit: '$ / gal' },
  { key: 'insurance_per_truck_month', chapter: 'Economics', kind: 'money', title: 'Insurance per truck, per month?', prompt: 'What is insurance per truck per month?', min: 0, max: 20000, step: 50, unit: '$ / mo' },
  { key: 'truck_payment_per_month', chapter: 'Economics', kind: 'money', title: 'Truck payment per truck, per month?', prompt: 'Truck payment per truck per month? Say zero if they are paid off.', min: 0, max: 20000, step: 50, unit: '$ / mo' },
  { key: 'overhead_per_month', chapter: 'Economics', kind: 'money', title: 'Office overhead per month?', prompt: 'And office overhead per month: phone, software, parking, that kind of thing?', min: 0, max: 50000, step: 50, unit: '$ / mo', skippable: true },
  { key: 'payment_terms_days', chapter: 'Money', kind: 'number', title: 'How long do brokers take to pay you?', prompt: 'How many days do brokers usually take to pay you?', hint: 'Not what the contract says. What actually happens.', min: 0, max: 120, step: 5, unit: 'days' },
  { key: 'factoring_enabled', chapter: 'Money', kind: 'yesno', title: 'Do you factor your invoices?', prompt: 'Do you factor your invoices?' },
  { key: 'factoring_rate_pct', chapter: 'Money', kind: 'number', title: 'What rate does your factor charge?', prompt: 'What rate does your factor charge, as a percent?', min: 0, max: 10, step: 0.1, unit: '%', skipIf: (p) => !p.factoring_enabled },
  { key: 'starting_cash', chapter: 'Money', kind: 'money', title: 'Cash in the business account today?', prompt: 'Roughly how much cash do you keep in the business account?', hint: 'A rough number is fine. This sets your runway.', min: 0, max: 5_000_000, step: 500, unit: '$' },
  { key: 'doc_channels', chapter: 'Autopilot', kind: 'multi', title: 'How does paperwork reach you today?', prompt: 'How does paperwork reach you today? Email, text photos, broker portals, paper?', options: [
    { value: 'email', label: 'Email', sub: 'Forward to your Haulage inbox', keywords: ['email', 'e mail', 'inbox', 'gmail', 'outlook'] },
    { value: 'photo', label: 'Text photos', sub: 'Drivers snap it in the app', keywords: ['photo', 'text', 'picture', 'phone', 'snap', 'camera'] },
    { value: 'portal', label: 'Broker portals', sub: 'We fetch rate cons for you', keywords: ['portal', 'website', 'site', 'login'] },
    { value: 'paper', label: 'Paper', sub: 'Scan once, then never again', keywords: ['paper', 'binder', 'folder', 'mail'] },
    { value: 'eld', label: 'ELD / TMS', sub: 'Samsara, Motive and more', keywords: ['eld', 'samsara', 'motive', 'tms', 'system'] },
  ] },
  { key: 'mode', chapter: 'Autopilot', kind: 'choice', title: 'How much should Autopilot do on its own?', prompt: 'Last one. How much should Autopilot do on its own? It can suggest and wait for you, act within limits you set, or run fully on its own within policy.', options: [
    { value: 'suggest', label: 'Suggest', sub: 'Prepares everything, you press send', keywords: ['suggest', 'ask', 'wait', 'me', 'approve', 'first'] },
    { value: 'act', label: 'Act within limits', sub: 'Sends invoices under a limit, chases paperwork, files reminders', keywords: ['act', 'limit', 'some', 'within', 'middle', 'reasonable'] },
    { value: 'full', label: 'Full autonomy', sub: 'Runs the back office. You review the ledger', keywords: ['full', 'everything', 'all', 'autonom', 'itself', 'run it'] },
  ] },
  { key: 'review', chapter: 'Launch', kind: 'review', title: 'Here is your back office.', prompt: 'That is everything. Here is your plan. When you are ready, launch your back office.' },
];

export const CHAPTERS = ['Welcome', 'Company', 'Fleet', 'Economics', 'Money', 'Autopilot', 'Launch'] as const;

export interface Parsed { ok: boolean; value?: unknown; display?: string; retry?: string; skipped?: boolean }

const SKIP = /^(skip|pass|next|not sure|don'?t know|no idea|later)\b/i;

export function parseAnswer(step: Step, raw: string, profile: Partial<OnboardingProfile>): Parsed {
  const t = raw.trim();
  if (!t) return { ok: false, retry: 'I didn’t catch that.' };
  if (step.skippable && SKIP.test(t)) return { ok: true, skipped: true };

  switch (step.kind) {
    case 'text': {
      const v = parseName(t);
      return v.length >= 2 ? { ok: true, value: v, display: v } : { ok: false, retry: 'Say the company name again.' };
    }
    case 'id': {
      const v = parseIdNumber(t);
      return v ? { ok: true, value: v, display: v } : { ok: false, retry: 'I need the digits, or say skip.' };
    }
    case 'number': {
      let n = parseNumber(t);
      if (n === null && /\b(just me|only me|myself|me)\b/i.test(t)) n = 1;
      if (n === null && /\b(none|no trailers?|zero)\b/i.test(t)) n = 0;
      if (n === null) return { ok: false, retry: 'Give me a number.' };
      if (step.step === 1) n = Math.round(n);
      if (step.min != null && n < step.min) return { ok: false, retry: `That’s below ${step.min}.` };
      if (step.max != null && n > step.max) return { ok: false, retry: `That seems high. Say it again?` };
      return { ok: true, value: n, display: `${n.toLocaleString()} ${step.unit ?? ''}`.trim() };
    }
    case 'rate': {
      const n = parseRate(t);
      if (n === null) return { ok: false, retry: 'Say it like “two thirty five”.' };
      if (step.max != null && n > step.max) return { ok: false, retry: 'That seems high. Per mile?' };
      return { ok: true, value: n, display: `$${n.toFixed(2)} ${step.unit?.replace('$ ', '') ?? ''}`.trim() };
    }
    case 'money': {
      const n = parseNumber(t);
      if (n === null) return { ok: false, retry: 'Give me a dollar amount.' };
      return { ok: true, value: n, display: `$${Math.round(n).toLocaleString()}` };
    }
    case 'percent': {
      const n = parsePercent(t);
      if (n === null) return { ok: false, retry: 'A percentage, like fifteen.' };
      return { ok: true, value: n, display: `${Math.round(n * 100)}%` };
    }
    case 'yesno': {
      const v = parseYesNo(t);
      if (v === null) return { ok: false, retry: 'Yes or no?' };
      return { ok: true, value: v, display: v ? 'Yes' : 'No' };
    }
    case 'choice': {
      const v = parseChoice(t, step.options!);
      if (!v) return { ok: false, retry: `Which one: ${step.options!.map((o) => o.label).join(', ')}?` };
      return { ok: true, value: v, display: step.options!.find((o) => o.value === v)!.label };
    }
    case 'multi': {
      const v = parseMulti(t, step.options!);
      if (!v.length) return { ok: false, retry: 'Name one or more: email, photos, portals, paper.' };
      return { ok: true, value: v, display: v.map((x) => step.options!.find((o) => o.value === x)!.label).join(', ') };
    }
    default:
      return { ok: true, value: t, display: t };
  }
}

export type Answers = Partial<OnboardingProfile> & { mode?: AutopilotMode; doc_channels?: DocChannel[] };

/** Spoken confirmation after a good answer, short and specific. */
export function ack(step: Step, display: string | undefined, answers: Answers): string {
  switch (step.key) {
    case 'company_name': return `${display}. Good name.`;
    case 'trucks': return answers.trucks === 1 ? 'One truck. Owner-operator, got it.' : `${answers.trucks} trucks.`;
    case 'rate_per_loaded_mile': return `${display} a mile.`;
    case 'deadhead_pct': return (answers.deadhead_pct ?? 0) > 0.2 ? `${display} empty. We can work on that.` : `${display} empty. That’s healthy.`;
    case 'factoring_enabled': return answers.factoring_enabled ? 'You factor. I’ll compare that against waiting on terms.' : 'No factoring. I’ll watch your cash gap instead.';
    case 'starting_cash': return 'Got it. That sets your runway.';
    case 'mode': return answers.mode === 'full' ? 'Full autonomy. I’ll keep the ledger honest.' : answers.mode === 'act' ? 'I’ll act within your limits.' : 'I’ll suggest and wait for you.';
    default: return display ? `${display}.` : 'Got it.';
  }
}
