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
import {
  DONUT_ADVANCED_LABEL_RING_GAP,
  DONUT_LABEL_RING_GAP,
  DONUT_RADIUS,
  DONUT_RING_WIDTHS,
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SLICE_GAPS,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';
import { spectrum2Colors } from '@spectrum-charts/themes';

import { defaultDonutOptions } from './donutTestUtils';
import {
  getArcMark,
  getDonutEmptyStateTest,
  getDonutInnerRadiusExpr,
  getDonutOuterRadiusExpr,
  getEmptyStateArcMark,
  getRingWidthScale,
  getRingWidthSignal,
  getSliceGapScale,
  getSliceGapSignal,
  getSumData,
} from './donutUtils';

describe('getDonutEmptyStateTest()', () => {
  test('should test for empty data and a metric sum of 0', () => {
    const test = getDonutEmptyStateTest('testName');
    expect(test).toBe(`length(data('${FILTERED_TABLE}')) === 0 || !data('testName_sumData')[0]['sum']`);
  });
});

describe('getDonutOuterRadiusExpr()', () => {
  test('should return the raw donut radius when neither SegmentLabel nor AdvancedLabel is present', () => {
    expect(getDonutOuterRadiusExpr(defaultDonutOptions)).toBe(DONUT_RADIUS);
  });

  test('should return the raw donut radius for isBoolean donuts, even with labels configured', () => {
    expect(
      getDonutOuterRadiusExpr({ ...defaultDonutOptions, isBoolean: true, segmentLabels: [{}], advancedLabels: [{}] })
    ).toBe(DONUT_RADIUS);
  });

  test('should reserve room using the direct-label ring gap when only SegmentLabel is present', () => {
    const expr = getDonutOuterRadiusExpr({ ...defaultDonutOptions, segmentLabels: [{}] });
    expect(expr).toBe(`((${DONUT_RADIUS} - ${DONUT_LABEL_RING_GAP}) / (1 + 0.6))`);
  });

  test('should reserve room using the (larger) advanced-label ring gap when only AdvancedLabel is present', () => {
    const expr = getDonutOuterRadiusExpr({ ...defaultDonutOptions, advancedLabels: [{}] });
    expect(expr).toBe(`((${DONUT_RADIUS} - ${DONUT_ADVANCED_LABEL_RING_GAP}) / (1 + 0.6))`);
  });

  test('should reserve room using the advanced-label ring gap when both SegmentLabel and AdvancedLabel are present', () => {
    const expr = getDonutOuterRadiusExpr({ ...defaultDonutOptions, segmentLabels: [{}], advancedLabels: [{}] });
    expect(expr).toBe(`((${DONUT_RADIUS} - ${DONUT_ADVANCED_LABEL_RING_GAP}) / (1 + 0.6))`);
  });
});

describe('getSumData()', () => {
  test('should aggregate the sum of the metric from the filtered table', () => {
    const sumData = getSumData(defaultDonutOptions);
    expect(sumData).toHaveProperty('name', 'testName_sumData');
    expect(sumData).toHaveProperty('source', FILTERED_TABLE);
    expect(sumData.transform).toEqual([
      {
        type: 'aggregate',
        fields: ['testMetric'],
        ops: ['sum'],
        as: ['sum'],
      },
    ]);
  });
});

describe('getArcMark()', () => {
  test('should hide the arcs when the donut is in the empty state', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    const opacity = arcMark.encode?.update?.opacity;
    expect(opacity).toHaveLength(2);
    expect(opacity?.[0]).toEqual({ test: getDonutEmptyStateTest('testName'), value: 0 });
  });
  test('should use the normal color scale when isBoolean is false', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    expect(arcMark.encode?.enter?.fill).toEqual({ scale: 'color', field: 'testColor' });
  });
  test('should force the secondary segment to secondary-gray when isBoolean is true', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, isBoolean: true });
    const fill = arcMark.encode?.enter?.fill;
    expect(fill).toEqual([
      {
        test: `!(datum.${defaultDonutOptions.idKey} === data('testName_booleanData')[0].${defaultDonutOptions.idKey})`,
        value: spectrum2Colors.light['gray-400'],
      },
      { scale: 'color', field: 'testColor' },
    ]);
  });

  test('should use the per-tier fixed ring width at the default holeRatio', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    expect(arcMark.encode?.update?.innerRadius).toEqual({
      signal: '((min(width, height) / 2 - 2) - testName_ringWidth)',
    });
  });

  test('should use a proportional ring when holeRatio is explicitly customized', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, holeRatio: 0.5 });
    expect(arcMark.encode?.update?.innerRadius).toEqual({ signal: '0.5 * (min(width, height) / 2 - 2)' });
  });

  test('should convert the per-tier fixed slice gap to an angle at the outer radius, capped to a fraction of this segment\'s own angular width', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    // capping against this segment's own arcLength (not an average across all segments) is what
    // actually prevents collapse for a donut whose segment sizes are highly skewed
    expect(arcMark.encode?.update?.padAngle).toEqual({
      signal:
        "min(testName_sliceGap / (min(width, height) / 2 - 2), datum['testName_arcLength'] * 0.3333333333333333)",
    });
  });

  test('should fade segments that do not match a hovered Legend entry', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, legendHighlightSignals: ['legend0_hoveredSeries'] });
    const opacity = arcMark.encode?.update?.opacity as { test?: string }[];
    expect(opacity).toHaveLength(3);
    expect(opacity[1]).toEqual({
      test: "isValid(legend0_hoveredSeries) && legend0_hoveredSeries !== datum.rscSeriesId",
      value: 0.2,
    });
  });

  test('should not add any legend-highlight opacity rules when no Legend is paired', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    const opacity = arcMark.encode?.update?.opacity as { test?: string }[];
    expect(opacity.some((rule) => rule.test?.includes('hoveredSeries'))).toBe(false);
  });

  test('should use the normal categorical color when no segments are emphasized', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    expect(arcMark.encode?.enter?.fill).toEqual({ scale: 'color', field: 'testColor' });
  });

  test('should swap non-emphasized segments to solid gray-400, at full opacity (not a fade)', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, emphasizedItems: ['Chrome'] });
    expect(arcMark.encode?.enter?.fill).toEqual([
      {
        test: `indexof(["Chrome"], datum.testColor) < 0`,
        value: spectrum2Colors.light['gray-400'],
      },
      { scale: 'color', field: 'testColor' },
    ]);
    // the color swap is a static `fill` rule (enter), fully independent from the opacity-based
    // hover/legend fade rules (update) - it must not add or alter any opacity rule
    const opacity = arcMark.encode?.update?.opacity as { test?: string }[];
    expect(opacity).toHaveLength(2);
  });

  test('should support multiple emphasized segments', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, emphasizedItems: ['Chrome', 'Firefox'] });
    expect(arcMark.encode?.enter?.fill).toEqual([
      {
        test: `indexof(["Chrome","Firefox"], datum.testColor) < 0`,
        value: spectrum2Colors.light['gray-400'],
      },
      { scale: 'color', field: 'testColor' },
    ]);
  });

  test('should respect a custom otherItemColor override', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, emphasizedItems: ['Chrome'], otherItemColor: 'gray-200' });
    expect(arcMark.encode?.enter?.fill).toEqual([
      {
        test: `indexof(["Chrome"], datum.testColor) < 0`,
        value: spectrum2Colors.light['gray-200'],
      },
      { scale: 'color', field: 'testColor' },
    ]);
  });
});

describe('getEmptyStateArcMark()', () => {
  test('should return a gray-200 ring', () => {
    const emptyStateMark = getEmptyStateArcMark(defaultDonutOptions);
    expect(emptyStateMark).toHaveProperty('name', 'testName_emptyState');
    expect(emptyStateMark).toHaveProperty('type', 'arc');
    expect(emptyStateMark).toHaveProperty('interactive', false);
    expect(emptyStateMark.encode?.enter?.fill).toEqual({ value: spectrum2Colors.light['gray-200'] });
    expect(emptyStateMark.encode?.enter?.startAngle).toEqual({ value: 0 });
    expect(emptyStateMark.encode?.enter?.endAngle).toEqual({ signal: '2 * PI' });
  });
  test('should only be visible when the donut is in the empty state', () => {
    const emptyStateMark = getEmptyStateArcMark(defaultDonutOptions);
    expect(emptyStateMark.encode?.update?.opacity).toEqual([
      { test: getDonutEmptyStateTest('testName'), value: 1 },
      { value: 0 },
    ]);
  });
  test('should match the real arc mark ring width so the empty state stays visually consistent', () => {
    const emptyStateMark = getEmptyStateArcMark(defaultDonutOptions);
    const arcMark = getArcMark(defaultDonutOptions);
    expect(emptyStateMark.encode?.update?.innerRadius).toEqual(arcMark.encode?.update?.innerRadius);
  });
});

describe('getRingWidthScale()', () => {
  test('should snap outer diameter to the nearest named tier via the shared cutpoints', () => {
    const scale = getRingWidthScale(defaultDonutOptions);
    expect(scale).toEqual({
      name: 'testName_ringWidthScale',
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_RING_WIDTHS,
    });
  });
});

describe('getRingWidthSignal()', () => {
  test('should resolve ring width from the outer diameter', () => {
    const signal = getRingWidthSignal(defaultDonutOptions);
    expect(signal).toEqual({
      name: 'testName_ringWidth',
      update: "scale('testName_ringWidthScale', 2 * (min(width, height) / 2 - 2))",
    });
  });
});

describe('getSliceGapScale()', () => {
  test('should snap outer diameter to the nearest named tier via the shared cutpoints', () => {
    const scale = getSliceGapScale(defaultDonutOptions);
    expect(scale).toEqual({
      name: 'testName_sliceGapScale',
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_SLICE_GAPS,
    });
  });
});

describe('getSliceGapSignal()', () => {
  test('should resolve the slice gap from the outer diameter', () => {
    const signal = getSliceGapSignal(defaultDonutOptions);
    expect(signal).toEqual({
      name: 'testName_sliceGap',
      update: "scale('testName_sliceGapScale', 2 * (min(width, height) / 2 - 2))",
    });
  });
});

describe('getDonutInnerRadiusExpr()', () => {
  test('should use the fixed per-tier ring width at the default holeRatio', () => {
    expect(getDonutInnerRadiusExpr(defaultDonutOptions)).toBe('((min(width, height) / 2 - 2) - testName_ringWidth)');
  });

  test('should use a proportional ring when holeRatio is explicitly customized', () => {
    expect(getDonutInnerRadiusExpr({ ...defaultDonutOptions, holeRatio: 0.5 })).toBe(
      '0.5 * (min(width, height) / 2 - 2)'
    );
  });
});
