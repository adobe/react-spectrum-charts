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
import { COLOR_SCALE, FILTERED_TABLE, HOVERED_ITEM } from '@spectrum-charts/constants';

import { defaultSignals } from '../specTestUtils';
import { initializeSpec } from '../specUtils';
import { addData, addDonut, addMarks, addScales, addSignals } from './donutSpecBuilder';
import { defaultDonutOptions } from './donutTestUtils';

describe('addData', () => {
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

  test('should add a SERIES_ID transform when paired with a highlighted legend', () => {
    const data = addData(initializeSpec().data ?? [], {
      ...defaultDonutOptions,
      legendHighlightSignals: ['legend0_hoveredSeries'],
    });
    expect(data[1].transform).toHaveLength(5);
    expect(data[1].transform?.[4]).toEqual({ type: 'formula', as: 'rscSeriesId', expr: "datum.testColor" });
  });

  test('should not add a SERIES_ID transform when not interactive', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    expect(data[1].transform).toHaveLength(4);
  });

  test('should add a descending sort transform ahead of the pie transform for a semicircle donut', () => {
    const data = addData(initializeSpec().data ?? [], { ...defaultDonutOptions, variant: 'semicircle' });
    expect(data[1].transform).toHaveLength(5);
    expect(data[1].transform?.[0]).toEqual({ type: 'collect', sort: { field: 'testMetric', order: 'descending' } });
    expect(data[1].transform?.[1].type).toBe('pie');
  });

  test('should preserve source order for a semicircle donut when sortOrder is data', () => {
    const data = addData(initializeSpec().data ?? [], {
      ...defaultDonutOptions,
      sortOrder: 'data',
      variant: 'semicircle',
    });
    expect(data[1].transform).toHaveLength(4);
    expect(data[1].transform?.[0].type).toBe('pie');
  });

  test('should not add a sort transform for a circle donut', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    expect(data[1].transform?.[0].type).toBe('pie');
  });

  test('should sweep a semicircle donut half the full circle', () => {
    const data = addData(initializeSpec().data ?? [], { ...defaultDonutOptions, variant: 'semicircle' });
    const pieTransform = data[1].transform?.[1];
    expect(pieTransform).toHaveProperty('startAngle', 0);
    expect(pieTransform).toHaveProperty('endAngle', { signal: '0 + PI' });
    expect(data[1].transform?.[4]).toHaveProperty('expr', "datum['testName_arcLength'] / (PI)");
  });

  test('should sweep a circle donut the full circle', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    const pieTransform = data[1].transform?.[0];
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

  test('should register a donut paired with a highlighted legend as interactive', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const result = addDonut(spec, {
      ...defaultDonutOptions,
      legendHighlightSignals: ['legend0_hoveredSeries'],
    });
    expect(result.usermeta?.interactiveMarks).toContainEqual({ name: 'testName', dimension: undefined });
  });

  test('should default startAngle to -PI/2 for a semicircle donut when not explicitly provided', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const { startAngle: _startAngle, ...rest } = defaultDonutOptions;
    const result = addDonut(spec, { ...rest, variant: 'semicircle' });
    const emptyStateMark = result.marks?.find((mark) => mark.name === 'testName_emptyState');
    expect(emptyStateMark?.encode?.enter?.startAngle).toEqual({ value: -Math.PI / 2 });
    expect(emptyStateMark?.encode?.enter?.endAngle).toEqual({ signal: `${-Math.PI / 2} + PI` });
  });

  test('should default startAngle to 0 for a circle donut when not explicitly provided', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const { startAngle: _startAngle, ...rest } = defaultDonutOptions;
    const result = addDonut(spec, rest);
    const emptyStateMark = result.marks?.find((mark) => mark.name === 'testName_emptyState');
    expect(emptyStateMark?.encode?.enter?.startAngle).toEqual({ value: 0 });
    expect(emptyStateMark?.encode?.enter?.endAngle).toEqual({ signal: '0 + 2 * PI' });
  });

  test('should honor an explicit startAngle even for a semicircle donut', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const result = addDonut(spec, { ...defaultDonutOptions, variant: 'semicircle', startAngle: 1 });
    const emptyStateMark = result.marks?.find((mark) => mark.name === 'testName_emptyState');
    expect(emptyStateMark?.encode?.enter?.startAngle).toEqual({ value: 1 });
  });
});
