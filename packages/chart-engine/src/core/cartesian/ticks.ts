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

const GAP = 16;

/** Do any two labels, laid out at their centred positions, overlap? */
export function overlaps(ticks: { pos: number; width: number }[], gap = GAP, align: 'middle' | 'start' = 'middle'): boolean {
  for (let i = 1; i < ticks.length; i++) {
    const a = ticks[i - 1];
    const b = ticks[i];
    const aEnd = align === 'middle' ? a.pos + a.width / 2 : a.pos + a.width;
    const bStart = align === 'middle' ? b.pos - b.width / 2 : b.pos;
    if (aEnd + gap > bStart) return true;
  }
  return false;
}

export function timeTicks(
  scale: ScaleTime<number, number>,
  f: Formatters,
  font: string,
  width: number,
  requested?: number,
  showSuper = true,
): Tick[] {
  let count = requested ?? Math.max(2, Math.floor(width / 70));
  for (let attempt = 0; attempt < 12; attempt++) {
    const values = scale.ticks(count);
    const step = values.length > 1 ? +values[1] - +values[0] : +scale.domain()[1] - +scale.domain()[0];
    const fmts = timeFormatsForGrain(f, grainForTickStep(step));
    let prevSuper = '';
    const ticks: Tick[] = values.map((v, i) => {
      const t: Tick = { value: +v, pos: scale(v), label: fmts.primary(v) };
      if (showSuper && fmts.superLabel) {
        const s = fmts.superLabel(v);
        if (i === 0 || s !== prevSuper) t.superLabel = s;
        prevSuper = s;
      }
      return t;
    });
    const measured = ticks.map((t) => ({ pos: t.pos, width: measureText(t.label, font) }));
    if (!overlaps(measured) || count <= 2) return ticks;
    count = Math.max(2, Math.floor(count * 0.7));
  }
  return [];
}

export function linearXTicks(
  scale: ScaleLinear<number, number>,
  fmt: ((n: number) => string) | null,
  f: Formatters,
  font: string,
  width: number,
  requested?: number,
): Tick[] {
  let count = requested ?? Math.max(2, Math.floor(width / 80));
  for (let attempt = 0; attempt < 12; attempt++) {
    const values = scale.ticks(count);
    const format = fmt ?? autoNumberFormat(values, f);
    const ticks = values.map((v) => ({ value: v, pos: scale(v), label: format(v) }));
    const measured = ticks.map((t) => ({ pos: t.pos, width: measureText(t.label, font) }));
    if (!overlaps(measured) || count <= 2) return ticks;
    count = Math.max(2, Math.floor(count * 0.7));
  }
  return [];
}

export function yTicks(
  scale: ScaleLinear<number, number>,
  fmt: ((n: number) => string) | null,
  f: Formatters,
  height: number,
  fontSize: number,
  requested?: number,
): Tick[] {
  const count = requested ?? Math.max(2, Math.min(8, Math.floor(height / (fontSize * 4))));
  const values = scale.ticks(count);
  const format = fmt ?? autoNumberFormat(values, f);
  return values.map((v) => ({ value: v, pos: scale(v), label: format(v) }));
}

/** Compact format with just enough precision to keep tick labels distinct. */
export function autoNumberFormat(values: number[], f: Formatters, prefix = ''): (n: number) => string {
  const step = values.length > 1 ? Math.abs(values[1] - values[0]) : Math.abs(values[0] ?? 1) || 1;
  const max = Math.max(...values.map(Math.abs), 0);
  return compactFormatter(f, decimalsForStep(step, max), prefix);
}

/** Show every nth band label so none overlap. */
export function bandTicks(
  categories: string[],
  pos: (i: number) => number,
  font: string,
  width: number,
): Tick[] {
  const all = categories.map((c, i) => ({ value: i, pos: pos(i), label: c }));
  if (all.length === 0) return all;
  const widest = Math.max(...all.map((t) => measureText(t.label, font)));
  const spacing = all.length > 1 ? Math.abs(all[1].pos - all[0].pos) : width;
  const every = Math.max(1, Math.ceil((widest + GAP) / Math.max(1, spacing)));
  return all.filter((_, i) => i % every === 0);
}
