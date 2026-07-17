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
import {
  ArrayValueRef,
  ColorValueRef,
  EncodeEntry,
  GroupMark,
  NumericValueRef,
  ProductionRule,
  RectEncodeEntry,
  RectMark,
} from 'vega';

import {
  BACKGROUND_COLOR,
  DIMENSION_HOVER_AREA,
  FILTERED_TABLE,
  LAST_RSC_SERIES_ID,
  SELECTED_GROUP,
  SELECTED_ITEM,
  SERIES_ID,
  STACK_ID,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getPopovers } from '../chartPopover/chartPopoverUtils';
import {
  getColorProductionRule,
  getCursor,
  getMarkOpacity,
  getOpacityProductionRule,
  getStrokeDashProductionRule,
  getInspectEncoding,
  hasPopover,
} from '../marks/markUtils';
import { getBandPadding } from '../scale/scaleSpecBuilder';
import { getLineWidthPixelsFromLineWidth } from '../specUtils';
import { BarSpecOptions, Orientation } from '../types';
import { getTrellisProperties, isTrellised } from './trellisedBarUtils';

/**
 * checks to see if the bar is faceted in the stacked and dodged dimensions
 * @param color
 */
export const isDodgedAndStacked = ({ color, lineType, opacity }: BarSpecOptions): boolean => {
  return [color, lineType, opacity].some((facet) => Array.isArray(facet) && facet.length === 2);
};

/**
 * Checks if the bar chart is a dual metric axis chart
 * @param options - The bar chart options
 * @returns True if the bar chart is a dual metric axis chart, false otherwise
 */
export const isDualMetricAxis = (options: BarSpecOptions) => {
  const { dualMetricAxis, type } = options;
  return Boolean(dualMetricAxis && !isTrellised(options) && type === 'dodged' && !isDodgedAndStacked(options));
};

export const getDodgedGroupMark = (options: BarSpecOptions): GroupMark => {
  const { dimension, groupedPadding, orientation, name, paddingRatio } = options;

  const { dimensionScaleKey, dimensionAxis, dimensionSizeSignal } = getOrientationProperties(orientation);

  return {
    name: `${name}_group`,
    type: 'group',
    from: {
      facet: {
        data: isTrellised(options) ? getTrellisProperties(options).facetName : FILTERED_TABLE,
        name: `${name}_facet`,
        groupby: dimension,
      },
    },
    encode: {
      enter: {
        [dimensionAxis]: {
          scale: dimensionScaleKey,
          field: dimension,
        },
      },
    },
    signals: [{ name: dimensionSizeSignal, update: `bandwidth("${dimensionScaleKey}")` }],
    scales: [
      {
        name: `${name}_position`,
        type: 'band',
        range: dimensionSizeSignal,
        // want to reference the FILTERED_TABLE and not the facet table because we want the bar widths and positioning to be consistent across facets
        // if we don't do this, the bar widths could be different for the different groups if one of the groups is missing a value
        domain: { data: FILTERED_TABLE, field: `${name}_dodgeGroup` },
        paddingInner: groupedPadding ?? paddingRatio,
      },
    ],
  };
};

export const getDodgedDimensionEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const { dimensionAxis, dimensionSizeSignal } = getOrientationProperties(options.orientation);

  const scale = `${options.name}_position`;
  const field = `${options.name}_dodgeGroup`;

  return {
    [dimensionAxis]: { scale, field },
    [dimensionSizeSignal]: { scale, band: 1 },
  };
};

export const getTrellisedDimensionEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const { dimensionAxis, dimensionSizeSignal, dimensionScaleKey } = getOrientationProperties(options.orientation);

  return {
    [dimensionAxis]: { scale: dimensionScaleKey, field: options.dimension },
    [dimensionSizeSignal]: { scale: dimensionScaleKey, band: 1 },
  };
};

export const getMetricEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const { metric, type } = options;
  const { metricAxis: startKey, metricScaleKey: scaleKey } = getOrientationProperties(
    options.orientation,
    options.metricAxis
  );
  const endKey = `${startKey}2`;

  if (type === 'stacked' || isDodgedAndStacked(options)) {
    return getStackedMetricEncodings(options);
  }

  if (isDualMetricAxis(options)) {
    return {
      [startKey]: [
        {
          test: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}`,
          scale: `${scaleKey}Secondary`,
          value: 0,
        },
        {
          scale: `${scaleKey}Primary`,
          value: 0,
        },
      ],
      [endKey]: [
        {
          test: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}`,
          scale: `${scaleKey}Secondary`,
          field: metric,
        },
        {
          scale: `${scaleKey}Primary`,
          field: metric,
        },
      ],
    };
  }

  return {
    [startKey]: { scale: scaleKey, value: 0 },
    [endKey]: { scale: scaleKey, field: metric },
  };
};

export const getStackedMetricEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const { metric, orientation } = options;
  const { metricAxis: startKey, metricScaleKey: scaleKey } = getOrientationProperties(
    options.orientation,
    options.metricAxis
  );
  const endKey = `${startKey}2`;

  const startValue = `datum.${metric}0`;
  const endValue = `datum.${metric}1`;

  const pixelGapBetweenBars = 1.5;

  if (orientation === 'vertical') {
    return {
      [startKey]: [
        // if the bar starts at 0, no need to calculate any shifts
        { test: `${startValue} === 0`, signal: `scale('${scaleKey}', ${startValue})` },
        // if the bar is positive, shift the start up by 1.5px gap
        {
          test: `${endValue} > 0`,
          signal: `max(scale('${scaleKey}', ${startValue}) - ${pixelGapBetweenBars}, scale('${scaleKey}', ${endValue}))`,
        },
        // if the bar is negative, shift the start down by 1.5px gap
        {
          signal: `min(scale('${scaleKey}', ${startValue}) + ${pixelGapBetweenBars}, scale('${scaleKey}', ${endValue}))`,
        },
      ],
      [endKey]: { scale: scaleKey, field: `${metric}1` },
    };
  }

  return {
    [startKey]: [
      // if the bar starts at 0, no need to calculate any shifts
      { test: `${startValue} === 0`, signal: `scale('${scaleKey}', ${startValue})` },
      // if the bar is positive, shift the start right by 1.5px gap
      {
        test: `${endValue} > 0`,
        signal: `min(scale('${scaleKey}', ${startValue}) + ${pixelGapBetweenBars}, scale('${scaleKey}', ${endValue}))`,
      },
      // if the bar is negative, shift the start left by 1.5px gap
      {
        signal: `max(scale('${scaleKey}', ${startValue}) - ${pixelGapBetweenBars}, scale('${scaleKey}', ${endValue}))`,
      },
    ],
    [endKey]: { scale: scaleKey, field: `${metric}1` },
  };
};

export const getCornerRadiusEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const { type, metric, hasSquareCorners } = options;
  // S2 always uses 4px corner radius (or 0 if square corners requested)
  const cornerRadius = hasSquareCorners ? 0 : 4;

  let rectEncodeEntry: RectEncodeEntry;

  if (type === 'dodged' && !isDodgedAndStacked(options)) {
    rectEncodeEntry = {
      cornerRadiusTopLeft: [{ test: `datum.${metric} > 0`, value: cornerRadius }, { value: 0 }],
      cornerRadiusTopRight: [{ test: `datum.${metric} > 0`, value: cornerRadius }, { value: 0 }],
      cornerRadiusBottomLeft: [{ test: `datum.${metric} < 0`, value: cornerRadius }, { value: 0 }],
      cornerRadiusBottomRight: [{ test: `datum.${metric} < 0`, value: cornerRadius }, { value: 0 }],
    };
  } else {
    rectEncodeEntry = getStackedCornerRadiusEncodings(options);
  }

  return rotateRectClockwiseIfNeeded(rectEncodeEntry, options);
};

export const getStackedCornerRadiusEncodings = ({
  name,
  metric,
  hasSquareCorners,
}: BarSpecOptions): RectEncodeEntry => {
  const topTestString = `datum.${metric}1 > 0 && data('${name}_stacks')[indexof(pluck(data('${name}_stacks'), '${STACK_ID}'), datum.${STACK_ID})].max_${metric}1 === datum.${metric}1`;
  const bottomTestString = `datum.${metric}1 < 0 && data('${name}_stacks')[indexof(pluck(data('${name}_stacks'), '${STACK_ID}'), datum.${STACK_ID})].min_${metric}1 === datum.${metric}1`;
  // S2 always uses 4px corner radius (or 0 if square corners requested)
  const cornerRadius = hasSquareCorners ? 0 : 4;

  return {
    cornerRadiusTopLeft: [{ test: topTestString, value: cornerRadius }, { value: 0 }],
    cornerRadiusTopRight: [{ test: topTestString, value: cornerRadius }, { value: 0 }],
    cornerRadiusBottomLeft: [{ test: bottomTestString, value: cornerRadius }, { value: 0 }],
    cornerRadiusBottomRight: [{ test: bottomTestString, value: cornerRadius }, { value: 0 }],
  };
};

export const rotateRectClockwiseIfNeeded = (
  rectEncodeEntry: RectEncodeEntry,
  { orientation }: BarSpecOptions
): RectEncodeEntry => {
  if (orientation === 'vertical') return rectEncodeEntry;
  return {
    cornerRadiusTopLeft: rectEncodeEntry.cornerRadiusBottomLeft,
    cornerRadiusTopRight: rectEncodeEntry.cornerRadiusTopLeft,
    cornerRadiusBottomLeft: rectEncodeEntry.cornerRadiusBottomRight,
    cornerRadiusBottomRight: rectEncodeEntry.cornerRadiusTopRight,
  };
};

export const getBaseBarEnterEncodings = (options: BarSpecOptions): EncodeEntry => ({
  ...getMetricEncodings(options),
  ...getCornerRadiusEncodings(options),
});

/**
 * Returns the Vega fill encoding for the bar. When {@link BarSpecOptions.colorOverride} is set
 * it takes precedence and the bar fill is taken from that data field (one color per row).
 * Otherwise fill is from the color scale via {@link getColorProductionRule} using {@link BarSpecOptions.color}.
 */
export const getBarFillEncoding = (options: BarSpecOptions): ColorValueRef => {
  const { colorOverride, color, colorScheme } = options;
  if (colorOverride) {
    return { signal: `datum[${JSON.stringify(colorOverride)}]` };
  }
  return getColorProductionRule(color, colorScheme);
};

export const getBarEnterEncodings = (options: BarSpecOptions): EncodeEntry => ({
  fill: getBarFillEncoding(options),
  fillOpacity: getOpacityProductionRule(options.opacity),
  tooltip: getInspectEncoding(options.chartInspects, options.name),
});

export const getBarUpdateEncodings = (options: BarSpecOptions): EncodeEntry => ({
  cursor: getCursor(options.chartPopovers, options.hasOnClick),
  opacity: getMarkOpacity(options),
  stroke: getStroke(options),
  strokeDash: getStrokeDash(options),
  strokeWidth: getStrokeWidth(options),
});

export const getStroke = (options: BarSpecOptions): ProductionRule<ColorValueRef> => {
  const { name, chartPopovers, colorScheme, idKey } = options;
  const defaultProductionRule = getBarFillEncoding(options);
  if (!hasPopover({ chartPopovers })) {
    return [defaultProductionRule];
  }

  return [
    {
      test: `(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${idKey}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.${name}_selectedGroupId)`,
      value: getS2ColorValue('static-blue', colorScheme),
    },
    defaultProductionRule,
  ];
};

/**
 * Determines whether the per-item selection ring should be added for this mark.
 * Mutually exclusive with the dimension-level {@link getDimensionSelectionRing}, which
 * already provides its own group-spanning ring for `UNSAFE_highlightBy: 'dimension'` popovers.
 */
export const shouldShowItemSelectionRing = (options: BarSpecOptions): boolean => {
  const { chartPopovers, name } = options;
  const popovers = getPopovers(chartPopovers, name);
  return popovers.length > 0 && !popovers.some(({ UNSAFE_highlightBy }) => UNSAFE_highlightBy === 'dimension');
};

// gap, in pixels, between the bar's own edge and the selection ring's stroke (matches Figma's `padding: 2px`)
const SELECTION_RING_GAP = 2;
// matches Figma's `border: 2px solid`
const SELECTION_RING_STROKE_WIDTH = 2;
// Vega centers a rect's stroke on its path, but the Figma spec draws the border fully outside the
// padding box. Offsetting the path by gap + half the stroke width makes the stroke's inner edge land
// exactly at the gap boundary, so the rendered border spans [gap, gap + strokeWidth] from the bar's edge.
const SELECTION_RING_PADDING = SELECTION_RING_GAP + SELECTION_RING_STROKE_WIDTH / 2;

/**
 * The selection ring's corner radius matches the bar's own per-corner radius (already
 * orientation/sign-aware via {@link getCornerRadiusEncodings}), widened by the ring's gap to the bar
 * so the ring's corners stay visually concentric with the bar's own corners. Per the Figma spec
 * (`border-radius: 2px … 6px`) the outset here is the gap only (bar radius 0/4 → ring 2/6), not the
 * position padding — the extra half-stroke used for positioning would over-round each corner by 1px.
 */
const getSelectionRingCornerRadiusEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const barCornerRadius = getCornerRadiusEncodings(options);
  // each corner is a plain-numeric production rule; widen every branch's value by the gap
  const widen = (rule: ProductionRule<NumericValueRef>): ProductionRule<NumericValueRef> => {
    const add = (branch: NumericValueRef): NumericValueRef => ({
      ...branch,
      value: (branch as { value: number }).value + SELECTION_RING_GAP,
    });
    return (Array.isArray(rule) ? rule.map(add) : add(rule)) as ProductionRule<NumericValueRef>;
  };
  return {
    cornerRadiusTopLeft: widen(barCornerRadius.cornerRadiusTopLeft as ProductionRule<NumericValueRef>),
    cornerRadiusTopRight: widen(barCornerRadius.cornerRadiusTopRight as ProductionRule<NumericValueRef>),
    cornerRadiusBottomLeft: widen(barCornerRadius.cornerRadiusBottomLeft as ProductionRule<NumericValueRef>),
    cornerRadiusBottomRight: widen(barCornerRadius.cornerRadiusBottomRight as ProductionRule<NumericValueRef>),
  };
};

/**
 * Collapses a (possibly multi-branch, conditional) numeric production rule into a single
 * Vega expression string, e.g. `test1 ? expr1 : test2 ? expr2 : exprFallback`.
 */
const productionRuleToExpr = (rule: ProductionRule<NumericValueRef>): string => {
  const valueRefToExpr = (valueRef: NumericValueRef): string => {
    if ('signal' in valueRef) return valueRef.signal as string;
    if ('scale' in valueRef) {
      const scaleName = valueRef.scale as string;
      if ('field' in valueRef) return `scale('${scaleName}', datum.${valueRef.field as string})`;
      if ('band' in valueRef) return `bandwidth('${scaleName}') * ${valueRef.band as number}`;
      if ('value' in valueRef) return `scale('${scaleName}', ${JSON.stringify(valueRef.value)})`;
    } else if ('value' in valueRef) {
      return `${valueRef.value as number}`;
    }
    // Fail fast on any production-rule shape this helper wasn't built to serialize, rather than
    // silently emitting an invalid Vega expression like `scale('x', undefined)` or `undefined`.
    throw new Error(`getBarItemSelectionRing: unsupported numeric production rule ${JSON.stringify(valueRef)}`);
  };

  if (!Array.isArray(rule)) return valueRefToExpr(rule);

  // array form = conditional rules, each an optional `test` plus a value ref
  const branches = rule as ({ test?: string } & NumericValueRef)[];
  const fallbackRule = branches.at(-1);
  if (fallbackRule === undefined) {
    throw new Error('getBarItemSelectionRing: empty production rule array');
  }
  let expr = valueRefToExpr(fallbackRule);
  for (let i = branches.length - 2; i >= 0; i--) {
    expr = `${branches[i].test} ? ${valueRefToExpr(branches[i])} : ${expr}`;
  }
  return expr;
};

/**
 * Shared position/size/visibility (`update`) encodings for the two selection-ring marks. The rect is
 * outset from the bar's bounds by {@link SELECTION_RING_PADDING} on every side and is only visible
 * (opacity 1) for the bar whose mark ID matches the {@link SELECTED_ITEM} signal.
 */
const getSelectionRingUpdateEncodings = (
  options: BarSpecOptions,
  dimensionEncodings: RectEncodeEntry
): RectEncodeEntry => {
  const { idKey, orientation } = options;
  const { metricAxis, dimensionAxis, dimensionSizeSignal } = getOrientationProperties(orientation);
  const metricEndKey = `${metricAxis}2`;

  const metricEncodings = getMetricEncodings(options);
  const metricStartExpr = productionRuleToExpr(metricEncodings[metricAxis] as ProductionRule<NumericValueRef>);
  const metricEndExpr = productionRuleToExpr(metricEncodings[metricEndKey] as ProductionRule<NumericValueRef>);

  const dimensionPosExpr = productionRuleToExpr(dimensionEncodings[dimensionAxis] as ProductionRule<NumericValueRef>);
  const dimensionSizeExpr = productionRuleToExpr(
    dimensionEncodings[dimensionSizeSignal] as ProductionRule<NumericValueRef>
  );

  return {
    [metricAxis]: { signal: `min(${metricStartExpr}, ${metricEndExpr}) - ${SELECTION_RING_PADDING}` },
    [metricEndKey]: { signal: `max(${metricStartExpr}, ${metricEndExpr}) + ${SELECTION_RING_PADDING}` },
    [dimensionAxis]: { signal: `${dimensionPosExpr} - ${SELECTION_RING_PADDING}` },
    [dimensionSizeSignal]: { signal: `${dimensionSizeExpr} + ${2 * SELECTION_RING_PADDING}` },
    opacity: [
      { test: `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${idKey}`, value: 1 },
      { value: 0 },
    ],
  };
};

/**
 * Opaque backdrop for the selection ring, drawn UNDERNEATH the bar. It is outset from the bar and
 * filled with the chart's background color so the gap between the bar and the stroke reads as an
 * opaque halo (elements behind the bar aren't visible through it) rather than showing gridlines or
 * other marks. It carries no stroke — the visible outline is {@link getBarItemSelectionRing}, drawn
 * on top. Kept separate so the stroke can render above the bars while the fill stays below (an opaque
 * fill drawn on top would cover the bar itself).
 */
export const getBarItemSelectionBackdrop = (
  options: BarSpecOptions,
  dataSource: string,
  dimensionEncodings: RectEncodeEntry
): RectMark => ({
  name: `${options.name}_itemSelectionBackdrop`,
  type: 'rect',
  from: { data: dataSource },
  interactive: false,
  encode: {
    enter: {
      ...getSelectionRingCornerRadiusEncodings(options),
      fill: { signal: BACKGROUND_COLOR },
    },
    update: getSelectionRingUpdateEncodings(options, dimensionEncodings),
  },
});

/**
 * The visible selection outline: a stroke-only rect drawn ON TOP of the bar marks so it is never
 * occluded. This matters for stacked bars, where adjacent segments (drawn after) would paint over a
 * ring drawn underneath. Its fill is transparent so it doesn't cover the bar; the opaque gap is
 * provided by {@link getBarItemSelectionBackdrop}, drawn underneath. Only visible for the bar whose
 * mark ID matches the {@link SELECTED_ITEM} signal.
 */
export const getBarItemSelectionRing = (
  options: BarSpecOptions,
  dataSource: string,
  dimensionEncodings: RectEncodeEntry
): RectMark => ({
  name: `${options.name}_itemSelectionRing`,
  type: 'rect',
  from: { data: dataSource },
  interactive: false,
  encode: {
    enter: {
      ...getSelectionRingCornerRadiusEncodings(options),
      fill: { value: 'transparent' },
      stroke: { value: getS2ColorValue('blue-800', options.colorScheme) },
      strokeWidth: { value: SELECTION_RING_STROKE_WIDTH },
    },
    update: getSelectionRingUpdateEncodings(options, dimensionEncodings),
  },
});

export const getDimensionSelectionRing = (options: BarSpecOptions): RectMark => {
  const { name, colorScheme, paddingRatio, orientation } = options;

  const update =
    orientation === 'vertical'
      ? {
          y: { value: 0 },
          y2: { signal: 'height' },
          xc: { signal: `scale('xBand', datum.${name}_selectedGroupId) + bandwidth('xBand')/2` },
          width: { signal: `bandwidth('xBand')/(1 - ${paddingRatio} / 2)` },
        }
      : {
          x: { value: 0 },
          x2: { signal: 'width' },
          yc: { signal: `scale('yBand', datum.${name}_selectedGroupId) + bandwidth('yBand')/2` },
          height: { signal: `bandwidth('yBand')/(1 - ${paddingRatio} / 2)` },
        };

  return {
    name: `${name}_selectionRing`,
    type: 'rect',
    from: {
      data: `${name}_selectedData`,
    },
    interactive: false,
    encode: {
      enter: {
        fill: { value: 'transparent' },
        strokeWidth: { value: 2 },
        stroke: { value: getS2ColorValue('static-blue', colorScheme) },
        cornerRadius: { value: 4 },
      },
      update,
    },
  };
};

export const getStrokeDash = ({ chartPopovers, idKey, lineType }: BarSpecOptions): ProductionRule<ArrayValueRef> => {
  const defaultProductionRule = getStrokeDashProductionRule(lineType);
  if (!hasPopover({ chartPopovers })) {
    return [defaultProductionRule];
  }

  return [
    { test: `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${idKey}`, value: [] },
    defaultProductionRule,
  ];
};

export const getStrokeWidth = ({
  chartPopovers,
  idKey,
  lineWidth,
  name,
}: BarSpecOptions): ProductionRule<NumericValueRef> => {
  const lineWidthValue = getLineWidthPixelsFromLineWidth(lineWidth);
  const defaultProductionRule = { value: lineWidthValue };
  const popovers = getPopovers(chartPopovers, name);
  const popoverWithDimensionHighlightExists = popovers.some(
    ({ UNSAFE_highlightBy }) => UNSAFE_highlightBy === 'dimension'
  );

  if (popovers.length === 0 || popoverWithDimensionHighlightExists) {
    return [defaultProductionRule];
  }

  return [
    {
      test: `(isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${idKey}) || (isValid(${SELECTED_GROUP}) && ${SELECTED_GROUP} === datum.${name}_selectedGroupId)`,
      value: Math.max(lineWidthValue, 2),
    },
    defaultProductionRule,
  ];
};

export const getBarPadding = (paddingRatio: number, paddingOuter?: number) => {
  return getBandPadding(paddingRatio, paddingOuter);
};

export const getScaleValues = (options: BarSpecOptions) => {
  return options.type === 'stacked' || isDodgedAndStacked(options) ? [`${options.metric}1`] : [options.metric];
};

export interface BarOrientationProperties {
  metricAxis: 'x' | 'y';
  dimensionAxis: 'x' | 'y';
  metricScaleKey: string;
  dimensionScaleKey: 'xBand' | 'yBand';
  dimensionSizeSignal: 'width' | 'height';
  metricSizeSignal: 'width' | 'height';
}

export const getOrientationProperties = (orientation: Orientation, scaleName?: string): BarOrientationProperties =>
  orientation === 'vertical'
    ? {
        metricAxis: 'y',
        dimensionAxis: 'x',
        metricScaleKey: scaleName || 'yLinear',
        dimensionScaleKey: 'xBand',
        dimensionSizeSignal: 'width',
        metricSizeSignal: 'height',
      }
    : {
        metricAxis: 'x',
        dimensionAxis: 'y',
        metricScaleKey: scaleName || 'xLinear',
        dimensionScaleKey: 'yBand',
        dimensionSizeSignal: 'height',
        metricSizeSignal: 'width',
      };

export const getBaseScaleName = (options: BarSpecOptions) => {
  const { metricAxis, orientation } = options;
  const { metricScaleKey } = getOrientationProperties(orientation);
  return metricAxis || metricScaleKey;
};

/**
 * Returns the mark for the dimension area position of a stacked bar
 * @param options
 * @returns
 */
export const getBarDimensionHoverArea = (options: BarSpecOptions, type: 'stacked' | 'dodged'): RectMark => {
  const { dimension, name: barName } = options;

  return {
    name: `${barName}_${DIMENSION_HOVER_AREA}`,
    description: `hover area for ${barName} dimensions`,
    type: 'rect',
    from: { data: `${barName}_${type === 'stacked' ? 'stacks' : 'groups'}` },
    interactive: true,
    clip: true,
    encode: {
      enter: {
        fill: { value: 'transparent' },
        tooltip: getInspectEncoding(options.chartInspects ?? [], `${barName}_${DIMENSION_HOVER_AREA}`, false, { dimension }),
      },
      update: {
        ...getBarDimensionAreaPositionEncodings(options),
      },
    },
  };
};

/**
 * Returns the encodings for the dimension area position of a stacked bar
 * @param options
 * @returns
 */
export const getBarDimensionAreaPositionEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const { dimension, orientation } = options;
  const { dimensionScaleKey, metricAxis, dimensionAxis, dimensionSizeSignal, metricSizeSignal } =
    getOrientationProperties(orientation);

  return {
    [metricAxis]: { value: 0 },
    [`${metricAxis}2`]: { signal: `${metricSizeSignal}` },
    [dimensionAxis]: {
      signal: `scale('${dimensionScaleKey}', datum.${dimension}) - bandwidth('${dimensionScaleKey}') * paddingInner / 2 / (1 - paddingInner)`,
    },
    [dimensionSizeSignal]: {
      signal: `bandwidth('${dimensionScaleKey}') * ( 1 + paddingInner / (1 - paddingInner))`,
    },
  };
};
