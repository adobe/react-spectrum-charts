/*
 * Copyright 2023 Adobe. All rights reserved.
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
  DEFAULT_OPACITY_RULE,
  FADE_FACTOR,
  HIGHLIGHTED_GROUP,
  HOVERED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { encodingUsesScale, getHighlightOpacityRule, setHoverOpacityForMarks } from './legendHighlightUtils';
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
    expect(opacityRule).toHaveProperty('test', `isValid(${HIGHLIGHTED_GROUP})`);
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
