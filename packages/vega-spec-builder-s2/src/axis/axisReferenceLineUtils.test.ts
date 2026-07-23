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
  CHART_SIZE_BREAKPOINTS,
  CHART_SIZE_FONT_SIZE,
  CHART_SIZE_STROKE_WIDTH,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_FONT_COLOR,
  DEFAULT_GRANULARITY,
  DEFAULT_LABEL_ALIGN,
  DEFAULT_LABEL_FONT_WEIGHT,
  DEFAULT_LABEL_ORIENTATION,
  REFERENCE_LINE_END_CAP_PATHS,
  REFERENCE_LINE_LABEL_BACKGROUND_STROKE,
  REFERENCE_LINE_LABEL_BACKGROUND_STROKE_WIDTH,
  REFERENCE_LINE_LABEL_FONT_WEIGHT,
  REFERENCE_LINE_LABEL_OFFSET_FROM_LINE,
  REFERENCE_LINE_AUTO_RULE_X2_OFFSET,
  REFERENCE_LINE_AUTO_RULE_X_START,
  REFERENCE_LINE_END_CAP_ANCHOR_OFFSET,
  REFERENCE_LINE_RULE_X2_OFFSET,
  REFERENCE_LINE_RULE_X_START,
  REFERENCE_LINE_SECONDARY_COLORS,
  REFERENCE_LINE_SECONDARY_STROKE_WIDTH,
  REFERENCE_LINE_SIZE_STROKE_WIDTHS,
  REFERENCE_LINE_START_CAP_PATHS,
} from '@spectrum-charts/constants';
import { spectrum2Colors } from '@spectrum-charts/themes';

import { AxisSpecOptions, ReferenceLineSpecOptions } from '../types';
import {
  getPositionEncoding,
  getReferenceLineEndCapMark,
  getReferenceLineMarks,
  getReferenceLineRuleMark,
  getReferenceLineStartCapMark,
  getReferenceLineTextMark,
  getReferenceLines,
  scaleTypeSupportsReferenceLines,
} from './axisReferenceLineUtils';

const defaultReferenceLineOptions: ReferenceLineSpecOptions = {
  value: 10,
  colorScheme: DEFAULT_COLOR_SCHEME,
  name: 'axis0ReferenceLine0',
};

/** Base axis options for a vertical (left) axis — the only axis S2 supports reference lines on */
const defaultAxisOptions: AxisSpecOptions = {
  axisAnnotations: [],
  axisThumbnails: [],
  baseline: false,
  baselineOffset: 0,
  colorScheme: DEFAULT_COLOR_SCHEME,
  granularity: DEFAULT_GRANULARITY,
  grid: false,
  hideDefaultLabels: false,
  index: 0,
  labelAlign: DEFAULT_LABEL_ALIGN,
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  labelOrientation: DEFAULT_LABEL_ORIENTATION,
  labels: [],
  name: 'axis0',
  numberFormat: 'shortNumber',
  position: 'left',
  referenceLines: [defaultReferenceLineOptions],
  scaleType: 'linear',
  subLabels: [],
  ticks: false,
};

const defaultYPositionEncoding = { scale: 'yLinear', value: 10 };

describe('getReferenceLines()', () => {
  test('should return the options for all reference lines', () => {
    const referenceLines = getReferenceLines({
      ...defaultAxisOptions,
      referenceLines: [{ value: 1 }, { value: 0 }],
    });

    expect(referenceLines).toHaveLength(2);
    expect(referenceLines[0]).toHaveProperty('value', 1);
    expect(referenceLines[1]).toHaveProperty('value', 0);
  });

  test('should return an empty array if there are no referenceLines', () => {
    expect(getReferenceLines({ ...defaultAxisOptions, axisAnnotations: [{}], referenceLines: [] })).toHaveLength(0);
  });
});

describe('scaleTypeSupportsRefenceLines()', () => {
  test('should identify supported and unsupported scaleTypes', () => {
    expect(scaleTypeSupportsReferenceLines('linear')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('point')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('time')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('utc')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('band')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('quantile')).toBe(false);
  });
});

describe('getPositionEncoding()', () => {
  test('creates the correct mark when value is a string', () => {
    expect(
      getPositionEncoding(defaultAxisOptions, { ...defaultReferenceLineOptions, value: 'test' }, 'yLinear')
    ).toStrictEqual({ scale: 'yLinear', value: 'test' });
  });

  test('creates the correct mark when value is a number', () => {
    expect(
      getPositionEncoding(defaultAxisOptions, { ...defaultReferenceLineOptions, value: 10 }, 'yLinear')
    ).toStrictEqual({
      scale: 'yLinear',
      value: 10,
    });
  });

  test('creates the correct mark when value is a string and scaleType is band', () => {
    expect(
      getPositionEncoding(
        { ...defaultAxisOptions, scaleType: 'band' },
        { ...defaultReferenceLineOptions, value: 'value' },
        'yBand'
      )
    ).toStrictEqual({ signal: "scale('yBand', 'value') + bandwidth('yBand') / 2" });
  });

  test('creates the correct mark when value is a number and scaleType is band', () => {
    expect(
      getPositionEncoding(
        { ...defaultAxisOptions, scaleType: 'band' },
        { ...defaultReferenceLineOptions, value: 10 },
        'yBand'
      )
    ).toStrictEqual({ signal: "scale('yBand', 10) + bandwidth('yBand') / 2" });
  });
});

describe('getReferenceLineMarks() — S2 vertical-only', () => {
  test('returns empty marks for horizontal axes (top/bottom)', () => {
    const bottom = getReferenceLineMarks({ ...defaultAxisOptions, position: 'bottom' }, 'xLinear');
    expect(bottom).toHaveLength(0);

    const top = getReferenceLineMarks({ ...defaultAxisOptions, position: 'top' }, 'xLinear');
    expect(top).toHaveLength(0);
  });

  test('returns marks for vertical axes (left/right)', () => {
    const left = getReferenceLineMarks({ ...defaultAxisOptions, position: 'left' }, 'yLinear');
    expect(left.some((m) => m.type === 'rule')).toBe(true);

    const right = getReferenceLineMarks({ ...defaultAxisOptions, position: 'right' }, 'yLinear');
    expect(right.some((m) => m.type === 'rule')).toBe(true);
  });

  test('auto mode: includes S/M/L tier caps, rule, and text marks when label is present', () => {
    const marks = getReferenceLineMarks(
      {
        ...defaultAxisOptions,
        referenceLines: [{ ...defaultReferenceLineOptions, label: 'Target' }],
      },
      'yLinear'
    );
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_startCap_S')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_startCap_M')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_startCap_L')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_endCap_S')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_endCap_M')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_endCap_L')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_labelBackground')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_label')).toBe(true);
  });

  test('explicit size: includes single start/end cap', () => {
    const marks = getReferenceLineMarks(
      {
        ...defaultAxisOptions,
        referenceLines: [{ ...defaultReferenceLineOptions, size: 'M' }],
      },
      'yLinear'
    );
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_startCap')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_endCap')).toBe(true);
    expect(marks.some((m) => m.name?.includes('_startCap_'))).toBe(false);
  });

  test('does not include symbol/icon marks', () => {
    const marks = getReferenceLineMarks({ ...defaultAxisOptions }, 'yLinear');
    expect(marks.some((m) => m.name?.endsWith('_symbol'))).toBe(false);
  });
});

describe('getReferenceLineRuleMark()', () => {
  test('should generate horizontal rule mark with fixed S2 color', () => {
    const rule = getReferenceLineRuleMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(rule.type).toBe('rule');
    expect(rule.name).toBe('axis0ReferenceLine0');
    expect(rule.encode?.enter?.stroke).toStrictEqual({ value: spectrum2Colors.light[DEFAULT_FONT_COLOR] });
    expect(rule.encode?.enter?.strokeCap).toStrictEqual({ value: 'round' });
    expect(rule.encode?.enter?.strokeJoin).toStrictEqual({ value: 'round' });
  });

  test('auto mode (no size): strokeWidth uses CHART_SIZE_STROKE_WIDTH signal', () => {
    const rule = getReferenceLineRuleMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(rule.encode?.enter?.strokeWidth).toStrictEqual({ signal: CHART_SIZE_STROKE_WIDTH });
  });

  test('auto mode (no size): x and x2 use reactive signals across S/M/L breakpoints', () => {
    const rule = getReferenceLineRuleMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    const expectedX = `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? ${REFERENCE_LINE_AUTO_RULE_X_START.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? ${REFERENCE_LINE_AUTO_RULE_X_START.M} : ${REFERENCE_LINE_AUTO_RULE_X_START.L}`;
    const expectedX2 = `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.M} : width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.L}`;
    expect(rule.encode?.update?.x).toStrictEqual({ signal: expectedX });
    expect(rule.encode?.update?.x2).toStrictEqual({ signal: expectedX2 });
  });

  test('y is set to positionEncoding', () => {
    const rule = getReferenceLineRuleMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(rule.encode?.update?.y).toStrictEqual(defaultYPositionEncoding);
  });

  test('rule x2 signal is position-independent', () => {
    const rule = getReferenceLineRuleMark(
      { ...defaultAxisOptions, ticks: true },
      defaultReferenceLineOptions,
      defaultYPositionEncoding
    );
    const expectedX2 = `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.M} : width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.L}`;
    expect(rule.encode?.update?.x2).toStrictEqual({ signal: expectedX2 });
  });
});

describe('getReferenceLineStartCapMark()', () => {
  test('auto mode: returns 3 marks for S/M/L tiers', () => {
    const caps = getReferenceLineStartCapMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(caps).toHaveLength(3);
    expect(caps.map((c) => c.name)).toStrictEqual([
      'axis0ReferenceLine0_startCap_S',
      'axis0ReferenceLine0_startCap_M',
      'axis0ReferenceLine0_startCap_L',
    ]);
  });

  test('auto mode: each tier uses the correct path and opacity signal', () => {
    const caps = getReferenceLineStartCapMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(caps[0].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_START_CAP_PATHS['S'] });
    expect(caps[1].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_START_CAP_PATHS['M'] });
    expect(caps[2].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_START_CAP_PATHS['L'] });
    expect(caps[0].encode?.update?.opacity).toStrictEqual({ signal: `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? 1 : 0` });
    expect(caps[2].encode?.update?.opacity).toStrictEqual({ signal: `rscContainerWidth(width) >= ${CHART_SIZE_BREAKPOINTS.L} ? 1 : 0` });
  });

  test('auto mode: all tiers share x: 5 and y: positionEncoding', () => {
    const caps = getReferenceLineStartCapMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    for (const cap of caps) {
      expect(cap.encode?.update?.x).toStrictEqual({ value: 5 });
      expect(cap.encode?.update?.y).toStrictEqual(defaultYPositionEncoding);
      expect(cap.encode?.enter?.fill).toStrictEqual({ value: spectrum2Colors.light[DEFAULT_FONT_COLOR] });
    }
  });

  test('explicit size: returns single mark named _startCap', () => {
    const caps = getReferenceLineStartCapMark(
      defaultAxisOptions,
      { ...defaultReferenceLineOptions, size: 'M' },
      defaultYPositionEncoding
    );
    expect(caps).toHaveLength(1);
    expect(caps[0].name).toBe('axis0ReferenceLine0_startCap');
    expect(caps[0].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_START_CAP_PATHS['M'] });
    expect(caps[0].encode?.update?.opacity).toBeUndefined();
  });
});

describe('getReferenceLineEndCapMark()', () => {
  test('auto mode: returns 3 marks for S/M/L tiers', () => {
    const caps = getReferenceLineEndCapMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(caps).toHaveLength(3);
    expect(caps.map((c) => c.name)).toStrictEqual([
      'axis0ReferenceLine0_endCap_S',
      'axis0ReferenceLine0_endCap_M',
      'axis0ReferenceLine0_endCap_L',
    ]);
  });

  test('auto mode: each tier uses the correct path and opacity signal', () => {
    const caps = getReferenceLineEndCapMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(caps[0].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_END_CAP_PATHS['S'] });
    expect(caps[1].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_END_CAP_PATHS['M'] });
    expect(caps[2].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_END_CAP_PATHS['L'] });
  });

  test('auto mode: each tier uses its own REFERENCE_LINE_END_CAP_ANCHOR_OFFSET anchor', () => {
    const caps = getReferenceLineEndCapMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(caps[0].encode?.update?.x).toStrictEqual({ signal: `width - ${REFERENCE_LINE_END_CAP_ANCHOR_OFFSET['S']}` });
    expect(caps[1].encode?.update?.x).toStrictEqual({ signal: `width - ${REFERENCE_LINE_END_CAP_ANCHOR_OFFSET['M']}` });
    expect(caps[2].encode?.update?.x).toStrictEqual({ signal: `width - ${REFERENCE_LINE_END_CAP_ANCHOR_OFFSET['L']}` });
    for (const cap of caps) {
      expect(cap.encode?.update?.y).toStrictEqual(defaultYPositionEncoding);
    }
  });

  test('explicit size: returns single mark named _endCap', () => {
    const caps = getReferenceLineEndCapMark(
      defaultAxisOptions,
      { ...defaultReferenceLineOptions, size: 'M' },
      defaultYPositionEncoding
    );
    expect(caps).toHaveLength(1);
    expect(caps[0].name).toBe('axis0ReferenceLine0_endCap');
    expect(caps[0].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_END_CAP_PATHS['M'] });
    expect(caps[0].encode?.update?.opacity).toBeUndefined();
  });
});

describe('getReferenceLineTextMark() — S2 direct label pattern', () => {
  test('should return an empty array if there is no label', () => {
    const marks = getReferenceLineTextMark(
      { ...defaultReferenceLineOptions, label: undefined },
      defaultYPositionEncoding
    );
    expect(marks).toHaveLength(0);
  });

  test('should return two text marks (background + main) when label is defined', () => {
    const marks = getReferenceLineTextMark(
      { ...defaultReferenceLineOptions, label: 'Target' },
      defaultYPositionEncoding
    );
    expect(marks).toHaveLength(2);
    expect(marks[0].name).toBe('axis0ReferenceLine0_labelBackground');
    expect(marks[1].name).toBe('axis0ReferenceLine0_label');
    expect(marks[0].type).toBe('text');
    expect(marks[1].type).toBe('text');
  });

  test('background mark: transparent fill, REFERENCE_LINE_LABEL_BACKGROUND_STROKE signal for stroke, strokeWidth = REFERENCE_LINE_LABEL_BACKGROUND_STROKE_WIDTH', () => {
    const marks = getReferenceLineTextMark(
      { ...defaultReferenceLineOptions, label: 'Target' },
      defaultYPositionEncoding
    );
    expect(marks[0].encode?.enter?.fill).toStrictEqual({ value: 'transparent' });
    expect(marks[0].encode?.enter?.stroke).toStrictEqual({ signal: REFERENCE_LINE_LABEL_BACKGROUND_STROKE });
    expect(marks[0].encode?.enter?.strokeWidth).toStrictEqual({ value: REFERENCE_LINE_LABEL_BACKGROUND_STROKE_WIDTH });
  });

  test('main mark: fixed S2 content neutral fill, no stroke', () => {
    const marks = getReferenceLineTextMark(
      { ...defaultReferenceLineOptions, label: 'Target' },
      defaultYPositionEncoding
    );
    expect(marks[1].encode?.enter?.fill).toStrictEqual({ value: spectrum2Colors.light[DEFAULT_FONT_COLOR] });
    expect(marks[1].encode?.enter?.stroke).toBeUndefined();
  });

  test('both marks inherit font, lineHeight from theme (no explicit overrides)', () => {
    const marks = getReferenceLineTextMark(
      { ...defaultReferenceLineOptions, label: 'Target' },
      defaultYPositionEncoding
    );
    for (const mark of marks) {
      expect(mark.encode?.enter?.font).toBeUndefined();
      expect(mark.encode?.enter?.lineHeight).toBeUndefined();
    }
  });

  test('fontWeight 700 in update block', () => {
    const marks = getReferenceLineTextMark(
      { ...defaultReferenceLineOptions, label: 'Target' },
      defaultYPositionEncoding
    );
    for (const mark of marks) {
      expect(mark.encode?.update?.fontWeight).toBeDefined();
      expect((mark.encode?.update?.fontWeight as { value: number }).value).toBe(REFERENCE_LINE_LABEL_FONT_WEIGHT);
    }
  });

  test('fontSize uses the same CHART_SIZE_FONT_SIZE signal regardless of explicit size tier or secondary', () => {
    for (const size of ['XS', 'S', 'M', 'L'] as const) {
      for (const secondary of [false, true]) {
        const marks = getReferenceLineTextMark(
          { ...defaultReferenceLineOptions, label: 'Target', size, secondary },
          defaultYPositionEncoding
        );
        for (const mark of marks) {
          expect(mark.encode?.update?.fontSize).toStrictEqual({ signal: CHART_SIZE_FONT_SIZE });
        }
      }
    }
  });

  test('label position: x = width signal, y = positionEncoding, dy = 9, baseline = top, align = right', () => {
    const marks = getReferenceLineTextMark(
      { ...defaultReferenceLineOptions, label: 'Target' },
      defaultYPositionEncoding
    );
    for (const mark of marks) {
      expect(mark.encode?.enter?.x).toStrictEqual({ signal: 'width' });
      expect(mark.encode?.enter?.y).toStrictEqual(defaultYPositionEncoding);
      expect(mark.encode?.enter?.dy).toStrictEqual({ value: REFERENCE_LINE_LABEL_OFFSET_FROM_LINE });
      expect(mark.encode?.enter?.baseline).toStrictEqual({ value: 'top' });
      expect(mark.encode?.enter?.align).toStrictEqual({ value: 'right' });
    }
  });
});

describe('size prop — explicit size variants', () => {
  test.each(['XS', 'S', 'M', 'L'] as const)(
    'size %s: rule strokeWidth uses lookup table value',
    (size) => {
      const rule = getReferenceLineRuleMark(
        defaultAxisOptions,
        { ...defaultReferenceLineOptions, size },
        defaultYPositionEncoding
      );
      expect(rule.encode?.enter?.strokeWidth).toStrictEqual({ value: REFERENCE_LINE_SIZE_STROKE_WIDTHS[size] });
    }
  );

  test.each(['XS', 'S', 'M', 'L'] as const)(
    'size %s: rule x-start uses REFERENCE_LINE_RULE_X_START[size]',
    (size) => {
      const rule = getReferenceLineRuleMark(
        defaultAxisOptions,
        { ...defaultReferenceLineOptions, size },
        defaultYPositionEncoding
      );
      expect(rule.encode?.update?.x).toStrictEqual({ value: REFERENCE_LINE_RULE_X_START[size] });
    }
  );

  test.each(['XS', 'S', 'M', 'L'] as const)(
    'size %s: rule x2 uses REFERENCE_LINE_RULE_X2_OFFSET[size]',
    (size) => {
      const rule = getReferenceLineRuleMark(
        defaultAxisOptions,
        { ...defaultReferenceLineOptions, size },
        defaultYPositionEncoding
      );
      expect(rule.encode?.update?.x2).toStrictEqual({ signal: `width - ${REFERENCE_LINE_RULE_X2_OFFSET[size]}` });
    }
  );

  test.each(['XS', 'S', 'M', 'L'] as const)(
    'size %s: start cap uses REFERENCE_LINE_START_CAP_PATHS[size]',
    (size) => {
      const caps = getReferenceLineStartCapMark(
        defaultAxisOptions,
        { ...defaultReferenceLineOptions, size },
        defaultYPositionEncoding
      );
      expect(caps[0].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_START_CAP_PATHS[size] });
    }
  );

  test.each(['XS', 'S', 'M', 'L'] as const)(
    'size %s: end cap uses REFERENCE_LINE_END_CAP_PATHS[size]',
    (size) => {
      const caps = getReferenceLineEndCapMark(
        defaultAxisOptions,
        { ...defaultReferenceLineOptions, size },
        defaultYPositionEncoding
      );
      expect(caps[0].encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_END_CAP_PATHS[size] });
    }
  );
});

describe('secondary prop', () => {
  const secondaryOptions: ReferenceLineSpecOptions = { ...defaultReferenceLineOptions, secondary: true };

  describe('getReferenceLineRuleMark() with secondary: true', () => {
    test('auto mode: stroke uses REFERENCE_LINE_SECONDARY_COLORS[M] (gray-800 — same as primary in M tier)', () => {
      const rule = getReferenceLineRuleMark(defaultAxisOptions, secondaryOptions, defaultYPositionEncoding);
      expect(rule.encode?.enter?.stroke).toStrictEqual({ value: spectrum2Colors.light[REFERENCE_LINE_SECONDARY_COLORS['M']] });
    });

    test('size XS: stroke uses REFERENCE_LINE_SECONDARY_COLORS[XS] (gray-600)', () => {
      const rule = getReferenceLineRuleMark(
        defaultAxisOptions,
        { ...secondaryOptions, size: 'XS' },
        defaultYPositionEncoding
      );
      expect(rule.encode?.enter?.stroke).toStrictEqual({ value: spectrum2Colors.light[REFERENCE_LINE_SECONDARY_COLORS['XS']] });
    });

    test('strokeWidth is always REFERENCE_LINE_SECONDARY_STROKE_WIDTH (1px) regardless of size', () => {
      const autoRule = getReferenceLineRuleMark(defaultAxisOptions, secondaryOptions, defaultYPositionEncoding);
      expect(autoRule.encode?.enter?.strokeWidth).toStrictEqual({ value: REFERENCE_LINE_SECONDARY_STROKE_WIDTH });

      const lRule = getReferenceLineRuleMark(defaultAxisOptions, { ...secondaryOptions, size: 'L' }, defaultYPositionEncoding);
      expect(lRule.encode?.enter?.strokeWidth).toStrictEqual({ value: REFERENCE_LINE_SECONDARY_STROKE_WIDTH });
    });

    test('x is fixed at 0 (no cap offset)', () => {
      const rule = getReferenceLineRuleMark(defaultAxisOptions, secondaryOptions, defaultYPositionEncoding);
      expect(rule.encode?.update?.x).toStrictEqual({ value: 0 });
    });

    test('x2 spans full width', () => {
      const rule = getReferenceLineRuleMark(defaultAxisOptions, secondaryOptions, defaultYPositionEncoding);
      expect(rule.encode?.update?.x2).toStrictEqual({ signal: 'width' });
    });

    test('explicit size: x and x2 still use secondary values (0 and width)', () => {
      const rule = getReferenceLineRuleMark(
        defaultAxisOptions,
        { ...secondaryOptions, size: 'L' },
        defaultYPositionEncoding
      );
      expect(rule.encode?.update?.x).toStrictEqual({ value: 0 });
      expect(rule.encode?.update?.x2).toStrictEqual({ signal: 'width' });
    });
  });

  describe('getReferenceLineStartCapMark() with secondary: true', () => {
    test('returns empty array — no caret caps on secondary lines', () => {
      expect(getReferenceLineStartCapMark(defaultAxisOptions, secondaryOptions, defaultYPositionEncoding)).toStrictEqual([]);
    });

    test('returns empty array even with explicit size', () => {
      expect(
        getReferenceLineStartCapMark(defaultAxisOptions, { ...secondaryOptions, size: 'L' }, defaultYPositionEncoding)
      ).toStrictEqual([]);
    });
  });

  describe('getReferenceLineEndCapMark() with secondary: true', () => {
    test('returns empty array — no caret caps on secondary lines', () => {
      expect(getReferenceLineEndCapMark(defaultAxisOptions, secondaryOptions, defaultYPositionEncoding)).toStrictEqual([]);
    });

    test('returns empty array even with explicit size', () => {
      expect(
        getReferenceLineEndCapMark(defaultAxisOptions, { ...secondaryOptions, size: 'M' }, defaultYPositionEncoding)
      ).toStrictEqual([]);
    });
  });

  describe('getReferenceLineTextMark() with secondary: true', () => {
    test('auto mode: label fill matches stroke color (gray-800)', () => {
      const marks = getReferenceLineTextMark(
        { ...secondaryOptions, label: 'Last year' },
        defaultYPositionEncoding
      );
      expect(marks[1].encode?.enter?.fill).toStrictEqual({ value: spectrum2Colors.light[REFERENCE_LINE_SECONDARY_COLORS['M']] });
    });

    test('size XS: label fill matches stroke color (gray-600)', () => {
      const marks = getReferenceLineTextMark(
        { ...secondaryOptions, size: 'XS', label: 'Last year' },
        defaultYPositionEncoding
      );
      expect(marks[1].encode?.enter?.fill).toStrictEqual({ value: spectrum2Colors.light[REFERENCE_LINE_SECONDARY_COLORS['XS']] });
    });

    test('background mark is unaffected — still transparent fill', () => {
      const marks = getReferenceLineTextMark(
        { ...secondaryOptions, label: 'Last year' },
        defaultYPositionEncoding
      );
      expect(marks[0].encode?.enter?.fill).toStrictEqual({ value: 'transparent' });
    });
  });

  test('getReferenceLineMarks() with secondary: true returns rule and text marks but no cap marks', () => {
    const marks = getReferenceLineMarks(
      {
        ...defaultAxisOptions,
        referenceLines: [{ ...defaultReferenceLineOptions, secondary: true, label: 'Average' }],
      },
      'yLinear'
    );
    expect(marks.some((m) => m.type === 'rule')).toBe(true);
    expect(marks.some((m) => m.name?.includes('_label'))).toBe(true);
    expect(marks.some((m) => m.name?.includes('_startCap'))).toBe(false);
    expect(marks.some((m) => m.name?.includes('_endCap'))).toBe(false);
  });
});
