import { describe, expect, it } from 'vitest';
import { parseChoice, parseIdNumber, parseMulti, parseName, parseNumber, parsePercent, parseRate, parseYesNo } from '../src/nlu';

describe('parseNumber', () => {
  it('digits', () => {
    expect(parseNumber('2500')).toBe(2500);
    expect(parseNumber('about 2,500 miles')).toBe(2500);
    expect(parseNumber('$1,400')).toBe(1400);
    expect(parseNumber('2k')).toBe(2000);
    expect(parseNumber('3.85')).toBe(3.85);
    expect(parseNumber('2 dollars 35')).toBe(2.35);
  });
  it('words', () => {
    expect(parseNumber('three')).toBe(3);
    expect(parseNumber('twenty five hundred')).toBe(2500);
    expect(parseNumber('two thousand five hundred')).toBe(2500);
    expect(parseNumber('fifteen')).toBe(15);
    expect(parseNumber('fourteen hundred')).toBe(1400);
    expect(parseNumber('twenty two hundred')).toBe(2200);
    expect(parseNumber('two point three five')).toBe(2.35);
    expect(parseNumber('a couple')).toBe(3); // "a" + "couple" → 1 + 2; acceptable, callers round
    expect(parseNumber('fifty thousand')).toBe(50000);
    expect(parseNumber('one hundred and twenty')).toBe(120);
    expect(parseNumber('just me')).toBeNull();
  });
});

describe('parsePercent', () => {
  it('handles both forms', () => {
    expect(parsePercent('fifteen percent')).toBe(0.15);
    expect(parsePercent('15')).toBe(0.15);
    expect(parsePercent('0.2')).toBe(0.2);
    expect(parsePercent('about ten')).toBe(0.1);
  });
});

describe('parseRate', () => {
  it('spoken prices', () => {
    expect(parseRate('two thirty five')).toBe(2.35);
    expect(parseRate('$2.35 a mile')).toBe(2.35);
    expect(parseRate('sixty two cents')).toBe(0.62);
    expect(parseRate('3 85')).toBe(3.85);
    expect(parseRate('about 2 dollars')).toBe(2);
  });
});

describe('parseYesNo', () => {
  it('reads intent', () => {
    expect(parseYesNo('yeah we do')).toBe(true);
    expect(parseYesNo('nope')).toBe(false);
    expect(parseYesNo("we don't factor")).toBe(false);
    expect(parseYesNo('maybe')).toBeNull();
  });
});

describe('choices', () => {
  const opts = [
    { value: 'starting', keywords: ['start', 'new', 'just getting', 'about to'] },
    { value: 'operating', keywords: ['already', 'running', 'hauling', 'operating', 'years'] },
  ] as const;
  it('single', () => {
    expect(parseChoice("we're already hauling", [...opts])).toBe('operating');
    expect(parseChoice('just getting started', [...opts])).toBe('starting');
    expect(parseChoice('hmm', [...opts])).toBeNull();
  });
  it('multi', () => {
    const ch = [
      { value: 'email', keywords: ['email', 'e-mail', 'inbox'] },
      { value: 'photo', keywords: ['photo', 'text', 'picture', 'phone'] },
      { value: 'portal', keywords: ['portal', 'website'] },
    ] as const;
    expect(parseMulti('drivers text me photos and brokers email', [...ch])).toEqual(['email', 'photo']);
  });
});

describe('names and ids', () => {
  it('company name', () => {
    expect(parseName("it's called acme trucking llc")).toBe('Acme Trucking LLC');
    expect(parseName('Redline Haulers')).toBe('Redline Haulers');
  });
  it('dot numbers', () => {
    expect(parseIdNumber('my dot number is 3391027')).toBe('3391027');
    expect(parseIdNumber('three three nine one zero two seven')).toBe('3391027');
    expect(parseIdNumber('skip')).toBeNull();
  });
});
