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
import { Mark, RectMark } from 'vega';

import { DEFAULT_OPACITY_RULE, FADE_FACTOR, FILTERED_TABLE } from '@spectrum-charts/constants';

import { setThumbnailHoverOpacityForMarks } from './axisThumbnailHighlightUtils';

const defaultBarMark: RectMark = {
  name: 'bar0',
  type: 'rect',
  from: {
    data: FILTERED_TABLE,
  },
  encode: {
    enter: {
      fill: { value: 'blue' },
    },
    update: {
      opacity: [],
    },
  },
};

const defaultGroupMark: Mark = {
  type: 'group',
  marks: [defaultBarMark],
};

const expectedOpacityEncoding = {
  opacity: [
    {
      test: 'isValid(axis0_hoveredGroup)',
      signal: `axis0_hoveredGroup === datum.category ? 1 : ${FADE_FACTOR}`,
    },
  ],
};

describe('setThumbnailHoverOpacityForMarks()', () => {
  describe('no initial state', () => {
    test('should not modify empty marks array', () => {
      const marks: Mark[] = [];
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks).toEqual([]);
    });
  });

  describe('bar mark initial state', () => {
    test('should add opacity encoding for bar mark with empty opacity array', () => {
      const marks = JSON.parse(JSON.stringify([defaultBarMark]));
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks).toStrictEqual([
        { ...defaultBarMark, encode: { ...defaultBarMark.encode, update: expectedOpacityEncoding } },
      ]);
    });

    test('should add opacity rule before default opacity rule when it exists', () => {
      const marks = JSON.parse(
        JSON.stringify([
          {
            ...defaultBarMark,
            encode: { ...defaultBarMark.encode, update: { opacity: [DEFAULT_OPACITY_RULE] } },
          },
        ])
      );
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks).toStrictEqual([
        {
          ...defaultBarMark,
          encode: {
            ...defaultBarMark.encode,
            update: {
              ...expectedOpacityEncoding,
              opacity: [...expectedOpacityEncoding.opacity, DEFAULT_OPACITY_RULE],
            },
          },
        },
      ]);
    });

    test('should not modify mark if opacity is undefined', () => {
      const markWithoutOpacity: RectMark = {
        ...defaultBarMark,
        encode: {
          enter: { fill: { value: 'blue' } },
          update: {},
        },
      };
      const marks = JSON.parse(JSON.stringify([markWithoutOpacity]));
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks[0].encode.update.opacity).toBeUndefined();
    });
  });

  describe('group mark initial state', () => {
    test('should add opacity encoding to nested bar marks', () => {
      const marks = JSON.parse(JSON.stringify([defaultGroupMark]));
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks).toStrictEqual([
        {
          ...defaultGroupMark,
          marks: [{ ...defaultBarMark, encode: { ...defaultBarMark.encode, update: expectedOpacityEncoding } }],
        },
      ]);
    });
  });

  describe('mark filtering', () => {
    test('should not modify non-rect marks', () => {
      const lineMark: Mark = {
        name: 'line0',
        type: 'line',
        from: { data: FILTERED_TABLE },
        encode: {
          update: {
            opacity: [],
          },
        },
      };
      const marks = JSON.parse(JSON.stringify([lineMark]));
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks[0].encode.update.opacity).toEqual([]);
    });

    test('should not modify marks that do not use filteredTable or bar-specific data sources', () => {
      const barMarkWithOtherData: RectMark = {
        ...defaultBarMark,
        from: {
          data: 'otherData',
        },
      };
      const marks = JSON.parse(JSON.stringify([barMarkWithOtherData]));
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks[0].encode.update.opacity).toEqual([]);
    });

    test('should modify marks that use facet data sources', () => {
      const barMarkWithFacet: RectMark = {
        ...defaultBarMark,
        from: {
          data: 'bar0_facet',
        },
      };
      const marks = JSON.parse(JSON.stringify([barMarkWithFacet]));
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks[0].encode.update.opacity).toHaveLength(1);
      expect(marks[0].encode.update.opacity[0]).toHaveProperty('test', 'isValid(axis0_hoveredGroup)');
    });

    test('should modify marks that use stacks data sources', () => {
      const barMarkWithStacks: RectMark = {
        ...defaultBarMark,
        from: {
          data: 'bar0_stacks',
        },
      };
      const marks = JSON.parse(JSON.stringify([barMarkWithStacks]));
      setThumbnailHoverOpacityForMarks('axis0', 'category', marks);
      expect(marks[0].encode.update.opacity).toHaveLength(1);
      expect(marks[0].encode.update.opacity[0]).toHaveProperty('test', 'isValid(axis0_hoveredGroup)');
    });
  });
});
