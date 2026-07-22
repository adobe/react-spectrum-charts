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
import { produce } from 'immer';
import { Data, Mark, Scale, Signal } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DEFAULT_TIME_DIMENSION,
  FILTERED_TABLE,
  INTERACTION_MODE,
  LAST_RSC_SERIES_ID,
  LINE_TYPE_SCALE,
  OPACITY_SCALE,
  SERIES_ID,
  TABLE,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import {
  addInspectData,
  addInspectSignals,
  getGroupIdTransform,
  isHighlightedByGroup,
} from '../chartInspect/chartInspectUtils';
import { addPopoverData } from '../chartPopover/chartPopoverUtils';
import { addTimeTransform, getFilteredInspectData, getTableData } from '../data/dataUtils';
import { getLineDirectLabelData, getLineDirectLabelMarks, getLineDirectLabelSpecOptions } from '../lineDirectLabel';
import {
  getForecastAlternateFlagTransform,
  getForecastEffectiveValueTransform,
  getLineForecastBoundaryMark,
  getLineForecastLabelMarks,
  getLineForecastSpecOptions,
} from '../lineForecast';
import {
  addHoverAnimLastChangeData,
  addHoverAnimationSignals,
  getHoverAnimStateData,
  getHoverFractionData,
  getHoverTargetData,
} from '../marks/hoverAnimationUtils';
import { getHoverMarkNames, getInteractiveMarkName, isInteractive } from '../marks/markUtils';
import { getMetricRangeData, getMetricRangeGroupMarks, getMetricRanges } from '../metricRange/metricRangeUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';
import { getDualAxisScaleNames } from '../scale/scaleUtils';
import { addHoveredItemSignal, getFirstRscSeriesIdSignal, getLastRscSeriesIdSignal } from '../signal/signalSpecBuilder';
import { addUserMetaAnimatedMark, addUserMetaInteractiveMark, getFacetsFromOptions } from '../specUtils';
import { addTrendlineData, getTrendlineMarks, getTrendlineScales, setTrendlineSignals } from '../trendline';
import { ChartData, ColorScheme, HighlightedItem, LineOptions, LineSpecOptions, ScSpec } from '../types';
import {
  getHoverLabelData,
  getLineHighlightedData,
  getLineHoverRules,
  getLineStaticPointData,
  getPrimarySeriesFacetData,
  getPrimarySeriesOtherExpr,
} from './lineDataUtils';
import {
  getHighlightedSeriesOpacityRules,
  getLineGradientMark,
  getLineHighlightOverlayGroup,
  getLineHoverMarks,
  getLineMark,
} from './lineMarkUtils';
import { getLinePointAnnotationMarks } from './linePointAnnotation';
import { getLineStaticPoint, getLineStaticPointBackground } from './linePointUtils';
import { getPopoverMarkName, isDualMetricAxis } from './lineUtils';

export const addLine = produce<
  ScSpec,
  [
    LineOptions & {
      animations?: boolean;
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      highlightedSeries?: string | number;
      index?: number;
      idKey: string;
      comboSiblingNames?: string[];
      data?: ChartData[];
    }
  ]
>(
  (
    spec,
    {
      animations,
      chartPopovers = [],
      chartInspects = [],
      color = { value: 'categorical-100' },
      colorScheme = DEFAULT_COLOR_SCHEME,
      dimension = DEFAULT_TIME_DIMENSION,
      dualMetricAxis = false,
      forecasts = [],
      gradient = false,
      hasOnClick = false,
      hasOnContextMenu = false,
      index = 0,
      lineCap = 'round',
      lineDirectLabels = [],
      linePointAnnotations = [],
      lineType = { value: 'solid' },
      metric = DEFAULT_METRIC,
      metricAxis,
      metricRanges = [],
      name,
      opacity = { value: 1 },
      scaleType = 'time',
      trendlines = [],
      interpolate,
      alternateSegmentKey,
      alternateSegmentLineType = 'dotted',
      alternateSegmentLabel,
      primarySeries,
      otherSeriesColor,
      showHoverLabel = true,
      dimensionHover = false,
      data,
      ...options
    }
  ) => {
    const lineName = toCamelCase(name || `line${index}`);
    // ChartInspect owns the hover story when present — suppress the hover value label
    const effectiveShowHoverLabel = chartInspects.length > 0 ? false : showHoverLabel;
    const { facets } = getFacetsFromOptions({ color, lineType, opacity });
    const seriesIds = getUniqueSeriesIds(data, facets);

    // put options back together now that all defaults are set
    const lineOptions: LineSpecOptions = {
      chartPopovers,
      chartInspects,
      color,
      colorScheme,
      dimension,
      dualMetricAxis,
      forecasts,
      gradient,
      hasOnClick,
      hasOnContextMenu,
      index,
      lineCap,
      lineDirectLabels,
      linePointAnnotations,
      interactiveMarkName: getInteractiveMarkName(
        {
          chartPopovers,
          chartInspects,
          hasOnClick,
          hasOnContextMenu,
          highlightedItem: options.highlightedItem,
          metricRanges,
          trendlines,
        },
        lineName
      ),
      lineType,
      metric,
      metricAxis,
      metricRanges,
      name: lineName,
      opacity,
      popoverMarkName: getPopoverMarkName(chartPopovers, lineName),
      scaleType,
      trendlines,
      interpolate,
      alternateSegmentKey,
      alternateSegmentLineType,
      alternateSegmentLabel,
      primarySeries,
      otherSeriesColor,
      showHoverLabel: effectiveShowHoverLabel,
      dimensionHover,
      seriesIds,
      ...options,
    };
    lineOptions.isHighlightedByGroup = isHighlightedByGroup(lineOptions) || dimensionHover;
    lineOptions.isAnimate = usesHoverAnimation(animations, lineOptions);
    spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, lineOptions.interactiveMarkName);
    if (lineOptions.isAnimate) spec.usermeta = addUserMetaAnimatedMark(spec.usermeta, lineName);
    spec.data = addData(spec.data ?? [], lineOptions);
    spec.signals = addSignals(spec.signals ?? [], lineOptions);
    spec.scales = setScales(spec.scales ?? [], lineOptions);
    spec.marks = addLineMarks(spec.marks ?? [], lineOptions);

    return spec;
  }
);

/**
 * Whether the line participates in the hover-animation system.
 * Computed once in `addLine` and stored on `options.isAnimate`; every downstream gate reads that
 * resolved boolean. A highlight legend counts (via legendHighlightSignals) so both the legend and the line animate.
 * `highlightedItem`/`highlightedSeries` are the chart-level controlled-highlight props; either one alone
 * is enough to animate, since `getLineHoverRules` always wires both `controlledTableMatch` and
 * `controlledSeriesMatch` regardless of which is set.
 * `animations === false` opts out unconditionally, regardless of the other conditions.
 */
const usesHoverAnimation = (animations: boolean | undefined, options: LineSpecOptions): boolean =>
  animations !== false &&
  (isInteractive(options) ||
    options.highlightedItem !== undefined ||
    options.highlightedSeries !== undefined ||
    (options.legendHighlightSignals?.length ?? 0) > 0);

/**
 * Gets the unique series ids for the line
 * @param data - the data for the line
 * @param facets - the facets for the line
 * @returns string[] - list of the unique series ids for the line
 */
const getUniqueSeriesIds = (data: ChartData[] | undefined, facets: string[]): string[] => {
  if (!data?.length || !facets.length) return [];
  return [...new Set(data.map((row) => facets.map((f) => (row as Record<string, unknown>)[f]).join(' | ')))];
};

export const addData = produce<Data[], [LineSpecOptions]>((data, options) => {
  const { chartInspects, dimension, dimensionHover, isSparkline, isMethodLast, name, scaleType, staticPoint } = options;
  const tableData = getTableData(data);
  if (scaleType === 'time') {
    tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
  }
  addDimensionHoverGroupTransform(tableData, chartInspects, dimensionHover, dimension, name);
  addSegmentData(data, tableData, options);
  addLineHoverData(data, options);

  if (staticPoint || isSparkline) {
    data.push(getLineStaticPointData(name, staticPoint, FILTERED_TABLE, isSparkline, isMethodLast));
  }

  addDualMetricAxisData(data, options);
  addTrendlineData(data, options);
  addInspectData(data, options, false);
  addPopoverData(data, options);
  data.push(...getMetricRangeData(options));
  for (const [i, label] of (options.lineDirectLabels ?? []).entries()) {
    const specOpts = getLineDirectLabelSpecOptions(label, i, options);
    data.push(getLineDirectLabelData(options.name, specOpts, options));
  }
});

/**
 * Adds the groupId transform used by dimensionHover, unless a ChartInspect is already grouping by dimension.
 */
const addDimensionHoverGroupTransform = (
  tableData: Data,
  chartInspects: LineSpecOptions['chartInspects'],
  dimensionHover: boolean,
  dimension: string,
  name: string
): void => {
  const inspectAlreadyGroupsByDimension = chartInspects.some(({ highlightBy }) => highlightBy === 'dimension');
  if (!dimensionHover || inspectAlreadyGroupsByDimension) return;
  tableData.transform = tableData.transform ?? [];
  tableData.transform.push(getGroupIdTransform([dimension], name));
};

/**
 * Adds the data sources for whichever segmenting feature is in use: alternative segments, forecasts,
 * or a primary series facet. These are mutually exclusive.
 */
const addSegmentData = (data: Data[], tableData: Data, options: LineSpecOptions): void => {
  const { alternateSegmentKey, dimension, forecasts, metric, name, primarySeries, scaleType } = options;
  // time data was transformed above, so we need to use the transformed dimension
  const dimSortField = scaleType === 'time' ? `${dimension}0` : dimension;
  if (alternateSegmentKey) {
    tableData.transform = tableData.transform ?? [];
    tableData.transform.push({ type: 'formula', as: `${name}_alternateFlag`, expr: `datum["${alternateSegmentKey}"]` });
    data.push(...getAlternateSegmentData(name, dimSortField));
  } else if (forecasts.length > 0) {
    tableData.transform = tableData.transform ?? [];
    tableData.transform.push(
      getForecastAlternateFlagTransform(name, dimension, forecasts[0].start),
      getForecastEffectiveValueTransform(name, metric, forecasts[0].metric)
    );
    data.push(...getAlternateSegmentData(name, dimSortField));
  } else if (primarySeries) {
    data.push(getPrimarySeriesFacetData(name, primarySeries));
  }
};

/**
 * Adds the hover-label/highlight data sources for interactive or highlighted lines, plus the
 * hover-animation engine's data sources when the line is animated.
 */
const addLineHoverData = (data: Data[], options: LineSpecOptions): void => {
  const { chartInspects, highlightedItem, isAnimate, name, seriesIds, showHoverLabel } = options;
  if (isInteractive(options) || highlightedItem !== undefined) {
    data.push(getLineHighlightedData(options), getFilteredInspectData(chartInspects));
    if (showHoverLabel) {
      data.push(getHoverLabelData(options));
    }
  }
  if (isAnimate) {
    data.push(
      getHoverTargetData({ name, groupby: [SERIES_ID], rules: getLineHoverRules(options) }),
      getHoverAnimStateData({ name, keys: seriesIds ?? [] }),
      getHoverFractionData(name)
    );
    addHoverAnimLastChangeData(data, name);
  }
};

/**
 * Adds data sources for dual metric axis feature
 * Creates filtered datasets for primary (all except last series) and secondary (last series only) scales
 */
export const addDualMetricAxisData = (data: Data[], options: LineSpecOptions) => {
  if (isDualMetricAxis(options)) {
    const { metricAxis } = options;
    const baseScaleName = metricAxis || 'yLinear';
    const scaleNames = getDualAxisScaleNames(baseScaleName);

    if (scaleNames.primaryDomain && scaleNames.secondaryDomain) {
      data.push(
        {
          name: scaleNames.primaryDomain,
          source: FILTERED_TABLE,
          transform: [{ type: 'filter', expr: `datum.${SERIES_ID} !== ${LAST_RSC_SERIES_ID}` }],
        },
        {
          name: scaleNames.secondaryDomain,
          source: FILTERED_TABLE,
          transform: [{ type: 'filter', expr: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}` }],
        }
      );
    }
  }
};

export const addSignals = produce<Signal[], [LineSpecOptions]>((signals, options) => {
  const { name } = options;
  setTrendlineSignals(signals, options);

  if (isDualMetricAxis(options)) {
    signals.push(getFirstRscSeriesIdSignal(), getLastRscSeriesIdSignal());
  }

  if (options.isAnimate) {
    addHoverAnimationSignals(signals, name);
  }

  if (!isInteractive(options)) return;
  const { primarySeries } = options;
  // datum.datum because the voronoi mark uses datumOrder=2
  addHoveredItemSignal(
    signals,
    name,
    `${name}_voronoi`,
    2,
    undefined,
    getPrimarySeriesExcludeCondition(primarySeries, 'datum.datum')
  );
  addHoverSignals(signals, options);
  addInspectSignals(signals, options);
});

export const setScales = produce<Scale[], [LineSpecOptions]>((scales, options) => {
  const { metricAxis, dimension, color, lineType, opacity, padding, scaleType } = options;
  // add dimension scale
  addContinuousDimensionScale(scales, { scaleType, dimension, padding });
  // add color to the color domain
  addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
  // add lineType to the lineType domain
  addFieldToFacetScaleDomain(scales, LINE_TYPE_SCALE, lineType);
  // add opacity to the opacity domain
  addFieldToFacetScaleDomain(scales, OPACITY_SCALE, opacity);
  // find the linear scale and add our fields to it
  addMetricScale(scales, getMetricKeys(options));
  // add linear scale with custom name
  if (metricAxis) {
    addMetricScale(scales, getMetricKeys(options), 'y', metricAxis);
  }
  // add dual metric axis scales
  if (isDualMetricAxis(options)) {
    const baseScaleName = metricAxis || 'yLinear';
    const scaleNames = getDualAxisScaleNames(baseScaleName);
    addMetricScale(scales, getMetricKeys(options), 'y', scaleNames.primaryScale, scaleNames.primaryDomain);
    addMetricScale(scales, getMetricKeys(options), 'y', scaleNames.secondaryScale, scaleNames.secondaryDomain);
  }
  // add trendline scales
  scales.push(...getTrendlineScales(options));
  return scales;
});

// The order that marks are added is important since it determines the draw order.
export const addLineMarks = produce<Mark[], [LineSpecOptions]>((marks, options) => {
  const {
    alternateSegmentKey,
    color,
    gradient,
    highlightedItem,
    isSparkline,
    legendHighlightSignals,
    linePointAnnotations,
    lineType,
    name,
    opacity,
    primarySeries,
    staticPoint,
  } = options;
  const forecasts = options.forecasts ?? [];
  const hasForecast = !alternateSegmentKey && forecasts.length > 0;

  const { facets } = getFacetsFromOptions({ color, lineType, opacity });
  // when alternateSegmentKey or forecasts are active, facet by segmentId so each contiguous run
  // gets its own path with its own strokeDash
  const usesAlternateSegments = !!alternateSegmentKey || hasForecast;
  // when primarySeries is set, use a pre-sorted source so "other" series facets are drawn first (behind primary)
  const defaultFacetData = primarySeries ? `${name}_primarySeriesFacetData` : FILTERED_TABLE;
  const facetData = usesAlternateSegments ? `${name}_with_bridges` : defaultFacetData;
  const facetGroupby = usesAlternateSegments ? [...facets, `${name}_segmentId`] : facets;

  // when forecasts are present, override metric to effectiveValue and set alternateSegmentKey
  // to trigger getAlternateSegmentStrokeDash in getLineMark
  const markOptions = hasForecast
    ? {
        ...options,
        metric: `${name}_effectiveValue`,
        alternateSegmentKey: `${name}_alternateFlag`,
      }
    : options;

  const hasInteractiveHighlight = isInteractive(options) || highlightedItem !== undefined;
  const hasHighlightState = hasInteractiveHighlight || (legendHighlightSignals?.length ?? 0) > 0;

  // boundary rules are drawn behind everything
  for (const [i, forecast] of forecasts.entries()) {
    marks.push(getLineForecastBoundaryMark(getLineForecastSpecOptions(forecast, i, options)));
  }

  marks.push({
    name: `${name}_group`,
    type: 'group',
    from: {
      facet: {
        name: `${name}_facet`,
        data: facetData,
        groupby: facetGroupby,
      },
    },
    marks: [
      ...(gradient ? [getLineGradientMark(markOptions, `${name}_facet`)] : []),
      getLineMark(markOptions, `${name}_facet`),
    ],
  });

  if (staticPoint || isSparkline) {
    marks.push(getLineStaticPointBackground(options), getLineStaticPoint(options));
    if (linePointAnnotations.length > 0) {
      marks.push(...getLinePointAnnotationMarks(options));
    }
  }
  marks.push(...getMetricRangeGroupMarks(options), ...getTrendlineMarks(options));
  // direct labels
  const labelSpecOpts = (options.lineDirectLabels ?? []).map((label, i) =>
    getLineDirectLabelSpecOptions(label, i, options)
  );
  for (const specOpts of labelSpecOpts) {
    marks.push(
      ...getLineDirectLabelMarks(options.name, specOpts, options, options.backgroundColor, options.colorScheme)
    );
  }
  // overlay renders the highlighted series on top of labels so the line stays in the foreground on hover
  // fg labels are pushed in the same call (after the overlay group) so they always render above all overlay lines
  if (hasHighlightState && labelSpecOpts.length) {
    const opacityRules = getHighlightedSeriesOpacityRules(markOptions);
    marks.push(
      getLineHighlightOverlayGroup(markOptions, facetData, facetGroupby),
      ...labelSpecOpts.flatMap((specOpts) =>
        getLineDirectLabelMarks(
          options.name,
          specOpts,
          options,
          options.backgroundColor,
          options.colorScheme,
          opacityRules
        )
      )
    );
  }
  // hover marks are last so hollow points and interaction marks always render above everything
  if (hasInteractiveHighlight) {
    marks.push(...getLineHoverMarks(markOptions, `${FILTERED_TABLE}ForInspect`));
  }
  // forecast labels are drawn last so they appear on top of other marks
  for (const [i, forecast] of forecasts.entries()) {
    marks.push(...getLineForecastLabelMarks(getLineForecastSpecOptions(forecast, i, options)));
  }
});

const getMetricKeys = (lineOptions: LineSpecOptions) => {
  const hasForecast = (lineOptions.forecasts ?? []).length > 0 && !lineOptions.alternateSegmentKey;
  // when forecasts are present, use effectiveValue for the y-scale domain since it covers both
  // the historical metric and forecast metric(s) in a single unified field
  const metricKeys = hasForecast ? [`${lineOptions.name}_effectiveValue`] : [lineOptions.metric];

  // metric range fields should be added if metric-axis will be scaled to fit
  const metricRanges = getMetricRanges(lineOptions);
  metricRanges.forEach((metricRange) => {
    if (metricRange.scaleAxisToFit) metricKeys.push(metricRange.metricStart, metricRange.metricEnd);
  });

  return metricKeys;
};

export const getAlternateSegmentData = (name: string, dimSortField: string): Data[] => [
  {
    name: `${name}_segmented`,
    source: FILTERED_TABLE,
    transform: [
      {
        type: 'window',
        groupby: [SERIES_ID],
        sort: { field: dimSortField, order: 'ascending' },
        ops: ['lag'],
        fields: [`${name}_alternateFlag`],
        params: [1],
        as: [`${name}_prevAlternateFlag`],
      },
      {
        type: 'formula',
        as: `${name}_isSegmentBreak`,
        expr: `datum.${name}_prevAlternateFlag !== null && datum.${name}_alternateFlag !== datum.${name}_prevAlternateFlag ? 1 : 0`,
      },
      {
        type: 'window',
        groupby: [SERIES_ID],
        sort: { field: dimSortField, order: 'ascending' },
        ops: ['sum'],
        fields: [`${name}_isSegmentBreak`],
        frame: [null, 0],
        as: [`${name}_segmentId`],
      },
    ],
  },
  {
    name: `${name}_bridge`,
    source: `${name}_segmented`,
    transform: [
      { type: 'filter', expr: `datum.${name}_isSegmentBreak === 1` },
      { type: 'formula', as: `${name}_segmentId`, expr: `datum.${name}_segmentId - 1` },
      { type: 'formula', as: `${name}_alternateFlag`, expr: `!datum.${name}_alternateFlag` },
    ],
  },
  {
    // merges segmented data with bridge points and re-sorts so each segment path connects seamlessly to the next
    name: `${name}_with_bridges`,
    source: [`${name}_segmented`, `${name}_bridge`],
    transform: [{ type: 'collect', sort: { field: dimSortField, order: 'ascending' } }],
  },
];

const addHoverSignals = (signals: Signal[], options: LineSpecOptions) => {
  const { interactionMode, name: lineName, primarySeries } = options;
  if (interactionMode !== INTERACTION_MODE.ITEM) return;
  const itemExcludeCondition = getPrimarySeriesExcludeCondition(primarySeries, 'datum');
  for (const hoverMarkName of getHoverMarkNames(lineName)) {
    addHoveredItemSignal(signals, lineName, hoverMarkName, 1, undefined, itemExcludeCondition);
  }
};

const getPrimarySeriesExcludeCondition = (
  primarySeries: number | string[] | undefined,
  datumPath: string
): string | undefined => (primarySeries ? getPrimarySeriesOtherExpr(primarySeries, datumPath) : undefined);
