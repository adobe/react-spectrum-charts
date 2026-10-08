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
  ANIMATION_TIMER,
  BACKGROUND_COLOR,
  CONTROLLED_HIGHLIGHTED_ITEM,
  CONTROLLED_HIGHLIGHTED_SERIES,
  DEFAULT_HOLE_RATIO,
  DONUT_BOOLEAN_SECONDARY_COLOR,
  DONUT_DRAW_IN_LABEL_FADE_DURATION_MS,
  DONUT_LABEL_MIN_SPACE_RATIO,
  DONUT_LABEL_RING_GAPS,
  DONUT_RADIUS,
  DONUT_RING_WIDTHS,
  DONUT_SEMICIRCLE_RADIUS,
  DONUT_SIZE_TIER_LABELED_CHART_SIZES,
  DONUT_SIZE_TIER_UNLABELED_CHART_SIZES,
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SLICE_GAPS,
  DRAW_IN_ANIM_CUTOFF,
  DRAW_IN_ANIMATION_DURATION_MS,
  DRAW_IN_START,
  FADE_FACTOR,
  FILTERED_TABLE,
  HOVERED_ITEM,
  SELECTED_ITEM,
  SERIES_ID,
} from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { addHoveredItemOpacityRules } from '../chartInspect/chartInspectUtils.js';
import { getDeemphasisRamp, getHoverFractionSignal, HoverMatchRule } from '../marks/hoverAnimationUtils.js';
import {
  getColorProductionRule,
  getCursor,
  getInspectEncoding,
  getMarkOpacity,
  isInteractive,
} from '../marks/markUtils.js';
import { DonutSpecOptions } from '../types/index.js';

const DONUT_MIN_VISIBLE_SLICE_WIDTH = 1;

/** Returns whether a donut needs hover state for its own interactions or a highlighted legend. */
export const isDonutInteractive = (options: DonutSpecOptions): boolean =>
  isInteractive(options) || Boolean(options.legendHighlightSignals?.length);

export const getDonutAnimIdField = (name: string): string => `${name}_hoverId`;

/** Builds per-segment hover targets using the same precedence as Line hover. */
export const getDonutHoverRules = (options: DonutSpecOptions): HoverMatchRule[] => {
  const { idKey, name, chartPopovers } = options;
  const rules: HoverMatchRule[] = [];
  if (isDonutInteractive(options)) {
    rules.push({
      as: 'hoveredMatch',
      expr: `isValid(${name}_${HOVERED_ITEM}) ? (${name}_${HOVERED_ITEM}.${idKey} === datum.${idKey} ? 1 : 0) : null`,
    });
  }
  rules.push(
    {
      as: 'controlledTableMatch',
      expr: `isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) && length(${CONTROLLED_HIGHLIGHTED_ITEM}) ? (indexof(${CONTROLLED_HIGHLIGHTED_ITEM}, datum.${idKey}) > -1 ? 1 : 0) : null`,
    },
    {
      as: 'controlledSeriesMatch',
      expr: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) ? (${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null`,
    }
  );
  if (chartPopovers.length) {
    rules.push({
      as: 'popoverMatch',
      expr: `isValid(${SELECTED_ITEM}) ? (${SELECTED_ITEM} === datum.${idKey} ? 1 : 0) : null`,
    });
  }
  return rules;
};

/** Gets the shared arc and label opacity, animated when hover animations are enabled. */
export const getDonutOpacity = (options: DonutSpecOptions): ({ test?: string } & NumericValueRef)[] => {
  if (options.isHoverAnimate) {
    const ramp = getDeemphasisRamp(getHoverFractionSignal(options.name, getDonutAnimIdField(options.name)));
    return [{ signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}` }];
  }
  const opacity = getMarkOpacity(options);
  if (!isInteractive(options) && options.legendHighlightSignals?.length) {
    addHoveredItemOpacityRules(opacity, options);
  }
  return opacity;
};

/** Gets the 0-1 linear label fade that starts when the label's slice finishes drawing. */
export const getDonutLabelFadeProgressExpr = (options: DonutSpecOptions): string => {
  const startAngle = `datum['${options.name}_startAngle']`;
  const endAngle = `datum['${options.name}_endAngle']`;
  const drawStartAngle = getDonutStartAngle(options);
  const sweep = options.variant === 'semicircle' ? Math.PI : 2 * Math.PI;
  const endProgress = `clamp((${endAngle} - ${drawStartAngle}) / ${sweep}, 0, 1)`;
  const sliceEndTime = `${DRAW_IN_ANIMATION_DURATION_MS} * sqrt(${endProgress})`;
  const elapsed = `${ANIMATION_TIMER} - ${DRAW_IN_START}`;
  const linearFade = `clamp(((${elapsed}) - (${sliceEndTime})) / ${DONUT_DRAW_IN_LABEL_FADE_DURATION_MS}, 0, 1)`;
  return `(${endAngle} > ${startAngle} ? ${linearFade} : 0)`;
};

/** Combines the draw-in label fade with the donut's existing highlight opacity rules. */
export const getDonutLabelOpacity = (options: DonutSpecOptions): ({ test?: string } & NumericValueRef)[] => {
  const opacity = getDonutOpacity(options);
  if (!options.isDrawInAnimate) return opacity;
  const fadeProgress = getDonutLabelFadeProgressExpr(options);

  return opacity.map((rule) => {
    const baseOpacity = 'signal' in rule ? rule.signal : 'value' in rule ? rule.value : undefined;
    if (baseOpacity === undefined) throw new Error('Expected a value or signal for donut label opacity');
    return {
      ...(rule.test !== undefined && { test: rule.test }),
      signal: `(${baseOpacity}) * (${fadeProgress})`,
    };
  });
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
 * Gets the name of the signal holding the donut's size tier index (0-4 for XS/S/M/L/XL).
 * @param name donut name
 * @returns signal name
 */
export const getDonutSizeTierSignalName = (name: string): string => `${name}_sizeTier`;

/** Index of each donut size tier, as held by the size tier signal. */
export const DONUT_SIZE_TIER = { XS: 0, S: 1, M: 2, L: 3, XL: 4 } as const;

/**
 * Gets an expression that picks the value for the donut's size tier.
 * @param name donut name
 * @param values one value per size tier (XS/S/M/L/XL)
 * @returns vega expression string
 */
export const getSizeTierValueExpr = (name: string, values: (number | string)[]): string =>
  `[${values.join(', ')}][${getDonutSizeTierSignalName(name)}]`;

/**
 * Gets the donut's outer radius; with labels, shrinks the donut so its labels fit inside the chart, keeping it within its size tier.
 * @param donutOptions
 * @returns vega expression string
 */
export const getDonutOuterRadiusExpr = (options: DonutSpecOptions): string => {
  const baseRadius = getDonutBaseRadiusExpr(options);
  if (!isDonutLabelSpaceReserved(options)) {
    return baseRadius;
  }

  // the radius + the label gap + the minimum label space (radius × DONUT_LABEL_MIN_SPACE_RATIO) fills the base radius
  const ringGap = getDonutLabelRingGapSignalName(options.name);
  const labelFitRadius = `(${baseRadius} - ${ringGap}) / (1 + ${DONUT_LABEL_MIN_SPACE_RATIO})`;

  // half the next tier's min diameter; XL has no max
  const tierMaxDiameter = getSizeTierValueExpr(options.name, [...DONUT_SIZE_TIER_CUTPOINTS, 'MAX_VALUE']);
  const tierMaxRadius = `${tierMaxDiameter} / 2`;

  return `min(${labelFitRadius}, ${tierMaxRadius})`;
};

/**
 * Gets the chart size the donut's size tier is looked up from (the space its base radius is drawn in).
 * @param donutOptions
 * @returns vega expression string
 */
const getDonutChartSizeExpr = ({ variant }: DonutSpecOptions): string =>
  // a semicircle only sweeps the top half, so it can use twice the height
  variant === 'semicircle' ? 'min(width, 2 * height)' : 'min(width, height)';

/**
 * Gets the threshold scale that maps chart size to the donut's size tier index.
 * @param donutOptions
 * @returns ThresholdScale
 */
export const getSizeTierScale = (options: DonutSpecOptions): ThresholdScale => ({
  name: `${options.name}_sizeTierScale`,
  type: 'threshold',
  // labels need their own breakpoints, since the label gap and label space shrink the donut
  domain: isDonutLabelSpaceReserved(options)
    ? DONUT_SIZE_TIER_LABELED_CHART_SIZES
    : DONUT_SIZE_TIER_UNLABELED_CHART_SIZES,
  // tier indexes 0-4 (XS-XL)
  range: [0, ...DONUT_SIZE_TIER_CUTPOINTS.map((_, index) => index + 1)],
});

/**
 * Gets the signal resolving the donut's size tier index from chart size, shared by every size-tiered value.
 * @param donutOptions
 * @returns Signal
 */
export const getSizeTierSignal = (options: DonutSpecOptions): Signal => ({
  name: getDonutSizeTierSignalName(options.name),
  update: `scale('${options.name}_sizeTierScale', ${getDonutChartSizeExpr(options)})`,
});

/**
 * Gets the signal resolving the size-tiered gap (px) between the ring's outer edge and its segment labels.
 * @param donutOptions
 * @returns Signal[]
 */
export const getLabelRingGapSignals = ({ name, segmentLabels }: DonutSpecOptions): Signal[] =>
  segmentLabels.length
    ? [
      {
        name: getDonutLabelRingGapSignalName(name),
        update: getSizeTierValueExpr(name, DONUT_LABEL_RING_GAPS)
      },
    ]
    : [];

/**
 * Gets the signal that resolves a donut's fixed ring width from its size tier
 * @param donutOptions
 * @returns Signal
 */
export const getRingWidthSignal = ({ name }: DonutSpecOptions): Signal => ({
  name: `${name}_ringWidth`,
  update: getSizeTierValueExpr(name, DONUT_RING_WIDTHS),
});

/**
 * Gets the signal that resolves a donut's fixed segment gap (in px) from its size tier, using a fixed 1px gap for pies
 * @param donutOptions
 * @returns Signal
 */
export const getSliceGapSignal = ({ holeRatio, name }: DonutSpecOptions): Signal => ({
  name: `${name}_sliceGap`,
  // pies always use a 1px gap
  update: holeRatio === 0 ? '1' : getSizeTierValueExpr(name, DONUT_SLICE_GAPS),
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
  const { holeRatio, isDrawInAnimate, name } = options;
  if (holeRatio === 0) return requestedWidth;
  const radius = `max(0, ${getDonutInnerRadiusExpr(options)})`;
  const cutoff = `${name}_${DRAW_IN_ANIM_CUTOFF}`;
  const drawnStart = `min(datum['${name}_startAngle'], ${cutoff})`;
  const drawnEnd = `min(datum['${name}_endAngle'], ${cutoff})`;
  const arcLength = isDrawInAnimate ? `(${drawnEnd}) - (${drawnStart})` : `datum['${name}_arcLength']`;
  const arcAngle = `min(PI, max(0, ${arcLength}))`;
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

/** Gets an arc angle clipped to the draw-in sweep when enabled. */
export const getDonutAngleEncoding = (
  { isDrawInAnimate, name }: DonutSpecOptions,
  angle: 'startAngle' | 'endAngle'
): NumericValueRef => {
  const field = `${name}_${angle}`;
  return isDrawInAnimate
    ? { signal: `min(datum['${field}'], ${name}_${DRAW_IN_ANIM_CUTOFF})` }
    : { field };
};

/** Hides labels until their draw-in fade begins. */
export const getDonutDrawInLabelVisibilityRules = (options: DonutSpecOptions): ({ test: string } & NumericValueRef)[] =>
  options.isDrawInAnimate ? [{ test: `${getDonutLabelFadeProgressExpr(options)} <= 0`, value: 0 }] : [];

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
        startAngle: getDonutAngleEncoding(options, 'startAngle'),
        endAngle: getDonutAngleEncoding(options, 'endAngle'),
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
          ...(options.isDrawInAnimate
            ? [{ test: `${name}_${DRAW_IN_ANIM_CUTOFF} <= datum['${name}_startAngle']`, value: 0 }]
            : []),
          ...(options.isHoverAnimate ? [] : getLegendHighlightOpacityRules(legendHighlightSignals)),
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
