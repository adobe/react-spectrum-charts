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
  COMPONENT_NAME,
  CONTROLLED_HIGHLIGHTED_ITEM,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_COLOR,
  DEFAULT_METRIC,
  DEFAULT_OPACITY_RULE,
  DEFAULT_SECONDARY_COLOR,
  FADE_FACTOR,
  FILTERED_TABLE,
  HOVERED_ITEM,
  MARK_ID,
} from '@spectrum-charts/constants';

import { BarSpecOptions } from '../types';
import {
  defaultBarOptions,
  defaultBarStrokeEncodings,
  defaultCornerRadiusEncodings,
  defaultDodgedYEncodings,
  dodgedAnnotationMarks,
} from './barTestUtils';
import { getDodgedMarks } from './dodgedBarUtils';

const defaultDodgedOptions: BarSpecOptions = { ...defaultBarOptions, type: 'dodged' };

const defaultDodgedXEncodings: RectEncodeEntry = {
  x: { scale: 'bar0_position', field: 'bar0_dodgeGroup' },
  width: { scale: 'bar0_position', band: 1 },
};

const defaultDodgedCornerRadiusEncodings: RectEncodeEntry = {
  cornerRadiusTopLeft: [{ test: `datum.${DEFAULT_METRIC} > 0`, value: 4 }, { value: 0 }],
  cornerRadiusTopRight: [{ test: `datum.${DEFAULT_METRIC} > 0`, value: 4 }, { value: 0 }],
  cornerRadiusBottomLeft: [{ test: `datum.${DEFAULT_METRIC} < 0`, value: 4 }, { value: 0 }],
  cornerRadiusBottomRight: [{ test: `datum.${DEFAULT_METRIC} < 0`, value: 4 }, { value: 0 }],
};

const defaultDodgedStackedEnterEncodings: RectEncodeEntry = {
  y: [
    { test: `datum.${DEFAULT_METRIC}0 === 0`, signal: `scale('yLinear', datum.${DEFAULT_METRIC}0)` },
    {
      test: `datum.${DEFAULT_METRIC}1 > 0`,
      signal: `max(scale('yLinear', datum.${DEFAULT_METRIC}0) - 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))`,
    },
    { signal: `min(scale('yLinear', datum.${DEFAULT_METRIC}0) + 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))` },
  ],
  y2: { scale: 'yLinear', field: `${DEFAULT_METRIC}1` },
  ...defaultCornerRadiusEncodings,
};

const defaultBackgroundMark: Mark = {
  name: 'bar0_background',
  type: 'rect',
  from: { data: 'bar0_facet' },
  interactive: false,
  encode: {
    enter: {
      ...defaultDodgedYEncodings,
      ...defaultDodgedCornerRadiusEncodings,
      fill: { signal: BACKGROUND_COLOR },
    },
    update: { ...defaultDodgedXEncodings },
  },
};

const defaultMark: Mark = {
  name: 'bar0',
  type: 'rect',
  from: { data: 'bar0_facet' },
  interactive: false,
  encode: {
    enter: {
      ...defaultDodgedYEncodings,
      ...defaultDodgedCornerRadiusEncodings,
      fill: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
      fillOpacity: DEFAULT_OPACITY_RULE,
      tooltip: undefined,
    },
    update: {
      ...defaultDodgedXEncodings,
      ...defaultBarStrokeEncodings,
      cursor: undefined,
      opacity: [DEFAULT_OPACITY_RULE],
    },
  },
};

const defaultMarkWithInspect: Mark = {
  name: 'bar0',
  type: 'rect',
  from: { data: 'bar0_facet' },
  interactive: true,
  encode: {
    enter: {
      ...defaultDodgedYEncodings,
      ...defaultDodgedCornerRadiusEncodings,
      fill: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
      fillOpacity: DEFAULT_OPACITY_RULE,
      tooltip: { signal: `merge(datum, {'${COMPONENT_NAME}': 'bar0'})` },
    },
    update: {
      ...defaultDodgedXEncodings,
      ...defaultBarStrokeEncodings,
      opacity: [
        {
          test: `isValid(bar0_${HOVERED_ITEM})`,
          signal: `bar0_${HOVERED_ITEM}.${MARK_ID} === datum.${MARK_ID} ? 1 : ${FADE_FACTOR}`,
        },
        {
          test: `isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) && length(${CONTROLLED_HIGHLIGHTED_ITEM}) > 0 && indexof(${CONTROLLED_HIGHLIGHTED_ITEM}, datum.${MARK_ID}) === -1`,
          value: FADE_FACTOR,
        },
        DEFAULT_OPACITY_RULE,
      ],
      cursor: undefined,
    },
  },
};

const defaultDodgedStackedBackgroundMark: Mark = {
  name: 'bar0_background',
  type: 'rect',
  from: { data: 'bar0_facet' },
  interactive: false,
  encode: {
    enter: {
      ...defaultDodgedStackedEnterEncodings,
      fill: { signal: BACKGROUND_COLOR },
    },
    update: { ...defaultDodgedXEncodings },
  },
};

const defaultDodgedStackedMark: Mark = {
  name: 'bar0',
  type: 'rect',
  from: { data: 'bar0_facet' },
  interactive: false,
  encode: {
    enter: {
      ...defaultDodgedStackedEnterEncodings,
      fill: {
        signal: `scale('colors', datum.${DEFAULT_COLOR})[indexof(domain('secondaryColor'), datum.${DEFAULT_SECONDARY_COLOR})% length(scale('colors', datum.${DEFAULT_COLOR}))]`,
      },
      fillOpacity: DEFAULT_OPACITY_RULE,
      tooltip: undefined,
    },
    update: {
      ...defaultDodgedXEncodings,
      cursor: undefined,
      opacity: [DEFAULT_OPACITY_RULE],
      stroke: [
        {
          signal: `scale('colors', datum.${DEFAULT_COLOR})[indexof(domain('secondaryColor'), datum.${DEFAULT_SECONDARY_COLOR})% length(scale('colors', datum.${DEFAULT_COLOR}))]`,
        },
      ],
      strokeDash: [{ value: [] }],
      strokeWidth: [{ value: 0 }],
    },
  },
};

export const defaultDodgedMark = {
  name: 'bar0_group',
  type: 'group',
  from: { facet: { data: FILTERED_TABLE, groupby: DEFAULT_CATEGORICAL_DIMENSION, name: 'bar0_facet' } },
  signals: [{ name: 'width', update: 'bandwidth("xBand")' }],
  scales: [
    {
      domain: { data: FILTERED_TABLE, field: `bar0_dodgeGroup` },
      name: 'bar0_position',
      paddingInner: 0.4,
      range: 'width',
      type: 'band',
    },
  ],
  encode: { enter: { x: { field: DEFAULT_CATEGORICAL_DIMENSION, scale: 'xBand' } } },
  marks: [defaultBackgroundMark, defaultMark],
};

export const annotationDodgedMarks = {
  ...defaultDodgedMark,
  marks: [...defaultDodgedMark.marks, ...dodgedAnnotationMarks],
};

describe('dodgedBarUtils', () => {
  describe('getDodgedMarks()', () => {
    test('default options,', () => {
      expect(getDodgedMarks(defaultDodgedOptions)).toStrictEqual([defaultDodgedMark]);
    });
    test('with annotation', () => {
      const marks = getDodgedMarks({
        ...defaultDodgedOptions,
        barAnnotations: [{ textKey: 'textLabel' }],
      });
      const mark = marks[0] as GroupMark;
      expect(mark.marks).toHaveLength(3);
      expect(mark.marks?.[0].name).toEqual('bar0_background');
      expect(mark.marks?.[1].name).toEqual('bar0');
      const annotationGroup = mark.marks?.[2] as GroupMark;
      expect(annotationGroup.name).toEqual('bar0_annotationGroup');
      expect(annotationGroup.marks).toHaveLength(2);
      expect(annotationGroup.marks?.[0].name).toEqual('bar0_annotationText');
      expect(annotationGroup.marks?.[1].name).toEqual('bar0_annotationBackground');
    });
    test('should add inspect keys if ChartInspect exists as child', () => {
      expect(getDodgedMarks({ ...defaultDodgedOptions, chartInspects: [{}] })).toEqual([
        {
          ...defaultDodgedMark,
          marks: [defaultBackgroundMark, defaultMarkWithInspect],
        },
      ]);
    });
    test('subseries, should include advanced fill, advanced corner radius, and border strokes,', () => {
      expect(getDodgedMarks({ ...defaultDodgedOptions, color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] })).toEqual([
        {
          ...defaultDodgedMark,
          marks: [defaultDodgedStackedBackgroundMark, defaultDodgedStackedMark],
        },
      ]);
    });
    test('should add dimension hover area marks if has inspect with dimension area target', () => {
      const marks = getDodgedMarks({
        ...defaultDodgedOptions,
        chartInspects: [{ targets: ['dimensionArea'] }],
      });
      expect(marks).toHaveLength(2);
      expect(marks[0].name).toEqual('bar0_dimensionHoverArea');
      expect(marks[1].name).toEqual('bar0_group');
    });
    test('adds the selection backdrop under the bars and the outline ring on top when an item popover exists', () => {
      const marks = getDodgedMarks({
        ...defaultDodgedOptions,
        chartPopovers: [{}],
      });
      const mark = marks[0] as GroupMark;
      expect(mark.marks).toHaveLength(4);
      // backdrop is drawn first (underneath) to fill the gap; the outline ring is drawn last (on top)
      expect(mark.marks?.[0].name).toEqual('bar0_itemSelectionBackdrop');
      expect(mark.marks?.[1].name).toEqual('bar0_background');
      expect(mark.marks?.[2].name).toEqual('bar0');
      expect(mark.marks?.[3].name).toEqual('bar0_itemSelectionRing');
    });
    test('does not add the item selection marks when the popover highlights by dimension', () => {
      const marks = getDodgedMarks({
        ...defaultDodgedOptions,
        chartPopovers: [{ UNSAFE_highlightBy: 'dimension' }],
      });
      const mark = marks[0] as GroupMark;
      const names = mark.marks?.map((ringMark) => ringMark.name);
      expect(names).not.toContain('bar0_itemSelectionBackdrop');
      expect(names).not.toContain('bar0_itemSelectionRing');
    });
  });
});
