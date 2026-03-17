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
import { Mark, NumericValueRef } from 'vega';

import { FADE_FACTOR } from '@spectrum-charts/constants';

import { flattenMarks } from '../marks/markUtils';

/**
 * Adds opacity rules to bar marks for thumbnail hover highlighting.
 * When an axis thumbnail is hovered, bars with matching dimension values will be highlighted.
 */
export const setThumbnailHoverOpacityForMarks = (
  axisName: string,
  dimensionField: string,
  marks: Mark[]
): void => {
  if (!marks.length) return;
  const flatMarks = flattenMarks(marks);
  const barMarks = flatMarks.filter((mark) => markUsesDimensionField(mark));

  barMarks.forEach((mark) => {
    if (!mark.encode) {
      mark.encode = { update: {} };
    }
    if (!mark.encode.update) {
      mark.encode.update = {};
    }
    const { update } = mark.encode;
    const { opacity } = update;

    if (opacity !== undefined) {
      const highlightOpacityRule = getThumbnailHighlightOpacityRule(axisName, dimensionField);

      if (!Array.isArray(update.opacity)) {
        update.opacity = [];
      }
      // Insert the new test in the second to last slot (before default opacity rule)
      const opacityRuleInsertIndex = Math.max(update.opacity.length - 1, 0);
      update.opacity.splice(opacityRuleInsertIndex, 0, highlightOpacityRule);
    }
  });
};

/**
 * Returns the opacity rule for thumbnail hover highlighting.
 */
const getThumbnailHighlightOpacityRule = (
  axisName: string,
  dimensionField: string
): { test?: string } & NumericValueRef => {
  return {
    test: `isValid(${axisName}_hoveredGroup)`,
    signal: `${axisName}_hoveredGroup === datum.${dimensionField} ? 1 : ${FADE_FACTOR}`,
  };
};

/**
 * Determines if the supplied mark uses the dimension field.
 * This is used to identify bar marks that should be highlighted when thumbnails are hovered.
 */
const markUsesDimensionField = (mark: Mark): boolean => {
  // Check if mark is a rect (bar mark)
  if (mark.type !== 'rect') {
    return false;
  }

  // Check if mark has opacity rules (indicating it's an interactive bar)
  const opacity = mark.encode?.update?.opacity;
  if (!opacity || !Array.isArray(opacity)) {
    return false;
  }

  // Check if mark uses filteredTable or bar-specific data sources
  const from = mark.from;
  if (from && 'data' in from) {
    const dataSource = from.data;
    if (typeof dataSource === 'string') {
      // Bar marks use filteredTable or bar-specific facet data
      if (dataSource === 'filteredTable' || dataSource.includes('_facet') || dataSource.includes('_stacks')) {
        return true;
      }
    }
  }

  return false;
};
