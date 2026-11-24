import type { ScaleLinear, ScaleTime } from 'd3-scale';
import { measureText } from '../../util/text.js';
import { compactFormatter, decimalsForStep, grainForTickStep, timeFormatsForGrain, type Formatters } from '../../util/format.js';

export interface Tick {
  value: number;
  pos: number;
  label: string;
  /** Second-row label, e.g. the year under a month. */
  superLabel?: string;
}

/** Minimum horizontal space between neighbouring labels. */
const MIN_LABEL_GAP = 16;
/** Starting tick density for x axes: one tick per this many pixels. */
const TIME_TICK_SPACING = 70;
const LINEAR_TICK_SPACING = 80;
const MIN_TICK_COUNT = 2;
const MAX_Y_TICK_COUNT = 8;
/** Y tick spacing as a multiple of the font size. */
const Y_TICK_SPACING_IN_FONT_SIZES = 4;
/** How many times to thin the x ticks before giving up. */
const MAX_THINNING_ATTEMPTS = 12;
/** Each thinning attempt keeps this fraction of the ticks. */
const THINNING_RATIO = 0.7;

interface MeasuredLabel {
  pos: number;
  width: number;
}

/** Do any two labels, laid out at their centred positions, overlap? */
export function overlaps(ticks: { pos: number; width: number }[], gap = MIN_LABEL_GAP, align: 'middle' | 'start' = 'middle'): boolean {
  for (let i = 1; i < ticks.length; i++) {
    const previous = ticks[i - 1];
    const current = ticks[i];
    const previousEnd = align === 'middle' ? previous.pos + previous.width / 2 : previous.pos + previous.width;
    const currentStart = align === 'middle' ? current.pos - current.width / 2 : current.pos;
    if (previousEnd + gap > currentStart) return true;
  }
  return false;
}

function measureLabels(ticks: Tick[], font: string): MeasuredLabel[] {
  return ticks.map((tick) => ({ pos: tick.pos, width: measureText(tick.label, font) }));
}

function thinnedCount(count: number): number {
  return Math.max(MIN_TICK_COUNT, Math.floor(count * THINNING_RATIO));
}

/** Labels one round of time ticks, adding a super label wherever it changes. */
function labelTimeTicks(scale: ScaleTime<number, number>, values: Date[], formatters: Formatters, showSuper: boolean): Tick[] {
  const domain = scale.domain();
  const step = values.length > 1 ? +values[1] - +values[0] : +domain[1] - +domain[0];
  const formats = timeFormatsForGrain(formatters, grainForTickStep(step));
  let previousSuperLabel = '';
  return values.map((value, i) => {
    const tick: Tick = { value: +value, pos: scale(value), label: formats.primary(value) };
    if (showSuper && formats.superLabel) {
      const superLabel = formats.superLabel(value);
      if (i === 0 || superLabel !== previousSuperLabel) tick.superLabel = superLabel;
      previousSuperLabel = superLabel;
    }
    return tick;
  });
}

export function timeTicks(
  scale: ScaleTime<number, number>,
  formatters: Formatters,
  font: string,
  width: number,
  requested?: number,
  showSuper = true,
): Tick[] {
  let count = requested ?? Math.max(MIN_TICK_COUNT, Math.floor(width / TIME_TICK_SPACING));
  for (let attempt = 0; attempt < MAX_THINNING_ATTEMPTS; attempt++) {
    const ticks = labelTimeTicks(scale, scale.ticks(count), formatters, showSuper);
    if (!overlaps(measureLabels(ticks, font)) || count <= MIN_TICK_COUNT) return ticks;
    count = thinnedCount(count);
  }
  return [];
}

export function linearXTicks(
  scale: ScaleLinear<number, number>,
  format: ((n: number) => string) | null,
  formatters: Formatters,
  font: string,
  width: number,
  requested?: number,
): Tick[] {
  let count = requested ?? Math.max(MIN_TICK_COUNT, Math.floor(width / LINEAR_TICK_SPACING));
  for (let attempt = 0; attempt < MAX_THINNING_ATTEMPTS; attempt++) {
    const values = scale.ticks(count);
    const labelFormat = format ?? autoNumberFormat(values, formatters);
    const ticks = values.map((value) => ({ value, pos: scale(value), label: labelFormat(value) }));
    if (!overlaps(measureLabels(ticks, font)) || count <= MIN_TICK_COUNT) return ticks;
    count = thinnedCount(count);
  }
  return [];
}

export function yTicks(
  scale: ScaleLinear<number, number>,
  format: ((n: number) => string) | null,
  formatters: Formatters,
  height: number,
  fontSize: number,
  requested?: number,
): Tick[] {
  const countForHeight = Math.floor(height / (fontSize * Y_TICK_SPACING_IN_FONT_SIZES));
  const count = requested ?? Math.max(MIN_TICK_COUNT, Math.min(MAX_Y_TICK_COUNT, countForHeight));
  const values = scale.ticks(count);
  const labelFormat = format ?? autoNumberFormat(values, formatters);
  return values.map((value) => ({ value, pos: scale(value), label: labelFormat(value) }));
}

/** Compact format with just enough precision to keep tick labels distinct. */
export function autoNumberFormat(values: number[], formatters: Formatters, prefix = ''): (n: number) => string {
  const step = values.length > 1 ? Math.abs(values[1] - values[0]) : Math.abs(values[0] ?? 1) || 1;
  const largestMagnitude = Math.max(...values.map(Math.abs), 0);
  return compactFormatter(formatters, decimalsForStep(step, largestMagnitude), prefix);
}

/** Show every nth band label so none overlap. */
export function bandTicks(
  categories: string[],
  pos: (i: number) => number,
  font: string,
  width: number,
): Tick[] {
  const all = categories.map((category, i) => ({ value: i, pos: pos(i), label: category }));
  if (all.length === 0) return all;
  const widestLabel = Math.max(...all.map((tick) => measureText(tick.label, font)));
  const spacing = all.length > 1 ? Math.abs(all[1].pos - all[0].pos) : width;
  const labelEvery = Math.max(1, Math.ceil((widestLabel + MIN_LABEL_GAP) / Math.max(1, spacing)));
  return all.filter((_, i) => i % labelEvery === 0);
}
