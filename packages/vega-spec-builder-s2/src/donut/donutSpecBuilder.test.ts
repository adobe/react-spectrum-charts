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
  DONUT_ADVANCED_LABEL_RING_GAP,
  DONUT_LABEL_COLLISION_GAP,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAP,
  FILTERED_TABLE,
  HOVERED_ITEM,
  TABLE,
} from '@spectrum-charts/constants';

import { buildSpec } from '../chartSpecBuilder';
import { getExpressionFunctions } from '../expressionFunctions';
import { defaultSignals } from '../specTestUtils';
import { initializeSpec } from '../specUtils';
import { addData, addDonut, addMarks, addScales, addSignals } from './donutSpecBuilder';
import { defaultDonutOptions } from './donutTestUtils';

describe('addData', () => {
  test('rotates direct-label data coordinates with startAngle', async () => {
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
    const getLabelData = async (startAngle: number) => {
      const spec = buildSpec({
        data,
        marks: [
          {
            markType: 'donut',
            color: 'series',
            metric: 'value',
            name: 'testDonut',
            startAngle,
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
    const baseline = await getLabelData(0);
    const rotated = await getLabelData(Math.PI / 2);

    baseline.forEach((datum, index) => {
      const rotatedDatum = rotated[index];
      expect(datum.testDonut_segmentLabel_labelY).toBeCloseTo(datum.testDonut_segmentLabel_idealY);
      expect(rotatedDatum.testDonut_arcTheta - datum.testDonut_arcTheta).toBeCloseTo(Math.PI / 2);
      expect(rotatedDatum.testDonut_segmentLabel_labelY).not.toBeCloseTo(
        datum.testDonut_segmentLabel_labelY
      );
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
      const ringGap = _mode === 'advanced' ? DONUT_ADVANCED_LABEL_RING_GAP : DONUT_LABEL_RING_GAP;
      const outerRadius = (364 / 2 - 2 - ringGap) / (1 + DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO);
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
    expect(data[1].transform).toHaveLength(4);
    expect(data[1].transform?.[0].type).toBe('pie');
    expect(data[1].transform?.[1]).toHaveProperty('as', 'testName_arcTheta');
    expect(data[1].transform?.[2]).toHaveProperty('as', 'testName_arcLength');
    expect(data[1].transform?.[3]).toHaveProperty('as', 'testName_arcPercent');
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
    expect(data[1].transform).toHaveLength(5);
    expect(data[1].transform?.[4]).toEqual({ type: 'formula', as: 'rscSeriesId', expr: "datum.testColor" });
  });

  test('should not add a SERIES_ID transform when not interactive', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    expect(data[1].transform).toHaveLength(4);
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
  test('should exclude data with key from update if inspect has excludeDataKey', () => {
    const signals = addSignals(defaultSignals, {
      ...defaultDonutOptions,
      chartInspects: [{ excludeDataKeys: ['excludeFromTooltip'] }],
    });
    expect(signals).toHaveLength(defaultSignals.length + 3);

    const hoveredItemSignal = signals.find((signal) => signal.name.includes(HOVERED_ITEM));

    expect(hoveredItemSignal).toBeDefined();
    expect(hoveredItemSignal?.on).toHaveLength(2);
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('events', '@testName:mouseover');
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('update', '(datum.excludeFromTooltip) ? null : datum');
    expect(hoveredItemSignal?.on?.[1]).toHaveProperty('events', '@testName:mouseout');
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
    expect(signals).toHaveLength(baselineSignals.length + 4);
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
});

describe('donutSpecBuilder', () => {
  test('should add scales correctly', () => {
    const scales = addScales([], defaultDonutOptions);
    expect(scales).toHaveLength(3);
    expect(scales[0]).toHaveProperty('name', COLOR_SCALE);
    expect(scales[1]).toHaveProperty('name', 'testName_ringWidthScale');
    expect(scales[2]).toHaveProperty('name', 'testName_sliceGapScale');
  });

  test('should add rich SegmentLabel font size scales when swatch is enabled', () => {
    const scales = addScales([], { ...defaultDonutOptions, segmentLabels: [{ swatch: true }] });
    expect(scales).toHaveLength(6);
    expect(scales[3]).toHaveProperty('name', 'testName_richSegmentLabelNameFontSizeScale');
    expect(scales[4]).toHaveProperty('name', 'testName_richSegmentLabelValueFontSizeScale');
    expect(scales[5]).toHaveProperty('name', 'testName_richSegmentLabelDetailFontSizeScale');
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
});
