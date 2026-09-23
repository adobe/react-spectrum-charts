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
  BACKGROUND_COLOR,
  DEFAULT_HOLE_RATIO,
  DONUT_ADVANCED_LABEL_RING_GAP,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAP,
  DONUT_RADIUS,
  DONUT_RING_WIDTHS,
  DONUT_SEMICIRCLE_RADIUS,
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SLICE_GAPS,
  FADE_FACTOR,
  FILTERED_TABLE,
  SELECTED_ITEM,
  SERIES_ID,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { addHoveredItemOpacityRules } from '../chartInspect/chartInspectUtils';
import {
  getColorProductionRule,
  getCursor,
  getInspectEncoding,
  getMarkOpacity,
  isInteractive,
} from '../marks/markUtils';
import { DonutSpecOptions } from '../types';

/** Returns whether a donut needs hover state for its own interactions or a highlighted legend. */
export const isDonutInteractive = (options: DonutSpecOptions): boolean =>
  isInteractive(options) || Boolean(options.legendHighlightSignals?.length);

const getDonutOpacity = (options: DonutSpecOptions): ({ test?: string } & NumericValueRef)[] => {
  const opacity = getMarkOpacity(options);
  if (!isInteractive(options) && options.legendHighlightSignals?.length) {
    addHoveredItemOpacityRules(opacity, options);
  }
  return opacity;
};

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
 * Gets the arc fill, forcing the secondary segment of a boolean donut to secondary-gray. Boolean
 * donuts never support emphasizedItems (mirrors segment labels' isBoolean exclusion), so for
 * non-boolean donuts this defers to getEmphasizeFillEncoding instead.
 * @param options
 * @returns ColorValueRef | ProductionRule<ColorValueRef>
 */
const getArcFillEncoding = (options: DonutSpecOptions): ColorValueRef | ProductionRule<ColorValueRef> => {
  const { color, colorScheme, idKey, isBoolean, name } = options;
  if (!isBoolean) return getEmphasizeFillEncoding(options);

  const normalColor = getColorProductionRule(color, colorScheme);
  const isPrimaryTest = `datum.${idKey} === data('${name}_booleanData')[0].${idKey}`;
  return [{ test: `!(${isPrimaryTest})`, value: getS2ColorValue('gray-400', colorScheme) }, normalColor];
};

/**
 * Gets the donut's un-reserved base radius expression, using the full available height for a
 * semicircle (only the top half sweeps) instead of half of it for a full circle.
 * @param donutOptions
 * @returns vega expression string
 */
const getDonutBaseRadiusExpr = ({ variant }: DonutSpecOptions): string =>
  variant === 'semicircle' ? DONUT_SEMICIRCLE_RADIUS : DONUT_RADIUS;

/**
 * Gets the donut's outer radius, reserving space for SegmentLabel content when needed.
 * @param donutOptions
 * @returns vega expression string
 */
export const getDonutOuterRadiusExpr = (options: DonutSpecOptions): string => {
  const { isBoolean, segmentLabels, hideDeemphasizedLabels, emphasizedItems, variant } = options;
  const baseRadius = getDonutBaseRadiusExpr(options);
  // baseRadius is already parenthesized; the reserved branch below self-parenthesizes too, so
  // callers can interpolate this result directly without adding their own wrapping parens
  const visibleLabels = segmentLabels.filter(
    ({ labelMode }) => !(emphasizedItems?.length && hideDeemphasizedLabels && labelMode === 'deemphasized')
  );
  if (isBoolean || variant === 'semicircle' || !visibleLabels.length) return baseRadius;
  const ringGap = visibleLabels.some(({ swatch, showValueRow }) => swatch || showValueRow)
    ? DONUT_ADVANCED_LABEL_RING_GAP
    : DONUT_LABEL_RING_GAP;
  // solve R such that R + ringGap + R*capRatio == baseRadius (the worst-case label reach)
  return `((${baseRadius} - ${ringGap}) / (1 + ${DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO}))`;
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
 * Gets opacity rules that fade a segment when a paired Legend's hovered entry doesn't match it -
 * the reverse direction of the arc's own hover fading the legend (legendUtils.ts). Each signal
 * fades non-matching segments and falls through (to getMarkOpacity's own rules) otherwise, mirroring
 * the CONTROLLED_HIGHLIGHTED_ITEM rule shape in addHoveredItemOpacityRules.
 * @param legendHighlightSignals
 * @returns opacity rules
 */
const getLegendHighlightOpacityRules = (
  legendHighlightSignals: string[] = []
): ({ test: string } & NumericValueRef)[] =>
  legendHighlightSignals.map((signal) => ({
    test: `isValid(${signal}) && ${signal} !== datum.${SERIES_ID}`,
    value: FADE_FACTOR,
  }));

/**
 * Builds a Vega expression that evaluates to true for segments NOT in emphasizedItems. Matches
 * against the segment's own color facet value (not idKey), so users specify category names
 * directly - mirroring Line's primarySeries `string[]` usage.
 * @param emphasizedItems
 * @param color
 * @returns vega expression string
 */
const getEmphasizeOtherExpr = (emphasizedItems: (string | number)[], color: string): string =>
  `indexof(${JSON.stringify(emphasizedItems)}, datum.${color}) < 0`;

/**
 * Builds the arc's `fill` encoding, inserting a solid gray color rule (full opacity, not a fade)
 * for segments not in emphasizedItems
 * @param options
 * @returns ColorValueRef | ProductionRule<ColorValueRef>
 */
const getEmphasizeFillEncoding = (options: DonutSpecOptions): ColorValueRef | ProductionRule<ColorValueRef> => {
  const { color, colorScheme, emphasizedItems, otherItemColor } = options;
  const normalColor = getColorProductionRule(color, colorScheme);
  if (!emphasizedItems?.length) return normalColor;
  const grayColor = getS2ColorValue(otherItemColor || 'gray-400', colorScheme);
  return [{ test: getEmphasizeOtherExpr(emphasizedItems, color), value: grayColor }, normalColor];
};

const getHoveredArcFillEncoding = (
  options: DonutSpecOptions
): ColorValueRef | ProductionRule<ColorValueRef> | undefined => {
  const { color, colorScheme, emphasizedItems, idKey, name } = options;
  if (!emphasizedItems?.length || !isInteractive(options)) return;
  const normalColor = getColorProductionRule(color, colorScheme);
  const grayColor = getS2ColorValue(options.otherItemColor || 'gray-400', colorScheme);
  return [
    {
      test: `isValid(${name}_hoveredItem) && ${name}_hoveredItem.${idKey} === datum.${idKey}`,
      ...normalColor,
    },
    { test: getEmphasizeOtherExpr(emphasizedItems, color), value: grayColor },
    normalColor,
  ];
};

/**
 * Gets the y anchor signal for donut marks, placing a semicircle's flat edge below its diameter.
 * @param donutOptions
 * @returns vega signal string
 */
export const getDonutCenterYSignal = ({ variant }: DonutSpecOptions): string =>
  variant === 'semicircle' ? 'height' : 'height / 2';

export const getArcMark = (options: DonutSpecOptions): ArcMark => {
  const { chartPopovers, chartInspects, colorScheme, idKey, legendHighlightSignals, name } = options;
  const outerRadius = getDonutOuterRadiusExpr(options);
  const hoveredArcFillEncoding = getHoveredArcFillEncoding(options);
  return {
    type: 'arc',
    name,
    description: name,
    from: { data: FILTERED_TABLE },
    encode: {
      enter: {
        fill: getArcFillEncoding(options),
        x: { signal: 'width / 2' },
        y: { signal: getDonutCenterYSignal(options) },
        tooltip: getInspectEncoding(chartInspects, name),
      },
      update: {
        ...(hoveredArcFillEncoding ? { fill: hoveredArcFillEncoding } : {}),
        startAngle: { field: `${name}_startAngle` },
        endAngle: { field: `${name}_endAngle` },
        innerRadius: { signal: getDonutInnerRadiusExpr(options) },
        outerRadius: { signal: outerRadius },
        stroke: [
          { test: `${SELECTED_ITEM} === datum.${idKey}`, value: getS2ColorValue('static-blue', colorScheme) },
          { signal: BACKGROUND_COLOR },
        ],
        // hide the segments when there isn't any data to display, the empty state ring is shown instead
        opacity: [
          { test: getDonutEmptyStateTest(name), value: 0 },
          ...getLegendHighlightOpacityRules(legendHighlightSignals),
          ...getDonutOpacity(options),
        ],
        cursor: getCursor(chartPopovers),
        strokeWidth: [{ test: `${SELECTED_ITEM} === datum.${idKey}`, value: 2 }, { signal: `${name}_sliceGap` }],
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
  const { colorScheme, name, startAngle, variant } = options;
  const outerRadius = getDonutOuterRadiusExpr(options);
  const sweep = variant === 'semicircle' ? 'PI' : '2 * PI';
  return {
    type: 'arc',
    name: `${name}_emptyState`,
    description: `${name}_emptyState`,
    interactive: false,
    encode: {
      enter: {
        fill: { value: getS2ColorValue('gray-200', colorScheme) },
        x: { signal: 'width / 2' },
        y: { signal: getDonutCenterYSignal(options) },
        startAngle: { value: startAngle },
        endAngle: { signal: `${startAngle} + ${sweep}` },
      },
      update: {
        innerRadius: { signal: getDonutInnerRadiusExpr(options) },
        outerRadius: { signal: outerRadius },
        opacity: [{ test: getDonutEmptyStateTest(name), value: 1 }, { value: 0 }],
      },
    },
  };
};
