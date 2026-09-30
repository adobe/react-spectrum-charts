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
  DONUT_SEMICIRCLE_RADIUS,
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
  getSliceStrokeWidthExpr,
  getSumData,
} from './donutUtils';

describe('getDonutEmptyStateTest()', () => {
  test('should test for empty data and a metric sum of 0', () => {
    const test = getDonutEmptyStateTest('testName');
    expect(test).toBe(`length(data('${FILTERED_TABLE}')) === 0 || !data('testName_sumData')[0]['sum']`);
  });
});

describe('getDonutOuterRadiusExpr()', () => {
  test('should return the raw donut radius when no labels are present', () => {
    expect(getDonutOuterRadiusExpr(defaultDonutOptions)).toBe(DONUT_RADIUS);
  });

  describe('getSliceStrokeWidthExpr()', () => {
    const evaluate = (
      arcLength: number,
      options = defaultDonutOptions,
      sliceGap = 2,
      size = 364,
      requestedWidth = 'testName_sliceGap'
    ): number => {
      const expression = getSliceStrokeWidthExpr(options, requestedWidth);
      // eslint-disable-next-line no-new-func
      return new Function(
        'width',
        'height',
        'datum',
        'testName_ringWidth',
        'testName_sliceGap',
        'PI',
        'min',
        'max',
        'sin',
        `return ${expression};`
      )(size, size, { testName_arcLength: arcLength }, 28, sliceGap, Math.PI, Math.min, Math.max, Math.sin);
    };

    test('preserves the configured gap for ordinary slices', () => {
      expect(evaluate(0.5)).toBe(2);
    });

    test('reduces or removes the gap before it consumes a tiny slice', () => {
      expect(evaluate(0.01)).toBeGreaterThan(0);
      expect(evaluate(0.01)).toBeLessThan(2);
      expect(evaluate(0.001)).toBe(0);
    });

    test.each([
      [64, 1],
      [124, 1],
      [164, 1],
      [204, 1],
      [404, 1],
    ])('preserves the configured pie gap at chart size %s', (size, sliceGap) => {
      expect(evaluate(1.2, { ...defaultDonutOptions, holeRatio: 0 }, sliceGap, size)).toBe(sliceGap);
    });

    test('preserves gaps for semicircle pies and pies with labels', () => {
      expect(evaluate(1.2, { ...defaultDonutOptions, holeRatio: 0, variant: 'semicircle' }, 1)).toBe(1);
      expect(evaluate(1.2, { ...defaultDonutOptions, holeRatio: 0, segmentLabels: [{}] }, 1)).toBe(1);
    });

    test('keeps pie gaps and selected outlines fixed even for tiny slices', () => {
      const options = { ...defaultDonutOptions, holeRatio: 0 };
      expect(evaluate(0.01, options, 1)).toBe(1);
      expect(evaluate(0.001, options, 1)).toBe(1);
      expect(evaluate(0, options, 1)).toBe(1);
      expect(evaluate(1.2, options, 2, 364, '2')).toBe(2);
      expect(evaluate(0.01, options, 1, 364, '2')).toBe(2);
      expect(evaluate(0.001, options, 1, 364, '2')).toBe(2);
    });

    test.each([64, 124, 164, 204, 404])(
      'keeps moderate-dominant sliver strokes fixed at chart size %s',
      (size) => {
      const options = { ...defaultDonutOptions, holeRatio: 0 };
      for (let value = 3; value <= 14; value++) {
        const angle = (value / 502) * 2 * Math.PI;
        for (const requestedWidth of ['testName_sliceGap', '2']) {
          const strokeWidth = evaluate(angle, options, 1, size, requestedWidth);
          const requestedGap = requestedWidth === '2' ? 2 : 1;
          expect(strokeWidth).toBe(requestedGap);
        }
      }
      }
    );
  });

  test('should return the raw donut radius for isBoolean donuts, even with labels configured', () => {
    expect(
      getDonutOuterRadiusExpr({ ...defaultDonutOptions, isBoolean: true, segmentLabels: [{ swatch: true }] })
    ).toBe(DONUT_RADIUS);
  });

  test('should reserve room using the direct-label ring gap when only SegmentLabel is present', () => {
    const expr = getDonutOuterRadiusExpr({ ...defaultDonutOptions, segmentLabels: [{}] });
    expect(expr).toBe(`((${DONUT_RADIUS} - ${DONUT_LABEL_RING_GAP}) / (1 + 0.6))`);
  });

  test('should reserve room using the rich SegmentLabel ring gap when swatch is enabled', () => {
    const expr = getDonutOuterRadiusExpr({ ...defaultDonutOptions, segmentLabels: [{ swatch: true }] });
    expect(expr).toBe(`((${DONUT_RADIUS} - ${DONUT_ADVANCED_LABEL_RING_GAP}) / (1 + 0.6))`);
  });

  test('should reserve room using the rich SegmentLabel ring gap when enabled', () => {
    const expr = getDonutOuterRadiusExpr({ ...defaultDonutOptions, segmentLabels: [{ swatch: true }] });
    expect(expr).toBe(`((${DONUT_RADIUS} - ${DONUT_ADVANCED_LABEL_RING_GAP}) / (1 + 0.6))`);
  });

  test('should use the semicircle base radius (full height/width) for a semicircle donut', () => {
    expect(getDonutOuterRadiusExpr({ ...defaultDonutOptions, variant: 'semicircle' })).toBe(DONUT_SEMICIRCLE_RADIUS);
  });

  test('should not reserve label space for a semicircle donut because its labels are omitted', () => {
    expect(
      getDonutOuterRadiusExpr({
        ...defaultDonutOptions,
        variant: 'semicircle',
        segmentLabels: [{ swatch: true }],
      })
    ).toBe(DONUT_SEMICIRCLE_RADIUS);
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
    const strokeWidth = getSliceStrokeWidthExpr(defaultDonutOptions, 'testName_sliceGap');
    const inset = `(testName_sliceGap - (${strokeWidth})) / 2`;
    expect(arcMark.encode?.update?.innerRadius).toEqual({
      signal: `(((min(width, height) / 2 - 2) - testName_ringWidth)) + (${inset})`,
    });
    expect(arcMark.encode?.update?.outerRadius).toEqual({
      signal: `((min(width, height) / 2 - 2)) - (${inset})`,
    });
  });

  test('should use a proportional ring when holeRatio is explicitly customized', () => {
    const options = { ...defaultDonutOptions, holeRatio: 0.5 };
    const arcMark = getArcMark(options);
    const strokeWidth = getSliceStrokeWidthExpr(options, 'testName_sliceGap');
    const inset = `(testName_sliceGap - (${strokeWidth})) / 2`;
    expect(arcMark.encode?.update?.innerRadius).toEqual({
      signal: `(0.5 * (min(width, height) / 2 - 2)) + (${inset})`,
    });
  });

  test('should not add the slice inset to a pie inner radius', () => {
    const options = { ...defaultDonutOptions, holeRatio: 0 };
    const arcMark = getArcMark(options);
    const strokeWidth = getSliceStrokeWidthExpr(options, 'testName_sliceGap');
    const inset = `(testName_sliceGap - (${strokeWidth})) / 2`;
    expect(arcMark.encode?.update).toHaveProperty('innerRadius', { value: 0 });
    expect(arcMark.encode?.update).toHaveProperty('outerRadius', {
      signal: `(${DONUT_RADIUS}) - (${inset})`,
    });
    expect(arcMark.encode?.update).toHaveProperty('strokeWidth', [
      { test: 'selectedItem === datum.rscMarkId', signal: getSliceStrokeWidthExpr(options, '2') },
      { signal: strokeWidth },
    ]);
  });

  test('should bevel pie stroke joins without changing gaps or selected outlines', () => {
    const options = { ...defaultDonutOptions, holeRatio: 0 };
    const arcMark = getArcMark(options);
    expect(arcMark.encode?.update).toHaveProperty('strokeJoin', { value: 'bevel' });
    expect(arcMark.encode?.update).toHaveProperty('strokeWidth', [
      { test: 'selectedItem === datum.rscMarkId', signal: '2' },
      { signal: 'testName_sliceGap' },
    ]);
    expect(getArcMark({ ...options, variant: 'semicircle' }).encode?.update).toHaveProperty('strokeJoin', {
      value: 'bevel',
    });
    expect(getArcMark(defaultDonutOptions).encode?.update).not.toHaveProperty('strokeJoin');
    expect(getArcMark({ ...defaultDonutOptions, holeRatio: 0.5 }).encode?.update).not.toHaveProperty('strokeJoin');
  });

  test('should use the per-tier fixed slice gap as the segment border width', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    expect(arcMark.encode?.update).not.toHaveProperty('padAngle');
    expect(arcMark.encode?.update?.stroke).toEqual([
      { test: 'selectedItem === datum.rscMarkId', value: 'static-blue' },
      { signal: 'chartBackgroundColor' },
    ]);
    expect(arcMark.encode?.update?.strokeWidth).toEqual([
      {
        test: 'selectedItem === datum.rscMarkId',
        signal:
          "min(2, max(0, (2 * (max(0, ((min(width, height) / 2 - 2) - testName_ringWidth))) * sin((min(PI, max(0, datum['testName_arcLength']))) / 2)) - 1))",
      },
      {
        signal:
          "min(testName_sliceGap, max(0, (2 * (max(0, ((min(width, height) / 2 - 2) - testName_ringWidth))) * sin((min(PI, max(0, datum['testName_arcLength']))) / 2)) - 1))",
      },
    ]);
  });

  test('should fade segments that do not match a hovered Legend entry', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, legendHighlightSignals: ['legend0_hoveredSeries'] });
    const opacity = arcMark.encode?.update?.opacity as { test?: string }[];
    expect(opacity).toHaveLength(5);
    expect(opacity[1]).toEqual({
      test: "isValid(legend0_hoveredSeries) && legend0_hoveredSeries !== datum.rscSeriesId",
      value: 0.2,
    });
    expect(opacity[2]).toHaveProperty('test', 'isValid(testName_hoveredItem)');
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

  test('should use the dark theme gray-400 for non-emphasized segments', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, colorScheme: 'dark', emphasizedItems: ['Chrome'] });
    expect(arcMark.encode?.enter?.fill).toEqual([
      {
        test: `indexof(["Chrome"], datum.testColor) < 0`,
        value: spectrum2Colors.dark['gray-400'],
      },
      { scale: 'color', field: 'testColor' },
    ]);
  });

  test('should restore categorical fill for the hovered emphasized segment', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, emphasizedItems: ['Chrome'], chartInspects: [{}] });
    expect(arcMark.encode?.update?.fill).toEqual([
      {
        test: 'isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId',
        scale: 'color',
        field: 'testColor',
      },
      {
        test: 'indexof(["Chrome"], datum.testColor) < 0',
        value: spectrum2Colors.light['gray-400'],
      },
      { scale: 'color', field: 'testColor' },
    ]);
  });

  test('should anchor at the vertical center for a circle donut', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    expect(arcMark.encode?.enter?.x).toEqual({ signal: 'width / 2' });
    expect(arcMark.encode?.enter?.y).toEqual({ signal: 'height / 2' });
  });

  test('should anchor at the bottom edge for a semicircle donut', () => {
    const arcMark = getArcMark({ ...defaultDonutOptions, variant: 'semicircle' });
    expect(arcMark.encode?.enter?.x).toEqual({ signal: 'width / 2' });
    expect(arcMark.encode?.enter?.y).toEqual({ signal: 'height' });
  });

  test('should reserve space below a semicircle for a summary delta', () => {
    const arcMark = getArcMark({
      ...defaultDonutOptions,
      variant: 'semicircle',
      donutSummaries: [{ delta: 0.025, label: 'Visitors' }],
    });
    expect(arcMark.encode?.enter?.y).toEqual({ signal: 'height - testName_summaryBottomOffset' });
  });

  test.each([
    [{ delta: 0.025 }, 'value and delta'],
    [{ delta: 0.025, hideValue: true, label: 'Visitors' }, 'label and delta'],
  ])('should remain bottom-anchored with only %s', (summary, _description) => {
    const arcMark = getArcMark({
      ...defaultDonutOptions,
      variant: 'semicircle',
      donutSummaries: [summary],
    });
    expect(arcMark.encode?.enter?.y).toEqual({ signal: 'height' });
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
    expect(emptyStateMark.encode?.enter?.endAngle).toEqual({ signal: '0 + 2 * PI' });
  });
  test('should mirror the semicircle sweep and bottom-edge anchor', () => {
    const emptyStateMark = getEmptyStateArcMark({ ...defaultDonutOptions, variant: 'semicircle' });
    expect(emptyStateMark.encode?.enter?.y).toEqual({ signal: 'height' });
    expect(emptyStateMark.encode?.enter?.startAngle).toEqual({ value: -Math.PI / 2 });
    expect(emptyStateMark.encode?.enter?.endAngle).toEqual({ signal: `${-Math.PI / 2} + PI` });
  });
  test('should reserve the same summary-delta space for the semicircle empty state', () => {
    const emptyStateMark = getEmptyStateArcMark({
      ...defaultDonutOptions,
      variant: 'semicircle',
      donutSummaries: [{ delta: 0.025, label: 'Visitors' }],
    });
    expect(emptyStateMark.encode?.enter?.y).toEqual({ signal: 'height - testName_summaryBottomOffset' });
  });
  test('should only be visible when the donut is in the empty state', () => {
    const emptyStateMark = getEmptyStateArcMark(defaultDonutOptions);
    expect(emptyStateMark.encode?.update?.opacity).toEqual([
      { test: getDonutEmptyStateTest('testName'), value: 1 },
      { value: 0 },
    ]);
  });
  test('should use the configured ring radii without per-datum slice clamping', () => {
    const emptyStateMark = getEmptyStateArcMark(defaultDonutOptions);
    expect(emptyStateMark.encode?.update?.innerRadius).toEqual({
      signal: getDonutInnerRadiusExpr(defaultDonutOptions),
    });
    expect(emptyStateMark.encode?.update?.outerRadius).toEqual({
      signal: getDonutOuterRadiusExpr(defaultDonutOptions),
    });
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
  test('should use a 1px gap for pies at every size tier', () => {
    const scale = getSliceGapScale({ ...defaultDonutOptions, holeRatio: 0 });
    expect(scale).toHaveProperty('range', DONUT_SLICE_GAPS.map(() => 1));
  });

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
