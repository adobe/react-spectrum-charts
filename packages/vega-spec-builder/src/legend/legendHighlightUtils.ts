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
import { Mark, NumericValueRef, ProductionRule } from 'vega';

import {
  CONTROLLED_HIGHLIGHTED_SERIES,
  FADE_FACTOR,
  GROUP_ID,
  HIGHLIGHTED_GROUP,
  HOVERED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { flattenMarks } from '../marks/markUtils';

/**
 * Adds opacity tests for the fill and stroke of marks that use the color scale to set the fill or stroke value.
 */
export const setHoverOpacityForMarks = (legendName: string, marks: Mark[], keys?: string[], controlled = false) => {
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
      if (!Array.isArray(update.opacity)) {
        update.opacity = [];
      }
      const rules = update.opacity as Array<Record<string, unknown>>;
      const lastRule = rules[rules.length - 1];
      // Show-mode marks end with an unconditional { value: 0 } fallback. Inserting a fade rule
      // before it would cause non-hovered series to appear at FADE_FACTOR instead of staying hidden.
      // Instead, extend the show predicate to include the relevant hover signal.
      const isShowMode = lastRule !== undefined && lastRule.value === 0 && !('test' in lastRule);
      if (isShowMode) {
        if (!controlled && !keys?.length) {
          // Extend the show predicate with the legend hover signal so hovering series A in the
          // legend reveals series A's metric range while keeping other series hidden.
          const showRule = rules[0];
          if (showRule && 'test' in showRule) {
            showRule.test = `${showRule.test} || isValid(${legendName}_${HOVERED_SERIES}) && ${legendName}_${HOVERED_SERIES} === datum.${SERIES_ID}`;
          }
        }
        // Controlled pass: the show predicate already includes controlledHighlightedSeries.
        return;
      }

      // Fade mode: insert the highlight rule second-to-last.
      const highlightOpacityRule = getHighlightOpacityRule(legendName, controlled, keys);
      const opacityRuleInsertIndex = Math.max(update.opacity.length - 1, 0);
      update.opacity.splice(opacityRuleInsertIndex, 0, highlightOpacityRule);
    }
  });
};

export const getHighlightOpacityRule = (
  legendName: string,
  controlled: boolean,
  keys?: string[]
): { test?: string } & NumericValueRef => {
  if (controlled) {
    return {
      test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
      signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
    };
  }
  if (keys?.length) {
    return {
      test: `isValid(${HIGHLIGHTED_GROUP})`,
      signal: `${HIGHLIGHTED_GROUP} === datum.${legendName}_${GROUP_ID} ? 1 : ${FADE_FACTOR}`,
    };
  }
  const isControlledSeries = `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) && ${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`;
  return {
    test: `isValid(${legendName}_${HOVERED_SERIES})`,
    signal: `${legendName}_${HOVERED_SERIES} === datum.${SERIES_ID} || ${isControlledSeries} ? 1 : ${FADE_FACTOR}`,
  };
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

  const { fill, fillOpacity, stroke, strokeDash, strokeOpacity } = enter;
  const facetEncodings = [fill, fillOpacity, stroke, strokeDash, strokeOpacity];

  for (const facet of facetEncodings) {
    if (encodingUsesScale(facet)) {
      return true;
    }
  }
  return false;
};

/**
 * Determines if the supplied encoding uses a scale to set the value
 * @param encoding
 * @returns boolean
 */
export const encodingUsesScale = <T>(encoding?: ProductionRule<T>): boolean => {
  if (!encoding || typeof encoding !== 'object') return false;
  if ('scale' in encoding) return true;
  if ('signal' in encoding && typeof encoding.signal === 'string' && encoding.signal.includes('scale(')) {
    return true;
  }
  return false;
};

