import { describe, expect, it } from 'vitest';
import { hitDonut } from '../src/charts/donut/hit.js';
import { layoutDonut, snapshotDonut, thicknessFor } from '../src/charts/donut/layout.js';
import { buildDonutModel } from '../src/charts/donut/model.js';
import type { DonutChartOptions } from '../src/charts/donut/types.js';
import type { Env } from '../src/core/module.js';
import { LIGHT, SIZES } from '../src/core/theme.js';
import { createFormatters } from '../src/util/format.js';

const env: Env = { theme: LIGHT, sizes: SIZES.M, f: createFormatters(), palette: LIGHT.palette };
const data = [
  { c: 'Tablet', v: 15 },
  { c: 'Phone', v: 65 },
  { c: 'Watch', v: 5 },
  { c: 'Desktop', v: 15 },
];
const base: DonutChartOptions = { data, category: 'c', value: 'v' };

function layout(o: Partial<DonutChartOptions> = {}, hidden: string[] = [], tween: { from: ReturnType<typeof snapshotDonut>; t: number } | null = null) {
  const opts = { ...base, ...o };
  return layoutDonut({ model: buildDonutModel(opts), options: opts, env, width: 400, height: 300, frame: null, hidden: new Set(hidden), tween });
}

describe('donut layout', () => {
  it('orders segments largest first, clockwise from 12 o’clock', () => {
    const arcs = layout().pies[0].arcs;
    expect(arcs.map((a) => a.category)).toEqual(['Phone', 'Tablet', 'Desktop', 'Watch']);
    expect(arcs[0].start).toBe(0);
    expect(arcs[3].end).toBeCloseTo(Math.PI * 2);
    expect(arcs[0].percent).toBeCloseTo(0.65);
  });

  it('keeps data order for ordinal data and spans 9 to 3 o’clock for semicircles', () => {
    const arcs = layout({ sort: 'none', variant: 'semicircle' }).pies[0].arcs;
    expect(arcs.map((a) => a.category)).toEqual(['Tablet', 'Phone', 'Watch', 'Desktop']);
    expect(arcs[0].start).toBeCloseTo(-Math.PI / 2);
    expect(arcs[3].end).toBeCloseTo(Math.PI / 2);
  });

  it('collapses hidden segments and recomputes shares from the visible total', () => {
    const arcs = layout({}, ['Phone']).pies[0].arcs;
    expect(arcs[0].end - arcs[0].start).toBe(0);
    expect(arcs[1].percent).toBeCloseTo(15 / 35);
  });

  it('interpolates angles from the previous snapshot while tweening', () => {
    const from = snapshotDonut(layout({}, ['Phone']));
    const mid = layout({}, [], { from, t: 0.5 }).pies[0].arcs[0];
    expect(mid.end).toBeCloseTo(0.65 * Math.PI);
  });

  it('puts the binary primary first and the remainder in the secondary gray', () => {
    const g = layout({ data: [{ c: 'No', v: 30 }, { c: 'Yes', v: 70 }], binary: { secondary: 'No' } });
    expect(g.pies[0].arcs.map((a) => a.category)).toEqual(['Yes', 'No']);
    expect(g.pies[0].arcs[1].color).toBe(LIGHT.secondary);
  });

  it('colors the binary primary by sentiment against a benchmark', () => {
    const below = layout({ data: [{ c: 'Yes', v: 40 }, { c: 'No', v: 60 }], binary: true, benchmark: { value: 54 } });
    expect(below.pies[0].arcs[0].color).toBe(LIGHT.negative);
    expect(below.pies[0].benchmark!.angle).toBeCloseTo(0.54 * Math.PI * 2);
  });

  it('builds one donut per facet with a shared category order', () => {
    const g = layout({
      data: [
        { f: 'A', c: 'x', v: 1 },
        { f: 'A', c: 'y', v: 9 },
        { f: 'B', c: 'x', v: 5 },
        { f: 'B', c: 'y', v: 1 },
      ],
      facet: 'f',
    });
    expect(g.pies).toHaveLength(2);
    expect(g.pies.map((p) => p.arcs.map((a) => a.category))).toEqual([
      ['y', 'x'],
      ['y', 'x'],
    ]);
  });
});

describe('donut sizing and hit testing', () => {
  it('interpolates ring thickness between the size steps', () => {
    expect(thicknessFor(120)).toBe(18);
    expect(thicknessFor(140)).toBe(19);
  });

  it('finds the segment under a point and ignores the hole', () => {
    const g = layout();
    const p = g.pies[0];
    const r = (p.inner + p.outer) / 2;
    expect(hitDonut(g, p.cx + r, p.cy)?.category).toBe('Phone');
    expect(hitDonut(g, p.cx - r, p.cy)?.category).toBe('Tablet');
    expect(hitDonut(g, p.cx - r * 0.2, p.cy - r)?.category).toBe('Watch');
    expect(hitDonut(g, p.cx, p.cy)).toBeNull();
  });
});
