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
import { GroupMark } from 'vega';

import {
  DEFAULT_OPACITY_RULE,
  DRAW_IN_ANIM_T,
  DRAW_IN_ANIM_T_EASED,
  FADE_FACTOR,
  HISTOGRAM_COUNT,
  HISTOGRAM_CURVE_X,
  HISTOGRAM_CURVE_Y,
  HISTOGRAM_Y0,
  HISTOGRAM_Y1,
  MARK_ID,
  SELECTED_ITEM,
} from '@spectrum-charts/core-s2/constants';
import { spectrumColors } from '@spectrum-charts/core-s2/tokens';

import { getControlledHighlightedItemOpacityRule } from '../chartInspect/chartInspectUtils.js';
import {
  HISTOGRAM_OVERLAID_FILL_OPACITY,
  HISTOGRAM_SWEEP_STAGGER,
  addHistogramMarks,
  getBinInsetExpr,
  getCellInsetExpr,
  getHistogramBarMark,
  getHistogramBarSpan,
  getHistogramBinEncodings,
  getHistogramCellMark,
  getHistogramCornerRadiusEncodings,
  getHistogramDensityCurveMarks,
  getHistogramDrawInProgress,
  getHistogramFillOpacity,
  getHistogramOpacity,
  getHistogramSelectionEncodings,
  getHistogramValueEncodings,
  getHistogramValueScale,
  getHistogramXEncodings,
  isHistogramDrawInGrowing,
  isHistogramHorizontal,
} from './histogramMarkUtils.js';
import {
  colorSplitHistogramOptions,
  defaultHistogramOptions,
  histogram2DOptions,
  interactiveHistogramOptions,
} from './histogramTestUtils.js';

describe('addHistogramMarks()', () => {
  test('adds a group with the bar mark', () => {
    const marks = addHistogramMarks([], defaultHistogramOptions);
    expect(marks).toHaveLength(1);
    expect(marks[0].name).toBe('histogram0_group');
    expect(marks[0]).toHaveProperty('clip', true);
    const group = marks[0] as GroupMark;
    expect(group.marks).toHaveLength(1);
    expect(group.marks?.[0]).toStrictEqual(getHistogramBarMark(defaultHistogramOptions));
  });

  test('adds the cell mark for 2D histograms', () => {
    const group = addHistogramMarks([], histogram2DOptions)[0] as GroupMark;
    expect(group.marks?.[0]).toStrictEqual(getHistogramCellMark(histogram2DOptions));
  });
});

describe('getHistogramBarMark()', () => {
  test('draws a rect per bin from the bins data', () => {
    const mark = getHistogramBarMark(defaultHistogramOptions);
    expect(mark).toHaveProperty('type', 'rect');
    expect(mark).toHaveProperty('from', { data: 'histogram0_bins' });
    expect(mark).toHaveProperty('key', MARK_ID);
    expect(mark.encode?.update).toHaveProperty('fill', { value: expect.any(String) });
    expect(mark.encode?.update?.tooltip).toBeUndefined();
  });

  test('fills from the color scale for a color key', () => {
    const mark = getHistogramBarMark(colorSplitHistogramOptions);
    expect(mark.encode?.update).toHaveProperty('fill', { scale: 'color', field: 'series' });
  });

  test('adds the inspect tooltip', () => {
    const mark = getHistogramBarMark(interactiveHistogramOptions);
    expect(mark.encode?.update).toHaveProperty('tooltip', { signal: "inspectDatum(datum, 'histogram0')" });
  });

  test('shows a pointer for popovers', () => {
    const mark = getHistogramBarMark({ ...defaultHistogramOptions, chartPopovers: [{}] });
    expect(mark.encode?.update).toHaveProperty('cursor', { value: 'pointer' });
  });
});

describe('getHistogramXEncodings()', () => {
  test('spans the bin, inset by half the gap', () => {
    const inset = getBinInsetExpr('xLinear', 'binStart', 'binEnd');
    expect(getHistogramXEncodings()).toStrictEqual({
      x: { signal: `scale('xLinear', datum.binStart) + (${inset})` },
      x2: { signal: `scale('xLinear', datum.binEnd) - (${inset})` },
    });
  });

  test('shrinks the inset for narrow bins', () => {
    expect(getBinInsetExpr('xLinear', 'binStart', 'binEnd')).toBe(
      "min(1, abs(scale('xLinear', datum.binEnd) - scale('xLinear', datum.binStart)) / 4)"
    );
  });
});

describe('getHistogramValueEncodings()', () => {
  test('spans from the bar bottom to its top', () => {
    expect(getHistogramValueEncodings(defaultHistogramOptions)).toStrictEqual({
      y: { scale: 'yLinear', field: HISTOGRAM_Y1 },
      y2: { scale: 'yLinear', field: HISTOGRAM_Y0 },
    });
  });

  test('stays at full height for the fade draw-in', () => {
    expect(
      getHistogramValueEncodings({ ...defaultHistogramOptions, isDrawInAnimate: true, drawInEffect: 'fade' })
    ).toStrictEqual(getHistogramValueEncodings(defaultHistogramOptions));
  });

  test('grows from the baseline during draw-in', () => {
    expect(getHistogramValueEncodings({ ...defaultHistogramOptions, isDrawInAnimate: true })).toStrictEqual({
      y: { signal: `scale('yLinear', datum.${HISTOGRAM_Y1} * ${DRAW_IN_ANIM_T_EASED})` },
      y2: { signal: `scale('yLinear', datum.${HISTOGRAM_Y0} * ${DRAW_IN_ANIM_T_EASED})` },
    });
  });
});

describe('getHistogramCornerRadiusEncodings()', () => {
  test('rounds the top of non-empty bars', () => {
    const { cornerRadiusTopLeft } = getHistogramCornerRadiusEncodings(defaultHistogramOptions);
    expect(cornerRadiusTopLeft).toStrictEqual([
      {
        test: `datum.${HISTOGRAM_Y1} > 0`,
        signal: `min(4, ((${getHistogramBarSpan(defaultHistogramOptions)[1]}) - (${
          getHistogramBarSpan(defaultHistogramOptions)[0]
        })) / 4)`,
      },
      { value: 0 },
    ]);
  });

  test('rounds only the top segment of a stack', () => {
    const { cornerRadiusTopRight } = getHistogramCornerRadiusEncodings(colorSplitHistogramOptions);
    expect(cornerRadiusTopRight).toHaveProperty(
      [0, 'test'],
      `datum.${HISTOGRAM_Y1} > datum.${HISTOGRAM_Y0} && datum.${HISTOGRAM_Y1} === datum.histogram0_stackTop`
    );
  });
});

describe('getHistogramOpacity()', () => {
  test('only fades for controlled highlighting when not interactive', () => {
    expect(getHistogramOpacity(defaultHistogramOptions)).toStrictEqual([
      getControlledHighlightedItemOpacityRule(MARK_ID),
      DEFAULT_OPACITY_RULE,
    ]);
  });

  test('fades other bins while one is hovered', () => {
    expect(getHistogramOpacity(interactiveHistogramOptions)[0]).toStrictEqual({
      test: 'isValid(histogram0_hoveredItem)',
      signal: `histogram0_hoveredItem.${MARK_ID} === datum.${MARK_ID} ? 1 : ${FADE_FACTOR}`,
    });
  });

  test('fades other bins while a popover is open', () => {
    const rules = getHistogramOpacity({ ...defaultHistogramOptions, chartPopovers: [{}] });
    expect(rules).toContainEqual({
      test: `isValid(${SELECTED_ITEM})`,
      signal: `${SELECTED_ITEM} === datum.${MARK_ID} ? 1 : ${FADE_FACTOR}`,
    });
    expect(rules.at(-1)).toStrictEqual(DEFAULT_OPACITY_RULE);
  });
});

describe('getHistogramSelectionEncodings()', () => {
  test('adds nothing without a popover', () => {
    expect(getHistogramSelectionEncodings(defaultHistogramOptions)).toStrictEqual({});
  });

  test('outlines the selected bin', () => {
    const encodings = getHistogramSelectionEncodings({ ...defaultHistogramOptions, chartPopovers: [{}] });
    expect(encodings).toHaveProperty(['stroke', 0, 'value'], spectrumColors.light['static-blue']);
    expect(encodings).toHaveProperty(['strokeWidth', 0, 'value'], 2);
    expect(encodings).toHaveProperty(['stroke', 1, 'value'], 'transparent');
  });
});

describe('getHistogramFillOpacity()', () => {
  test('is opaque by default', () => {
    expect(getHistogramFillOpacity(defaultHistogramOptions)).toStrictEqual({ value: 1 });
  });

  test('is opaque for stacked series', () => {
    expect(getHistogramFillOpacity(colorSplitHistogramOptions)).toStrictEqual({ value: 1 });
  });

  test('is semi-transparent for overlaid series', () => {
    expect(getHistogramFillOpacity({ ...colorSplitHistogramOptions, layout: 'overlaid' })).toStrictEqual({
      value: HISTOGRAM_OVERLAID_FILL_OPACITY,
    });
  });

  test('fades bars in for the fade draw-in', () => {
    const options = { ...defaultHistogramOptions, isDrawInAnimate: true, drawInEffect: 'fade' as const };
    expect(getHistogramFillOpacity(options)).toStrictEqual({ signal: `1 * ${DRAW_IN_ANIM_T_EASED}` });
  });

  test('stays opaque while bars grow', () => {
    expect(getHistogramFillOpacity({ ...defaultHistogramOptions, isDrawInAnimate: true })).toStrictEqual({ value: 1 });
  });

  test('fades 2D cells in from left to right for the sweep draw-in', () => {
    const options = { ...histogram2DOptions, isDrawInAnimate: true, drawInEffect: 'sweep' as const };
    expect(getHistogramFillOpacity(options)).toStrictEqual({ signal: `1 * ${getHistogramDrawInProgress(options)}` });
  });
});

describe('getHistogramDrawInProgress()', () => {
  test('uses the shared eased progress for grow and fade', () => {
    expect(getHistogramDrawInProgress(defaultHistogramOptions)).toBe(DRAW_IN_ANIM_T_EASED);
    expect(getHistogramDrawInProgress({ ...defaultHistogramOptions, drawInEffect: 'fade' })).toBe(DRAW_IN_ANIM_T_EASED);
  });

  test('staggers each bin by its x position for sweep', () => {
    const progress = getHistogramDrawInProgress({ ...defaultHistogramOptions, drawInEffect: 'sweep' });
    expect(progress).toBe(
      `cubicBezier(0.45, 0, 0.4, 1, clamp((${DRAW_IN_ANIM_T} - clamp(scale('xLinear', datum.binStart) / max(width, 1), 0, 1) * ${HISTOGRAM_SWEEP_STAGGER}) / 0.4, 0, 1))`
    );
  });
});

describe('isHistogramDrawInGrowing()', () => {
  test.each([
    [false, 'grow', false],
    [true, 'grow', true],
    [true, 'sweep', true],
    [true, 'fade', false],
  ] as const)('animated %s with %s grows: %s', (isDrawInAnimate, drawInEffect, expected) => {
    expect(isHistogramDrawInGrowing({ ...defaultHistogramOptions, isDrawInAnimate, drawInEffect })).toBe(expected);
  });
});

describe('getCellInsetExpr()', () => {
  const baseInset = getBinInsetExpr('xLinear', 'binStart', 'binEnd');

  test('uses the gap inset without a growing draw-in', () => {
    expect(getCellInsetExpr(histogram2DOptions, 'xLinear', 'binStart', 'binEnd')).toBe(baseInset);
    const sweep = { ...histogram2DOptions, isDrawInAnimate: true, drawInEffect: 'sweep' as const };
    expect(getCellInsetExpr(sweep, 'xLinear', 'binStart', 'binEnd')).toBe(baseInset);
  });

  test('shrinks cells toward their centers while they grow in', () => {
    const inset = getCellInsetExpr({ ...histogram2DOptions, isDrawInAnimate: true }, 'xLinear', 'binStart', 'binEnd');
    expect(inset).toContain(`(1 - ${DRAW_IN_ANIM_T_EASED})`);
    expect(inset.startsWith(baseInset)).toBe(true);
  });
});

describe('getHistogramCellMark()', () => {
  test('colors cells by count', () => {
    const mark = getHistogramCellMark(histogram2DOptions);
    expect(mark.encode?.update).toHaveProperty('fill', { scale: 'histogram0_cellColor', field: HISTOGRAM_COUNT });
  });

  test('spans each cell between its y bin edges', () => {
    const mark = getHistogramCellMark(histogram2DOptions);
    const inset = getBinInsetExpr('yLinear', 'yBinStart', 'yBinEnd');
    expect(mark.encode?.update).toHaveProperty('y', { signal: `scale('yLinear', datum.yBinEnd) + (${inset})` });
    expect(mark.encode?.update).toHaveProperty('y2', { signal: `scale('yLinear', datum.yBinStart) - (${inset})` });
  });
});

describe('orientation', () => {
  const horizontal = { ...defaultHistogramOptions, orientation: 'horizontal' as const };

  test('bins along y and grows bars along x when horizontal', () => {
    expect(isHistogramHorizontal(horizontal)).toBe(true);
    expect(getHistogramValueScale(horizontal)).toBe('xLinear');
    expect(Object.keys(getHistogramBinEncodings(horizontal))).toStrictEqual(['y', 'y2']);
    expect(getHistogramValueEncodings(horizontal)).toStrictEqual({
      x2: { scale: 'xLinear', field: HISTOGRAM_Y1 },
      x: { scale: 'xLinear', field: HISTOGRAM_Y0 },
    });
  });

  test('rounds the right corners when horizontal', () => {
    expect(Object.keys(getHistogramCornerRadiusEncodings(horizontal))).toStrictEqual([
      'cornerRadiusTopRight',
      'cornerRadiusBottomRight',
    ]);
  });

  test('ignores orientation for 2D histograms', () => {
    expect(isHistogramHorizontal({ ...histogram2DOptions, orientation: 'horizontal' })).toBe(false);
  });

  test('sweeps from the bottom when horizontal', () => {
    expect(getHistogramDrawInProgress({ ...horizontal, drawInEffect: 'sweep' })).toContain('height - scale');
  });
});

describe('getHistogramBarSpan()', () => {
  test('spans the whole bin without dodging', () => {
    const [low, high] = getHistogramBarSpan(defaultHistogramOptions);
    expect(low).toBe("min(scale('xLinear', datum.binStart), scale('xLinear', datum.binEnd))");
    expect(high).toContain(`${low} + abs(`);
  });

  test('splits the bin between dodged series', () => {
    const [low, high] = getHistogramBarSpan({ ...colorSplitHistogramOptions, layout: 'dodged' });
    expect(low).toContain('datum.histogram0_dodgeIndex / datum.histogram0_dodgeCount');
    expect(high).toContain('(datum.histogram0_dodgeIndex + 1) / datum.histogram0_dodgeCount');
  });
});

describe('getHistogramDensityCurveMarks()', () => {
  test('adds nothing without densityCurve', () => {
    expect(getHistogramDensityCurveMarks(defaultHistogramOptions)).toStrictEqual([]);
  });

  test('draws one neutral line over a single series', () => {
    const marks = getHistogramDensityCurveMarks({ ...defaultHistogramOptions, densityCurve: true });
    expect(marks).toHaveLength(1);
    expect(marks[0]).toMatchObject({ name: 'histogram0_densityCurve', type: 'line', interactive: false });
    expect(marks[0].from).toStrictEqual({ data: 'histogram0_curveData' });
    expect(marks[0].encode?.update).toHaveProperty('y', { scale: 'yLinear', field: HISTOGRAM_CURVE_Y });
  });

  test('draws one line per overlaid series in its series color', () => {
    const marks = getHistogramDensityCurveMarks({
      ...colorSplitHistogramOptions,
      layout: 'overlaid',
      densityCurve: true,
    }) as GroupMark[];
    expect(marks[0]).toMatchObject({
      type: 'group',
      from: { facet: { name: 'histogram0_curveDataFacet', data: 'histogram0_curveData', groupby: ['series'] } },
    });
    expect(marks[0].marks?.[0].encode?.update).toHaveProperty('stroke', { scale: 'color', field: 'series' });
  });

  test('swaps channels when horizontal', () => {
    const marks = getHistogramDensityCurveMarks({
      ...defaultHistogramOptions,
      densityCurve: true,
      orientation: 'horizontal',
    });
    expect(marks[0].encode?.update).toHaveProperty('x', { scale: 'xLinear', field: HISTOGRAM_CURVE_Y });
    expect(marks[0].encode?.update).toHaveProperty('y', { scale: 'yLinear', field: HISTOGRAM_CURVE_X });
  });

  test('is added to the histogram group', () => {
    const group = addHistogramMarks([], { ...defaultHistogramOptions, densityCurve: true })[0] as GroupMark;
    expect(group.marks?.map(({ name }) => name)).toStrictEqual(['histogram0', 'histogram0_densityCurve']);
  });
});

describe('weighted 2D cells', () => {
  test('color by the summed weight', () => {
    const mark = getHistogramCellMark({ ...histogram2DOptions, weight: 'revenue' });
    expect(mark.encode?.update).toHaveProperty('fill', { scale: 'histogram0_cellColor', field: 'sum' });
  });
});
