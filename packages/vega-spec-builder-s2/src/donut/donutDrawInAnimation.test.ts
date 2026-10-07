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
import { View, expressionFunction, parse } from 'vega';

import {
  ANIMATION_TIMER,
  DONUT_DRAW_IN_LABEL_FADE_DURATION_MS,
  DRAW_IN_ANIMATION_DURATION_MS,
  DRAW_IN_ANIM_T,
  DRAW_IN_ANIM_T_EASED,
  DRAW_IN_START,
  FADE_FACTOR,
  FILTERED_TABLE,
  SELECTED_ITEM,
  TABLE,
} from '@spectrum-charts/constants';

import { buildSpec } from '../chartSpecBuilder';
import { getExpressionFunctions } from '../expressionFunctions';
import { addDrawInClockSignals } from '../marks/drawInAnimationUtils';
import { ChartOptions, DonutOptions } from '../types';
import { addSignals } from './donutSpecBuilder';
import { getDonutSummaryMarks } from './donutSummaryUtils';
import { defaultDonutOptions } from './donutTestUtils';
import {
  getArcMark,
  getDonutDrawInLabelVisibilityRules,
  getDonutLabelFadeProgressExpr,
  getDonutLabelOpacity,
  getDonutOpacity,
  getSliceStrokeWidthExpr,
} from './donutUtils';
import { getRichSegmentLabelMarks, getSegmentLabelMarks } from './segmentLabelUtils';

interface SceneNode {
  name?: string;
  items?: SceneNode[];
  startAngle?: number;
  endAngle?: number;
  opacity?: number;
  fontSize?: number;
  size?: number;
  strokeWidth?: number;
  datum?: { id?: string };
}

const getMarkItems = (chart: View, name: string): SceneNode[] => {
  const findMark = (node: SceneNode): SceneNode | undefined => {
    if (node.name === name) return node;
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
  { id: 'a', series: 'A', value: 2 },
  { id: 'b', series: 'B', value: 1 },
  { id: 'c', series: 'C', value: 1 },
];
const donut: DonutOptions = { markType: 'donut', name: 'donut', color: 'series' };
const chartOptions: ChartOptions = {
  data,
  idKey: 'id',
  animationTypes: ['drawIn'],
  marks: [donut],
};

describe('donut draw-in animations', () => {
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
    view = new View(parse(spec), { renderer: 'none' }).width(600).height(600);
    await view.runAsync();
    return view;
  };

  const advance = async (chart: View, elapsed: number) => {
    now = chart.signal(DRAW_IN_START) + elapsed;
    await chart.signal(ANIMATION_TIMER, now).runAsync();
  };

  test.each([
    { animations: false, animationTypes: ['drawIn'] },
    { animationTypes: undefined },
    { animationTypes: [] },
    { animationTypes: ['hover'] },
  ] satisfies Partial<ChartOptions>[])('keeps static encodings unless draw-in is enabled: %o', (options) => {
    const spec = buildSpec({ ...chartOptions, ...options });
    expect(spec.signals?.some(({ name }) => name === DRAW_IN_START)).toBe(false);
    const arc = spec.marks?.find(({ name }) => name === 'donut');
    expect(arc?.encode?.update).toHaveProperty('startAngle', { field: 'donut_startAngle' });
    expect(arc?.encode?.update).toHaveProperty('endAngle', { field: 'donut_endAngle' });
  });

  test('shares the clock with Line draw-in and hover without duplicate timer signals', () => {
    const signals = [];
    addDrawInClockSignals(signals);
    const result = addSignals(signals, {
      ...defaultDonutOptions,
      isHoverAnimate: true,
      isDrawInAnimate: true,
    });
    [ANIMATION_TIMER, DRAW_IN_START, DRAW_IN_ANIM_T, DRAW_IN_ANIM_T_EASED].forEach((signal) =>
      expect(result.filter(({ name }) => name === signal)).toHaveLength(1)
    );
    expect(result.find(({ name }) => name === 'testName_drawInAnimCutoff')).toHaveProperty(
      'update',
      `0 + (2 * PI) * pow(${DRAW_IN_ANIM_T}, 2)`
    );
  });

  test.each([
    { variant: 'circle' as const, start: 0, sweep: 2 * Math.PI, holeRatio: 0.85 },
    { variant: 'circle' as const, start: 0, sweep: 2 * Math.PI, holeRatio: 0 },
    { variant: 'semicircle' as const, start: -Math.PI / 2, sweep: Math.PI, holeRatio: 0.85 },
    { variant: 'circle' as const, start: 0, sweep: 2 * Math.PI, holeRatio: 0.85, isBoolean: true },
  ])('sweeps continuously from the correct start and finishes at the original geometry: %o', async (options) => {
    const { start, sweep, ...markOptions } = options;
    const values = markOptions.isBoolean ? data.slice(0, 2).map((row) => ({ ...row, value: row.value / 3 })) : data;
    const chart = await createView({ data: values, marks: [{ ...donut, ...markOptions }] });
    expect(chart.signal('donut_drawInAnimCutoff')).toBe(start);
    getMarkItems(chart, 'donut').forEach((item) => {
      expect(item.startAngle).toBe(start);
      expect(item.endAngle).toBe(start);
      expect(item.opacity).toBe(0);
    });

    await advance(chart, DRAW_IN_ANIMATION_DURATION_MS / 4);
    const partialAngle = start + sweep / 16;
    const items = getMarkItems(chart, 'donut');
    expect(chart.signal('donut_drawInAnimCutoff')).toBeCloseTo(partialAngle);
    expect(items[0].startAngle).toBe(start);
    expect(items[0].endAngle).toBeCloseTo(partialAngle);
    expect(items[0].opacity).toBe(1);
    items.slice(1).forEach((item) => {
      expect(item.startAngle).toBeCloseTo(partialAngle);
      expect(item.endAngle).toBeCloseTo(partialAngle);
      expect(item.opacity).toBe(0);
    });

    await advance(chart, DRAW_IN_ANIMATION_DURATION_MS);
    const rows = chart.data(FILTERED_TABLE);
    getMarkItems(chart, 'donut').forEach((item, index) => {
      expect(item.startAngle).toBe(rows[index].donut_startAngle);
      expect(item.endAngle).toBe(rows[index].donut_endAngle);
      expect(item.opacity).toBe(1);
    });
  });

  test('clamps separators to the drawn span rather than the final segment size', async () => {
    const options = { ...defaultDonutOptions, name: 'donut', isDrawInAnimate: true };
    expect(getSliceStrokeWidthExpr(options, '2')).toContain('donut_drawInAnimCutoff');
    const chart = await createView();
    await advance(chart, 1);
    expect(getMarkItems(chart, 'donut')[0].strokeWidth).toBe(0);
    expect(getArcMark(defaultDonutOptions).encode?.update?.endAngle).toEqual({
      field: 'testName_endAngle',
    });
  });

  test('keeps center summary marks unchanged', () => {
    const options = { ...defaultDonutOptions, donutSummaries: [{ label: 'Visitors' }] };
    expect(getDonutSummaryMarks({ ...options, isDrawInAnimate: true })).toEqual(getDonutSummaryMarks(options));
  });

  test('draws a single segment from zero to a complete circle', async () => {
    const chart = await createView({ data: [data[0]] });
    await advance(chart, 500);
    expect(getMarkItems(chart, 'donut')[0].endAngle).toBeCloseTo(Math.PI / 2);
    await advance(chart, 1000);
    expect(getMarkItems(chart, 'donut')[0].endAngle).toBe(2 * Math.PI);
    expect(getMarkItems(chart, 'donut')[0].opacity).toBe(1);
  });
  const getCompletionMs = (progress: number) =>
    DRAW_IN_ANIMATION_DURATION_MS * Math.sqrt(progress);

  test('hides all label rows and swatches until their fade begins', () => {
    const options = { ...defaultDonutOptions, isDrawInAnimate: true };
    const rules = getDonutDrawInLabelVisibilityRules(options);
    expect(rules).toEqual([{ test: `${getDonutLabelFadeProgressExpr(options)} <= 0`, value: 0 }]);
    const labels = [
      ...getSegmentLabelMarks({ ...options, segmentLabels: [{ value: true }] }),
      ...getRichSegmentLabelMarks({
        ...options,
        segmentLabels: [{ value: true, percent: true, swatch: true, showValueRow: true, showTotal: true }],
      }),
    ].flatMap(({ marks }) => marks ?? []);
    expect(labels.length).toBeGreaterThan(5);
    labels.forEach((mark) => {
      const key = mark.type === 'symbol' ? 'size' : 'fontSize';
      expect(mark.encode?.update).toHaveProperty(key, expect.arrayContaining(rules));
    });
    expect(getDonutDrawInLabelVisibilityRules(defaultDonutOptions)).toEqual([]);
  });

  test.each([
    { value: true },
    { percent: true, value: false, swatch: true, showValueRow: true, showTotal: true },
  ])('fades all label rows and swatches linearly over 50ms after their slice finishes: %o', async (label) => {
    const options = { ...defaultDonutOptions, name: 'donut', segmentLabels: [label] };
    const labels = [...getSegmentLabelMarks(options), ...getRichSegmentLabelMarks(options)].flatMap(
      ({ marks }) => marks ?? []
    );
    expect(labels.length).toBeGreaterThan(1);
    const chart = await createView({ marks: [{ ...donut, segmentLabels: [label] }] });
    const expectLabels = (index: number, opacity: number) => {
      labels.forEach(({ name, type }) => {
        if (!name) throw new Error('Expected a named label mark');
        const item = getMarkItems(chart, name)[index];
        expect(item.opacity).toBeCloseTo(opacity);
        const size = type === 'symbol' ? item.size : item.fontSize;
        if (opacity > 0) expect(size).toBeGreaterThan(0);
        else expect(size).toBe(0);
      });
    };
    const fade = DONUT_DRAW_IN_LABEL_FADE_DURATION_MS;
    // slices are 50%, 25%, 25% of the sweep
    const finishes = [getCompletionMs(0.5), getCompletionMs(0.75), DRAW_IN_ANIMATION_DURATION_MS];
    for (const [index, finish] of finishes.entries()) {
      await advance(chart, finish - 1);
      expectLabels(index, 0);
      for (const fraction of [0.25, 0.5, 0.75, 1]) {
        await advance(chart, finish + fade * fraction);
        expectLabels(index, fraction);
        finishes.slice(0, index).forEach((_, previous) => expectLabels(previous, 1));
      }
    }
    await advance(chart, DRAW_IN_ANIMATION_DURATION_MS + 500);
    [0, 1, 2].forEach((index) => expectLabels(index, 1));
  });

  test.each([0.1, 0.25, 0.75, 0.9, 1])('starts the fade when a segment occupying %p of the sweep finishes', async (fraction) => {
    const chart = await createView({
      data: [
        { id: 'a', series: 'A', value: fraction },
        { id: 'b', series: 'B', value: 1 - fraction },
      ],
      marks: [{ ...donut, sortOrder: 'data', segmentLabels: [{ value: true }] }],
    });
    const getLabel = () => {
      const item = getMarkItems(chart, 'donut_segmentLabel').find(({ datum }) => datum?.id === 'a');
      if (!item) throw new Error('Expected the first segment label');
      return item;
    };
    const finish = getCompletionMs(fraction);
    await advance(chart, finish - 1);
    expect(getLabel().fontSize).toBe(0);
    expect(getLabel().opacity).toBe(0);
    const arc = getMarkItems(chart, 'donut').find(({ datum }) => datum?.id === 'a');
    if (arc?.startAngle === undefined || arc.endAngle === undefined) throw new Error('Expected the first segment arc');
    await advance(chart, finish);
    expect(arc.endAngle - arc.startAngle).toBeLessThan(2 * Math.PI * fraction + 1e-9);
    await advance(chart, finish + DONUT_DRAW_IN_LABEL_FADE_DURATION_MS / 2);
    expect(getLabel().fontSize).toBeGreaterThan(0);
    expect(getLabel().opacity).toBeCloseTo(0.5);
    await advance(chart, finish + DONUT_DRAW_IN_LABEL_FADE_DURATION_MS);
    expect(getLabel().opacity).toBeCloseTo(1);
  });

  test.each([
    { values: [98, 1, 1], label: { value: true }, name: 'donut_segmentLabel' },
    {
      values: Array.from({ length: 24 }, () => 1),
      label: { percent: true, value: false, swatch: true, showValueRow: true },
      name: 'donut_richSegmentLabelName',
    },
  ])('keeps the same trailing fade for hovered tiny slices: %o', async ({ values, label, name }) => {
    const rows = values.map((value, index) => ({ id: String(index), series: String(index), value }));
    const chart = await createView({
      data: rows,
      marks: [{ ...donut, segmentLabels: [label], chartInspects: [{}] }],
    });
    await advance(chart, DRAW_IN_ANIMATION_DURATION_MS - 1);
    const lastRow = chart.data(FILTERED_TABLE).at(-1);
    await chart.signal('donut_hoveredItem', lastRow).runAsync();
    const getLastLabel = () => {
      const item = getMarkItems(chart, name).find(({ datum }) => datum?.id === lastRow.id);
      if (!item) throw new Error('Expected the hovered tiny slice label');
      return item;
    };
    expect(getLastLabel().fontSize).toBe(0);
    await advance(chart, DRAW_IN_ANIMATION_DURATION_MS + DONUT_DRAW_IN_LABEL_FADE_DURATION_MS / 2);
    expect(getLastLabel().fontSize).toBeGreaterThan(0);
    expect(getLastLabel().opacity).toBeCloseTo(0.5);
    await advance(chart, DRAW_IN_ANIMATION_DURATION_MS + DONUT_DRAW_IN_LABEL_FADE_DURATION_MS);
    expect(getLastLabel().opacity).toBeCloseTo(1);
  });

  test.each<Pick<ChartOptions, 'animationTypes'>>([
    { animationTypes: ['hover', 'drawIn'] },
    { animationTypes: ['drawIn'] },
  ])(
    'multiplies the label fade by hover dimming with animation types %p',
    async ({ animationTypes }) => {
      const chart = await createView({
        animationTypes,
        marks: [{ ...donut, chartInspects: [{}], segmentLabels: [{ value: true }] }],
      });
      await advance(chart, 100);
      await chart.signal('donut_hoveredItem', chart.data(FILTERED_TABLE)[1]).runAsync();
      await advance(chart, getCompletionMs(0.5) + DONUT_DRAW_IN_LABEL_FADE_DURATION_MS / 2);
      expect(getMarkItems(chart, 'donut_segmentLabel')[0].opacity).toBeCloseTo(FADE_FACTOR * 0.5);
      expect(getMarkItems(chart, 'donut')[0].opacity).toBeCloseTo(FADE_FACTOR);
      await advance(chart, getCompletionMs(0.5) + DONUT_DRAW_IN_LABEL_FADE_DURATION_MS);
      expect(getMarkItems(chart, 'donut_segmentLabel')[0].opacity).toBeCloseTo(FADE_FACTOR);
      await chart.signal('donut_hoveredItem', null).runAsync();
      await advance(chart, 1500);
      getMarkItems(chart, 'donut_segmentLabel').forEach(({ opacity }) => expect(opacity).toBe(1));
    }
  );

  test('keeps the existing label opacity when draw-in is disabled', async () => {
    expect(getDonutLabelOpacity(defaultDonutOptions)).toEqual(getDonutOpacity(defaultDonutOptions));
    const chart = await createView({
      animations: false,
      marks: [{ ...donut, segmentLabels: [{ value: true }] }],
    });
    getMarkItems(chart, 'donut_segmentLabel').forEach(({ fontSize, opacity }) => {
      expect(fontSize).toBeGreaterThan(0);
      expect(opacity).toBe(1);
    });
  });

  test('preserves popover selection opacity during the label fade', async () => {
    const chart = await createView({
      marks: [{ ...donut, chartPopovers: [{}], segmentLabels: [{ value: true }] }],
    });
    await chart.signal(SELECTED_ITEM, 'b').runAsync();
    await advance(chart, getCompletionMs(0.5) + DONUT_DRAW_IN_LABEL_FADE_DURATION_MS / 2);
    expect(getMarkItems(chart, 'donut_segmentLabel')[0].opacity).toBeCloseTo(FADE_FACTOR * 0.5);
    await advance(chart, 1500);
    expect(getMarkItems(chart, 'donut_segmentLabel')[0].opacity).toBeCloseTo(FADE_FACTOR);
    await chart.signal(SELECTED_ITEM, null).runAsync();
    getMarkItems(chart, 'donut_segmentLabel').forEach(({ opacity }) => expect(opacity).toBe(1));
  });

  test.each([
    { label: { value: true }, name: 'donut_segmentLabel' },
    { label: { percent: true, swatch: true, showValueRow: true }, name: 'donut_richSegmentLabelName' },
  ])('keeps empty-state labels hidden with finite opacity: %o', async ({ label, name }) => {
    for (const rows of [[], [{ ...data[0], value: 0 }]]) {
      const chart = await createView({ data: rows, marks: [{ ...donut, segmentLabels: [label] }] });
      await advance(chart, DRAW_IN_ANIMATION_DURATION_MS + DONUT_DRAW_IN_LABEL_FADE_DURATION_MS);
      getMarkItems(chart, name).forEach(({ fontSize, opacity }) => {
        expect(fontSize).toBe(0);
        expect(Number.isFinite(opacity)).toBe(true);
      });
    }
  });

  test('preserves hover opacity while sweeping and restores normal interaction after drawing', async () => {
    const chart = await createView({
      animationTypes: ['hover', 'drawIn'],
      marks: [{ ...donut, chartInspects: [{}], segmentLabels: [{ value: true }] }],
    });
    await advance(chart, 500);
    await chart.signal('donut_hoveredItem', chart.data(FILTERED_TABLE)[0]).runAsync();
    await advance(chart, 900);
    const items = getMarkItems(chart, 'donut');
    expect(items[0].opacity).toBe(1);
    expect(items[1].opacity).toBe(FADE_FACTOR);
    expect(items[2].opacity).toBe(FADE_FACTOR);
    await advance(chart, 1000);
    await chart.signal('donut_hoveredItem', null).runAsync();
    await advance(chart, 1500);
    getMarkItems(chart, 'donut').forEach(({ opacity }) => expect(opacity).toBe(1));
  });

  test('keeps hovered zero-span labels hidden when the sweep completes', async () => {
    const chart = await createView({
      data: [...data, { id: 'zero', series: 'Zero', value: 0 }],
      marks: [{ ...donut, chartInspects: [{}], segmentLabels: [{ value: true }] }],
    });
    await advance(chart, DRAW_IN_ANIMATION_DURATION_MS);
    const row = chart.data(FILTERED_TABLE).find(({ id }) => id === 'zero');
    if (!row) throw new Error('Expected a zero-valued segment');
    await chart.signal('donut_hoveredItem', row).runAsync();
    const label = getMarkItems(chart, 'donut_segmentLabel').find(({ datum }) => datum?.id === 'zero');
    if (!label) throw new Error('Expected the hovered zero-span label');
    expect(label.fontSize).toBe(0);
    expect(label.opacity).toBe(0);
  });

  test('does not replay on resize or legend filtering, but a new view restarts from zero', async () => {
    const chart = await createView({ legends: [{ highlight: true, isToggleable: true }] });
    await advance(chart, 1000);
    const start = chart.signal(DRAW_IN_START);
    await chart.width(450).height(450).resize().runAsync();
    await chart.signal('hiddenSeries', ['B']).runAsync();
    expect(chart.signal(DRAW_IN_START)).toBe(start);
    expect(chart.signal(DRAW_IN_ANIM_T)).toBe(1);
    expect(getMarkItems(chart, 'donut')).toHaveLength(2);
    getMarkItems(chart, 'donut').forEach(({ opacity }) => expect(opacity).toBe(1));
    const restarted = await createView();
    expect(restarted.signal(DRAW_IN_ANIM_T)).toBe(0);
    getMarkItems(restarted, 'donut').forEach(({ opacity }) => expect(opacity).toBe(0));
  });

  test.each([{ data: [] }, { data: [{ id: 'a', series: 'A', value: 0 }] }])(
    'keeps the empty-state ring visible and hides data arcs throughout: %o',
    async (options) => {
      const chart = await createView(options);
      for (const elapsed of [0, 500, 1000]) {
        await advance(chart, elapsed);
        expect(getMarkItems(chart, 'donut_emptyState')[0].opacity).toBe(1);
        getMarkItems(chart, 'donut').forEach(({ opacity }) => expect(opacity).toBe(0));
      }
    }
  );
});
