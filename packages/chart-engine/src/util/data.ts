import type { Accessor, Datum, ScaleType } from '../core/types.js';

export function accessor<T = unknown>(a: Accessor<T> | undefined): ((d: Datum, i: number) => T) | null {
  if (a == null) return null;
  if (typeof a === 'function') return a;
  return (d: Datum) => d[a] as T;
}

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export function inferXType(values: unknown[]): ScaleType {
  let sawDate = false;
  let sawNumber = false;
  let sawString = false;
  for (const v of values) {
    if (v == null) continue;
    if (v instanceof Date) sawDate = true;
    else if (typeof v === 'number') sawNumber = true;
    else if (typeof v === 'string') {
      if (ISO_DATE.test(v)) sawDate = true;
      else if (v.trim() !== '' && Number.isFinite(Number(v))) sawNumber = true;
      else sawString = true;
    }
  }
  if (sawString) return 'band';
  if (sawDate) return 'time';
  if (sawNumber) return 'linear';
  return 'band';
}

/** Parse ISO date strings in local time when they have no time component (2024-03 → Mar 1 local). */
export function parseDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(+v) ? null : v;
  if (typeof v === 'number') return new Date(v);
  if (typeof v !== 'string') return null;
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(v);
  if (m) return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1);
  const d = new Date(v);
  return Number.isNaN(+d) ? null : d;
}

export function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** "a", "a and b", "a, b, and c". */
export function listFormat(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
