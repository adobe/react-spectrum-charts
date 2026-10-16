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
  COLOR_SCALE,
  DONUT_LABEL_COLLISION_GAP,
  DONUT_LABEL_MIN_SPACE_RATIO,
  FILTERED_TABLE,
  HOVERED_ITEM,
  MARK_ID,
  TABLE,
} from '@spectrum-charts/core-s2/constants';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { defaultSignals } from '../specTestUtils.js';
import { initializeSpec } from '../specUtils.js';
import { addData, addDonut, addMarks, addScales, addSignals } from './donutSpecBuilder.js';
import { defaultDonutOptions } from './donutTestUtils.js';

interface DonutSceneNode {
  name?: string;
  text?: string;
  limit?: number;
  x?: number;
  y?: number;
  outerRadius?: number;
  innerRadius?: number;
  strokeWidth?: number;
  items?: DonutSceneNode[];
}

describe('addData', () => {
  test.each([false, true])('centers semicircles and preserves visible ring width on resize: isBoolean=%s', async (isBoolean) => {
    const functions = getExpressionFunctions('en-US');
    Object.entries(functions).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
    const data = [{ series: 'Complete', value: 0.7 }, { series: 'Remaining', value: 0.3 }];
    const spec = buildSpec({
      data,
      marks: [{
        markType: 'donut',
        name: 'centeredDonut',
        color: 'series',
        metric: 'value',
        variant: 'semicircle',
        isBoolean,
        donutSummaries: [{ label: 'Total' }],
      }],
    });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(1200).height(420);
    const getMarkItems = (name: string): DonutSceneNode[] => {
      const scene: DonutSceneNode & { root?: DonutSceneNode } = view.scenegraph();
      if (!scene.root) throw new Error('Expected scenegraph root');
      const nodes = [scene.root];
      for (const node of nodes) {
        if (node.name === name && node.items) return node.items;
        nodes.push(...(node.items ?? []));
      }
      throw new Error(`Expected scenegraph mark ${name}`);
    };
    try {
      await view.runAsync();
      const initialArc = getMarkItems('centeredDonut')[0];
      expect(view.signal('centeredDonut_ringWidth')).toBe(40);
      for (const [width, height] of [[1200, 420], [420, 420], [1000, 300], [1200, 420]]) {
        await view.width(width).height(height).runAsync();
        const outerRadius = view.signal('centeredDonut_outerRadius');
        const top = (height - outerRadius) / 2;
        const centerY = height - top;
        expect(top).toBeGreaterThanOrEqual(10);
        expect(width / 2 - outerRadius).toBeGreaterThanOrEqual(10);
        for (const name of ['centeredDonut', 'centeredDonut_emptyState']) {
          for (const item of getMarkItems(name)) {
            expect(item.x).toBe(width / 2);
            expect(item.y).toBe(centerY);
          }
        }
        for (const item of getMarkItems('centeredDonut')) {
          if (item.outerRadius === undefined || item.innerRadius === undefined || item.strokeWidth === undefined) {
            throw new Error('Expected resolved arc radii and stroke width');
          }
          expect(item.outerRadius - item.innerRadius - item.strokeWidth).toBeCloseTo(
            view.signal('centeredDonut_ringWidth'), 10
          );
          expect(item.outerRadius - item.strokeWidth / 2).toBeCloseTo(outerRadius, 10);
        }
        const summaryName = isBoolean ? 'centeredDonut_booleanSummaryLabel' : 'centeredDonut_summaryLabel';
        const summary = getMarkItems(summaryName)[0];
        expect(summary.y).toBeLessThan(centerY);
        expect(getMarkItems('centeredDonut')[0]).toBe(initialArc);
      }
    } finally {
      view.finalize();
    }
  });

  test.each([
    ['direct', { value: true }],
    ['advanced', { percent: true, showValueRow: true, swatch: true, value: false }],
  ])('keeps %s labels within a 10px inset and the ring centered on resize', async (mode, label) => {
    const functions = getExpressionFunctions('en-US');
    Object.entries(functions).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
    expressionFunction('getLabelWidth', (text: string) => String(text).length * 8);
    const data = [
      { series: 'North America enterprise customers', value: 50 },
      { series: 'International enterprise customers', value: 50 },
    ];
    const spec = buildSpec({
      data,
      marks: [
        { markType: 'donut', name: 'wideDonut', color: 'series', metric: 'value', segmentLabels: [label] },
      ],
    });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(1200).height(674);
    const prefix = mode === 'advanced' ? 'wideDonut_richSegmentLabel' : 'wideDonut_segmentLabel';
    const getMarkItems = (name: string): DonutSceneNode[] => {
      const find = (node: DonutSceneNode): DonutSceneNode | undefined => {
        if (node.name === name) return node;
        for (const child of node.items ?? []) {
          const found = find(child);
          if (found) return found;
        }
        return undefined;
      };
      const scene: DonutSceneNode & { root?: DonutSceneNode } = view.scenegraph();
      if (!scene.root) throw new Error('Expected scenegraph root');
      const mark = find(scene.root);
      if (!mark?.items) throw new Error(`Expected scenegraph mark ${name}`);
      return mark.items;
    };
    try {
      await view.runAsync();
      const initialArc = getMarkItems('wideDonut')[0];
      const assertLayout = (truncated: boolean) => {
        for (const name of ['wideDonut', 'wideDonut_emptyState']) {
          getMarkItems(name).forEach((item) => {
            expect(item.x).toBe(view.width() / 2);
            expect(item.y).toBe(view.height() / 2);
          });
        }
        const labels = view.data(`${prefix}Data`);
        expect(labels).toHaveLength(2);
        expect(new Set(labels.map((datum) => datum[`${prefix}_hemisphere`]))).toEqual(new Set(['left', 'right']));
        labels.forEach((datum) => {
          expect(datum[`${prefix}_leftX`]).toBeGreaterThanOrEqual(10);
          expect(datum[`${prefix}_rightX`]).toBeLessThanOrEqual(view.width() - 10);
          if (truncated) {
            const edge = datum[`${prefix}_hemisphere`] === 'left' ? 'leftX' : 'rightX';
            expect(datum[`${prefix}_${edge}`]).toBeCloseTo(edge === 'leftX' ? 10 : view.width() - 10);
          }
        });
        const nameMark = mode === 'advanced' ? `${prefix}Name` : prefix;
        getMarkItems(nameMark).forEach((item) => {
          expect(data.map(({ series }) => series)).toContain(item.text);
          if (truncated) {
            expect(item.limit).toBeGreaterThan(0);
          } else {
            expect(item.limit).toBe(0);
          }
        });
      };
      expect(view.signal('wideDonut_sizeTier')).toBe(4);
      expect(view.signal('wideDonut_outerRadius')).toBe(200);
      assertLayout(false);
      await view.width(674).runAsync();
      assertLayout(true);
      await view.width(1400).height(700).runAsync();
      assertLayout(false);
      await view.width(1200).height(674).runAsync();
      assertLayout(false);
      expect(view.signal('wideDonut_outerRadius')).toBe(200);
      expect(getMarkItems('wideDonut')[0]).toBe(initialArc);
    } finally {
      view.finalize();
      expressionFunction('getLabelWidth', functions.getLabelWidth);
    }
  });

  test('positions direct-label data coordinates from the fixed circle start', async () => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
    const data = [
      { series: 'Chrome', value: 10390 },
      { series: 'Firefox', value: 8281 },
      { series: 'Safari', value: 7045 },
      { series: 'Opera', value: 6166 },
      { series: 'Other', value: 4201 },
      { series: 'Brave', value: 3261 },
      { series: 'Unknown', value: 1021 },
    ];
    const getLabelData = async () => {
      const spec = buildSpec({
        data,
        marks: [
          {
            markType: 'donut',
            color: 'series',
            metric: 'value',
            name: 'testDonut',
            segmentLabels: [{ value: true }],
          },
        ],
      });
      const table = spec.data?.find(({ name }) => name === TABLE);
      if (!table || !('values' in table)) throw new Error('Expected inline table data');
      table.values = data;
      const view = new View(parse(spec), { renderer: 'none' }).width(400).height(400);
      await view.runAsync();
      return view.data('testDonut_segmentLabelData');
    };
    const labels = await getLabelData();
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach((datum) => {
      expect(datum.testDonut_segmentLabel_labelY).toBeCloseTo(datum.testDonut_segmentLabel_idealY);
      expect(datum.testDonut_arcTheta).toBeGreaterThan(0);
      expect(datum.testDonut_arcTheta).toBeLessThan(2 * Math.PI);
    });
  });

  test.each([
    ['direct', { value: true }],
    ['advanced', { percent: true, showValueRow: true, swatch: true, value: false }],
  ])('keeps dense %s labels fixed and hides only overlapping candidates', async (_mode, label) => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
    const data = Array.from({ length: 24 }, (_, index) => ({
      series: `Category ${String(index + 1).padStart(2, '0')}`,
      value: 25 - index,
    }));
    const spec = buildSpec({
      data,
      marks: [
        {
          markType: 'donut',
          color: 'series',
          metric: 'value',
          name: 'denseDonut',
          segmentLabels: [label],
        },
      ],
    });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(364).height(364);
    await view.runAsync();
    const prefix = _mode === 'advanced' ? 'denseDonut_richSegmentLabel' : 'denseDonut_segmentLabel';
    const candidates = view.data(`${prefix}Candidates`);
    const labels = view.data(`${prefix}Data`);
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.length).toBeLessThanOrEqual(candidates.length);
    labels.forEach((datum) => {
      expect(datum[`${prefix}_labelY`]).toBeCloseTo(datum[`${prefix}_idealY`]);
      expect(datum[`${prefix}_labelHalfWidth`]).toBeLessThanOrEqual(182);
      // a 364px chart lands in the L tier, which uses a 10px label ring gap
      const ringGap = 10;
      const outerRadius = (364 / 2 - 2 - ringGap) / (1 + DONUT_LABEL_MIN_SPACE_RATIO);
      const innerX =
        datum[`${prefix}_hemisphere`] === 'right'
          ? datum[`${prefix}_leftX`] - 182
          : 182 - datum[`${prefix}_rightX`];
      const topY = datum[`${prefix}_topY`] - 182;
      const bottomY = datum[`${prefix}_bottomY`] - 182;
      const nearestY = topY <= 0 && bottomY >= 0 ? 0 : Math.min(Math.abs(topY), Math.abs(bottomY));
      expect(Math.hypot(innerX, nearestY) - outerRadius).toBeCloseTo(ringGap);
    });
    ['left', 'right'].forEach((hemisphere) => {
      const collisionBoxes = labels
        .filter((datum) => datum[`${prefix}_hemisphere`] === hemisphere)
        .map((datum) => datum[`${prefix}_collisionBoxes`]);
      collisionBoxes.forEach((labelBoxes, index) => {
        collisionBoxes.slice(index + 1).forEach((otherLabelBoxes) => {
          labelBoxes.forEach(([left, right, top, bottom]) => {
            otherLabelBoxes.forEach(([otherLeft, otherRight, otherTop, otherBottom]) => {
              const withinHorizontalGap =
                left < otherRight + DONUT_LABEL_COLLISION_GAP &&
                right > otherLeft - DONUT_LABEL_COLLISION_GAP;
              const withinVerticalGap =
                top < otherBottom + DONUT_LABEL_COLLISION_GAP &&
                bottom > otherTop - DONUT_LABEL_COLLISION_GAP;
              expect(withinHorizontalGap && withinVerticalGap).toBe(false);
            });
          });
        });
      });
    });
  });

  test.each([
    ['direct', { value: true }, 'denseDonut_segmentLabel'],
    ['advanced', { percent: true, showValueRow: true, swatch: true, value: true }, 'denseDonut_richSegmentLabel'],
  ])('hovering a segment reveals its hidden %s label and hides the labels it overlaps', async (_mode, label, prefix) => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
    // small chart + long names force direct-label collisions (jsdom measures text width as ~0)
    const data = [
      ...Array.from({ length: 18 }, (_, index) => ({ series: `Long category name ${index + 1}`, value: 10 })),
      { series: 'Sliver', value: 1 },
    ];
    const spec = buildSpec({
      data,
      marks: [{ markType: 'donut', color: 'series', metric: 'value', name: 'denseDonut', segmentLabels: [label] }],
    });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(240).height(240);
    await view.runAsync();

    const hoveredSignal = `denseDonut_${HOVERED_ITEM}`;
    const getLabelIds = () =>
      view
        .data(`${prefix}Data`)
        .map((datum) => datum[MARK_ID])
        .sort((a, b) => a - b);
    const expectNoCollisions = () => {
      const labels = view.data(`${prefix}Data`);
      labels.forEach((datum, index) => {
        labels.slice(index + 1).forEach((other) => {
          if (datum[`${prefix}_hemisphere`] !== other[`${prefix}_hemisphere`]) return;
          datum[`${prefix}_collisionBoxes`].forEach(([left, right, top, bottom]) => {
            other[`${prefix}_collisionBoxes`].forEach(([otherLeft, otherRight, otherTop, otherBottom]) => {
              const overlaps =
                left < otherRight + DONUT_LABEL_COLLISION_GAP &&
                right > otherLeft - DONUT_LABEL_COLLISION_GAP &&
                top < otherBottom + DONUT_LABEL_COLLISION_GAP &&
                bottom > otherTop - DONUT_LABEL_COLLISION_GAP;
              expect(overlaps).toBe(false);
            });
          });
        });
      });
    };
    const defaultIds = getLabelIds();
    const candidateIds = view.data(`${prefix}Candidates`).map((datum) => datum[MARK_ID]);
    const collisionHiddenId = candidateIds.find((id) => !defaultIds.includes(id));
    const belowMinAngleId = view
      .data(FILTERED_TABLE)
      .map((datum) => datum[MARK_ID])
      .find((id) => !candidateIds.includes(id));
    expect(collisionHiddenId).toBeDefined();
    expect(belowMinAngleId).toBeDefined();

    for (const hoveredId of [collisionHiddenId, belowMinAngleId]) {
      await view.signal(hoveredSignal, { [MARK_ID]: hoveredId }).runAsync();
      expect(getLabelIds()).toContain(hoveredId);
      expectNoCollisions();
    }

    await view.signal(hoveredSignal, null).runAsync();
    expect(getLabelIds()).toEqual(defaultIds);
  });

  test('should add data correctly for boolean donut', () => {
    const data = addData(initializeSpec().data ?? [], { ...defaultDonutOptions, isBoolean: true });

    expect(data).toHaveLength(4);
    expect(data[2].transform).toHaveLength(2);
    expect(data[2].transform?.[0].type).toBe('window');
    expect(data[2].transform?.[1].type).toBe('filter');
  });

  test('should add data correctly for non-boolean donut', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    expect(data).toHaveLength(3);
    expect(data[1].transform).toHaveLength(5);
    expect(data[1].transform?.[0]).toEqual({ type: 'collect', sort: { field: 'testMetric', order: 'descending' } });
    expect(data[1].transform?.[1].type).toBe('pie');
    expect(data[1].transform?.[2]).toHaveProperty('as', 'testName_arcTheta');
    expect(data[1].transform?.[3]).toHaveProperty('as', 'testName_arcLength');
    expect(data[1].transform?.[4]).toHaveProperty('as', 'testName_arcPercent');
  });

  test('should add the sum data used to detect the empty state', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    const sumData = data.find((d) => d.name === 'testName_sumData');
    expect(sumData).toBeDefined();
    expect(sumData?.transform).toHaveLength(1);
    expect(sumData?.transform?.[0]).toHaveProperty('type', 'aggregate');
    expect(sumData?.transform?.[0]).toHaveProperty('fields', ['testMetric']);
    expect(sumData?.transform?.[0]).toHaveProperty('ops', ['sum']);
  });

  test('should add a SERIES_ID transform when interactive, so legend hover-highlight can match this donut', () => {
    const interactiveOptions = { ...defaultDonutOptions, segmentLabels: [{ value: true }] };
    const data = addData(initializeSpec().data ?? [], interactiveOptions);
    expect(data[1].transform).toHaveLength(6);
    expect(data[1].transform?.[5]).toEqual({ type: 'formula', as: 'rscSeriesId', expr: "datum.testColor" });
  });

  test('should add a SERIES_ID transform when paired with a highlighted legend', () => {
    const data = addData(initializeSpec().data ?? [], {
      ...defaultDonutOptions,
      legendHighlightSignals: ['legend0_hoveredSeries'],
    });
    expect(data[1].transform).toHaveLength(6);
    expect(data[1].transform?.[5]).toEqual({ type: 'formula', as: 'rscSeriesId', expr: "datum.testColor" });
  });

  test('should not add a SERIES_ID transform when not interactive', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    expect(data[1].transform).toHaveLength(5);
    expect(data[1].transform?.some((transform) => 'as' in transform && transform.as === 'rscSeriesId')).toBe(false);
  });

  test.each(['circle', 'semicircle'] as const)('should sort a %s donut descending before computing slices', (variant) => {
    const data = addData(initializeSpec().data ?? [], { ...defaultDonutOptions, variant });
    expect(data[1].transform).toHaveLength(5);
    expect(data[1].transform?.[0]).toEqual({ type: 'collect', sort: { field: 'testMetric', order: 'descending' } });
    expect(data[1].transform?.[1].type).toBe('pie');
  });

  test.each(['circle', 'semicircle'] as const)('should preserve source order for a %s donut when sortOrder is data', (variant) => {
    const data = addData(initializeSpec().data ?? [], {
      ...defaultDonutOptions,
      sortOrder: 'data',
      variant,
    });
    expect(data[1].transform).toHaveLength(4);
    expect(data[1].transform?.[0].type).toBe('pie');
  });

  test.each(['circle', 'semicircle'] as const)('should preserve source order for a boolean %s donut', (variant) => {
    const data = addData(initializeSpec().data ?? [], { ...defaultDonutOptions, isBoolean: true, variant });
    expect(data[1].transform?.some(({ type }) => type === 'collect')).toBe(false);
    expect(data[1].transform?.[0].type).toBe('pie');
  });

  test('should sweep a semicircle donut half the full circle', () => {
    const data = addData(initializeSpec().data ?? [], { ...defaultDonutOptions, variant: 'semicircle' });
    const pieTransform = data[1].transform?.[1];
    expect(pieTransform).toHaveProperty('startAngle', -Math.PI / 2);
    expect(pieTransform).toHaveProperty('endAngle', { signal: `${-Math.PI / 2} + PI` });
    expect(data[1].transform?.[4]).toHaveProperty('expr', "datum['testName_arcLength'] / (PI)");
  });

  test('should sweep a circle donut the full circle', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    const pieTransform = data[1].transform?.[1];
    expect(pieTransform).toHaveProperty('startAngle', 0);
    expect(pieTransform).toHaveProperty('endAngle', { signal: '0 + 2 * PI' });
  });
});

describe('addSignals()', () => {
  test('should add hover events when inspect is present', () => {
    const signals = addSignals(defaultSignals, { ...defaultDonutOptions, chartInspects: [{}] });

    const hoveredItemSignal = signals.find((signal) => signal.name.includes(HOVERED_ITEM));

    expect(hoveredItemSignal).toBeDefined();
    expect(hoveredItemSignal?.on).toHaveLength(2);
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('events', '@testName:mouseover');
    expect(hoveredItemSignal?.on?.[1]).toHaveProperty('events', '@testName:mouseout');
  });
  test('should add hover events when paired with a highlighted legend', () => {
    const signals = addSignals(defaultSignals, {
      ...defaultDonutOptions,
      legendHighlightSignals: ['legend0_hoveredSeries'],
    });
    const hoveredItemSignal = signals.find((signal) => signal.name.includes(HOVERED_ITEM));

    expect(hoveredItemSignal).toBeDefined();
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('events', '@testName:mouseover');
    expect(hoveredItemSignal?.on?.[1]).toHaveProperty('events', '@testName:mouseout');
  });
  test('should exclude data with key from update if inspect has excludeDataKey', () => {
    const signals = addSignals(defaultSignals, {
      ...defaultDonutOptions,
      chartInspects: [{ excludeDataKeys: ['excludeFromTooltip'] }],
    });
    expect(signals).toHaveLength(defaultSignals.length + 6);

    const hoveredItemSignal = signals.find((signal) => signal.name.includes(HOVERED_ITEM));

    expect(hoveredItemSignal).toBeDefined();
    expect(hoveredItemSignal?.on).toHaveLength(2);
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('events', '@testName:mouseover');
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('update', '(datum.excludeFromTooltip) ? null : datum');
    expect(hoveredItemSignal?.on?.[1]).toHaveProperty('events', '@testName:mouseout');
  });

  test('should add the outer then inner radius signals right after the size tier signal', () => {
    const names = addSignals(defaultSignals, defaultDonutOptions).map((signal) => signal.name);
    const sizeTierIndex = names.indexOf('testName_sizeTier');
    expect(names.slice(sizeTierIndex, sizeTierIndex + 3)).toEqual([
      'testName_sizeTier',
      'testName_outerRadius',
      'testName_innerRadius',
    ]);
    expect(names.indexOf('testName_ringWidth')).toBeLessThan(names.indexOf('testName_innerRadius'));
  });

  test('should preserve normal hover behavior when emphasizedItems is set', () => {
    const signals = addSignals(defaultSignals, {
      ...defaultDonutOptions,
      chartInspects: [{}],
      emphasizedItems: ['Chrome'],
    });
    const hoveredItemSignal = signals.find((signal) => signal.name.includes(HOVERED_ITEM));
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('update', 'datum');
  });

  test('should not exclude anything from hover when emphasizedItems is not set', () => {
    const signals = addSignals(defaultSignals, { ...defaultDonutOptions, chartInspects: [{}] });
    const hoveredItemSignal = signals.find((signal) => signal.name.includes(HOVERED_ITEM));
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('update', 'datum');
  });

  test('should add rich SegmentLabel font size signals when swatch is enabled', () => {
    const baselineSignals = addSignals(defaultSignals, defaultDonutOptions);
    const signals = addSignals(defaultSignals, { ...defaultDonutOptions, segmentLabels: [{ swatch: true }] });
    expect(signals).toHaveLength(baselineSignals.length + 5);
    expect(signals.find((signal) => signal.name === 'testName_sizeTier')).toBeDefined();
    expect(signals.find((signal) => signal.name === 'testName_labelRingGap')).toBeDefined();
    expect(signals.find((signal) => signal.name === 'testName_richSegmentLabelNameFontSize')).toBeDefined();
    expect(signals.find((signal) => signal.name === 'testName_richSegmentLabelValueFontSize')).toBeDefined();
    expect(signals.find((signal) => signal.name === 'testName_richSegmentLabelDetailFontSize')).toBeDefined();
  });
});

describe('addMarks()', () => {
  test('should add the empty state ring before the arc mark', () => {
    const marks = addMarks([], defaultDonutOptions);
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveProperty('name', 'testName_emptyState');
    expect(marks[0]).toHaveProperty('type', 'arc');
    expect(marks[1]).toHaveProperty('name', 'testName');
  });

  test('should add the rich SegmentLabel group mark when swatch is enabled', () => {
    const marks = addMarks([], { ...defaultDonutOptions, segmentLabels: [{ swatch: true }] });
    expect(marks).toHaveLength(3);
    expect(marks[2]).toHaveProperty('name', 'testName_richSegmentLabelGroup');
  });

  test('should omit SegmentLabel and rich SegmentLabel marks for a semicircle donut', () => {
    const marks = addMarks([], {
      ...defaultDonutOptions,
      variant: 'semicircle',
      segmentLabels: [{ swatch: true }],
    });
    expect(marks).toHaveLength(2);
  });
});

describe('donutSpecBuilder', () => {
  test('should add scales correctly', () => {
    const scales = addScales([], defaultDonutOptions);
    expect(scales).toHaveLength(2);
    expect(scales[0]).toHaveProperty('name', COLOR_SCALE);
    expect(scales[1]).toHaveProperty('name', 'testName_sizeTierScale');
  });

  test('should only add the size tier scale when segment labels are present', () => {
    const scales = addScales([], { ...defaultDonutOptions, segmentLabels: [{ swatch: true }] });
    expect(scales).toHaveLength(2);
    expect(scales[1]).toHaveProperty('name', 'testName_sizeTierScale');
  });
});

describe('donutSpecBuilder', () => {
  test('should add donut correctly', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const options = { ...defaultDonutOptions, holeRatio: 0.85 };
    const result = addDonut(spec, options);
    const expectedSpec = {
      data: addData(spec.data, options),
      scales: addScales([], options),
      marks: addMarks([], options),
      signals: addSignals([], options),
      usermeta: {},
    };
    expect(result).toEqual(expectedSpec);
  });

  test('should register a donut paired with a highlighted legend as interactive', () => {
    const spec = { data: [{ name: TABLE, values: [] }, { name: FILTERED_TABLE }], usermeta: {} };
    const result = addDonut(spec, {
      ...defaultDonutOptions,
      legendHighlightSignals: ['legend0_hoveredSeries'],
    });
    expect(result.usermeta?.interactiveMarks).toContainEqual({ name: 'testName', dimension: undefined });
  });

  test('should start a semicircle donut at -PI/2', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const result = addDonut(spec, { ...defaultDonutOptions, variant: 'semicircle' });
    const emptyStateMark = result.marks?.find((mark) => mark.name === 'testName_emptyState');
    expect(emptyStateMark?.encode?.enter).toHaveProperty('startAngle', { value: -Math.PI / 2 });
    expect(emptyStateMark?.encode?.enter).toHaveProperty('endAngle', { signal: `${-Math.PI / 2} + PI` });
  });

  test('should start a circle donut at 0', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const result = addDonut(spec, defaultDonutOptions);
    const emptyStateMark = result.marks?.find((mark) => mark.name === 'testName_emptyState');
    expect(emptyStateMark?.encode?.enter).toHaveProperty('startAngle', { value: 0 });
    expect(emptyStateMark?.encode?.enter).toHaveProperty('endAngle', { signal: '0 + 2 * PI' });
  });
});
