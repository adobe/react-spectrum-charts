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
  LineMark,
  Mark,
  NumericValueRef,
  ProductionRule,
  RuleMark,
  TextMark,
} from 'vega';

import {
  CHART_SIZE_FONT_SIZE,
  CHART_SIZE_HOVER_STROKE_WIDTH,
  CHART_SIZE_STROKE_WIDTH,
  COLOR_SCALE,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DEFAULT_INTERACTION_MODE,
  DEFAULT_OPACITY_RULE,
  DEFAULT_STROKE_WIDTH_RULE,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  FADE_FACTOR,
  HOVERED_ITEM,
  LAST_RSC_SERIES_ID,
  LINE_TYPE_SCALE,
  OPACITY_SCALE,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getPopovers } from '../chartPopover/chartPopoverUtils';
import { getDeemphasisRamp, getHoverFractionSignal } from '../marks/hoverAnimationUtils';
import {
  getColorProductionRule,
  getColorProductionRuleSignalString,
  getItemHoverArea,
  getOpacityProductionRule,
  getStrokeDashProductionRule,
  getVoronoiPath,
  getXProductionRule,
  hasPopover,
} from '../marks/markUtils';
import { getScaleName } from '../scale/scaleSpecBuilder';
import { getDualAxisScaleNames } from '../scale/scaleUtils';
import { getStrokeDashFromLineType } from '../specUtils';
import { ScaleType } from '../types';
import { MIN_LABEL_GAP, getDirectLabelTextMarks } from './directLabelUtils';
import { getPrimarySeriesOtherExpr } from './lineDataUtils';
import { getHighlightPoint, getSecondaryHighlightPoint, getSelectionPoint } from './linePointUtils';
import { LineMarkOptions, isDualMetricAxis } from './lineUtils';

/**
 * Gets the Y encoding for line marks with dual metric axis support
 * @param lineMarkOptions - Line mark options including metricAxis and dualMetricAxis
 * @param metric - The metric field name
 * @returns Y encoding with conditional scale selection for dual metric axis
 */
export const getLineYEncoding = (lineMarkOptions: LineMarkOptions, metric: string): ProductionRule<NumericValueRef> => {
  const { metricAxis } = lineMarkOptions;

  if (isDualMetricAxis(lineMarkOptions)) {
    const baseScaleName = metricAxis || 'yLinear';
    const scaleNames = getDualAxisScaleNames(baseScaleName);

    return [
      {
        test: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}`,
        scale: scaleNames.secondaryScale,
        field: metric,
      },
      {
        scale: scaleNames.primaryScale,
        field: metric,
      },
    ];
  }

  return [{ scale: metricAxis || 'yLinear', field: metric }];
};

const GRADIENT_BASE_OPACITY = 0.2;
const FORECAST_GRADIENT_RATIO = 0.4;

/** Builds the `stroke` encoding for a line mark, inserting a gray color rule for non-primary series. */
const getStrokeEncoding = (
  primarySeries: number | string[] | undefined,
  otherSeriesColor: string | undefined,
  color: LineMarkOptions['color'],
  colorScheme: LineMarkOptions['colorScheme']
): ColorValueRef | ProductionRule<ColorValueRef> => {
  const normalColor = getColorProductionRule(color, colorScheme);
  if (!primarySeries) {
    return normalColor;
  }

  const grayColor = getS2ColorValue(otherSeriesColor || 'gray-400', colorScheme);
  return [
    {
      test: getPrimarySeriesOtherExpr(primarySeries, 'datum'),
      value: grayColor,
    },
    normalColor,
  ];
};

/**
 * Generates an area mark with a gradient fill beneath the line, fading from the line's color to transparent.
 */
export const getLineGradientMark = (lineMarkOptions: LineMarkOptions, dataSource: string): Mark => {
  const { dimension, metric, name, scaleType, interpolate } = lineMarkOptions;

  return {
    name: `${name}_gradient`,
    description: `${name}_gradient`,
    type: 'area',
    from: { data: dataSource },
    interactive: false,
    encode: {
      enter: {
        y: getLineYEncoding(lineMarkOptions, metric),
        y2: { signal: 'height' },
        defined: { signal: `isValid(datum["${metric}"])` },
        ...getGradientFillEncoding(lineMarkOptions),
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        opacity: [
          {
            test: `length(domain('${COLOR_SCALE}')) > 1 || length(domain('${LINE_TYPE_SCALE}')) > 1 || length(domain('${OPACITY_SCALE}')) > 1`,
            value: 0,
          },
          ...[getLineOpacity(lineMarkOptions)].flat(),
        ],
        ...(interpolate ? { interpolate: { value: interpolate } } : {}),
      },
    },
  };
};

const getGradientFillEncoding = ({ color, colorScheme, name, opacity, alternateSegmentKey }: LineMarkOptions) => {
  const colorSignal = getColorProductionRuleSignalString(color, colorScheme);
  return {
    fill: {
      signal: `{gradient: 'linear', stops: [{offset: 0, color: ${colorSignal}}, {offset: 1, color: 'transparent'}], x1: 0, y1: 0, x2: 0, y2: 1}`,
    },
    fillOpacity: getGradientFillOpacity(name, opacity, alternateSegmentKey),
  };
};

const getGradientFillOpacity = (
  name: string,
  opacity: LineMarkOptions['opacity'],
  alternateSegmentKey: LineMarkOptions['alternateSegmentKey']
): { value: number } | { signal: string } => {
  if (!alternateSegmentKey) {
    return getGradientOpacity(opacity);
  }
  const forecastGradientOpacity = GRADIENT_BASE_OPACITY * FORECAST_GRADIENT_RATIO;
  const normalOpacitySignal =
    typeof opacity === 'string'
      ? `scale('${OPACITY_SCALE}', datum.${opacity}) * ${GRADIENT_BASE_OPACITY}`
      : String(opacity.value * GRADIENT_BASE_OPACITY);
  const altOpacitySignal =
    typeof opacity === 'string'
      ? `scale('${OPACITY_SCALE}', datum.${opacity}) * ${forecastGradientOpacity}`
      : String(opacity.value * forecastGradientOpacity);
  return { signal: `datum.${name}_alternateFlag ? ${altOpacitySignal} : ${normalOpacitySignal}` };
};

const getGradientOpacity = (opacity: LineMarkOptions['opacity']): { value: number } | { signal: string } => {
  if (typeof opacity === 'string') {
    return { signal: `scale('${OPACITY_SCALE}', datum.${opacity}) * ${GRADIENT_BASE_OPACITY}` };
  }
  return { value: opacity.value * GRADIENT_BASE_OPACITY };
};

/**
 * Returns the strokeDash encoding for a line mark that has alternateSegmentKey set.
 * When lineType is a static value, returns a signal expression that switches between
 * the base dash and the alternate dash based on the per-datum alternateFlag field.
 * Falls back to the standard scale/field lookup for data-driven lineType facets.
 */
const getLineTypeDashSignal = (lineTypeFacet: LineMarkOptions['lineType']): string => {
  if (typeof lineTypeFacet === 'string') {
    return `scale('${LINE_TYPE_SCALE}', datum['${lineTypeFacet}'])`;
  }
  return JSON.stringify(getStrokeDashFromLineType(lineTypeFacet.value));
};

export const getAlternateSegmentStrokeDash = (
  name: string,
  lineType: LineMarkOptions['lineType'],
  alternateSegmentLineType: LineMarkOptions['alternateSegmentLineType']
): ArrayValueRef | undefined => {
  if (!alternateSegmentLineType) return;
  const altDash = JSON.stringify(getStrokeDashFromLineType(alternateSegmentLineType));
  const baseDash = getLineTypeDashSignal(lineType);
  return { signal: `datum.${name}_alternateFlag ? ${altDash} : ${baseDash}` };
};

/**
 * generates a line mark
 * @param lineOptions
 * @param dataSource
 * @returns LineMark
 */
export const getLineMark = (lineMarkOptions: LineMarkOptions, dataSource: string): LineMark => {
  const {
    alternateSegmentKey,
    alternateSegmentLineType,
    chartPopovers,
    color,
    colorScheme,
    dimension,
    otherSeriesColor,
    lineCap = 'round',
    lineType,
    metric,
    name,
    opacity,
    scaleType,
    primarySeries,
    interpolate,
  } = lineMarkOptions;
  const popovers = getPopovers(chartPopovers ?? [], name);
  const popoverWithDimensionHighlightExists = popovers.some(
    ({ UNSAFE_highlightBy }) => UNSAFE_highlightBy === 'dimension'
  );

  return {
    name,
    description: name,
    type: 'line',
    from: { data: dataSource },
    interactive: false,
    encode: {
      enter: {
        y: getLineYEncoding(lineMarkOptions, metric),
        stroke: getStrokeEncoding(primarySeries, otherSeriesColor, color, colorScheme),
        strokeCap: { value: lineCap },
        strokeDash: alternateSegmentKey
          ? getAlternateSegmentStrokeDash(name, lineType, alternateSegmentLineType)
          : getStrokeDashProductionRule(lineType),
        strokeOpacity: getOpacityProductionRule(opacity),
      },
      update: {
        // x and strokeWidth must be in update: x changes on resize, strokeWidth changes on hover
        x: getXProductionRule(scaleType, dimension),
        ...(popoverWithDimensionHighlightExists ? {} : { opacity: getLineOpacity(lineMarkOptions) }),
        ...(interpolate ? { interpolate: { value: interpolate } } : {}),
        strokeWidth: getLineStrokeWidth(lineMarkOptions),
      },
    },
  };
};

export const getLineOpacity = (lineMarkOptions: LineMarkOptions): ProductionRule<NumericValueRef> => {
  const { displayOnHover, isAnimate, name } = lineMarkOptions;
  // displayOnHover overlay marks manage their own visibility via getHighlightedSeriesOpacityRules
  if (displayOnHover) return [DEFAULT_OPACITY_RULE];

  if (isAnimate) {
    // Fade deemphasized series; neutral and emphasized both stay fully opaque
    const ramp = getDeemphasisRamp(getHoverFractionSignal(name));
    return {
      signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
    };
  }

  // Return the original opacity rules ProductionRule if we aren't using hover animations
  return getLineOpacityRules(lineMarkOptions);
};

export const getLineOpacityRules = ({
  comboSiblingNames,
  interactiveMarkName,
  popoverMarkName,
  isHighlightedByGroup,
  highlightedItem,
}: LineMarkOptions): ProductionRule<NumericValueRef> => {
  if (!interactiveMarkName && highlightedItem === undefined) return [DEFAULT_OPACITY_RULE];
  const strokeOpacityRules: ProductionRule<NumericValueRef> = [];

  if (interactiveMarkName) {
    if (isHighlightedByGroup) {
      strokeOpacityRules.push({
        test: `length(data('${interactiveMarkName}_highlightedData'))`,
        signal: `indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1 ? 1 : ${FADE_FACTOR}`,
      });
    } else {
      strokeOpacityRules.push({
        test: `isValid(${interactiveMarkName}_${HOVERED_ITEM})`,
        signal: `${interactiveMarkName}_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      });
    }
  }

  strokeOpacityRules.push(
    {
      test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
      signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
    },
    {
      test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
      signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
    }
  );

  if (popoverMarkName) {
    strokeOpacityRules.push({
      test: `isValid(${SELECTED_SERIES})`,
      signal: `${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
    });
  }

  if (comboSiblingNames?.length) {
    const test = comboSiblingNames.map((siblingName) => `isValid(${siblingName}_${HOVERED_ITEM})`).join(' || ');
    strokeOpacityRules.push({
      test,
      value: FADE_FACTOR,
    });
  }

  strokeOpacityRules.push(DEFAULT_OPACITY_RULE);

  return strokeOpacityRules;
};

/**
 * Gets the production rules for strokeWidth
 */
export const getLineStrokeWidth = ({
  displayOnHover,
  comboSiblingNames,
  interactiveMarkName,
  popoverMarkName,
  isHighlightedByGroup,
  highlightedItem,
}: LineMarkOptions): ProductionRule<NumericValueRef> => {
  // No interactivity -> use default (no hover)
  if ((!interactiveMarkName || displayOnHover) && highlightedItem === undefined) return [DEFAULT_STROKE_WIDTH_RULE];
  const strokeWidthRules: ProductionRule<NumericValueRef> = [];

  if (interactiveMarkName) {
    if (isHighlightedByGroup) {
      strokeWidthRules.push({
        test: `length(data('${interactiveMarkName}_highlightedData'))`,
        signal: `indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1 ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      });
    } else {
      strokeWidthRules.push({
        test: `isValid(${interactiveMarkName}_${HOVERED_ITEM})`,
        signal: `${interactiveMarkName}_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      });
    }
  }

  strokeWidthRules.push(
    {
      test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
      signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
    },
    {
      test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
      signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
    }
  );

  if (popoverMarkName) {
    strokeWidthRules.push({
      test: `isValid(${SELECTED_SERIES})`,
      signal: `${SELECTED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
    });
  }

  if (comboSiblingNames?.length) {
    const test = comboSiblingNames.map((siblingName) => `isValid(${siblingName}_${HOVERED_ITEM})`).join(' || ');
    strokeWidthRules.push({
      test,
      signal: CHART_SIZE_STROKE_WIDTH,
    });
  }

  strokeWidthRules.push(DEFAULT_STROKE_WIDTH_RULE);

  return strokeWidthRules;
};

/**
 * All the marks that get displayed when hovering or selecting a point on a line
 * @param lineMarkOptions
 * @param dataSource
 * @param secondaryHighlightedMetric
 * @returns
 */
export const getLineHoverMarks = (
  lineOptions: LineMarkOptions,
  dataSource: string,
  secondaryHighlightedMetric?: string
): Mark[] => {
  const { dimension, name, scaleType, showHoverLabel = true } = lineOptions;
  return [
    // vertical rule shown for the hovered or selected point
    getHoverRule(dimension, name, scaleType),
    // if has popover, add selection point
    ...(hasPopover(lineOptions) ? [getSelectionPoint(lineOptions)] : []),
    // hover or select point
    getHighlightPoint(lineOptions),
    // additional point that gets highlighted like the trendline or raw line point
    ...(secondaryHighlightedMetric ? [getSecondaryHighlightPoint(lineOptions, secondaryHighlightedMetric)] : []),
    // hover value label: background halo + foreground text — omitted when showHoverLabel is false
    ...(showHoverLabel ? getHoverValueLabelMarks(lineOptions) : []),
    // get interactive marks for the line
    ...getInteractiveMarks(dataSource, lineOptions),
  ];
};

/**
 * Two text marks (background halo + foreground) showing the metric value adjacent to the hovered point.
 * Reads from hoverLabelData which carries cascade transforms — when multiple series share the same
 * hovered dimension (dimensionHover), labels are spread apart using the same cascading formula as
 * direct labels rather than stacking on top of each other.
 */
const getHoverValueLabelMarks = (lineOptions: LineMarkOptions): TextMark[] => {
  const { color, colorScheme, dimension, hoverLabelKey, metric, metricAxis, name, scaleType } = lineOptions;
  const labelField = hoverLabelKey ?? metric;
  const yScaleName = metricAxis || 'yLinear';

  const scaleName = getScaleName('x', scaleType);
  const xField = scaleType === 'time' ? DEFAULT_TRANSFORMED_TIME_DIMENSION : dimension;
  // Offset between the hover point center and the label.
  const LABEL_POINT_GAP = 9;
  // Flip label to the left side when the label would overflow the right edge of the chart.
  const nearRightEdge = `scale('${scaleName}', datum['${xField}']) + getLabelWidth(datum["${labelField}"], 'bold', ${CHART_SIZE_FONT_SIZE}) + ${LABEL_POINT_GAP} > width`;

  // Cascade correction only — no fixed anchor offset. Labels default to the natural y of each
  // hover point; the formula only pushes them apart when they would otherwise collide.
  const cascadeOffset = `datum._hover_cumMaxAdjusted + datum._hover_metricRank * ${MIN_LABEL_GAP} - datum._hover_scaledY`;

  return getDirectLabelTextMarks(
    `${name}_hoverLabelBg`,
    `${name}_hoverLabel`,
    `${name}_hoverLabelData`,
    `datum["${labelField}"]`,
    {
      x: getXProductionRule(scaleType, dimension),
      y: [{ scale: yScaleName, field: metric, offset: { signal: cascadeOffset } }],
      additional: {
        dx: { signal: `${nearRightEdge} ? -${LABEL_POINT_GAP} : ${LABEL_POINT_GAP}` },
        align: { signal: `${nearRightEdge} ? 'right' : 'left'` },
        baseline: { value: 'middle' },
      },
    },
    colorScheme,
    { signal: getColorProductionRuleSignalString(color, colorScheme) }
  );
};

const getHoverRule = (dimension: string, name: string, scaleType: ScaleType): RuleMark => {
  return {
    name: `${name}_hoverRule`,
    description: `${name}_hoverRule`,
    type: 'rule',
    from: { data: `${name}_highlightedData` },
    interactive: false,
    encode: {
      enter: {
        y: { value: 0 },
        y2: { signal: 'height' },
        strokeWidth: { value: 1 },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        opacity: { signal: `length(data('${name}_selectedData')) > 0 ? 0 : 1` },
      },
    },
  };
};

const getInteractiveMarks = (dataSource: string, lineOptions: LineMarkOptions): Mark[] => {
  const { interactionMode = DEFAULT_INTERACTION_MODE } = lineOptions;

  const inspectMarks = {
    nearest: getVoronoiMarks,
    item: getItemHoverMarks,
  };

  return inspectMarks[interactionMode](lineOptions, dataSource);
};

const getVoronoiMarks = (lineOptions: LineMarkOptions, dataSource: string): Mark[] => {
  const { name } = lineOptions;

  return [
    // points used for the voronoi transform
    getLinePointsForVoronoi(lineOptions, dataSource),
    // voronoi transform used to get nearest point paths
    getVoronoiPath(lineOptions, `${name}_pointsForVoronoi`),
  ];
};

/**
 * Gets the points used for the voronoi calculation for line charts with dual metric axis support
 * @param lineOptions - Line options including dual metric axis settings
 * @param dataSource - the name of the data source that will be used in the voronoi calculation
 * @returns SymbolMark
 */
const getLinePointsForVoronoi = (lineOptions: LineMarkOptions, dataSource: string): Mark => {
  const { dimension, metric, name, scaleType } = lineOptions;

  return {
    name: `${name}_pointsForVoronoi`,
    description: `${name}_pointsForVoronoi`,
    type: 'symbol',
    from: { data: dataSource },
    interactive: false,
    encode: {
      enter: {
        y: getLineYEncoding(lineOptions, metric),
        fill: { value: 'transparent' },
        stroke: { value: 'transparent' },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
      },
    },
  };
};

const getItemHoverMarks = (lineOptions: LineMarkOptions, dataSource: string): Mark[] => {
  const { chartInspects = [], dimension, metric, name, scaleType } = lineOptions;

  return [
    // area around item that triggers hover
    getItemHoverArea(
      chartInspects,
      dataSource,
      dimension,
      metric,
      name,
      scaleType,
      getLineYEncoding(lineOptions, metric)
    ),
  ];
};

/**
 * Returns show/hide opacity rules for marks that should be visible only when `datum` belongs
 * to the currently hovered or externally highlighted series. Follows the same production-rule
 * array pattern as `getLineOpacity`, but uses `value: 1` (show) per matching condition and
 * `value: 0` (hide) as the fallback — in contrast to the fade pattern used for regular marks.
 */
export const getHighlightedSeriesOpacityRules = (markOptions: {
  interactiveMarkName?: string;
  isHighlightedByGroup?: boolean;
  legendHighlightSignals?: string[];
}): ProductionRule<NumericValueRef> => {
  const { interactiveMarkName, isHighlightedByGroup, legendHighlightSignals } = markOptions;
  return [
    ...(interactiveMarkName
      ? [
          isHighlightedByGroup
            ? {
                test: `length(data('${interactiveMarkName}_highlightedData')) && indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1`,
                value: 1,
              }
            : {
                test: `isValid(${interactiveMarkName}_${HOVERED_ITEM}) && ${interactiveMarkName}_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID}`,
                value: 1,
              },
        ]
      : []),
    {
      test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) && ${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`,
      value: 1,
    },
    {
      test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}')) && indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1`,
      value: 1,
    },
    ...(legendHighlightSignals ?? []).map((signal) => ({
      test: `isValid(${signal}) && ${signal} === datum.${SERIES_ID}`,
      value: 1,
    })),
    { value: 0 },
  ];
};

/**
 * A duplicate line group rendered after direct labels so the highlighted series always appears
 * in the foreground. Only the hovered/highlighted series is visible (others have opacity 0).
 */
export const getLineHighlightOverlayGroup = (
  markOptions: LineMarkOptions,
  facetData: string,
  facetGroupby: string[]
): Mark => {
  const { name } = markOptions;
  const opacityRules = getHighlightedSeriesOpacityRules(markOptions);

  const baseLineMark = getLineMark(
    { ...markOptions, name: `${name}_highlightOverlayLine`, isAnimate: false },
    `${name}_highlightOverlay_facet`
  );

  const overlayLineMark: LineMark = {
    ...baseLineMark,
    encode: {
      ...baseLineMark.encode,
      update: {
        ...baseLineMark.encode?.update,
        opacity: opacityRules,
      },
    },
  };

  return {
    name: `${name}_highlightOverlay_group`,
    type: 'group',
    interactive: false,
    from: {
      facet: {
        name: `${name}_highlightOverlay_facet`,
        data: facetData,
        groupby: facetGroupby,
      },
    },
    marks: [overlayLineMark],
  };
};
