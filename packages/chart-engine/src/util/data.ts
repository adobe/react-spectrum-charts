import type { Accessor, Datum, ScaleType } from '../core/types.js';

export function accessor<T = unknown>(field: Accessor<T> | undefined): ((d: Datum, i: number) => T) | null {
  if (field == null) return null;
  if (typeof field === 'function') return field;
  return (datum: Datum) => datum[field] as T;
}

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
/** "2024-03" or "2024-03-05", with no time component. */
const DATE_ONLY = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;

function isNumericString(value: string): boolean {
  return value.trim() !== '' && Number.isFinite(Number(value));
}

/** Scale type for x values: any non-numeric string makes it a band, then dates, then numbers. */
export function inferXType(values: unknown[]): ScaleType {
  let sawDate = false;
  let sawNumber = false;
  let sawString = false;
  for (const value of values) {
    if (value == null) continue;
    if (value instanceof Date) sawDate = true;
    else if (typeof value === 'number') sawNumber = true;
    else if (typeof value === 'string') {
      if (ISO_DATE.test(value)) sawDate = true;
      else if (isNumericString(value)) sawNumber = true;
      else sawString = true;
    }
  }
  if (sawString) return 'band';
  if (sawDate) return 'time';
  if (sawNumber) return 'linear';
  return 'band';
}

/** Parse ISO date strings in local time when they have no time component (2024-03 → Mar 1 local). */
export function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(+value) ? null : value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value !== 'string') return null;
  const dateOnly = DATE_ONLY.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(+year, +month - 1, day ? +day : 1);
  }
  const parsed = new Date(value);
  return Number.isNaN(+parsed) ? null : parsed;
}

export function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

/** "a", "a and b", "a, b, and c". */
export function listFormat(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  const allButLast = items.slice(0, -1).join(', ');
  return `${allButLast}, and ${items[items.length - 1]}`;
}
