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
 * Adds opacity tests for marks whose fill/stroke is driven by the color scale, and for marks
 * that are already per-series (e.g. trendlines, which facet by series regardless of their own
 * color encoding — a trendline with an overridden literal color still needs to fade on legend hover).
 */
export const setHoverOpacityForMarks = (legendName: string, marks: Mark[], keys?: string[], controlled = false) => {
  if (!marks.length) return;
  const flatMarks = flattenMarks(marks);
  flatMarks.filter(markIsSeriesAware).forEach((mark) => applyLegendOpacityToMark(mark, legendName, keys, controlled));
};

const applyLegendOpacityToMark = (mark: Mark, legendName: string, keys?: string[], controlled = false) => {
  if (!mark.encode) mark.encode = { update: {} };
  if (!mark.encode.update) mark.encode.update = {};
  const { update } = mark.encode;
  if (update.opacity === undefined) return;
  if (!Array.isArray(update.opacity)) update.opacity = [];

  const rules = update.opacity as Array<Record<string, unknown>>;
  const lastRule = rules.at(-1);
  // Show-mode marks end with { value: 0 }; inserting a fade rule before it shows non-hovered
  // series at FADE_FACTOR instead of keeping them hidden. Extend the show predicate instead.
  const isShowMode = lastRule?.value === 0 && !('test' in lastRule);
  if (isShowMode) {
    if (!controlled && !keys?.length) {
      const showRule = rules[0];
      if (showRule && 'test' in showRule) {
        showRule.test = `${showRule.test} || isValid(${legendName}_${HOVERED_SERIES}) && ${legendName}_${HOVERED_SERIES} === datum.${SERIES_ID}`;
      }
    }
    return;
  }

  const highlightOpacityRule = getHighlightOpacityRule(legendName, controlled, keys);
  update.opacity.splice(Math.max(update.opacity.length - 1, 0), 0, highlightOpacityRule);
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
 * Determines if the supplied mark is the trendline's own line/rule mark, or the metric range's
 * own line mark. These are always per-series (faceted by series regardless of their own color
 * encoding), so an overridden literal color still needs to fade on legend hover. Anchored to
 * these two exact name shapes — `<parent>Trendline<index>` and `<parent>MetricRange<index>_line`
 * — so it doesn't also match hover-support marks that share the same name prefix (e.g.
 * `<parent>Trendline_hoverRule`, `_pointBackground`, `_point_highlight`, `_secondaryPoint`).
 * Those marks are already scoped to a single active item via their (pre-filtered) data source,
 * not via opacity, and some carry non-series opacity logic of their own that a broader match
 * would clobber.
 * @param mark
 * @returns boolean
 */
const isTrendlineOrMetricRangeLineMark = (mark: Mark): boolean =>
  Boolean(mark.name) && /(Trendline\d+|MetricRange\d+_line)$/.test(mark.name as string);

/**
 * Determines if a mark should receive a legend-hover opacity rule — either because its own
 * fill/stroke uses the color scale, or because it's a trendline/metric range mark.
 * @param mark
 * @returns boolean
 */
export const markIsSeriesAware = (mark: Mark): boolean =>
  markUsesSeriesColorScale(mark) || isTrendlineOrMetricRangeLineMark(mark);

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

