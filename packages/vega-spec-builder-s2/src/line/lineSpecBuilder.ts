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
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { addPopoverData } from '../chartPopover/chartPopoverUtils';
import { addInspectData, addInspectSignals, isHighlightedByGroup } from '../chartInspect/chartInspectUtils';
import { addTimeTransform, getFilteredInspectData, getTableData } from '../data/dataUtils';
import { getHoverMarkNames, getInteractiveMarkName, isInteractive } from '../marks/markUtils';
import { getMetricRangeData, getMetricRangeGroupMarks, getMetricRanges } from '../metricRange/metricRangeUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';
import { getDualAxisScaleNames } from '../scale/scaleUtils';
import { addHoveredItemSignal, getFirstRscSeriesIdSignal, getLastRscSeriesIdSignal } from '../signal/signalSpecBuilder';
import { addUserMetaInteractiveMark, getFacetsFromOptions } from '../specUtils';
import { getLineDirectLabelData, getLineDirectLabelMarks, getLineDirectLabelSpecOptions } from '../lineDirectLabel';
import { getForecastAlternateFlagTransform, getForecastEffectiveValueTransform, getLineForecastBoundaryMark, getLineForecastLabelMarks, getLineForecastSpecOptions } from '../lineForecast';
import { getLinePointAnnotationMarks } from './linePointAnnotation';
import { addTrendlineData, getTrendlineMarks, getTrendlineScales, setTrendlineSignals } from '../trendline';
import { ColorScheme, HighlightedItem, LineOptions, LineSpecOptions, ScSpec } from '../types';
import { getLineHighlightedData, getLineStaticPointData } from './lineDataUtils';
import { getHighlightedSeriesOpacityRules, getLineGradientMark, getLineHighlightOverlayGroup, getLineHoverMarks, getLineMark } from './lineMarkUtils';
import { getLineStaticPoint } from './linePointUtils';
import { getPopoverMarkName, isDualMetricAxis } from './lineUtils';

export const addLine = produce<
  ScSpec,
  [
    LineOptions & {
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      index?: number;
      idKey: string;
      comboSiblingNames?: string[];
    }
  ]
>(
  (
    spec,
    {
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
      ...options
    }
  ) => {
    const lineName = toCamelCase(name || `line${index}`);
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
      ...options,
    };
    lineOptions.isHighlightedByGroup = isHighlightedByGroup(lineOptions);

    spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, lineOptions.interactiveMarkName);
    spec.data = addData(spec.data ?? [], lineOptions);
    spec.signals = addSignals(spec.signals ?? [], lineOptions);
    spec.scales = setScales(spec.scales ?? [], lineOptions);
    spec.marks = addLineMarks(spec.marks ?? [], lineOptions);

    return spec;
  }
);

export const addData = produce<Data[], [LineSpecOptions]>((data, options) => {
  const { alternateSegmentKey, chartInspects, dimension, forecasts, highlightedItem, isSparkline, isMethodLast, metric, name, scaleType, staticPoint } =
    options;
  const tableData = getTableData(data);
  if (scaleType === 'time') {
    tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
  }
  if (alternateSegmentKey) {
    tableData.transform = tableData.transform ?? [];
    tableData.transform.push({ type: 'formula', as: `${name}_alternateFlag`, expr: `datum["${alternateSegmentKey}"]` });
    // time data was transformed above, so we need to use the transformed dimension
    const dimSortField = scaleType === 'time' ? `${dimension}0` : dimension;
    data.push(...getAlternateSegmentData(name, dimSortField));
  }
  if (!alternateSegmentKey && forecasts.length > 0) {
    tableData.transform = tableData.transform ?? [];
    const dimSortField = scaleType === 'time' ? `${dimension}0` : dimension;
    tableData.transform.push(
      getForecastAlternateFlagTransform(name, dimension, forecasts[0].start),
      getForecastEffectiveValueTransform(name, metric, forecasts[0].metric)
    );
    data.push(...getAlternateSegmentData(name, dimSortField));
  }
  if (isInteractive(options) || highlightedItem !== undefined) {
    data.push(getLineHighlightedData(options), getFilteredInspectData(chartInspects));
  }
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

  if (!isInteractive(options)) return;
  // we don't need to include the excludeDataKeys here because they will be excluded from the points for voronoi
  addHoveredItemSignal(signals, name, `${name}_voronoi`, 2);
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
  const { alternateSegmentKey, color, gradient, highlightedItem, isSparkline, linePointAnnotations, lineType, name, opacity, staticPoint } = options;
  const forecasts = options.forecasts ?? [];
  const hasForecast = !alternateSegmentKey && forecasts.length > 0;

  const { facets } = getFacetsFromOptions({ color, lineType, opacity });
  // when alternateSegmentKey or forecasts are active, facet by segmentId so each contiguous run
  // gets its own path with its own strokeDash
  const usesAlternateSegments = !!alternateSegmentKey || hasForecast;
  const facetData = usesAlternateSegments ? `${name}_with_bridges` : FILTERED_TABLE;
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

  const hasHighlightState = isInteractive(options) || highlightedItem !== undefined;

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
  if (staticPoint || isSparkline) marks.push(getLineStaticPoint(options));
  if ((staticPoint || isSparkline) && linePointAnnotations.length > 0) {
    marks.push(...getLinePointAnnotationMarks(options));
  }
  marks.push(...getMetricRangeGroupMarks(options));
  marks.push(...getTrendlineMarks(options));
  const labelSpecOpts = (options.lineDirectLabels ?? []).map((label, i) => getLineDirectLabelSpecOptions(label, i, options));
  for (const specOpts of labelSpecOpts) {
    marks.push(...getLineDirectLabelMarks(options.name, specOpts, options, options.backgroundColor, options.colorScheme));
  }
  // overlay renders the highlighted series on top of labels so the line stays in the foreground on hover
  if (hasHighlightState && labelSpecOpts.length) {
    const opacityRules = getHighlightedSeriesOpacityRules(markOptions);
    marks.push(getLineHighlightOverlayGroup(markOptions, facetData, facetGroupby));
    // fg labels are pushed separately (after the overlay group) so they always render above all overlay lines,
    // regardless of facet sub-group ordering
    for (const specOpts of labelSpecOpts) {
      marks.push(...getLineDirectLabelMarks(options.name, specOpts, options, options.backgroundColor, options.colorScheme, opacityRules));
    }
  }
  // hover marks are last so hollow points and interaction marks always render above everything
  if (hasHighlightState) {
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
  const { interactionMode, name: lineName } = options;
  if (interactionMode !== INTERACTION_MODE.ITEM) return;
  for (const hoverMarkName of getHoverMarkNames(lineName)) {
    addHoveredItemSignal(signals, lineName, hoverMarkName);
  }
};
