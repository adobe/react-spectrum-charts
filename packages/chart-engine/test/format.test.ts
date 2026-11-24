import { describe, expect, it } from 'vitest';
import { compactFormatter, createFormatters, decimalsForStep, inferGrain } from '../src/util/format.js';

const f = createFormatters();

describe('compactFormatter', () => {
  const fmt = compactFormatter(f);
  it('abbreviates with K/M/B suffixes', () => {
    expect(fmt(9_500_000)).toBe('9.5M');
    expect(fmt(10_000)).toBe('10K');
    expect(fmt(2_400_000_000)).toBe('2.4B');
    expect(fmt(950)).toBe('950');
  });
  it('rolls 999,950 up to 1M instead of 1000K', () => {
    expect(fmt(999_950)).toBe('1M');
  });
  it('uses a true minus sign and a currency prefix', () => {
    expect(compactFormatter(f, 1, '$')(-5_000_000)).toBe('\u22125M'.replace('5M', '$5M'));
  });
  it('returns an empty string for non-finite values', () => {
    expect(fmt(NaN)).toBe('');
  });
});

describe('decimalsForStep', () => {
  it('needs no decimals for whole steps in the display unit', () => {
    expect(decimalsForStep(5_000_000, 10_000_000)).toBe(0);
  });
  it('adds decimals for fractional steps', () => {
    expect(decimalsForStep(500_000, 2_000_000)).toBe(1);
    expect(decimalsForStep(250_000, 2_000_000)).toBe(2);
  });
});

describe('inferGrain', () => {
  const day = 86_400_000;
  it('detects weekly and monthly data', () => {
    expect(inferGrain([0, 7 * day, 14 * day])).toBe('week');
    const months = [0, 1, 2, 3].map((m) => new Date(2024, m, 1).getTime());
    expect(inferGrain(months)).toBe('month');
  });
});
