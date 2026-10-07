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

import { TABLE } from '@spectrum-charts/constants';

import { buildSpec } from '../chartSpecBuilder';
import { getExpressionFunctions } from '../expressionFunctions';
import { getMaxLabelWidthExpr } from '../legend/legendUtils';
import { initializeSpec } from '../specUtils';
import { DonutOptions, ScSpec } from '../types';
import {
  DONUT_LEGEND_MARGIN_SIGNAL,
  DONUT_LEGEND_OFFSET,
  DONUT_LEGEND_SPACER_END,
  DONUT_LEGEND_SPACER_START,
  DONUT_LEGEND_WIDTH_SIGNAL,
  addDonutLegendLayout,
  getDonutLegendSignals,
  getDonutLegendSpacerMarks,
  getDonutLegendWidthExpr,
  getDonutSideLegend,
} from './donutLegendLayoutUtils';

const donut: DonutOptions = { markType: 'donut', color: 'series', metric: 'value' };
const getSpacerX = (marks: ReturnType<typeof getDonutLegendSpacerMarks>, name: string) =>
  marks.find((mark) => mark.name === name)?.encode?.update?.x;

describe('getDonutSideLegend()', () => {
  test('returns the first left or right legend with its spec name', () => {
    expect(getDonutSideLegend([{ position: 'bottom' }, { position: 'right', title: 'Browser' }])).toEqual({
      position: 'right',
      title: 'Browser',
      name: 'legend1',
    });
    expect(getDonutSideLegend([{ position: 'left' }])).toEqual({ position: 'left', name: 'legend0' });
  });

  test('returns undefined when no legend is beside the chart', () => {
    expect(getDonutSideLegend([])).toBeUndefined();
    expect(getDonutSideLegend([{ position: 'top' }, { position: 'bottom' }])).toBeUndefined();
  });
});

describe('getDonutLegendWidthExpr()', () => {
  test('uses the widest label when there is no title', () => {
    const expr = getDonutLegendWidthExpr({ name: 'legend0', position: 'right' });
    expect(expr).toContain(getMaxLabelWidthExpr('legend0'));
    expect(expr).toMatch(/, 0\)$/);
  });

  test('includes the title width capped at the title limit', () => {
    expect(getDonutLegendWidthExpr({ name: 'legend0', position: 'right', title: 'Browser' })).toContain(
      `min(getLabelWidth("Browser", 'bold', 14), 180)`
    );
    expect(
      getDonutLegendWidthExpr({ name: 'legend0', position: 'right', title: 'Browser', titleLimit: 50 })
    ).toContain(`min(getLabelWidth("Browser", 'bold', 14), 50)`);
  });

  test('passes the label limit through to the label measurement', () => {
    expect(getDonutLegendWidthExpr({ name: 'legend0', position: 'right', labelLimit: 60 })).toContain(
      getMaxLabelWidthExpr('legend0', 60)
    );
  });
});

describe('getDonutLegendSignals()', () => {
  test('sizes a full donut to the chart height', () => {
    const [width, margin] = getDonutLegendSignals({ name: 'legend0', position: 'right' }, undefined);
    expect(width.name).toBe(DONUT_LEGEND_WIDTH_SIGNAL);
    expect(margin).toEqual({
      name: DONUT_LEGEND_MARGIN_SIGNAL,
      update: `max(0, (rscViewWidth(width) - ${DONUT_LEGEND_OFFSET} - ${DONUT_LEGEND_WIDTH_SIGNAL} - height) / 2)`,
    });
  });

  test('sizes a semicircle to twice the chart height', () => {
    const [, margin] = getDonutLegendSignals({ name: 'legend0', position: 'right' }, 'semicircle');
    expect(margin).toHaveProperty('update', expect.stringContaining('- 2 * height) / 2)'));
  });
});

describe('getDonutLegendSpacerMarks()', () => {
  test('pads past a right legend and before the donut', () => {
    const marks = getDonutLegendSpacerMarks('right');
    expect(marks).toHaveLength(2);
    marks.forEach((mark) => {
      expect(mark).toHaveProperty('interactive', false);
      expect(mark).toHaveProperty('aria', false);
    });
    expect(getSpacerX(marks, DONUT_LEGEND_SPACER_START)).toEqual({ signal: `-${DONUT_LEGEND_MARGIN_SIGNAL}` });
    expect(getSpacerX(marks, DONUT_LEGEND_SPACER_END)).toEqual({
      signal: `${DONUT_LEGEND_MARGIN_SIGNAL} > 0 ? width + 24 + ${DONUT_LEGEND_WIDTH_SIGNAL} + ${DONUT_LEGEND_MARGIN_SIGNAL} : width`,
    });
  });

  test('mirrors the padding for a left legend', () => {
    const marks = getDonutLegendSpacerMarks('left');
    expect(getSpacerX(marks, DONUT_LEGEND_SPACER_START)).toEqual({
      signal: `${DONUT_LEGEND_MARGIN_SIGNAL} > 0 ? -(24 + ${DONUT_LEGEND_WIDTH_SIGNAL} + ${DONUT_LEGEND_MARGIN_SIGNAL}) : 0`,
    });
    expect(getSpacerX(marks, DONUT_LEGEND_SPACER_END)).toEqual({ signal: `width + ${DONUT_LEGEND_MARGIN_SIGNAL}` });
  });
});

describe('addDonutLegendLayout()', () => {
  const getNames = (spec: ScSpec) => ({
    signals: spec.signals?.map(({ name }) => name) ?? [],
    marks: spec.marks?.map(({ name }) => name) ?? [],
  });

  test('adds the layout signals and spacers for a donut with a side legend', () => {
    const spec = addDonutLegendLayout(initializeSpec(), { donut, legends: [{ position: 'right' }] });
    expect(getNames(spec).signals).toEqual([DONUT_LEGEND_WIDTH_SIGNAL, DONUT_LEGEND_MARGIN_SIGNAL]);
    expect(getNames(spec).marks).toEqual([DONUT_LEGEND_SPACER_START, DONUT_LEGEND_SPACER_END]);
  });

  test('does nothing without a donut or a side legend', () => {
    const spec = initializeSpec();
    expect(addDonutLegendLayout(spec, { legends: [{ position: 'right' }] })).toEqual(spec);
    expect(addDonutLegendLayout(spec, { donut, legends: [{ position: 'bottom' }] })).toEqual(spec);
    expect(addDonutLegendLayout(spec, { donut, legends: [] })).toEqual(spec);
  });

  test('aligns the title to the chart bounds', () => {
    const spec = addDonutLegendLayout(
      { ...initializeSpec(), title: { text: 'Browser share', frame: 'group' } },
      { donut, legends: [{ position: 'left' }] }
    );
    expect(spec.title).toHaveProperty('frame', 'bounds');
  });
});

describe('buildSpec() donut side legend layout', () => {
  const data = [
    { series: 'Chrome', value: 48 },
    { series: 'Safari', value: 24 },
    { series: 'Edge', value: 12 },
  ];

  const getMargin = async (viewWidth: number, height: number) => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
    expressionFunction('rscViewWidth', () => viewWidth);
    const spec = buildSpec({
      data,
      marks: [{ ...donut, name: 'testDonut' }],
      legends: [{ position: 'right' }],
    });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(viewWidth).height(height);
    await view.runAsync();
    return { margin: view.signal(DONUT_LEGEND_MARGIN_SIGNAL), legendWidth: view.signal(DONUT_LEGEND_WIDTH_SIGNAL) };
  };

  test('splits the leftover width evenly around the donut and legend', async () => {
    const { margin, legendWidth } = await getMargin(1000, 300);
    expect(legendWidth).toBeGreaterThan(0);
    expect(margin).toBeCloseTo((1000 - DONUT_LEGEND_OFFSET - legendWidth - 300) / 2);
  });

  test('has no margin when the chart is not wider than the donut and legend', async () => {
    const { margin } = await getMargin(300, 300);
    expect(margin).toBe(0);
  });

  test('is not added for a bottom legend', () => {
    const spec = buildSpec({ data, marks: [donut], legends: [{ position: 'bottom' }] });
    expect(spec.signals?.some(({ name }) => name === DONUT_LEGEND_MARGIN_SIGNAL)).toBe(false);
    expect(spec.marks?.some(({ name }) => name === DONUT_LEGEND_SPACER_START)).toBe(false);
  });
});
