/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import * as vega from 'vega';

import { buildSpec } from '../chartSpecBuilder';
import { getExpressionFunctions } from '../expressionFunctions';

const data = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: 4000 },
];

const build = (accessibleNavigation: boolean): Record<string, unknown> =>
  buildSpec({
    accessibleNavigation,
    data,
    colors: 's2Categorical20',
    marks: [{ markType: 'bar', dimension: 'browser', metric: 'downloads', color: 'browser' } as never],
    axes: [{ position: 'bottom' } as never, { position: 'left', baseline: true } as never],
    legends: [{ color: 'browser', title: 'Browser', position: 'bottom' } as never],
  } as never) as unknown as Record<string, unknown>;

describe('plot-group subview (increment 1)', () => {
  test('nests the chart marks/axes/scales in a plot group and reserves a band', () => {
    const spec = build(true);

    // Everything positional moved into the plot group; built-in legend dropped. The shared scales
    // (color + the legend's `${name}Entries`) stay top-level so both groups can reference them.
    expect((spec.legends as unknown[] | undefined) ?? []).toHaveLength(0);
    expect((spec.axes as unknown[]) ?? []).toHaveLength(0);
    const topScaleNames = ((spec.scales as { name?: string }[]) ?? []).map((s) => s.name);
    expect(topScaleNames).toContain('color');
    expect(topScaleNames.some((n) => n?.endsWith('Entries'))).toBe(true);

    const marks = spec.marks as { name?: string; type?: string; marks?: unknown[]; axes?: unknown[]; scales?: unknown[] }[];
    const plot = marks.find((m) => m.name === 'plotGroup')!;
    expect(plot.type).toBe('group');
    expect((plot.marks ?? []).length).toBeGreaterThan(0);
    expect((plot.axes ?? []).length).toBe(2);
    expect((plot.scales ?? []).length).toBeGreaterThan(0);
    // the color scale is NOT duplicated into the plot group.
    expect((plot.scales as { name?: string }[]).some((s) => s.name === 'color')).toBe(false);

    // the legend band group is a sibling of the plot group.
    const legend = marks.find((m) => m.name === 'legend');
    expect(legend?.type).toBe('group');

    // plotHeight reserves the band below the plot.
    expect((spec.signals as { name?: string }[]).some((s) => s.name === 'plotHeight')).toBe(true);

    // group-scoped `height`/`width` signals make everything inside (scales, baselines, focus rings)
    // resolve to the plot area, so nothing spills past the axes into the band.
    const plotWithSignals = plot as { signals?: { name?: string; update?: string }[] };
    expect(plotWithSignals.signals).toEqual([
      { name: 'height', update: 'plotHeight' },
      { name: 'width', update: 'plotWidth' },
    ]);
  });

  test('leaves non-accessible charts flat (no plot group)', () => {
    const spec = build(false);
    const marks = spec.marks as { name?: string }[];
    expect(marks.some((m) => m.name === 'plotGroup')).toBe(false);
    expect((spec.axes as unknown[]).length).toBe(2);
  });

  test('the nested chart still renders (scales resolve inside the plot group)', async () => {
    const fns = getExpressionFunctions('en-US') as unknown as Record<string, (...a: unknown[]) => unknown>;
    for (const [name, fn] of Object.entries(fns)) vega.expressionFunction(name, fn);
    vega.expressionFunction('rscContainerWidth', () => 400);

    const spec = build(true);
    const tableSource = (spec.data as Record<string, unknown>[]).find((d) => d.name === 'table');
    if (tableSource) tableSource.values = data;

    const view = new vega.View(vega.parse(spec as vega.Spec), { renderer: 'svg' }).width(400).height(400).initialize();
    await view.runAsync();

    // Find the bar mark's rendered items inside the plot group and confirm they have real geometry
    // (scales resolved against the group's width/plotHeight).
    let barItemCount = 0;
    const walk = (item: unknown): void => {
      if (!item || typeof item !== 'object') return;
      const n = item as Record<string, unknown>;
      if (n.name === 'bar0' && Array.isArray(n.items)) barItemCount = n.items.length;
      if (Array.isArray(n.items)) n.items.forEach(walk);
    };
    walk((view as unknown as { scenegraph: () => { root: unknown } }).scenegraph().root);
    expect(barItemCount).toBe(3);
  });
});
