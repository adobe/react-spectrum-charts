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
import { Mark } from 'vega';

import {
  CHART_SIZE_HOVER_STROKE_WIDTH,
  CHART_SIZE_STROKE_WIDTH,
  CONTROLLED_HIGHLIGHTED_SERIES,
  DEFAULT_OPACITY_RULE,
  DEFAULT_STROKE_WIDTH_RULE,
  FADE_FACTOR,
  HOVERED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import {
  encodingUsesScale,
  getHighlightOpacityRule,
  getHighlightStrokeWidthRule,
  setHoverOpacityForMarks,
  setHoverStrokeWidthForMarks,
} from './legendHighlightUtils';
import { defaultMark } from './legendTestUtils';

const defaultGroupMark: Mark = {
  type: 'group',
  marks: [defaultMark],
};

const defaultOpacityEncoding = {
  opacity: [
    {
      test: `isValid(legend0_${HOVERED_SERIES})`,
      signal: `legend0_${HOVERED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
    },
  ],
};

describe('getHighlightOpacityRule()', () => {
  test('should use HIGHLIGHTED_SERIES in test if there are not any keys', () => {
    const opacityRule = getHighlightOpacityRule('legend0', false);
    expect(opacityRule).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
  });
  test('should use keys in test if there are keys', () => {
    const opacityRule = getHighlightOpacityRule('legend0', false, ['key1']);
    expect(opacityRule).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
  });
});

describe('setHoverOpacityForMarks()', () => {
  describe('no initial state', () => {
    test('should not modify the marks', () => {
      const marks = [];
      setHoverOpacityForMarks('legend0', marks);
      expect(marks).toEqual([]);
    });
  });
  describe('bar mark initial state', () => {
    test('encoding should be added for opacity', () => {
      const marks = JSON.parse(JSON.stringify([defaultMark]));
      setHoverOpacityForMarks('legend0', marks);
      expect(marks).toStrictEqual([
        { ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } },
      ]);
    });
    test('opacity encoding already exists, rules should be added in the correct spot', () => {
      const marks = JSON.parse(
        JSON.stringify([
          {
            ...defaultMark,
            encode: { ...defaultMark.encode, update: { opacity: [DEFAULT_OPACITY_RULE] } },
          },
        ])
      );
      setHoverOpacityForMarks('legend0', marks);
      expect(marks).toStrictEqual([
        {
          ...defaultMark,
          encode: {
            ...defaultMark.encode,
            update: {
              ...defaultOpacityEncoding,
              opacity: [...defaultOpacityEncoding.opacity, DEFAULT_OPACITY_RULE],
            },
          },
        },
      ]);
    });
  });
  describe('group mark initial state', () => {
    test('encoding should be added for opacity', () => {
      const marks = JSON.parse(JSON.stringify([defaultGroupMark]));
      setHoverOpacityForMarks('legend0', marks);
      expect(marks).toStrictEqual([
        {
          ...defaultGroupMark,
          marks: [{ ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } }],
        },
      ]);
    });
  });
});

describe('getHighlightStrokeWidthRule()', () => {
  test('should use hoveredSeries signal when no keys and not controlled', () => {
    const rule = getHighlightStrokeWidthRule('legend0', false);
    expect(rule).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
    expect(rule).toHaveProperty(
      'signal',
      `legend0_${HOVERED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`
    );
  });
  test('should use hoveredSeries signal when keys are provided', () => {
    const rule = getHighlightStrokeWidthRule('legend0', false, ['category']);
    expect(rule).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
  });
  test('should use CONTROLLED_HIGHLIGHTED_SERIES signal when controlled', () => {
    const rule = getHighlightStrokeWidthRule('legend0', true);
    expect(rule).toHaveProperty('test', `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`);
  });
});

describe('setHoverStrokeWidthForMarks()', () => {
  const markWithStrokeWidth = {
    ...defaultMark,
    encode: {
      ...defaultMark.encode,
      update: { strokeWidth: [DEFAULT_STROKE_WIDTH_RULE] },
    },
  };

  test('should not modify marks when marks array is empty', () => {
    const marks = [];
    setHoverStrokeWidthForMarks('legend0', marks);
    expect(marks).toEqual([]);
  });
  test('should not modify a mark that has no strokeWidth in update', () => {
    const marks = JSON.parse(JSON.stringify([defaultMark]));
    setHoverStrokeWidthForMarks('legend0', marks);
    expect(marks[0].encode.update).not.toHaveProperty('strokeWidth');
  });
  test('should inject highlight rule before the fallback strokeWidth rule', () => {
    const marks = JSON.parse(JSON.stringify([markWithStrokeWidth]));
    setHoverStrokeWidthForMarks('legend0', marks);
    expect(marks[0].encode.update.strokeWidth).toHaveLength(2);
    expect(marks[0].encode.update.strokeWidth[0]).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
    expect(marks[0].encode.update.strokeWidth[1]).toEqual(DEFAULT_STROKE_WIDTH_RULE);
  });
  test('should inject group rule when keys are provided', () => {
    const marks = JSON.parse(JSON.stringify([markWithStrokeWidth]));
    setHoverStrokeWidthForMarks('legend0', marks, ['category']);
    expect(marks[0].encode.update.strokeWidth[0]).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
  });
});

describe('encodingUsesScale()', () => {
  test('should return true if the encoding uses a scale', () => {
    expect(encodingUsesScale({ scale: 'color' })).toBe(true);
  });
  test('should return true if the encoding uses a signal that references a scale', () => {
    expect(encodingUsesScale({ signal: 'scale("color", datum.color)' })).toBe(true);
  });
  test('should return false if the encoding is not an object', () => {
    expect(encodingUsesScale(1)).toBe(false);
  });
  test('should return false if the encoding is undefined', () => {
    expect(encodingUsesScale(undefined)).toBe(false);
  });
  test('should return false if encoding is not related to a scale', () => {
    expect(encodingUsesScale({ value: 1 })).toBe(false);
  });
});
