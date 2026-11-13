import { describe, expect, it } from 'vitest';
import { buildModel } from '../src/charts/line/model.js';
import { inferXType, parseDate } from '../src/util/data.js';
import { segmentRuns } from '../src/charts/line/draw.js';
import type { ScreenPoint } from '../src/charts/line/layout.js';

describe('inferXType', () => {
  it('detects dates, numbers, and categories', () => {
    expect(inferXType(['2024-01-01', '2024-02-01'])).toBe('time');
    expect(inferXType([new Date(), new Date()])).toBe('time');
    expect(inferXType([1, 2, 3])).toBe('linear');
    expect(inferXType(['Q1', 'Q2'])).toBe('band');
  });
});

describe('parseDate', () => {
  it('parses ISO dates in local time', () => {
    const d = parseDate('2024-07-01')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2024, 6, 1, 0]);
  });
  it('rejects garbage', () => {
    expect(parseDate('not a date')).toBeNull();
  });
});

describe('buildModel', () => {
  const data = [
    { d: '2024-01-01', b: 'Chrome', v: 1 },
    { d: '2024-02-01', b: 'Chrome', v: null },
    { d: '2024-03-01', b: 'Chrome', v: 3, est: true },
    { d: '2024-01-01', b: 'IE11', v: null },
  ];
  const m = buildModel({ data, x: 'd', y: 'v', series: 'b', estimated: 'est' });

  it('groups series in first-appearance order and reports all-null series as missing', () => {
    expect(m.seriesKeys).toEqual(['Chrome', 'IE11']);
    expect(m.missing).toEqual(['IE11']);
  });
  it('keeps nulls as gaps and flags estimated points', () => {
    const chrome = m.series.find((s) => s.key === 'Chrome')!;
    expect(chrome.points.map((p) => p.y)).toEqual([1, null, 3]);
    expect(chrome.points.map((p) => p.estimated)).toEqual([false, false, true]);
  });
  it('separates color and line-style fields', () => {
    const m2 = buildModel({
      data: [
        { d: 1, b: 'Chrome', yr: '2024', v: 1 },
        { d: 1, b: 'Chrome', yr: '2023', v: 2 },
      ],
      x: 'd',
      y: 'v',
      series: (r) => `${r.b} ${r.yr}`,
      color: 'b',
      lineStyle: 'yr',
      lineStyles: { '2023': 'dashed' },
    });
    expect(m2.colorKeys).toEqual(['Chrome']);
    expect(m2.styleKeys).toEqual(['2024', '2023']);
    expect(m2.series.map((s) => s.lineStyle)).toEqual(['solid', 'dashed']);
  });
});

describe('segmentRuns', () => {
  const pt = (x: number, y: number | null, estimated = false): ScreenPoint => ({
    x,
    y,
    value: y,
    p: { x, xRaw: x, y, estimated, datum: {}, index: x },
  });

  it('breaks at nulls', () => {
    const runs = segmentRuns([pt(0, 1), pt(1, 2), pt(2, null), pt(3, 4), pt(4, 5)]);
    expect(runs.map((r) => r.pts.map((p) => p.x))).toEqual([[0, 1], [3, 4]]);
  });
  it('switches to a dotted run when either end of a segment is estimated', () => {
    const runs = segmentRuns([pt(0, 1), pt(1, 2), pt(2, 3, true), pt(3, 4, true)]);
    expect(runs.map((r) => [r.estimated, r.pts.map((p) => p.x)])).toEqual([
      [false, [0, 1]],
      [true, [1, 2, 3]],
    ]);
  });
});
