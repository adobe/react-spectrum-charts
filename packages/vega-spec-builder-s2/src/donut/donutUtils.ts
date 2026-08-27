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
import { ArcMark, ColorValueRef, NumericValueRef, ProductionRule, Signal, SourceData, ThresholdScale } from 'vega';

import {
  DEFAULT_HOLE_RATIO,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAP,
  DONUT_RADIUS,
  DONUT_RING_WIDTHS,
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SLICE_GAP_MAX_SEGMENT_FRACTION,
  DONUT_SLICE_GAPS,
  FADE_FACTOR,
  FILTERED_TABLE,
  SELECTED_ITEM,
  SERIES_ID,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getColorProductionRule, getCursor, getMarkOpacity, getInspectEncoding } from '../marks/markUtils';
import { DonutSpecOptions } from '../types';

/**
 * Gets the test expression that is true when the donut has no data or all metric values sum to 0.
 * When the metric sum is 0, the vega pie transform produces NaN angles which cannot be rendered.
 * @param name donut name
 * @returns vega expression string
 */
export const getDonutEmptyStateTest = (name: string): string =>
  `length(data('${FILTERED_TABLE}')) === 0 || !data('${name}_sumData')[0]['sum']`;

/**
 * Gets the data source that aggregates the sum of the metric.
 * Used to detect the empty state (no data or all metric values are 0).
 * @param donutOptions
 * @returns SourceData
 */
export const getSumData = ({ metric, name }: DonutSpecOptions): SourceData => ({
  name: `${name}_sumData`,
  source: FILTERED_TABLE,
  transform: [
    {
      type: 'aggregate',
      fields: [metric],
      ops: ['sum'],
      as: ['sum'],
    },
  ],
});

/**
 * Gets the arc fill, forcing the secondary segment of a boolean donut to secondary-gray
 * @param options
 * @returns ColorValueRef | ProductionRule<ColorValueRef>
 */
const getArcFillEncoding = ({
  color,
  colorScheme,
  idKey,
  isBoolean,
  name,
}: DonutSpecOptions): ColorValueRef | ProductionRule<ColorValueRef> => {
  const normalColor = getColorProductionRule(color, colorScheme);
  if (!isBoolean) return normalColor;

  const isPrimaryTest = `datum.${idKey} === data('${name}_booleanData')[0].${idKey}`;
  return [{ test: `!(${isPrimaryTest})`, value: getS2ColorValue('gray-400', colorScheme) }, normalColor];
};

/**
 * Gets the donut's outer radius. When a SegmentLabel with direct labels is present (and the donut
 * isn't boolean, which never renders them), this reserves room for the label's ring-gap and its
 * (capped) hemisphere pull-back out of the raw available radius, so the ring and its labels always
 * fit within the given container in a single deterministic pass - the ring never needs a further
 * reactive shrink, and the container never needs to grow beyond what's given.
 * @param donutOptions
 * @returns vega expression string
 */
export const getDonutOuterRadiusExpr = ({ isBoolean, segmentLabels }: DonutSpecOptions): string => {
  // DONUT_RADIUS is already parenthesized; the reserved branch below self-parenthesizes too, so
  // callers can interpolate this result directly without adding their own wrapping parens
  if (!segmentLabels.length || isBoolean) return DONUT_RADIUS;
  // solve R such that R + ringGap + R*capRatio == DONUT_RADIUS (the worst-case label reach)
  return `((${DONUT_RADIUS} - ${DONUT_LABEL_RING_GAP}) / (1 + ${DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO}))`;
};

/**
 * Gets the threshold scale that snaps a donut's outer diameter to its nearest named size tier's fixed ring width
 * @param donutOptions
 * @returns ThresholdScale
 */
export const getRingWidthScale = ({ name }: DonutSpecOptions): ThresholdScale => ({
  name: `${name}_ringWidthScale`,
  type: 'threshold',
  domain: DONUT_SIZE_TIER_CUTPOINTS,
  range: DONUT_RING_WIDTHS,
});

/**
 * Gets the signal that resolves a donut's fixed ring width from its outer diameter (the label-reserved
 * radius, so the ring width tier stays consistent with the label font-size tier)
 * @param donutOptions
 * @returns Signal
 */
export const getRingWidthSignal = (options: DonutSpecOptions): Signal => ({
  name: `${options.name}_ringWidth`,
  update: `scale('${options.name}_ringWidthScale', 2 * ${getDonutOuterRadiusExpr(options)})`,
});

/**
 * Gets the threshold scale that snaps a donut's outer diameter to its nearest named size tier's fixed slice gap
 * @param donutOptions
 * @returns ThresholdScale
 */
export const getSliceGapScale = ({ name }: DonutSpecOptions): ThresholdScale => ({
  name: `${name}_sliceGapScale`,
  type: 'threshold',
  domain: DONUT_SIZE_TIER_CUTPOINTS,
  range: DONUT_SLICE_GAPS,
});

/**
 * Gets the signal that resolves a donut's fixed segment gap (in px) from its outer diameter (the
 * label-reserved radius, so the slice gap tier stays consistent with the label font-size tier)
 * @param donutOptions
 * @returns Signal
 */
export const getSliceGapSignal = (options: DonutSpecOptions): Signal => ({
  name: `${options.name}_sliceGap`,
  update: `scale('${options.name}_sliceGapScale', 2 * ${getDonutOuterRadiusExpr(options)})`,
});

/**
 * Gets the donut's inner radius expression, relative to the label-reserved outer radius. Uses the
 * fixed per-tier ring width when holeRatio is left at its default, otherwise honors an explicitly
 * customized holeRatio as a proportional ring.
 * @param donutOptions
 * @returns vega expression string
 */
export const getDonutInnerRadiusExpr = (options: DonutSpecOptions): string => {
  const { holeRatio, name } = options;
  const outerRadius = getDonutOuterRadiusExpr(options);
  return holeRatio === DEFAULT_HOLE_RATIO ? `(${outerRadius} - ${name}_ringWidth)` : `${holeRatio} * ${outerRadius}`;
};

/**
 * Gets the padAngle expression for the arc mark. Converts the per-tier fixed px slice gap
 * (chart.donut.size.slice-gap) to an angle at the outer radius, capped to a fraction of this
 * specific segment's own angular width (`${name}_arcLength`, already computed by the pie
 * transform) - otherwise a segment much smaller than the fixed gap could have its entire
 * angular width eaten by it, collapsing to nothing instead of just rendering a smaller gap.
 * Capping against the segment's own width (rather than the average across all segments) is
 * what actually prevents collapse for a donut whose segment sizes are highly skewed - an
 * average gets dragged up by the larger segments and wouldn't meaningfully shrink the gap for
 * the specific tiny ones that are actually at risk.
 * @param donutOptions
 * @returns vega expression string
 */
const getPadAngleExpr = (options: DonutSpecOptions): string => {
  const { name } = options;
  const outerRadius = getDonutOuterRadiusExpr(options);
  const fixedGapAngle = `${name}_sliceGap / ${outerRadius}`;
  const segmentAngle = `datum['${name}_arcLength']`;
  return `min(${fixedGapAngle}, ${segmentAngle} * ${DONUT_SLICE_GAP_MAX_SEGMENT_FRACTION})`;
};

/**
 * Gets opacity rules that fade a segment when a paired Legend's hovered entry doesn't match it -
 * the reverse direction of the arc's own hover fading the legend (legendUtils.ts). Each signal
 * fades non-matching segments and falls through (to getMarkOpacity's own rules) otherwise, mirroring
 * the CONTROLLED_HIGHLIGHTED_ITEM rule shape in addHoveredItemOpacityRules.
 * @param legendHighlightSignals
 * @returns opacity rules
 */
const getLegendHighlightOpacityRules = (legendHighlightSignals: string[] = []): ({ test: string } & NumericValueRef)[] =>
  legendHighlightSignals.map((signal) => ({
    test: `isValid(${signal}) && ${signal} !== datum.${SERIES_ID}`,
    value: FADE_FACTOR,
  }));

export const getArcMark = (options: DonutSpecOptions): ArcMark => {
  const { chartPopovers, chartInspects, colorScheme, idKey, legendHighlightSignals, name } = options;
  const outerRadius = getDonutOuterRadiusExpr(options);
  return {
    type: 'arc',
    name,
    description: name,
    from: { data: FILTERED_TABLE },
    encode: {
      enter: {
        fill: getArcFillEncoding(options),
        x: { signal: 'width / 2' },
        y: { signal: 'height / 2' },
        tooltip: getInspectEncoding(chartInspects, name),
        stroke: { value: getS2ColorValue('static-blue', colorScheme) },
      },
      update: {
        startAngle: { field: `${name}_startAngle` },
        endAngle: { field: `${name}_endAngle` },
        padAngle: { signal: getPadAngleExpr(options) },
        innerRadius: { signal: getDonutInnerRadiusExpr(options) },
        outerRadius: { signal: outerRadius },
        // hide the segments when there isn't any data to display, the empty state ring is shown instead
        opacity: [
          { test: getDonutEmptyStateTest(name), value: 0 },
          ...getLegendHighlightOpacityRules(legendHighlightSignals),
          ...getMarkOpacity(options),
        ],
        cursor: getCursor(chartPopovers),
        strokeWidth: [{ test: `${SELECTED_ITEM} === datum.${idKey}`, value: 2 }, { value: 0 }],
      },
    },
  };
};

/**
 * Gets the empty state arc mark. This is a light gray ring that is only visible
 * when the donut has no data or all metric values sum to 0.
 * @param donutOptions
 * @returns ArcMark
 */
export const getEmptyStateArcMark = (options: DonutSpecOptions): ArcMark => {
  const { colorScheme, name } = options;
  const outerRadius = getDonutOuterRadiusExpr(options);
  return {
    type: 'arc',
    name: `${name}_emptyState`,
    description: `${name}_emptyState`,
    interactive: false,
    encode: {
      enter: {
        fill: { value: getS2ColorValue('gray-200', colorScheme) },
        x: { signal: 'width / 2' },
        y: { signal: 'height / 2' },
        startAngle: { value: 0 },
        endAngle: { signal: '2 * PI' },
      },
      update: {
        innerRadius: { signal: getDonutInnerRadiusExpr(options) },
        outerRadius: { signal: outerRadius },
        opacity: [{ test: getDonutEmptyStateTest(name), value: 1 }, { value: 0 }],
      },
    },
  };
};
