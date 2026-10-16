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
import { GroupMark, LabelTransform, Spec, TextMark, View, changeset, expressionFunction, parse } from 'vega';

import {
  ANIMATION_TIMER,
  BACKGROUND_COLOR,
  CHART_SIZE_FONT_SIZE,
  DRAW_IN_START,
} from '@spectrum-charts/core-s2/constants';

import { defaultBarOptions } from '../bar/barTestUtils.js';
import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { BarDirectLabelSpecOptions, BarOptions, BarSpecOptions, Orientation } from '../types/index.js';
import {
  getBarDirectLabelFitsTest,
  getBarDirectLabelSpecOptions,
  getBarDirectLabelText,
  getBarDirectLabelsMarks,
  getInsideLabelGeometry,
  usesCollisionLayout,
} from './barDirectLabelUtils.js';

const specOptions = (overrides: Partial<BarDirectLabelSpecOptions> = {}): BarDirectLabelSpecOptions => ({
  ...getBarDirectLabelSpecOptions({}, 0, defaultBarOptions),
  ...overrides,
});

const getLayer = (overrides: Partial<BarSpecOptions> = {}): GroupMark =>
  getBarDirectLabelsMarks({ ...defaultBarOptions, barDirectLabels: [{}], ...overrides })[0] as GroupMark;

interface SceneNode {
  name?: string;
  items?: SceneNode[];
  x?: number;
  y?: number;
  opacity?: number;
  fontSize?: number;
  text?: string;
  datum?: { datum?: { id?: string } };
}

const getItems = (view: View, name: string): SceneNode[] => {
  const find = (node: SceneNode): SceneNode[] => {
    if (node.name === name) return node.items ?? [];
    return (node.items ?? []).flatMap(find);
  };
  const scene: SceneNode & { root?: SceneNode } = view.scenegraph();
  if (!scene.root) throw new Error('Missing scenegraph root');
  return find(scene.root);
};

const outsideItems = (view: View) =>
  ['positive', 'negative'].flatMap((sign) => getItems(view, `bar0DirectLabel0_${sign}`));

interface BarRow {
  id: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  callout?: boolean;
}

const rows: BarRow[] = [
  { id: 'a', value: 100000000, x: 10, y: 30, width: 10, height: 60, callout: false },
  { id: 'b', value: 100000000, x: 15, y: 30, width: 10, height: 60, callout: true },
];

const runtimeSpec = (values: BarRow[], overrides: Partial<BarSpecOptions> = {}, grouped = true): Spec => {
  const bar = {
    name: 'bar0',
    type: 'rect' as const,
    from: { data: grouped ? 'facet' : 'table' },
    encode: {
      update: {
        x: { field: grouped ? 'localX' : 'x' },
        y: { field: 'y' },
        width: { field: 'width' },
        height: { field: 'height' },
        fill: { value: 'blue' },
        opacity: { value: 1 },
      },
    },
  };
  return {
    width: 200,
    height: 100,
    signals: [
      { name: CHART_SIZE_FONT_SIZE, value: 12 },
      { name: BACKGROUND_COLOR, value: 'white' },
    ],
    data: [
      {
        name: 'table',
        values,
        transform: [{ type: 'formula', expr: '0', as: 'localX' }],
      },
    ],
    marks: [
      grouped
        ? {
            name: 'bar0_group',
            type: 'group',
            from: { facet: { name: 'facet', data: 'table', groupby: 'id' } },
            encode: { update: { x: { signal: "data('table')[datum.id === 'a' ? 0 : 1].x * width / 200" } } },
            marks: [bar],
          }
        : bar,
      ...getBarDirectLabelsMarks({
        ...defaultBarOptions,
        type: grouped ? 'dodged' : 'stacked',
        metric: 'value',
        orientation: 'vertical',
        barDirectLabels: [{ format: ',.0f' }],
        ...overrides,
      }),
    ],
  };
};

describe('bar direct label options and geometry', () => {
  it('inherits context and preserves overflow defaults', () => {
    expect(getBarDirectLabelSpecOptions({}, 2, defaultBarOptions)).toEqual({
      barName: defaultBarOptions.name,
      dataKey: undefined,
      format: '',
      index: 2,
      metric: defaultBarOptions.metric,
      orientation: defaultBarOptions.orientation,
      overflow: 'hide',
      position: 'end-outside',
    });
    expect(getBarDirectLabelSpecOptions({ position: 'start' }, 0, defaultBarOptions).overflow).toBe('spill');
    expect(getBarDirectLabelSpecOptions({ position: 'start', overflow: 'hide' }, 0, defaultBarOptions).overflow).toBe(
      'hide'
    );
  });

  it.each([
    ['', 'format(datum.datum["value"], ",.2~f")'],
    ['percentage', 'format(datum.datum["value"], "~%")'],
    ['currency', 'format(datum.datum["value"], "$,.2f")'],
    ['shortNumber', 'formatShortNumber(datum.datum["value"])'],
    ['.1f', 'format(datum.datum["value"], ".1f")'],
  ])('formats %s from the bar data', (format, expected) => {
    expect(getBarDirectLabelText('datum', specOptions({ metric: 'value', format }))).toBe(expected);
  });

  it('escapes format specifiers', () => {
    const format = '.1f\\"';
    expect(getBarDirectLabelText('datum', specOptions({ metric: 'value', format }))).toBe(
      `format(datum.datum["value"], ${JSON.stringify(format)})`
    );
  });

  it('tests both bar dimensions for fit', () => {
    expect(getBarDirectLabelFitsTest('datum', specOptions({ orientation: 'vertical' }))).toContain(
      `datum.height >= ${CHART_SIZE_FONT_SIZE} + 16 && datum.width >= getLabelWidth`
    );
    expect(getBarDirectLabelFitsTest('datum', specOptions({ orientation: 'horizontal' }))).toContain(
      `datum.height >= ${CHART_SIZE_FONT_SIZE} + 4`
    );
  });

  it.each<Orientation>(['vertical', 'horizontal'])('centers %s middle labels in the actual segment', (orientation) => {
    expect(getInsideLabelGeometry('datum', specOptions({ orientation, position: 'middle' }))).toEqual({
      x: '(datum.x + datum.width / 2)',
      y: '(datum.y + datum.height / 2)',
      align: "'center'",
      baseline: "'middle'",
    });
  });

  it('only requests outside layout for outside or spill labels', () => {
    expect(usesCollisionLayout(specOptions())).toBe(true);
    expect(usesCollisionLayout(specOptions({ position: 'end', overflow: 'spill' }))).toBe(true);
    expect(usesCollisionLayout(specOptions({ position: 'end', overflow: 'hide' }))).toBe(false);
  });
});

describe('shared native label layout', () => {
  it('returns no layer without labels', () => {
    expect(getBarDirectLabelsMarks(defaultBarOptions)).toEqual([]);
  });

  it('uses native bar-bound anchors and separates candidates by sign', () => {
    const layer = getLayer();
    expect(layer.data?.map((data) => data.name)).toEqual([
      'bar0_directLabelBars',
      'bar0DirectLabel0_positive_candidates',
      'bar0DirectLabel0_negative_candidates',
    ]);
    const positive = layer.marks?.[0] as TextMark;
    expect(positive.from).toEqual({ data: 'bar0DirectLabel0_positive_candidates' });
    expect(positive.transform?.[0]).toMatchObject({
      type: 'label',
      size: { signal: '[width, height]' },
      anchor: ['top'],
      offset: [6],
      padding: null,
      avoidMarks: ['bar0_directLabelBars'],
    });
    expect((layer.marks?.[3] as TextMark).transform?.[0]).toHaveProperty('anchor', ['bottom']);
  });

  it('uses left and right anchors for horizontal bars', () => {
    const layer = getLayer({ orientation: 'horizontal' });
    expect((layer.marks?.[0] as TextMark).transform?.[0]).toHaveProperty('anchor', ['right']);
    expect((layer.marks?.[3] as TextMark).transform?.[0]).toHaveProperty('anchor', ['left']);
  });

  it('places later label sets around earlier labels', () => {
    const layer = getLayer({ barDirectLabels: [{ position: 'middle' }, {}] });
    const placement = layer.marks?.find((mark) => mark.name === 'bar0DirectLabel1_positive_placement') as TextMark;
    expect((placement.transform?.[0] as LabelTransform).avoidMarks).toContain('bar0DirectLabel0_inside');
  });

  it('shares collision rejection and animation opacity between the halo and foreground', () => {
    const layer = getLayer({ isDrawInAnimate: true });
    const [, halo, foreground] = layer.marks as TextMark[];
    expect(halo.encode?.update).toHaveProperty('opacity', { signal: 'datum.opacity * datum.datum.labelOpacity' });
    expect(foreground.encode?.update?.opacity).toEqual(halo.encode?.update?.opacity);
    expect(JSON.stringify(layer.data?.[0])).toContain('drawInDuration');
  });

  it('uses stacked segment data for draw-in timing', () => {
    const layer = getLayer({ type: 'stacked', isDrawInAnimate: true });
    expect(JSON.stringify(layer.data?.[0])).toContain('datum.datum.bar0_drawInStackMax');
  });
});

describe('Vega label layout regressions', () => {
  let view: View;

  beforeEach(() => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
  });

  afterEach(() => view?.finalize());

  const run = async (spec: Spec) => {
    view = new View(parse(spec), { renderer: 'none' })
      .width(typeof spec.width === 'number' ? spec.width : 400)
      .height(typeof spec.height === 'number' ? spec.height : 300);
    await view.runAsync();
    return view;
  };

  it('rejects overlapping labels across dodged categories and restores them after resize', async () => {
    await run(runtimeSpec(rows));
    expect(outsideItems(view).filter((item) => item.opacity === 1)).toHaveLength(1);
    await view.width(2000).runAsync();
    expect(outsideItems(view).filter((item) => item.opacity === 1)).toHaveLength(2);
    await view.width(200).runAsync();
    expect(outsideItems(view).filter((item) => item.opacity === 1)).toHaveLength(1);
  });

  it('removes unselected rows before layout and updates selection reactively', async () => {
    await run(runtimeSpec(rows, { barDirectLabels: [{ dataKey: 'callout', format: ',.0f' }] }));
    expect(outsideItems(view)).toHaveLength(1);
    expect(outsideItems(view)[0].opacity).toBe(1);
    await view
      .change(
        'table',
        changeset().modify(() => true, 'callout', false)
      )
      .runAsync();
    expect(outsideItems(view)).toHaveLength(0);
  });

  it('keeps the top-edge label using an in-bounds bar anchor', async () => {
    await run(runtimeSpec([{ ...rows[0], y: 0 }]));
    const [label] = outsideItems(view);
    expect(label.opacity).toBe(1);
    expect(label.y).toBe(-6);
  });

  it('keeps inside-fit spill candidates out of outside layout', async () => {
    await run(
      runtimeSpec(
        [
          { ...rows[0], width: 150 },
          { ...rows[1], width: 5 },
        ],
        { barDirectLabels: [{ position: 'end', overflow: 'spill', format: ',.0f' }] }
      )
    );
    expect(outsideItems(view)).toHaveLength(1);
    expect(outsideItems(view)[0].opacity).toBe(1);
    expect(getItems(view, 'bar0DirectLabel0_inside').filter((item) => item.fontSize === 12)).toHaveLength(1);
  });

  it('updates inside fit and outside candidates when bar geometry changes', async () => {
    await run(
      runtimeSpec([{ ...rows[0], width: 150 }], {
        barDirectLabels: [{ position: 'end', overflow: 'spill' }],
      })
    );
    expect(outsideItems(view)).toHaveLength(0);
    await view
      .change(
        'table',
        changeset().modify(() => true, 'width', 5)
      )
      .runAsync();
    expect(outsideItems(view)).toHaveLength(1);
    expect(getItems(view, 'bar0DirectLabel0_inside')[0].fontSize).toBe(0);
  });

  it.each<Orientation>(['vertical', 'horizontal'])('places signed %s bars on opposite tips', async (orientation) => {
    await run(
      runtimeSpec(
        [
          { ...rows[0], x: 40, y: 30, width: 20, height: 20 },
          { ...rows[1], value: -100, x: 120, y: 60, width: 20, height: 20 },
        ],
        { orientation },
        false
      )
    );
    const positive = getItems(view, 'bar0DirectLabel0_positive')[0];
    const negative = getItems(view, 'bar0DirectLabel0_negative')[0];
    expect(positive.opacity).toBe(1);
    expect(negative.opacity).toBe(1);
    if (orientation === 'vertical') {
      expect(positive.y).toBe(24);
      expect(negative.y).toBe(86);
    } else {
      expect(positive.x).toBe(68);
      expect(negative.x).toBe(112);
    }
  });

  const runChart = async (bar: Partial<BarOptions> = {}, animations = false) => {
    const data = [
      { category: 'A', series: 'S', group: 'G', panel: 'P', value: 10 },
      { category: 'B', series: 'S', group: 'G', panel: 'P', value: 20 },
    ];
    const spec = buildSpec({
      chartWidth: 400,
      chartHeight: 300,
      animations,
      animationTypes: animations ? ['drawIn'] : [],
      data,
      marks: [
        {
          markType: 'bar',
          type: 'dodged',
          color: 'series',
          name: 'bar0',
          dimension: 'category',
          metric: 'value',
          barDirectLabels: [{}],
          ...bar,
        },
      ],
    });
    const table = spec.data?.find(({ name }) => name === 'table');
    if (!table || !('values' in table)) throw new Error('Missing inline table');
    table.values = data;
    await run(spec);
  };

  it.each<Partial<BarOptions>>([
    { type: 'dodged' },
    { type: 'stacked' },
    { type: 'dodged', color: ['series', 'group'] },
    { type: 'dodged', trellis: 'panel' },
  ])('renders labels through the full chart builder: %o', async (bar) => {
    await runChart(bar);
    expect(outsideItems(view)).toHaveLength(2);
    expect(outsideItems(view).every((item) => Number.isFinite(item.x) && Number.isFinite(item.y))).toBe(true);
  });

  it('fades labels in after draw-in and keeps their halo opacity synchronized', async () => {
    await runChart({}, true);
    await view.signal(ANIMATION_TIMER, Date.now()).runAsync();
    expect(outsideItems(view).every((item) => item.opacity === 0)).toBe(true);
    await view.signal(ANIMATION_TIMER, view.signal(DRAW_IN_START) + 2000).runAsync();
    expect(outsideItems(view).filter((item) => item.opacity === 1)).toHaveLength(2);
    expect(getItems(view, 'bar0DirectLabel0_positive_bg').map((item) => item.opacity)).toEqual(
      getItems(view, 'bar0DirectLabel0_positive').map((item) => item.opacity)
    );
  });
});
