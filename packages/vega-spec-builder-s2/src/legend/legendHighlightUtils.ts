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
import { AggregateTransform, Data, FormulaTransform, GroupMark, Mark, NumericValueRef, ProductionRule } from 'vega';

import {
  CHART_SIZE_HOVER_STROKE_WIDTH,
  CHART_SIZE_STROKE_WIDTH,
  CONTROLLED_HIGHLIGHTED_SERIES,
  FADE_FACTOR,
  GROUP_ID,
  HOVER_FRACTION_DATA,
  HOVERED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { LegendOptions } from '../types';

export const getLegendHighlightSignals = (legends: LegendOptions[]): string[] =>
  legends
    .map((legend, index) => ({ ...legend, name: legend.name ?? `legend${index}` }))
    .filter((legend) => legend.highlight)
    .map((legend) => `${legend.name}_${HOVERED_SERIES}`);

type DataTransforms = NonNullable<Data['transform']>;

/**
 * Merges a legend hover match rule into an existing `_hoverTargetData` source's `target` formula,
 * and (for grouped legends) adds the legend's group field to the aggregate's groupby.
 */
const injectLegendHoverIntoTargetData = (
  transform: DataTransforms,
  legendName: string,
  matchExpr: string,
  groupIdField: string,
  keys?: string[]
): void => {
  if (keys?.length) {
    // Add legend group field to aggregate's groupby
    const aggregateTransform = transform.find((t): t is AggregateTransform => t.type === 'aggregate');
    if (aggregateTransform && Array.isArray(aggregateTransform.groupby)) {
      aggregateTransform.groupby.push(groupIdField);
    }
  }

  // Change the old target's name to conditions
  const targetTransform = transform.find((t): t is FormulaTransform => t.type === 'formula' && t.as === 'target');
  if (targetTransform) {
    targetTransform.as = 'conditions';
  }

  // Add the legend hover match formula, then combine it with the prior target into a new target formula
  transform.push(
    {
      type: 'formula' as const,
      as: `legendHoverMatch`,
      expr: `(isValid(${legendName}_${HOVERED_SERIES})) ? ((${matchExpr}) ? 1 : 0) : null`,
    },
    {
      type: 'formula' as const,
      as: `target`,
      expr: `isValid(datum.hoveredMatch) ? datum.hoveredMatch : isValid(datum.legendHoverMatch) ? datum.legendHoverMatch : datum.conditions`,
    }
  );
};

/**
 * For grouped legends, brings the group field into an existing `_hoverFractionData` source via
 * lookup, then adds a `_hoverGroupFractionData` source that aggregates fractions by group (max).
 */
const addGroupedFractionData = (
  fractionDataName: string,
  transform: DataTransforms,
  data: Data[],
  groupIdField: string
): void => {
  const markName = fractionDataName.replace('_hoverFractionData', '');
  transform.push({
    type: 'lookup' as const,
    from: `${markName}_hoverTargetData`,
    key: SERIES_ID,
    fields: [SERIES_ID],
    values: [groupIdField],
    as: [groupIdField]
  });

  data.push({
    name: `${markName}_hoverGroupFractionData`,
    source: `${markName}_hoverFractionData`,
    transform: [
      {
        type: 'aggregate' as const,
        groupby: [groupIdField],
        fields: ['fraction'],
        ops: ['max'],
        as: ['fraction']
      },
    ],
  });
};

/**
 * Injects a legend hover rule into the hover target data for the chart.
 */
export const injectLegendHoverIntoData = (legendName: string, data: Data[], keys?: string[]): void => {
  const groupIdField = `${legendName}_${GROUP_ID}`;
  const matchExpr = keys?.length
    ? `${legendName}_${HOVERED_SERIES} === datum.${legendName}_${GROUP_ID} ? 1 : 0`
    : `${legendName}_${HOVERED_SERIES} === datum.${SERIES_ID} ? 1 : 0`;

  for (const source of data) {
    const { name, transform } = source;
    if (!Array.isArray(transform) || typeof name !== 'string') continue;
    if (name.endsWith('_hoverTargetData')) {
      injectLegendHoverIntoTargetData(transform, legendName, matchExpr, groupIdField, keys);
    }
    if (name.endsWith('_hoverFractionData') && keys?.length) {
      addGroupedFractionData(name, transform, data, groupIdField);
    }
  }
};

/**
 * Whether an opacity encoding already reads from the hover-animation engine's fraction data
 */
const isAnimatedOpacity = (opacity: ProductionRule<NumericValueRef> | undefined): boolean => {
  const rules = Array.isArray(opacity) ? opacity : [opacity];
  return rules.some(
    (rule) =>
      typeof (rule as { signal?: string })?.signal === 'string' &&
      (rule as { signal: string }).signal.includes(HOVER_FRACTION_DATA)
  );
};

/**
 * Adds opacity tests for marks whose fill/stroke is driven by the color scale, and for marks
 * that are already per-series (e.g. trendlines, which facet by series regardless of their own
 * color encoding — a trendline with an overridden literal color still needs to fade on legend hover).
 */
export const setHoverOpacityForMarks = (legendName: string, marks: Mark[], keys?: string[], controlled = false) => {
  if (!marks.length) return;
  const flatMarks = flattenMarks(marks);
  const seriesMarks = flatMarks.filter(markIsSeriesAware);
  seriesMarks.forEach((mark) => {
    // Skip marks already on the hover-animation system — their opacity is driven by the animated fraction
    if (isAnimatedOpacity(mark.encode?.update?.opacity)) return;

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
      // skip marks that explicitly manage their own visibility — their final fallback is opacity 0
      // (e.g. overlay lines and fg label marks that should only appear for the highlighted series)
      const lastRule = Array.isArray(opacity) ? opacity.at(-1) : opacity;
      if ((lastRule as { value?: number })?.value === 0) return;

      // the new production rule for highlighting
      const highlightOpacityRule = getHighlightOpacityRule(legendName, controlled, keys);

      if (!Array.isArray(update.opacity)) {
        update.opacity = [];
      }
      // need to insert the new test in the second to last slot
      const opacityRuleInsertIndex = Math.max(update.opacity.length - 1, 0);
      update.opacity.splice(opacityRuleInsertIndex, 0, highlightOpacityRule);
    }
  });
};

/**
 * Injects a strokeWidth rule into marks that use the color scale so legend hover thickens the hovered series.
 */
export const setHoverStrokeWidthForMarks = (legendName: string, marks: Mark[], keys?: string[], controlled = false) => {
  if (!marks.length) return;
  const flatMarks = flattenMarks(marks);
  const seriesMarks = flatMarks.filter(markUsesSeriesColorScale);
  seriesMarks.forEach((mark) => {
    if (!mark.encode?.update) return;
    const { update } = mark.encode;
    if (update.strokeWidth === undefined) return;

    const highlightStrokeWidthRule = getHighlightStrokeWidthRule(legendName, controlled, keys);

    if (!Array.isArray(update.strokeWidth)) {
      update.strokeWidth = [];
    }
    const insertIndex = Math.max(update.strokeWidth.length - 1, 0);
    update.strokeWidth.splice(insertIndex, 0, highlightStrokeWidthRule);
  });
};

export const getHighlightStrokeWidthRule = (
  legendName: string,
  controlled: boolean,
  keys?: string[]
): { test?: string } & NumericValueRef => {
  if (controlled) {
    return {
      test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
      signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
    };
  }
  if (keys?.length) {
    return {
      test: `isValid(${legendName}_${HOVERED_SERIES})`,
      signal: `${legendName}_${HOVERED_SERIES} === datum.${legendName}_${GROUP_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
    };
  }
  // Default hover
  return {
    test: `isValid(${legendName}_${HOVERED_SERIES})`,
    signal: `${legendName}_${HOVERED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
  };
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
      test: `isValid(${legendName}_${HOVERED_SERIES})`,
      signal: `${legendName}_${HOVERED_SERIES} === datum.${legendName}_${GROUP_ID} ? 1 : ${FADE_FACTOR}`,
    };
  }
  return {
    test: `isValid(${legendName}_${HOVERED_SERIES})`,
    signal: `${legendName}_${HOVERED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
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