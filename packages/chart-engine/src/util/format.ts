import { format as d3Format, formatLocale, type FormatLocaleObject } from 'd3-format';
import { timeFormat as d3TimeFormat, timeFormatLocale, type TimeLocaleObject } from 'd3-time-format';
import type { LocaleOptions } from '../core/types.js';

export type TimeGrain = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface Formatters {
  number: (specifier: string) => (n: number) => string;
  time: (specifier: string) => (d: Date) => string;
  minus: string;
}

export function createFormatters(locale?: LocaleOptions): Formatters {
  const num: FormatLocaleObject | null = locale?.number ? formatLocale(locale.number) : null;
  const tim: TimeLocaleObject | null = locale?.time ? timeFormatLocale(locale.time) : null;
  return {
    number: (s) => (num ? num.format(s) : d3Format(s)),
    time: (s) => (tim ? tim.format(s) : d3TimeFormat(s)),
    minus: locale?.number?.minus ?? '\u2212',
  };
}

const SUFFIXES: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

/**
 * Compact number formatter in the style of the design (10M, 9.5M, 720K).
 * `decimals` is the maximum number of fraction digits; trailing zeros are trimmed.
 */
export function compactFormatter(f: Formatters, decimals = 1, prefix = ''): (n: number) => string {
  const fmt = f.number(`,.${decimals}~f`);
  const plain = f.number(`,.${Math.max(decimals, 2)}~f`);
  return (n: number) => {
    if (n == null || !Number.isFinite(n)) return '';
    const abs = Math.abs(n);
    const sign = n < 0 ? f.minus : '';
    for (let i = 0; i < SUFFIXES.length; i++) {
      const [threshold, suffix] = SUFFIXES[i];
      if (abs >= threshold) {
        const scaled = abs / threshold;
        // 999,950 should read 1M rather than 1000K.
        if (i > 0 && Number(scaled.toFixed(decimals)) >= 1000) {
          const [up, upSuffix] = SUFFIXES[i - 1];
          return `${sign}${prefix}${fmt(abs / up)}${upSuffix}`;
        }
        return `${sign}${prefix}${fmt(scaled)}${suffix}`;
      }
    }
    if (Number(abs.toFixed(Math.max(decimals, 2))) >= 1000) return `${sign}${prefix}${fmt(abs / 1e3)}K`;
    return `${sign}${prefix}${plain(abs)}`;
  };
}

/** Number of fraction digits needed to distinguish values spaced by `step` in compact notation. */
export function decimalsForStep(step: number, maxValue: number): number {
  const abs = Math.abs(maxValue);
  const unit = SUFFIXES.find(([t]) => abs >= t)?.[0] ?? 1;
  const scaled = step / unit;
  if (!Number.isFinite(scaled) || scaled <= 0) return 0;
  // Fewest digits that represent the step exactly (0.5 → 1, 0.25 → 2), capped at 3.
  for (let d = 0; d < 3; d++) {
    const v = scaled * 10 ** d;
    if (Math.abs(v - Math.round(v)) < 1e-6 * Math.max(1, v)) return d;
  }
  return 3;
}

export function numberFormatter(
  f: Formatters,
  spec: string | ((v: never) => string) | undefined,
  fallback: (n: number) => string,
): (n: number) => string {
  if (typeof spec === 'function') return spec as (n: number) => string;
  if (typeof spec === 'string') {
    const fn = f.number(spec);
    return (n) => (n == null || !Number.isFinite(n) ? '' : fn(n));
  }
  return fallback;
}

export interface TimeLabelFormats {
  primary: (d: Date) => string;
  /** Second row label; shown at the first tick and whenever it changes. */
  superLabel: ((d: Date) => string) | null;
  /** Full label for tooltips and screen readers. */
  full: (d: Date) => string;
}

export function timeFormatsForGrain(f: Formatters, grain: TimeGrain): TimeLabelFormats {
  switch (grain) {
    case 'year':
      return { primary: f.time('%Y'), superLabel: null, full: f.time('%Y') };
    case 'quarter':
    case 'month':
      return { primary: f.time('%b'), superLabel: f.time('%Y'), full: f.time('%b %Y') };
    case 'week':
    case 'day':
      return { primary: f.time('%b %-d'), superLabel: f.time('%Y'), full: f.time('%b %-d, %Y') };
    case 'hour':
    case 'minute':
      return { primary: f.time('%H:%M'), superLabel: f.time('%b %-d'), full: f.time('%b %-d, %H:%M') };
    default:
      return { primary: f.time('%H:%M:%S'), superLabel: f.time('%b %-d'), full: f.time('%b %-d, %H:%M:%S') };
  }
}

const MS = { second: 1e3, minute: 6e4, hour: 36e5, day: 864e5 };

/** Infer the granularity of a sorted list of timestamps from their smallest gap and alignment. */
export function inferGrain(times: number[]): TimeGrain {
  if (times.length === 0) return 'month';
  let minGap = Infinity;
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1];
    if (gap > 0 && gap < minGap) minGap = gap;
  }
  const dates = times.map((t) => new Date(t));
  const allMidnight = dates.every((d) => d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0);
  const allFirst = allMidnight && dates.every((d) => d.getDate() === 1);
  const allJan = allFirst && dates.every((d) => d.getMonth() === 0);
  if (allJan && (minGap === Infinity || minGap >= 365 * MS.day)) return 'year';
  if (allFirst && (minGap === Infinity || minGap >= 28 * MS.day)) return 'month';
  if (minGap === Infinity) return allMidnight ? 'day' : 'hour';
  if (minGap >= 7 * MS.day) return 'week';
  if (minGap >= MS.day) return 'day';
  if (minGap >= MS.hour) return 'hour';
  if (minGap >= MS.minute) return 'minute';
  return 'second';
}

/** Granularity represented by a set of axis ticks. */
export function grainForTickStep(step: number): TimeGrain {
  if (step >= 360 * MS.day) return 'year';
  if (step >= 28 * MS.day) return 'month';
  if (step >= MS.day) return 'day';
  if (step >= MS.minute) return 'hour';
  return 'second';
}
