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
import { GroupMark, Mark, NumericValueRef } from 'vega';

import {
  COLOR_SCALE,
  GROUP_ID,
  HIGHLIGHTED_GROUP,
  HIGHLIGHTED_SERIES,
  FADE_FACTOR,
  SERIES_ID
} from '@spectrum-charts/constants';

/**
 * Adds opacity tests for the fill and stroke of marks that use the color scale to set the fill or stroke value.
 */
export const setHoverOpacityForMarks = (marks: Mark[], keys?: string[], name?: string) => {
  if (!marks.length) return;
  const flatMarks = flattenMarks(marks);
  const seriesMarks = flatMarks.filter(markUsesSeriesColorScale);
  seriesMarks.forEach((mark) => {
    // need to drill down to the prop we need to set and add missing properties if needed
    if (!mark.encode) {
      mark.encode = { update: {} };
    }
    if (!mark.encode.update) {
      mark.encode.update = {};
    }
    const { update } = mark.encode;
    const { opacity } = update;

    if (opacity !== undefined) {
      // the new production rule for highlighting
      const highlightOpacityRule = getHighlightOpacityRule(keys, name);

      if (!Array.isArray(update.opacity)) {
        update.opacity = [];
      }
      // need to insert the new test in the second to last slot
      const opacityRuleInsertIndex = Math.max(update.opacity.length - 1, 0);
      update.opacity.splice(opacityRuleInsertIndex, 0, highlightOpacityRule);
    }
  });
};

export const getHighlightOpacityRule = (keys?: string[], name?: string): { test?: string } & NumericValueRef => {
  let test = `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`;
  if (keys?.length) {
    test = `isValid(${HIGHLIGHTED_GROUP}) && ${HIGHLIGHTED_GROUP} !== datum.${name}_${GROUP_ID}`;
  }
  return { test, value: FADE_FACTOR };
};

/**
 * Determines if the supplied mark uses the color scale to set the fill or stroke value.
 * This is used to determine if we need to set the opacity for the mark when it is hovered
 * @param mark
 * @returns boolean
 */
export const markUsesSeriesColorScale = (mark: Mark): boolean => {
  const enter = mark.encode?.enter;
  if (!enter) return false;
  const { fill, stroke } = enter;
  if (fill && 'scale' in fill && fill.scale === COLOR_SCALE) {
    return true;
  }
  // some marks use a 2d color scale, these will use a signal expression to get the color for that series
  if (fill && 'signal' in fill && fill.signal.includes("scale('colors',")) {
    return true;
  }
  if (stroke && 'scale' in stroke && stroke.scale === COLOR_SCALE) {
    return true;
  }
  return false;
};

/**
 * Recursively flattens all nested marks into a flat array
 * @param marks
 * @returns
 */
export const flattenMarks = (marks: Mark[]): Mark[] => {
  let result = marks;
  for (const mark of marks) {
    if (isGroupMark(mark) && mark.marks) {
      result = [...result, ...flattenMarks(mark.marks)];
    }
  }
  return result;
};

const isGroupMark = (mark: Mark): mark is GroupMark => {
  return mark.type === 'group';
};
