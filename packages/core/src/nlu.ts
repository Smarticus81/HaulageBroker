/**
 * Tiny natural-language understanding for the voice-guided onboarding.
 * Turns spoken answers ("twenty five hundred", "two thirty five a mile",
 * "about fifteen percent", "yeah we do") into typed values. Deterministic,
 * dependency-free, and forgiving.
 */

const SMALL: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  a: 1, an: 1, single: 1, couple: 2, few: 3, dozen: 12, half: 0.5, quarter: 0.25,
};
const SCALE: Record<string, number> = { hundred: 100, thousand: 1000, k: 1000, grand: 1000, million: 1_000_000, m: 1_000_000 };

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[,$]/g, '')
    .replace(/-/g, ' ')
    .replace(/\b(dollars?|bucks?|usd)\b/g, ' ')
    .replace(/\bpercent(age)?\b|%/g, ' percent ')
    .replace(/\bcents?\b/g, ' cents ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse the first number expressed in digits or words. Returns null if none. */
export function parseNumber(input: string): number | null {
  const s = normalize(input);
  if (!s) return null;

  // Digits first: "2500", "2.35", "1,400", "2k", "$3.85"
  const digit = s.match(/(-?\d+(?:\.\d+)?)\s*(k|m|thousand|million|hundred|grand)?\b/);
  if (digit) {
    let v = parseFloat(digit[1]);
    if (digit[2]) v *= SCALE[digit[2]] ?? 1;
    // "2 dollars 35" / "2 35" (spoken price) → 2.35 when the second part looks like cents
    const cents = s.slice(digit.index! + digit[0].length).match(/^\s*(?:and\s*)?(\d{1,2})\s*(?:cents)?\b/);
    if (cents && !digit[2] && Number.isInteger(v) && v < 100) v = v + parseInt(cents[1], 10) / 100;
    return v;
  }

  // Words: "twenty five hundred", "two thousand five hundred", "fifteen", "two point three five"
  const tokens = s.split(' ').filter((t) => t in SMALL || t in SCALE || t === 'point' || t === 'and');
  if (!tokens.length) return null;
  let total = 0;
  let current = 0;
  let sawNumber = false;
  let i = 0;
  for (; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'and') continue;
    if (t === 'point') break;
    if (t in SMALL) {
      current += SMALL[t];
      sawNumber = true;
    } else if (t in SCALE) {
      const sc = SCALE[t];
      if (sc === 100) current = (current || 1) * 100;
      else {
        total += (current || 1) * sc;
        current = 0;
      }
      sawNumber = true;
    }
  }
  if (!sawNumber) return null;
  let value = total + current;
  if (tokens[i] === 'point') {
    const decimals = tokens.slice(i + 1).filter((t) => t in SMALL && SMALL[t] < 10 && Number.isInteger(SMALL[t]));
    if (decimals.length) value = parseFloat(`${value}.${decimals.map((t) => SMALL[t]).join('')}`);
  }
  return value;
}

/** "fifteen percent" → 0.15, "15" → 0.15, "0.15" → 0.15, ".2" → 0.2 */
export function parsePercent(input: string): number | null {
  const n = parseNumber(input);
  if (n === null) return null;
  if (n > 1) return Math.min(n, 100) / 100;
  return n;
}

/** Money per mile / per gallon: "two thirty five" → 2.35, "$2.35" → 2.35, "235" (cents) → 2.35 */
export function parseRate(input: string): number | null {
  const s = normalize(input);
  // Spoken price in words: "two thirty five" → 2.35 (a unit word followed by a 0–99 group)
  const words = s.split(' ').filter((t) => t in SMALL || t in SCALE || t === 'point');
  if (words.length >= 2 && words.length <= 3 && words[0] in SMALL && SMALL[words[0]] < 10 && Number.isInteger(SMALL[words[0]]) && !words.includes('point') && !words.some((w) => w in SCALE)) {
    const rest = parseNumber(words.slice(1).join(' '));
    if (rest !== null && rest < 100) return SMALL[words[0]] + rest / 100;
  }
  const n = parseNumber(s);
  if (n === null) return null;
  if (/cents?/.test(s) && n >= 10) return n / 100;
  if (Number.isInteger(n) && n >= 100 && n < 1000) return n / 100; // "two thirty five"
  return n;
}

export function parseYesNo(input: string): boolean | null {
  const s = normalize(input);
  if (/\b(yes|yeah|yep|yup|sure|correct|we do|i do|affirmative|absolutely|of course|true|right)\b/.test(s)) return true;
  if (/\b(no|nope|nah|not|don'?t|negative|never|false|we do not|i do not)\b/.test(s)) return false;
  return null;
}

/** Match a spoken answer to one of the options by label/keywords. */
export function parseChoice<T extends string>(input: string, options: { value: T; keywords: string[] }[]): T | null {
  const s = normalize(input);
  let best: { value: T; score: number } | null = null;
  for (const o of options) {
    const score = o.keywords.reduce((acc, k) => acc + (s.includes(k.toLowerCase()) ? k.length : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { value: o.value, score };
  }
  return best?.value ?? null;
}

/** Multi-select: every option whose keywords appear. */
export function parseMulti<T extends string>(input: string, options: { value: T; keywords: string[] }[]): T[] {
  const s = normalize(input);
  return options.filter((o) => o.keywords.some((k) => s.includes(k.toLowerCase()))).map((o) => o.value);
}

/** "Acme Trucking LLC" from "it's called acme trucking" */
export function parseName(input: string): string {
  const cleaned = input
    .replace(/^(it'?s|its|it is|we are|we're|were|the name is|name is|called|my company is|company is|i run|its called|it's called)\s+/i, '')
    .replace(/^(called)\s+/i, '')
    .trim();
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .map((w) => (/^(llc|inc|co|ltd|corp)\.?$/i.test(w) ? w.toUpperCase().replace('.', '') : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

/** Pull a DOT/MC-looking number out of speech: "three three nine one oh two seven" or "3391027". */
export function parseIdNumber(input: string): string | null {
  const s = normalize(input).replace(/\b(dot|mc|number|is|it'?s|my)\b/g, ' ');
  const digits = s.match(/\d{4,8}/);
  if (digits) return digits[0];
  const words = s.split(' ').filter((t) => t in SMALL && SMALL[t] < 10 && Number.isInteger(SMALL[t]));
  if (words.length >= 4) return words.map((w) => SMALL[w]).join('');
  return null;
}
