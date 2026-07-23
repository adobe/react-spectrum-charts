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
import { GroupMark, Mark, RectEncodeEntry } from 'vega';

import {
  BACKGROUND_COLOR,
  COLOR_SCALE,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_COLOR,
  DEFAULT_OPACITY_RULE,
  DEFAULT_SECONDARY_COLOR,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';

import { defaultBarEnterEncodings, defaultBarOptions, defaultBarStrokeEncodings } from './barTestUtils';
import { getDodgedAndStackedBarMark, getStackedBarMarks, getStackedDimensionEncodings } from './stackedBarUtils';

const defaultStackedBarXEncondings: RectEncodeEntry = {
  x: { scale: 'xBand', field: DEFAULT_CATEGORICAL_DIMENSION },
  width: { scale: 'xBand', band: 1 },
};

const defaultBackgroundMark: Mark = {
  encode: {
    enter: {
      ...defaultBarEnterEncodings,
      fill: { signal: BACKGROUND_COLOR },
    },
    update: defaultStackedBarXEncondings,
  },
  from: { data: FILTERED_TABLE },
  interactive: false,
  name: 'bar0_background',
  description: 'bar0_background',
  type: 'rect',
};

const defaultMark = {
  encode: {
    enter: {
      ...defaultBarEnterEncodings,
      fill: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
      fillOpacity: DEFAULT_OPACITY_RULE,
      tooltip: undefined,
    },
    update: {
      cursor: undefined,
      opacity: [DEFAULT_OPACITY_RULE],
      ...defaultStackedBarXEncondings,
      ...defaultBarStrokeEncodings,
    },
  },
  from: { data: FILTERED_TABLE },
  interactive: false,
  name: 'bar0',
  description: 'bar0',
  type: 'rect',
};

describe('stackedBarUtils', () => {
  describe('getStackedBarMarks()', () => {
    test('default options', () => {
      expect(getStackedBarMarks(defaultBarOptions)).toStrictEqual([defaultBackgroundMark, defaultMark]);
    });
    test('with annotation', () => {
      const marks = getStackedBarMarks({
        ...defaultBarOptions,
        barAnnotations: [{ textKey: 'textLabel' }],
      });

      expect(marks).toHaveLength(3);
      expect(marks[0].name).toEqual('bar0_background');
      expect(marks[1].name).toEqual('bar0');
      const annotationGroup = marks[2] as GroupMark;
      expect(annotationGroup.name).toEqual('bar0_annotationGroup');
      expect(annotationGroup.marks).toHaveLength(2);
      expect(annotationGroup.marks?.[0].name).toEqual('bar0_annotationText');
      expect(annotationGroup.marks?.[1].name).toEqual('bar0_annotationBackground');
    });
    test('should add dimension hover area marks if has inspect with dimension area target', () => {
      const marks = getStackedBarMarks({
        ...defaultBarOptions,
        chartInspects: [{ targets: ['dimensionArea'] }],
      });
      expect(marks).toHaveLength(3);
      expect(marks[0].name).toEqual('bar0_dimensionHoverArea');
      expect(marks[1].name).toEqual('bar0_background');
      expect(marks[2].name).toEqual('bar0');
    });
    test('adds the selection backdrop under the bars and the outline ring on top when an item popover exists', () => {
      const marks = getStackedBarMarks({
        ...defaultBarOptions,
        chartPopovers: [{}],
      });
      expect(marks).toHaveLength(5);
      // the dimension hover area is added first since the bar is interactive; the backdrop is drawn
      // next (underneath) to fill the gap; the outline ring is drawn last (on top) so it is never
      // occluded by adjacent stack segments
      expect(marks[0].name).toEqual('bar0_dimensionHoverArea');
      expect(marks[1].name).toEqual('bar0_itemSelectionBackdrop');
      expect(marks[2].name).toEqual('bar0_background');
      expect(marks[3].name).toEqual('bar0');
      expect(marks[4].name).toEqual('bar0_itemSelectionRing');
    });

    test('adds the dimension hover area mark whenever the bar is interactive, regardless of chartInspect target', () => {
      const marks = getStackedBarMarks({
        ...defaultBarOptions,
        chartPopovers: [{}],
      });
      expect(marks.find((mark) => mark.name === 'bar0_dimensionHoverArea')).toBeDefined();
    });

    test('does not add the dimension hover area mark if the bar is not interactive', () => {
      const marks = getStackedBarMarks(defaultBarOptions);
      expect(marks.find((mark) => mark.name === 'bar0_dimensionHoverArea')).toBeUndefined();
    });
    test('does not add the item selection marks when the popover highlights by dimension', () => {
      const marks = getStackedBarMarks({
        ...defaultBarOptions,
        chartPopovers: [{ UNSAFE_highlightBy: 'dimension' }],
      });
      const names = marks.map((mark) => mark.name);
      expect(names).not.toContain('bar0_itemSelectionBackdrop');
      expect(names).not.toContain('bar0_itemSelectionRing');
    });
    test('sources the item selection marks from the trellis facet when trellised', () => {
      const marks = getStackedBarMarks({
        ...defaultBarOptions,
        trellis: 'event',
        chartPopovers: [{}],
      });
      const backdrop = marks.find((mark) => mark.name === 'bar0_itemSelectionBackdrop');
      const ring = marks.find((mark) => mark.name === 'bar0_itemSelectionRing');
      expect(backdrop?.from).toStrictEqual({ data: 'bar0_trellis' });
      expect(ring?.from).toStrictEqual({ data: 'bar0_trellis' });
    });
  });

  describe('getDodgedAndStackedBarMark()', () => {
    test('should return mark with dodged and stacked marks', () => {
      const mark = getDodgedAndStackedBarMark(defaultBarOptions);

      expect(mark.name).toEqual('bar0_group');
      expect(mark.scales?.[0].name).toEqual('bar0_position');

      expect(mark.marks).toHaveLength(2);
      expect(mark.marks?.[0].name).toEqual('bar0_background');
      expect(mark.marks?.[1].name).toEqual('bar0');
    });

    test('adds the selection backdrop under the bars and the outline ring on top when an item popover exists', () => {
      const mark = getDodgedAndStackedBarMark({
        ...defaultBarOptions,
        chartPopovers: [{}],
      });

      expect(mark.marks).toHaveLength(4);
      // backdrop underneath, outline ring on top
      expect(mark.marks?.[0].name).toEqual('bar0_itemSelectionBackdrop');
      expect(mark.marks?.[1].name).toEqual('bar0_background');
      expect(mark.marks?.[2].name).toEqual('bar0');
      expect(mark.marks?.[3].name).toEqual('bar0_itemSelectionRing');
    });

    test('should return mark with dodged and stacked marks, with annotation', () => {
      const mark = getDodgedAndStackedBarMark({
        ...defaultBarOptions,
        barAnnotations: [{ textKey: 'textLabel' }],
      });

      expect(mark.name).toEqual('bar0_group');
      expect(mark.scales?.[0].name).toEqual('bar0_position');

      expect(mark.marks).toHaveLength(3);
      expect(mark.marks?.[0].name).toEqual('bar0_background');
      expect(mark.marks?.[1].name).toEqual('bar0');
      const annotationGroup = mark.marks?.[2] as GroupMark;
      expect(annotationGroup.name).toEqual('bar0_annotationGroup');
      expect(annotationGroup.marks).toHaveLength(2);
      expect(annotationGroup.marks?.[0].name).toEqual('bar0_annotationText');
      expect(annotationGroup.marks?.[1].name).toEqual('bar0_annotationBackground');
    });

    test('should return mark with dodged and stacked marks, with annotation, horizontal', () => {
      const mark = getDodgedAndStackedBarMark({
        ...defaultBarOptions,
        orientation: 'horizontal',
        barAnnotations: [{ textKey: 'textLabel' }],
      });

      expect(mark.name).toEqual('bar0_group');
      expect(mark.scales?.[0].name).toEqual('bar0_position');

      expect(mark.marks).toHaveLength(3);
      expect(mark.marks?.[0].name).toEqual('bar0_background');
      expect(mark.marks?.[1].name).toEqual('bar0');
      const annotationGroup = mark.marks?.[2] as GroupMark;
      expect(annotationGroup.name).toEqual('bar0_annotationGroup');
      expect(annotationGroup.marks).toHaveLength(2);
      expect(annotationGroup.marks?.[0].name).toEqual('bar0_annotationText');
      expect(annotationGroup.marks?.[1].name).toEqual('bar0_annotationBackground');
    });
  });

  describe('getStackedDimensionEncodings()', () => {
    test('should return x and width encodings', () => {
      expect(getStackedDimensionEncodings(defaultBarOptions)).toStrictEqual(defaultStackedBarXEncondings);
    });

    test('should get dodged x encoding if stacked/dodged', () => {
      expect(
        getStackedDimensionEncodings({
          ...defaultBarOptions,
          color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR],
        })
      ).toStrictEqual({
        width: { band: 1, scale: 'bar0_position' },
        x: { field: 'bar0_dodgeGroup', scale: 'bar0_position' },
      });
    });
  });
});
