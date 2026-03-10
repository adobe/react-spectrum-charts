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
  REFERENCE_LINE_LABEL_BACKGROUND_STROKE,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_FONT_COLOR,
  DEFAULT_GRANULARITY,
  DEFAULT_LABEL_ALIGN,
  DEFAULT_LABEL_FONT_WEIGHT,
  DEFAULT_LABEL_ORIENTATION,
  REFERENCE_LINE_END_CAP_PATH,
  REFERENCE_LINE_LABEL_BACKGROUND_STROKE_WIDTH,
  REFERENCE_LINE_LABEL_FONT_WEIGHT,
  REFERENCE_LINE_LABEL_OFFSET_FROM_LINE,
  REFERENCE_LINE_START_CAP_PATH,
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

  test('includes start cap, end cap, rule, and text marks when label is present', () => {
    const marks = getReferenceLineMarks(
      {
        ...defaultAxisOptions,
        referenceLines: [{ ...defaultReferenceLineOptions, label: 'Target' }],
      },
      'yLinear'
    );
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_startCap')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_endCap')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_labelBackground')).toBe(true);
    expect(marks.some((m) => m.name === 'axis0ReferenceLine0_label')).toBe(true);
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
    expect(rule.encode?.enter?.strokeWidth).toStrictEqual({ value: 2 });
    expect(rule.encode?.enter?.strokeCap).toStrictEqual({ value: 'round' });
    expect(rule.encode?.enter?.strokeJoin).toStrictEqual({ value: 'round' });
  });

  test('rule spans from x: 10 to x2: width - 7', () => {
    const rule = getReferenceLineRuleMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(rule.encode?.update?.x).toStrictEqual({ value: 10 });
    expect(rule.encode?.update?.x2).toStrictEqual({ signal: 'width - 7' });
  });

  test('y is set to positionEncoding', () => {
    const rule = getReferenceLineRuleMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(rule.encode?.update?.y).toStrictEqual(defaultYPositionEncoding);
  });

  test('rule coordinates are position-independent (same for left/right, with/without ticks)', () => {
    const rule = getReferenceLineRuleMark(
      { ...defaultAxisOptions, ticks: true },
      defaultReferenceLineOptions,
      defaultYPositionEncoding
    );
    expect(rule.encode?.update?.x).toStrictEqual({ value: 10 });
    expect(rule.encode?.update?.x2).toStrictEqual({ signal: 'width - 7' });
  });
});

describe('getReferenceLineStartCapMark()', () => {
  test('start cap at x: 5', () => {
    const cap = getReferenceLineStartCapMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(cap.type).toBe('path');
    expect(cap.name).toBe('axis0ReferenceLine0_startCap');
    expect(cap.encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_START_CAP_PATH });
    expect(cap.encode?.enter?.fill).toStrictEqual({ value: spectrum2Colors.light[DEFAULT_FONT_COLOR] });
    expect(cap.encode?.update?.x).toStrictEqual({ value: 5 });
    expect(cap.encode?.update?.y).toStrictEqual(defaultYPositionEncoding);
  });

  test('right axis: start cap at x: 5', () => {
    const cap = getReferenceLineStartCapMark(
      { ...defaultAxisOptions, position: 'right' },
      defaultReferenceLineOptions,
      defaultYPositionEncoding
    );
    expect(cap.encode?.update?.x).toStrictEqual({ value: 5 });
  });
});

describe('getReferenceLineEndCapMark()', () => {
  test('left axis: end cap at x: width - 5 (aligned with rule end)', () => {
    const cap = getReferenceLineEndCapMark(defaultAxisOptions, defaultReferenceLineOptions, defaultYPositionEncoding);
    expect(cap.type).toBe('path');
    expect(cap.name).toBe('axis0ReferenceLine0_endCap');
    expect(cap.encode?.enter?.path).toStrictEqual({ value: REFERENCE_LINE_END_CAP_PATH });
    expect(cap.encode?.enter?.fill).toStrictEqual({ value: spectrum2Colors.light[DEFAULT_FONT_COLOR] });
    expect(cap.encode?.update?.x).toStrictEqual({ signal: 'width - 5' });
    expect(cap.encode?.update?.y).toStrictEqual(defaultYPositionEncoding);
  });

  test('end cap at x: width - 5 (position-independent)', () => {
    const cap = getReferenceLineEndCapMark(
      { ...defaultAxisOptions, position: 'right', ticks: true },
      defaultReferenceLineOptions,
      defaultYPositionEncoding
    );
    expect(cap.encode?.update?.x).toStrictEqual({ signal: 'width - 5' });
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

  test('both marks inherit font, fontSize, lineHeight from theme (no explicit overrides)', () => {
    const marks = getReferenceLineTextMark(
      { ...defaultReferenceLineOptions, label: 'Target' },
      defaultYPositionEncoding
    );
    for (const mark of marks) {
      expect(mark.encode?.enter?.font).toBeUndefined();
      expect(mark.encode?.enter?.fontSize).toBeUndefined();
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
