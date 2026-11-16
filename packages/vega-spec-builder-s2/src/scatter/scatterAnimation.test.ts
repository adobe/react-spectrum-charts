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
import { GroupMark, Mark, View, expressionFunction, parse } from 'vega';

import {
  ANIMATION_HOVER_SPEED,
  ANIMATION_TIMER,
  DRAW_IN_PAINT_FADE_MS,
  DRAW_IN_SWEEP_DURATION_MS,
  FADE_FACTOR,
  TABLE,
} from '@spectrum-charts/core-s2/constants';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { ChartOptions, ScatterOptions } from '../types/index.js';
import { getItemHighlightExpr } from './scatterAnimationUtils.js';
import { defaultScatterOptions } from './scatterTestUtils.js';

interface SceneNode {
  name?: string;
  x?: number;
  y?: number;
  items?: SceneNode[];
  opacity?: number;
  fillOpacity?: number;
  size?: number;
  strokeWidth?: number;
  datum?: { id?: string };
}

const getMarkItems = (chart: View, name: string | RegExp): SceneNode[] => {
  const findMark = (node: SceneNode): SceneNode | undefined => {
    if (typeof name === 'string' ? node.name === name : name.test(node.name ?? '')) return node;
    for (const child of node.items ?? []) {
      const found = findMark(child);
      if (found) return found;
    }
    return undefined;
  };
  const scene: SceneNode & { root?: SceneNode } = chart.scenegraph();
  if (!scene.root) throw new Error('Expected scenegraph root');
  const mark = findMark(scene.root);
  if (!mark?.items) throw new Error(`Expected scenegraph mark ${name}`);
  return mark.items;
};

const data = [
  { id: 'a', series: 'A', x: 1, y: 1, weight: 1 },
  { id: 'b', series: 'A', x: 2, y: 2, weight: 2 },
  { id: 'c', series: 'B', x: 3, y: 3, weight: 3 },
];
const scatter: ScatterOptions = { markType: 'scatter', name: 'scatter', color: 'series', dimension: 'x', metric: 'y' };
const chartOptions: ChartOptions = { data, idKey: 'id', marks: [scatter] };

describe('scatter animations', () => {
  let view: View | undefined;
  let now: number;

  beforeEach(() => {
    now = 10000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
  });

  afterEach(() => {
    view?.finalize();
    view = undefined;
    jest.restoreAllMocks();
  });

  const createView = async (options: Partial<ChartOptions> = {}) => {
    const spec = buildSpec({ ...chartOptions, ...options });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = options.data ?? data;
    view?.finalize();
    view = new View(parse(spec), { renderer: 'none' }).width(600).height(400);
    await view.runAsync();
    if (spec.signals?.some(({ name }) => name === ANIMATION_TIMER)) await view.signal(ANIMATION_TIMER, now).runAsync();
    return view;
  };

  const tick = async (chart: View, ms: number) => {
    now += ms;
    await chart.signal(ANIMATION_TIMER, now).runAsync();
  };
  const sizes = (chart: View) => getMarkItems(chart, 'scatter').map((item) => item.size ?? 0);
  const opacities = (chart: View) =>
    getMarkItems(chart, 'scatter').map((item) => Math.round((item.opacity ?? 1) * 100) / 100);

  describe('draw-in', () => {
    test('grows points from left to right, then settles at full size', async () => {
      const chart = await createView();
      let staggered = false;
      for (let elapsed = 0; elapsed < DRAW_IN_SWEEP_DURATION_MS; elapsed += 50) {
        await tick(chart, 50);
        const [left, middle, right] = sizes(chart);
        expect(left).toBeGreaterThanOrEqual(middle);
        expect(middle).toBeGreaterThanOrEqual(right);
        staggered ||= left > middle && middle > right;
      }
      expect(staggered).toBe(true);
      await tick(chart, DRAW_IN_SWEEP_DURATION_MS);
      expect(new Set(sizes(chart)).size).toBe(1);
    });

    test('keeps the chart bounds fixed while points grow', async () => {
      const chart = await createView({ marks: [{ ...scatter, size: 'weight' }] });
      const bounds = () => JSON.stringify((chart.scenegraph() as unknown as { root: { bounds: object } }).root.bounds);
      const start = bounds();
      await tick(chart, DRAW_IN_SWEEP_DURATION_MS / 2);
      expect(bounds()).toBe(start);
      await tick(chart, DRAW_IN_SWEEP_DURATION_MS);
      expect(bounds()).toBe(start);
    });

    test('keeps the chart bounds fixed with thick borders', async () => {
      const chart = await createView({ marks: [{ ...scatter, size: 'weight', lineWidth: { value: 6 } }] });
      const bounds = () => JSON.stringify((chart.scenegraph() as unknown as { root: { bounds: object } }).root.bounds);
      const start = bounds();
      await tick(chart, DRAW_IN_SWEEP_DURATION_MS * 2);
      expect(bounds()).toBe(start);
    });

    test('fades annotation labels in together once the points finish', async () => {
      const chart = await createView({ marks: [{ ...scatter, scatterAnnotations: [{ textKey: 'id' }] }] });
      const fades = () => getMarkItems(chart, /Annotation/).map((item) => item.fillOpacity ?? 0);
      await tick(chart, DRAW_IN_SWEEP_DURATION_MS * 0.9);
      expect(fades().every((fade) => fade === 0)).toBe(true);
      await tick(chart, DRAW_IN_SWEEP_DURATION_MS * 0.1 + DRAW_IN_PAINT_FADE_MS / 2);
      expect(new Set(fades()).size).toBe(1);
      expect(fades()[0]).toBeGreaterThan(0);
      expect(fades()[0]).toBeLessThan(1);
      await tick(chart, DRAW_IN_PAINT_FADE_MS);
      expect(fades().every((fade) => fade === 1)).toBe(true);
    });

    test('reserves only the edge points', async () => {
      const chart = await createView({ marks: [{ ...scatter, size: 'weight' }] });
      expect(getMarkItems(chart, 'scatter_drawInBounds').length).toBeLessThanOrEqual(4);
    });

    test('places annotation labels the same as without draw-in', async () => {
      const marks = [{ ...scatter, scatterAnnotations: [{ textKey: 'id' }] }];
      const labels = (chart: View) =>
        getMarkItems(chart, /Annotation/).map((item) => JSON.stringify([item.x, item.y, item.opacity]));
      const animated = await createView({ marks });
      await tick(animated, DRAW_IN_SWEEP_DURATION_MS * 2);
      const placed = labels(animated);
      const still = await createView({ marks, animationTypes: ['hover'] });
      expect(placed).toEqual(labels(still));
    });

    test('sweeps across the points, not the whole plot', async () => {
      // every point sits at the far right of a plot that starts at 0
      const rightData = data.map((row, i) => ({ ...row, x: 98 + i }));
      const chart = await createView({ data: rightData, marks: [{ ...scatter, size: undefined }] });
      await tick(chart, DRAW_IN_SWEEP_DURATION_MS * 0.4);
      const [left, , right] = sizes(chart);
      expect(left).toBeGreaterThan(0);
      expect(right).toBe(0);
    });

    test('settles sized points at their own sizes', async () => {
      const chart = await createView({ marks: [{ ...scatter, size: 'weight' }] });
      await tick(chart, DRAW_IN_SWEEP_DURATION_MS * 2);
      const [small, medium, large] = sizes(chart);
      expect(small).toBeLessThan(medium);
      expect(medium).toBeLessThan(large);
    });

    test('starts every point at zero size', async () => {
      const chart = await createView();
      expect(sizes(chart)).toEqual([0, 0, 0]);
    });

    test('draws points at full size when draw-in is off', async () => {
      const chart = await createView({ animationTypes: ['hover'] });
      expect(sizes(chart).every((size) => size > 0)).toBe(true);
    });

    test('fades trendlines in after the points finish', () => {
      const spec = buildSpec({ ...chartOptions, marks: [{ ...scatter, trendlines: [{ method: 'linear' }] }] });
      const leaves = (marks: Mark[]): Mark[] =>
        marks.flatMap((mark) => (mark.type === 'group' ? leaves((mark as GroupMark).marks ?? []) : [mark]));
      const trendlineMarks = leaves(spec.marks ?? []).filter((mark) => /trendline/i.test(mark.name ?? ''));
      expect(trendlineMarks.length).toBeGreaterThan(0);
      trendlineMarks.forEach((mark) => expect(JSON.stringify(mark.encode?.update?.opacity)).toContain('drawInStart'));
    });
  });

  describe('hover', () => {
    const hover = async (chart: View, id: string | null) => {
      const datum = id ? data.find((row) => row.id === id) : null;
      await chart.signal('scatter_hoveredItem', datum).runAsync();
    };
    const createHoverView = async () => {
      const chart = await createView({ animationTypes: ['hover'], marks: [{ ...scatter, chartInspects: [{}] }] });
      await tick(chart, 1000);
      return chart;
    };

    test('fades the other points, then restores them when hover clears', async () => {
      const chart = await createHoverView();
      await hover(chart, 'a');
      await tick(chart, ANIMATION_HOVER_SPEED / 2);
      const [hovered, other] = opacities(chart);
      expect(hovered).toBe(1);
      expect(other).toBeLessThan(1);
      expect(other).toBeGreaterThan(FADE_FACTOR);
      await tick(chart, ANIMATION_HOVER_SPEED);
      expect(opacities(chart)).toEqual([1, FADE_FACTOR, FADE_FACTOR]);
      await hover(chart, null);
      await tick(chart, ANIMATION_HOVER_SPEED * 2);
      expect(opacities(chart)).toEqual([1, 1, 1]);
    });

    test('crossfades only the outgoing and incoming points when moving between points', async () => {
      const chart = await createHoverView();
      await hover(chart, 'a');
      await tick(chart, ANIMATION_HOVER_SPEED * 2);
      await hover(chart, 'b');
      await tick(chart, ANIMATION_HOVER_SPEED / 2);
      const [outgoing, incoming, other] = opacities(chart);
      expect(outgoing).toBeGreaterThan(FADE_FACTOR);
      expect(outgoing).toBeLessThan(1);
      expect(incoming).toBeGreaterThan(FADE_FACTOR);
      expect(incoming).toBeLessThan(1);
      expect(other).toBe(FADE_FACTOR);
      await tick(chart, ANIMATION_HOVER_SPEED);
      expect(opacities(chart)).toEqual([FADE_FACTOR, 1, FADE_FACTOR]);
    });

    test('animates a controlled highlightedItem', async () => {
      const chart = await createView({ animationTypes: ['hover'], highlightedItem: ['c'] });
      // the React layer sets the controlled signal's value
      await chart.signal('controlledHighlightedItem', ['c']).runAsync();
      await tick(chart, ANIMATION_HOVER_SPEED * 2);
      expect(opacities(chart)).toEqual([FADE_FACTOR, FADE_FACTOR, 1]);
    });

    test('animates a controlled highlightedSeries', async () => {
      const chart = await createView({ animationTypes: ['hover'], highlightedSeries: 'B' });
      await tick(chart, ANIMATION_HOVER_SPEED * 2);
      expect(opacities(chart)).toEqual([FADE_FACTOR, FADE_FACTOR, 1]);
    });

    test('switches opacity instantly when animations are off', async () => {
      const chart = await createView({ animations: false, marks: [{ ...scatter, chartInspects: [{}] }] });
      await hover(chart, 'a');
      expect(opacities(chart)).toEqual([1, FADE_FACTOR, FADE_FACTOR]);
    });
  });

  test('legend hover fades the other series', async () => {
    const chart = await createView({ legends: [{ highlight: true }] });
    await tick(chart, 2000);
    await chart.signal('legend0_hoveredSeries', 'A').runAsync();
    // a fade from neutral covers half the range, so it takes half the hover speed
    await tick(chart, ANIMATION_HOVER_SPEED / 8);
    expect(opacities(chart)[2]).toBeGreaterThan(FADE_FACTOR);
    await tick(chart, ANIMATION_HOVER_SPEED);
    expect(opacities(chart)).toEqual([1, 1, FADE_FACTOR]);
  });
});

describe('scatter outline', () => {
  beforeEach(() => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
  });

  const strokeWidths = async (color: string, outline?: ScatterOptions['outline']) => {
    const spec = buildSpec({
      ...chartOptions,
      animations: false,
      marks: [{ ...scatter, color: { value: color }, outline }],
    });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(600).height(400);
    await view.runAsync();
    const widths = getMarkItems(view, 'scatter').map((item) => item.strokeWidth);
    view.finalize();
    return widths;
  };

  test('auto outlines pale points and leaves strong ones alone', async () => {
    expect(await strokeWidths('yellow-400')).toEqual([1, 1, 1]);
    expect(await strokeWidths('indigo-900')).toEqual([0, 0, 0]);
  });

  test('always and never ignore contrast', async () => {
    expect(await strokeWidths('indigo-900', 'always')).toEqual([1, 1, 1]);
    expect(await strokeWidths('yellow-400', 'never')).toEqual([0, 0, 0]);
  });
});

describe('getItemHighlightExpr()', () => {
  test('reads the hovered point, then the controlled highlight', () => {
    expect(getItemHighlightExpr(defaultScatterOptions)).toBe(
      'isValid(scatter0_hoveredItem) ? [scatter0_hoveredItem.rscMarkId] : isArray(controlledHighlightedItem) && length(controlledHighlightedItem) > 0 ? controlledHighlightedItem : null'
    );
  });

  test('reads every point in the hovered group when inspect highlights by series', () => {
    expect(getItemHighlightExpr({ ...defaultScatterOptions, chartInspects: [{ highlightBy: 'series' }] })).toContain(
      "pluck(data('scatter0_highlightedData'), 'rscMarkId')"
    );
  });

  test('falls back to the selected point when there is a popover', () => {
    expect(getItemHighlightExpr({ ...defaultScatterOptions, chartPopovers: [{}] })).toContain(
      'isValid(selectedItem) ? [selectedItem] : null'
    );
  });
});

describe('addScatter() animation flags', () => {
  const build = (options: Partial<ChartOptions>) => buildSpec({ ...chartOptions, ...options });

  test('marks interactive scatters as hover animated', () => {
    const spec = build({ marks: [{ ...scatter, chartInspects: [{}] }] });
    expect(spec.usermeta?.animatedMarks).toEqual(['scatter']);
  });

  test('leaves static scatters without hover animation', () => {
    expect(build({}).usermeta?.animatedMarks).toBeUndefined();
  });

  test('turns every animation off with animations={false}', () => {
    const spec = build({ animations: false, marks: [{ ...scatter, chartInspects: [{}] }] });
    expect(spec.usermeta?.animatedMarks).toBeUndefined();
    expect(spec.signals?.some(({ name }) => name === 'drawInStart')).toBe(false);
  });
});
