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
  DONUT_LABEL_RING_GAPS,
  DONUT_RADIUS,
  DONUT_RING_WIDTHS,
  DONUT_SEMICIRCLE_RADIUS,
  DONUT_SIZE_TIER_LABELED_CHART_SIZES,
  DONUT_SIZE_TIER_UNLABELED_CHART_SIZES,
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SLICE_GAPS,
  FILTERED_TABLE,
} from '@spectrum-charts/core-s2/constants';
import { spectrum2Colors } from '@spectrum-charts/core-s2/tokens';

import { donutSliceStrokeWidth } from '../expressionFunctions/expressionFunctions.js';
import { DonutSpecOptions } from '../types/index.js';
import { defaultDonutOptions } from './donutTestUtils.js';
import {
  getArcMark,
  getDonutEmptyStateTest,
  getDonutInnerRadiusExpr,
  getDonutOuterRadiusExpr,
  getDonutRadiusSignals,
  getDonutSweepExpr,
  getEmptyStateArcMark,
  getLabelRingGapSignals,
  getRingWidthSignal,
  getSizeTierScale,
  getSizeTierSignal,
  getSizeTierValueExpr,
  getSliceGapSignal,
  getSliceStrokeWidthExpr,
  getSumData,
} from './donutUtils.js';

const evaluateExpr = (expr: string, scope: Record<string, unknown>): number =>
  // eslint-disable-next-line no-new-func
  new Function(...Object.keys(scope), 'MAX_VALUE', `return ${expr};`)(...Object.values(scope), Number.MAX_VALUE);

/** Evaluates the outer then inner radius signals, returning the scope with both radii added. */
const evaluateRadiusSignals = (options: DonutSpecOptions, scope: Record<string, unknown>): Record<string, number> =>
  (getDonutRadiusSignals(options) as { name: string; update: string }[]).reduce<Record<string, number>>(
    (acc, { name, update }) => ({ ...acc, [name]: evaluateExpr(update, acc) }),
    scope as Record<string, number>
  );

describe('getDonutEmptyStateTest()', () => {
  test('should test for empty data and a metric sum of 0', () => {
    const test = getDonutEmptyStateTest('testName');
    expect(test).toBe(`length(data('${FILTERED_TABLE}')) === 0 || !data('testName_sumData')[0]['sum']`);
  });
});

describe('getDonutSweepExpr()', () => {
  test('should sweep a full circle', () => {
    expect(getDonutSweepExpr({ variant: 'circle' })).toBe('2 * PI');
  });

  test('should sweep half a circle for a semicircle', () => {
    expect(getDonutSweepExpr({ variant: 'semicircle' })).toBe('PI');
  });
});

describe('getDonutOuterRadiusExpr()', () => {
  const getOuterRadiusUpdate = (options: DonutSpecOptions) => (getDonutRadiusSignals(options)[0] as { update: string }).update;

  test('should return the outer radius signal name', () => {
    expect(getDonutOuterRadiusExpr(defaultDonutOptions)).toBe('testName_outerRadius');
  });

  test('should return the raw donut radius when no labels are present', () => {
    expect(getOuterRadiusUpdate(defaultDonutOptions)).toBe(DONUT_RADIUS);
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
      const scope = evaluateRadiusSignals(options, {
        width: size,
        height: size,
        min: Math.min,
        testName_ringWidth: 28,
        testName_sizeTier: 4,
        testName_labelRingGap: 15,
      } as Record<string, unknown>);
      return evaluateExpr(expression, {
        ...scope,
        datum: { testName_startAngle: 0, testName_endAngle: arcLength },
        testName_sliceGap: sliceGap,
        donutSliceStrokeWidth,
      });
    };

    test('should pass the inner radius signal and slice angles to donutSliceStrokeWidth', () => {
      expect(getSliceStrokeWidthExpr(defaultDonutOptions, 'testName_sliceGap')).toBe(
        "donutSliceStrokeWidth(testName_sliceGap, testName_innerRadius, datum['testName_startAngle'], datum['testName_endAngle'])"
      );
    });

    test('should only pass the draw-in cutoff when isDrawInAnimate', () => {
      expect(getSliceStrokeWidthExpr(defaultDonutOptions, '2')).not.toContain('drawInAnimCutoff');
      expect(getSliceStrokeWidthExpr({ ...defaultDonutOptions, isDrawInAnimate: true }, '2')).toBe(
        "donutSliceStrokeWidth(2, testName_innerRadius, datum['testName_startAngle'], datum['testName_endAngle'], testName_drawInAnimCutoff)"
      );
    });

    test('should return the requested width unchanged for pies, even when animating', () => {
      expect(getSliceStrokeWidthExpr({ ...defaultDonutOptions, holeRatio: 0, isDrawInAnimate: true }, '2')).toBe('2');
    });

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
      getOuterRadiusUpdate({ ...defaultDonutOptions, isBoolean: true, segmentLabels: [{ swatch: true }] })
    ).toBe(DONUT_RADIUS);
  });

  test('should reserve room using the label ring gap signal when SegmentLabel is present', () => {
    const expr = getOuterRadiusUpdate({ ...defaultDonutOptions, segmentLabels: [{}] });
    expect(expr).toBe(`min((${DONUT_RADIUS} - testName_labelRingGap) / (1 + 0.6), [120, 160, 200, 400, MAX_VALUE][testName_sizeTier] / 2)`);
  });

  test('should reserve room using the label ring gap signal for rich SegmentLabels', () => {
    const expr = getOuterRadiusUpdate({ ...defaultDonutOptions, segmentLabels: [{ swatch: true }] });
    expect(expr).toBe(`min((${DONUT_RADIUS} - testName_labelRingGap) / (1 + 0.6), [120, 160, 200, 400, MAX_VALUE][testName_sizeTier] / 2)`);
  });

  test('should use the semicircle base radius (full height/width) for a semicircle donut', () => {
    expect(getOuterRadiusUpdate({ ...defaultDonutOptions, variant: 'semicircle' })).toBe(DONUT_SEMICIRCLE_RADIUS);
  });

  test('should not reserve label space for a semicircle donut because its labels are omitted', () => {
    expect(
      getOuterRadiusUpdate({
        ...defaultDonutOptions,
        variant: 'semicircle',
        segmentLabels: [{ swatch: true }],
      })
    ).toBe(DONUT_SEMICIRCLE_RADIUS);
  });
});

describe('getSizeTierScale() / getSizeTierSignal()', () => {
  const evaluateTier = (options: DonutSpecOptions, width: number, height = width): number => {
    const { domain, range } = getSizeTierScale(options) as { domain: number[]; range: number[] };
    const scale = (_: string, value: number) => range[domain.filter((breakpoint) => value >= breakpoint).length];
    return evaluateExpr((getSizeTierSignal(options) as { update: string }).update, { width, height, min: Math.min, scale });
  };

  describe('without label space', () => {
    test('should map chart size to the tier using the original diameter breakpoints', () => {
      expect(DONUT_SIZE_TIER_UNLABELED_CHART_SIZES).toEqual([124, 164, 204, 404]);
      for (const options of [defaultDonutOptions, { ...defaultDonutOptions, isBoolean: true, segmentLabels: [{}] }]) {
        expect(getSizeTierScale(options)).toEqual({
          name: 'testName_sizeTierScale',
          type: 'threshold',
          domain: DONUT_SIZE_TIER_UNLABELED_CHART_SIZES,
          range: [0, 1, 2, 3, 4],
        });
        expect(getSizeTierSignal(options)).toEqual({
          name: 'testName_sizeTier',
          update: "scale('testName_sizeTierScale', min(width, height))",
        });
      }
    });

    test('should switch tiers exactly when the donut diameter reaches each cutpoint', () => {
      DONUT_SIZE_TIER_CUTPOINTS.forEach((cutpoint, index) => {
        // diameter = chart size - 4 (DONUT_RADIUS's 2px padding on each side)
        expect(evaluateTier(defaultDonutOptions, cutpoint + 3, 1000)).toBe(index);
        expect(evaluateTier(defaultDonutOptions, cutpoint + 4, 1000)).toBe(index + 1);
      });
    });

    test('should use twice the height for a semicircle', () => {
      const options: DonutSpecOptions = { ...defaultDonutOptions, variant: 'semicircle' };
      expect(getSizeTierSignal(options)).toHaveProperty('update', "scale('testName_sizeTierScale', min(width, 2 * height))");
      // a 404 x 202 semicircle has a 400px diameter
      expect(evaluateTier(options, 404, 202)).toBe(4);
      expect(evaluateTier(options, 404, 201)).toBe(3);
    });
  });

  describe('with label space', () => {
    const labeledOptions = { ...defaultDonutOptions, segmentLabels: [{}] };
    const getOuterDiameter = (size: number): number => {
      const testName_sizeTier = evaluateTier(labeledOptions, size);
      const testName_labelRingGap = DONUT_LABEL_RING_GAPS[testName_sizeTier];
      const { testName_outerRadius } = evaluateRadiusSignals(labeledOptions, {
        width: size,
        height: size,
        min: Math.min,
        testName_sizeTier,
        testName_labelRingGap,
        testName_ringWidth: 0,
      } as Record<string, unknown>);
      return 2 * testName_outerRadius;
    };

    test('should map chart size to the tier using the labeled breakpoints', () => {
      expect(DONUT_SIZE_TIER_LABELED_CHART_SIZES).toEqual([206, 280, 344, 674]);
      expect(getSizeTierScale(labeledOptions)).toHaveProperty('domain', DONUT_SIZE_TIER_LABELED_CHART_SIZES);
    });

    test.each([
      [150, 0],
      [250, 1],
      [300, 2],
      [400, 3],
      [700, 4],
    ])('should resolve chart size %s to tier %s', (size, tier) => {
      expect(evaluateTier(labeledOptions, size)).toBe(tier);
    });

    test.each(DONUT_SIZE_TIER_LABELED_CHART_SIZES.map((breakpoint, index) => [breakpoint, DONUT_SIZE_TIER_CUTPOINTS[index]]))(
      'should switch tiers and reach exactly the cutpoint at chart size %s (%spx)',
      (breakpoint, cutpoint) => {
        const tier = DONUT_SIZE_TIER_CUTPOINTS.indexOf(cutpoint) + 1;
        expect(evaluateTier(labeledOptions, breakpoint - 1)).toBe(tier - 1);
        expect(evaluateTier(labeledOptions, breakpoint)).toBe(tier);
        expect(getOuterDiameter(breakpoint)).toBe(cutpoint);
      }
    );

    test('should never let a tier diameter overlap the next tier', () => {
      for (let size = 150; size <= 800; size += 0.5) {
        const tier = evaluateTier(labeledOptions, size);
        const diameter = getOuterDiameter(size);
        expect(diameter).toBeLessThanOrEqual([...DONUT_SIZE_TIER_CUTPOINTS, Infinity][tier]);
        expect(diameter).toBeGreaterThanOrEqual([0, ...DONUT_SIZE_TIER_CUTPOINTS][tier]);
      }
    });

    test('should pause the donut at the cutpoint when the next tier has a bigger gap', () => {
      // S -> M steps the gap from 5 to 10, so the donut holds at 160 until the chart reaches 280
      expect(getOuterDiameter(270)).toBe(160);
      expect(getOuterDiameter(279)).toBe(160);
      expect(evaluateTier(labeledOptions, 279)).toBe(1);
    });
  });
});

describe('getSizeTierValueExpr()', () => {
  test('should index the values by the size tier signal', () => {
    expect(getSizeTierValueExpr('testName', [1, 2, 3, 4, 5])).toBe('[1, 2, 3, 4, 5][testName_sizeTier]');
  });
});

describe('getLabelRingGapSignals()', () => {
  test('should not add a signal without segment labels', () => {
    expect(getLabelRingGapSignals(defaultDonutOptions)).toEqual([]);
  });

  test('should look up the gap from the size tier', () => {
    expect(DONUT_LABEL_RING_GAPS).toEqual([5, 5, 10, 10, 15]);
    expect(getLabelRingGapSignals({ ...defaultDonutOptions, segmentLabels: [{}] })).toEqual([
      { name: 'testName_labelRingGap', update: '[5, 5, 10, 10, 15][testName_sizeTier]' },
    ]);
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
      signal: `(testName_innerRadius) + (${inset})`,
    });
    expect(arcMark.encode?.update?.outerRadius).toEqual({
      signal: `(testName_outerRadius) - (${inset})`,
    });
    expect(getDonutRadiusSignals(defaultDonutOptions)[1]).toHaveProperty(
      'update',
      '(testName_outerRadius - testName_ringWidth)'
    );
  });

  test('should use a proportional ring when holeRatio is explicitly customized', () => {
    const options = { ...defaultDonutOptions, holeRatio: 0.5 };
    const arcMark = getArcMark(options);
    const strokeWidth = getSliceStrokeWidthExpr(options, 'testName_sliceGap');
    const inset = `(testName_sliceGap - (${strokeWidth})) / 2`;
    expect(arcMark.encode?.update?.innerRadius).toEqual({
      signal: `(testName_innerRadius) + (${inset})`,
    });
    expect(getDonutRadiusSignals(options)[1]).toHaveProperty('update', '0.5 * testName_outerRadius');
  });

  test('should not add the slice inset to a pie inner radius', () => {
    const options = { ...defaultDonutOptions, holeRatio: 0 };
    const arcMark = getArcMark(options);
    const strokeWidth = getSliceStrokeWidthExpr(options, 'testName_sliceGap');
    const inset = `(testName_sliceGap - (${strokeWidth})) / 2`;
    expect(arcMark.encode?.update).toHaveProperty('innerRadius', { value: 0 });
    expect(arcMark.encode?.update).toHaveProperty('outerRadius', {
      signal: `(testName_outerRadius) - (${inset})`,
    });
    expect(getDonutRadiusSignals(options)[0]).toHaveProperty('update', DONUT_RADIUS);
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
          "donutSliceStrokeWidth(2, testName_innerRadius, datum['testName_startAngle'], datum['testName_endAngle'])",
      },
      {
        signal:
          "donutSliceStrokeWidth(testName_sliceGap, testName_innerRadius, datum['testName_startAngle'], datum['testName_endAngle'])",
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

describe('getRingWidthSignal()', () => {
  test('should resolve ring width from the size tier', () => {
    expect(getRingWidthSignal(defaultDonutOptions)).toEqual({
      name: 'testName_ringWidth',
      update: `[${DONUT_RING_WIDTHS.join(', ')}][testName_sizeTier]`,
    });
  });
});

describe('getSliceGapSignal()', () => {
  test('should resolve the slice gap from the size tier', () => {
    expect(getSliceGapSignal(defaultDonutOptions)).toEqual({
      name: 'testName_sliceGap',
      update: `[${DONUT_SLICE_GAPS.join(', ')}][testName_sizeTier]`,
    });
  });

  test('should use a 1px gap for pies at every size tier', () => {
    expect(getSliceGapSignal({ ...defaultDonutOptions, holeRatio: 0 })).toHaveProperty('update', '1');
  });
});

describe('getDonutInnerRadiusExpr()', () => {
  const getInnerRadiusUpdate = (options: DonutSpecOptions) => (getDonutRadiusSignals(options)[1] as { update: string }).update;

  test('should return the inner radius signal name', () => {
    expect(getDonutInnerRadiusExpr(defaultDonutOptions)).toBe('testName_innerRadius');
  });

  test('should use the fixed per-tier ring width at the default holeRatio', () => {
    expect(getInnerRadiusUpdate(defaultDonutOptions)).toBe('(testName_outerRadius - testName_ringWidth)');
  });

  test('should use a proportional ring when holeRatio is explicitly customized', () => {
    expect(getInnerRadiusUpdate({ ...defaultDonutOptions, holeRatio: 0.5 })).toBe('0.5 * testName_outerRadius');
  });
});

describe('getDonutRadiusSignals()', () => {
  test('should resolve the outer radius before the inner radius at the default holeRatio', () => {
    expect(getDonutRadiusSignals(defaultDonutOptions)).toEqual([
      { name: 'testName_outerRadius', update: DONUT_RADIUS },
      { name: 'testName_innerRadius', update: '(testName_outerRadius - testName_ringWidth)' },
    ]);
  });

  test('should use a proportional inner radius when holeRatio is customized', () => {
    expect(getDonutRadiusSignals({ ...defaultDonutOptions, holeRatio: 0.5 })).toEqual([
      { name: 'testName_outerRadius', update: DONUT_RADIUS },
      { name: 'testName_innerRadius', update: '0.5 * testName_outerRadius' },
    ]);
  });

  test('should reserve label space in the outer radius when segment labels are present', () => {
    expect(getDonutRadiusSignals({ ...defaultDonutOptions, segmentLabels: [{}] })).toEqual([
      {
        name: 'testName_outerRadius',
        update: `min((${DONUT_RADIUS} - testName_labelRingGap) / (1 + 0.6), [120, 160, 200, 400, MAX_VALUE][testName_sizeTier] / 2)`,
      },
      { name: 'testName_innerRadius', update: '(testName_outerRadius - testName_ringWidth)' },
    ]);
  });

  test('should evaluate the inner radius from the evaluated outer radius', () => {
    const radii = evaluateRadiusSignals(defaultDonutOptions, { width: 364, height: 364, min: Math.min, testName_ringWidth: 28 });
    expect(radii.testName_outerRadius).toBe(180);
    expect(radii.testName_innerRadius).toBe(152);
  });
});
