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
  DONUT_BOOLEAN_SECONDARY_COLOR,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAPS,
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

const DONUT_MIN_VISIBLE_SLICE_WIDTH = 1;

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
  return [
    { test: `!(${isPrimaryTest})`, value: getS2ColorValue(DONUT_BOOLEAN_SECONDARY_COLOR, colorScheme) },
    normalColor,
  ];
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
 * Returns whether the donut's outer radius is reduced to make room for visible SegmentLabels.
 * @param donutOptions
 * @returns boolean
 */
const isDonutLabelSpaceReserved = ({
  isBoolean,
  segmentLabels,
  hideDeemphasizedLabels,
  emphasizedItems,
  variant,
}: DonutSpecOptions): boolean =>
  !isBoolean &&
  variant !== 'semicircle' &&
  segmentLabels.some(
    ({ labelMode }) => !(emphasizedItems?.length && hideDeemphasizedLabels && labelMode === 'deemphasized')
  );

/**
 * Gets the name of the signal holding the size-tiered gap (px) between the ring and its segment labels.
 * @param name donut name
 * @returns signal name
 */
export const getDonutLabelRingGapSignalName = (name: string): string => `${name}_labelRingGap`;

/**
 * Gets the donut's outer radius, reserving space for SegmentLabel content when needed.
 * @param donutOptions
 * @returns vega expression string
 */
export const getDonutOuterRadiusExpr = (options: DonutSpecOptions): string => {
  const baseRadius = getDonutBaseRadiusExpr(options);
  // baseRadius is already parenthesized; the reserved branch below self-parenthesizes too, so
  // callers can interpolate this result directly without adding their own wrapping parens
  if (!isDonutLabelSpaceReserved(options)) return baseRadius;
  const ringGap = getDonutLabelRingGapSignalName(options.name);
  // solve R such that R + ringGap + R*capRatio == baseRadius (the worst-case label reach)
  return `((${baseRadius} - ${ringGap}) / (1 + ${DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO}))`;
};

/**
 * Gets the name of the signal holding the min diameter of the donut's size tier (0 for XS).
 * @param name donut name
 * @returns signal name
 */
const getSizeTierDiameterSignalName = (name: string): string => `${name}_sizeTierDiameter`;

/**
 * Gets the diameter every size-tiered value (ring width, slice gap, fonts, label gap) looks up its tier from.
 * @param donutOptions
 * @returns vega expression string
 */
export const getDonutSizeTierDiameterExpr = (options: DonutSpecOptions): string =>
  isDonutLabelSpaceReserved(options)
    ? getSizeTierDiameterSignalName(options.name)
    : `2 * ${getDonutBaseRadiusExpr(options)}`;

/**
 * Gets the min diameter of the donut's size tier, moving up a tier only once that tier's label gap still fits.
 * @param baseRadius
 * @returns vega expression string
 */
const getReservedSizeTierDiameterExpr = (baseRadius: string): string => {
  // why: the label gap is tiered, so every tiered value must switch at the same point as the gap
  // a bigger gap makes the donut smaller, so check the chart size (baseRadius) rather than the donut's own diameter
  let expr = '0';
  // wraps each tier around the smaller tiers' expression, so the largest tier is checked first
  DONUT_SIZE_TIER_CUTPOINTS.forEach((cutpoint, index) => {
    // chart size (baseRadius) needed for the donut to reach this tier's minimum diameter, before adding the gap
    const cutpointRadius = (cutpoint * (1 + DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO)) / 2;
    const tierGap = DONUT_LABEL_RING_GAPS[index + 1];
    // move up a tier only when the chart is big enough that this tier's gap keeps the donut in it
    // e.g. a donut that is 403px with the L gap (10px) stays L, since the XL gap (15px) would shrink it to 396px
    expr = `${baseRadius} >= ${cutpointRadius + tierGap} ? ${cutpoint} : ${expr}`;
  });
  return expr;
};

/**
 * Gets the signal resolving the donut's size tier when labels reserve space out of its radius.
 * @param donutOptions
 * @returns Signal[]
 */
export const getSizeTierDiameterSignals = (options: DonutSpecOptions): Signal[] =>
  isDonutLabelSpaceReserved(options)
    ? [
        {
          name: getSizeTierDiameterSignalName(options.name),
          update: getReservedSizeTierDiameterExpr(getDonutBaseRadiusExpr(options)),
        },
      ]
    : [];

/**
 * Gets the threshold scale that maps a donut's size tier to its label ring gap.
 * @param donutOptions
 * @returns ThresholdScale[]
 */
export const getLabelRingGapScales = ({ name, segmentLabels }: DonutSpecOptions): ThresholdScale[] =>
  segmentLabels.length
    ? [
        {
          name: `${name}_labelRingGapScale`,
          type: 'threshold',
          domain: DONUT_SIZE_TIER_CUTPOINTS,
          range: DONUT_LABEL_RING_GAPS,
        },
      ]
    : [];

/**
 * Gets the signal resolving the size-tiered gap (px) between the ring's outer edge and its segment labels.
 * @param donutOptions
 * @returns Signal[]
 */
export const getLabelRingGapSignals = (options: DonutSpecOptions): Signal[] =>
  options.segmentLabels.length
    ? [
        {
          name: getDonutLabelRingGapSignalName(options.name),
          update: `scale('${options.name}_labelRingGapScale', ${getDonutSizeTierDiameterExpr(options)})`,
        },
      ]
    : [];

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
 * Gets the signal that resolves a donut's fixed ring width from its shared size tier
 * @param donutOptions
 * @returns Signal
 */
export const getRingWidthSignal = (options: DonutSpecOptions): Signal => ({
  name: `${options.name}_ringWidth`,
  update: `scale('${options.name}_ringWidthScale', ${getDonutSizeTierDiameterExpr(options)})`,
});

/**
 * Gets size-tiered donut slice gaps, using a fixed 1px gap for pies.
 * @param donutOptions
 * @returns ThresholdScale
 */
export const getSliceGapScale = ({ holeRatio, name }: DonutSpecOptions): ThresholdScale => ({
  name: `${name}_sliceGapScale`,
  type: 'threshold',
  domain: DONUT_SIZE_TIER_CUTPOINTS,
  range: holeRatio === 0 ? DONUT_SLICE_GAPS.map(() => 1) : DONUT_SLICE_GAPS,
});

/**
 * Gets the signal that resolves a donut's fixed segment gap (in px) from its shared size tier
 * @param donutOptions
 * @returns Signal
 */
export const getSliceGapSignal = (options: DonutSpecOptions): Signal => ({
  name: `${options.name}_sliceGap`,
  update: `scale('${options.name}_sliceGapScale', ${getDonutSizeTierDiameterExpr(options)})`,
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
 * Preserves fixed pie outlines and clamps donut outlines to preserve fill at the inner radius.
 * @param options
 * @param requestedWidth
 * @returns vega expression string
 */
export const getSliceStrokeWidthExpr = (options: DonutSpecOptions, requestedWidth: string): string => {
  const { holeRatio, name } = options;
  if (holeRatio === 0) return requestedWidth;
  const radius = `max(0, ${getDonutInnerRadiusExpr(options)})`;
  const arcAngle = `min(PI, max(0, datum['${name}_arcLength']))`;
  const availableWidth = `2 * (${radius}) * sin((${arcAngle}) / 2)`;
  const visibleWidth = `max(0, (${availableWidth}) - ${DONUT_MIN_VISIBLE_SLICE_WIDTH})`;
  return `min(${requestedWidth}, ${visibleWidth})`;
};

/**
 * Insets a clamped slice so its visible ring height matches slices with the full separator.
 * @param options
 * @param effectiveStrokeWidth
 * @returns vega expression string
 */
const getClampedSliceRadiusInsetExpr = (
  options: DonutSpecOptions,
  effectiveStrokeWidth: string
): string => `(${options.name}_sliceGap - (${effectiveStrokeWidth})) / 2`;

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
  const { color, colorScheme, emphasizedItems } = options;
  const normalColor = getColorProductionRule(color, colorScheme);
  if (!emphasizedItems?.length) return normalColor;
  const grayColor = getS2ColorValue('gray-400', colorScheme);
  return [{ test: getEmphasizeOtherExpr(emphasizedItems, color), value: grayColor }, normalColor];
};

const getHoveredArcFillEncoding = (
  options: DonutSpecOptions
): ColorValueRef | ProductionRule<ColorValueRef> | undefined => {
  const { color, colorScheme, emphasizedItems, idKey, name } = options;
  if (!emphasizedItems?.length || !isInteractive(options)) return;
  const normalColor = getColorProductionRule(color, colorScheme);
  const grayColor = getS2ColorValue('gray-400', colorScheme);
  return [
    {
      test: `isValid(${name}_hoveredItem) && ${name}_hoveredItem.${idKey} === datum.${idKey}`,
      ...normalColor,
    },
    { test: getEmphasizeOtherExpr(emphasizedItems, color), value: grayColor },
    normalColor,
  ];
};

export const getDonutStartAngle = ({ variant }: Pick<DonutSpecOptions, 'variant'>): number =>
  variant === 'semicircle' ? -Math.PI / 2 : 0;

/**
 * Gets the y anchor signal for donut marks, placing a semicircle's flat edge below its diameter.
 * @param donutOptions
 * @returns vega signal string
 */
export const getDonutCenterYSignal = ({ donutSummaries, name, variant }: DonutSpecOptions): string => {
  if (variant !== 'semicircle') {
    return 'height / 2';
  }
  const summary = donutSummaries[0];
  const hasThreeSummaryRows = summary?.delta !== undefined && !summary.hideValue && Boolean(summary.label);
  return hasThreeSummaryRows ? `height - ${name}_summaryBottomOffset` : 'height';
};

export const getArcMark = (options: DonutSpecOptions): ArcMark => {
  const { chartPopovers, chartInspects, colorScheme, idKey, legendHighlightSignals, name } = options;
  const outerRadius = getDonutOuterRadiusExpr(options);
  const sliceStrokeWidth = getSliceStrokeWidthExpr(options, `${name}_sliceGap`);
  const clampedRadiusInset = getClampedSliceRadiusInsetExpr(options, sliceStrokeWidth);
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
        innerRadius:
          options.holeRatio === 0
            ? { value: 0 }
            : { signal: `(${getDonutInnerRadiusExpr(options)}) + (${clampedRadiusInset})` },
        outerRadius: { signal: `(${outerRadius}) - (${clampedRadiusInset})` },
        stroke: [
          { test: `${SELECTED_ITEM} === datum.${idKey}`, value: getS2ColorValue('static-blue', colorScheme) },
          { signal: BACKGROUND_COLOR },
        ],
        ...(options.holeRatio === 0 ? { strokeJoin: { value: 'bevel' as const } } : {}),
        // hide the segments when there isn't any data to display, the empty state ring is shown instead
        opacity: [
          { test: getDonutEmptyStateTest(name), value: 0 },
          ...getLegendHighlightOpacityRules(legendHighlightSignals),
          ...getDonutOpacity(options),
        ],
        cursor: getCursor(chartPopovers),
        strokeWidth: [
          {
            test: `${SELECTED_ITEM} === datum.${idKey}`,
            signal: getSliceStrokeWidthExpr(options, '2'),
          },
          { signal: sliceStrokeWidth },
        ],
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
  const { colorScheme, name, variant } = options;
  const startAngle = getDonutStartAngle(options);
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
