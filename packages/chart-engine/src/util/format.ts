import { format as d3Format, formatLocale, type FormatLocaleObject } from 'd3-format';
import { timeFormat as d3TimeFormat, timeFormatLocale, type TimeLocaleObject } from 'd3-time-format';
import type { LocaleOptions } from '../core/types.js';

export type TimeGrain = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface Formatters {
  number: (specifier: string) => (n: number) => string;
  time: (specifier: string) => (d: Date) => string;
  minus: string;
}

const MINUS_SIGN = '\u2212';

/** Number and time formatters for a locale (d3 defaults when none is given). */
export function createFormatters(locale?: LocaleOptions): Formatters {
  const numberLocale: FormatLocaleObject | null = locale?.number ? formatLocale(locale.number) : null;
  const timeLocale: TimeLocaleObject | null = locale?.time ? timeFormatLocale(locale.time) : null;
  return {
    number: (specifier) => (numberLocale ? numberLocale.format(specifier) : d3Format(specifier)),
    time: (specifier) => (timeLocale ? timeLocale.format(specifier) : d3TimeFormat(specifier)),
    minus: locale?.number?.minus ?? MINUS_SIGN,
  };
}

const THOUSAND = 1e3;
/** Values below 1K keep at least this many fraction digits. */
const MIN_PLAIN_DECIMALS = 2;
/** Most fraction digits `decimalsForStep` returns. */
const MAX_STEP_DECIMALS = 3;
/** Relative tolerance when checking whether a scaled step is a whole number. */
const STEP_EPSILON = 1e-6;

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
export function compactFormatter(formatters: Formatters, decimals = 1, prefix = ''): (n: number) => string {
  const plainDecimals = Math.max(decimals, MIN_PLAIN_DECIMALS);
  const formatScaled = formatters.number(`,.${decimals}~f`);
  const formatPlain = formatters.number(`,.${plainDecimals}~f`);
  /** True when rounding would print 1000 or more, so the next larger suffix should be used. */
  const roundsToThousand = (amount: number, digits: number) => Number(amount.toFixed(digits)) >= THOUSAND;
  return (value: number) => {
    if (value == null || !Number.isFinite(value)) return '';
    const abs = Math.abs(value);
    const sign = value < 0 ? formatters.minus : '';
    for (let i = 0; i < SUFFIXES.length; i++) {
      const [threshold, suffix] = SUFFIXES[i];
      if (abs < threshold) continue;
      const scaled = abs / threshold;
      // 999,950 should read 1M rather than 1000K.
      if (i > 0 && roundsToThousand(scaled, decimals)) {
        const [largerThreshold, largerSuffix] = SUFFIXES[i - 1];
        return `${sign}${prefix}${formatScaled(abs / largerThreshold)}${largerSuffix}`;
      }
      return `${sign}${prefix}${formatScaled(scaled)}${suffix}`;
    }
    if (roundsToThousand(abs, plainDecimals)) return `${sign}${prefix}${formatScaled(abs / THOUSAND)}K`;
    return `${sign}${prefix}${formatPlain(abs)}`;
  };
}

/** Number of fraction digits needed to distinguish values spaced by `step` in compact notation. */
export function decimalsForStep(step: number, maxValue: number): number {
  const abs = Math.abs(maxValue);
  const unit = SUFFIXES.find(([threshold]) => abs >= threshold)?.[0] ?? 1;
  const scaled = step / unit;
  if (!Number.isFinite(scaled) || scaled <= 0) return 0;
  // Fewest digits that represent the step exactly (0.5 → 1, 0.25 → 2), capped at 3.
  for (let digits = 0; digits < MAX_STEP_DECIMALS; digits++) {
    const shifted = scaled * 10 ** digits;
    if (Math.abs(shifted - Math.round(shifted)) < STEP_EPSILON * Math.max(1, shifted)) return digits;
  }
  return MAX_STEP_DECIMALS;
}

/** Formatter from a user function, a d3-format specifier, or the fallback. */
export function numberFormatter(
  formatters: Formatters,
  spec: string | ((v: never) => string) | undefined,
  fallback: (n: number) => string,
): (n: number) => string {
  if (typeof spec === 'function') return spec as (n: number) => string;
  if (typeof spec === 'string') {
    const format = formatters.number(spec);
    return (value) => (value == null || !Number.isFinite(value) ? '' : format(value));
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

export function timeFormatsForGrain(formatters: Formatters, grain: TimeGrain): TimeLabelFormats {
  const timeFormat = formatters.time;
  switch (grain) {
    case 'year':
      return { primary: timeFormat('%Y'), superLabel: null, full: timeFormat('%Y') };
    case 'quarter':
    case 'month':
      return { primary: timeFormat('%b'), superLabel: timeFormat('%Y'), full: timeFormat('%b %Y') };
    case 'week':
    case 'day':
      return { primary: timeFormat('%b %-d'), superLabel: timeFormat('%Y'), full: timeFormat('%b %-d, %Y') };
    case 'hour':
    case 'minute':
      return { primary: timeFormat('%H:%M'), superLabel: timeFormat('%b %-d'), full: timeFormat('%b %-d, %H:%M') };
    default:
      return { primary: timeFormat('%H:%M:%S'), superLabel: timeFormat('%b %-d'), full: timeFormat('%b %-d, %H:%M:%S') };
  }
}

const MS = { second: 1e3, minute: 6e4, hour: 36e5, day: 864e5 };
const DAYS_PER_YEAR = 365;
/** Tick steps of at least this many days count as yearly (allows for rounded steps). */
const MIN_YEAR_TICK_DAYS = 360;
/** Shortest month. */
const MIN_MONTH_DAYS = 28;
const DAYS_PER_WEEK = 7;

/** Infer the granularity of a sorted list of timestamps from their smallest gap and alignment. */
export function inferGrain(times: number[]): TimeGrain {
  if (times.length === 0) return 'month';
  let minGap = Infinity;
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1];
    if (gap > 0 && gap < minGap) minGap = gap;
  }
  const dates = times.map((time) => new Date(time));
  const allMidnight = dates.every((date) => date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0);
  const allFirst = allMidnight && dates.every((date) => date.getDate() === 1);
  const allJan = allFirst && dates.every((date) => date.getMonth() === 0);
  const singleTime = minGap === Infinity;
  if (allJan && (singleTime || minGap >= DAYS_PER_YEAR * MS.day)) return 'year';
  if (allFirst && (singleTime || minGap >= MIN_MONTH_DAYS * MS.day)) return 'month';
  if (singleTime) return allMidnight ? 'day' : 'hour';
  if (minGap >= DAYS_PER_WEEK * MS.day) return 'week';
  if (minGap >= MS.day) return 'day';
  if (minGap >= MS.hour) return 'hour';
  if (minGap >= MS.minute) return 'minute';
  return 'second';
}

/** Granularity represented by a set of axis ticks. */
export function grainForTickStep(step: number): TimeGrain {
  if (step >= MIN_YEAR_TICK_DAYS * MS.day) return 'year';
  if (step >= MIN_MONTH_DAYS * MS.day) return 'month';
  if (step >= MS.day) return 'day';
  if (step >= MS.minute) return 'hour';
  return 'second';
}
