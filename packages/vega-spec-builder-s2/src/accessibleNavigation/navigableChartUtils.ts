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
import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC } from '@spectrum-charts/core-s2/constants';
import { toCamelCase } from '@spectrum-charts/core-s2/utils';

import { isDodgedAndStacked, isDualMetricAxis } from '../bar/barUtils.js';
import {
  AxisOptions,
  BarOptions,
  BarSpecOptions,
  LegendOptions,
  MarkOptions,
  NavigableChart,
  Position,
} from '../types/index.js';

type BarMarkOptions = BarOptions & { markType: 'bar' };

export interface BarSeriesFields {
  /** The field read as the series' name in labels: `color`, or a dual facet's first field */
  color?: string;
  /** Every field that divides the bar into series, in the order the chart's series id joins them */
  seriesFields: string[];
  /** For a dodged-and-stacked bar, the fields that split each category into side-by-side groups */
  dodgeFields?: string[];
  /** For a dodged-and-stacked bar, the remaining series fields, which tell a stack's segments apart */
  stackFields?: string[];
}

/** The field a facet names at `index` (a dual facet's primary or secondary field). */
const facetField = (facet: unknown, index: 0 | 1): string | undefined => {
  let value: unknown;
  if (Array.isArray(facet)) value = facet[index];
  else if (index === 0) value = facet;
  return typeof value === 'string' ? value : undefined;
};

const uniqueFields = (fields: (string | undefined)[]): string[] => [
  ...new Set(fields.filter((field): field is string => field !== undefined)),
];

/**
 * Gets the fields dividing a bar into series, grouped the way a dodged-and-stacked bar dodges and stacks them.
 * @param bar
 * @returns BarSeriesFields
 */
export const getBarSeriesFields = (
  bar: Pick<BarOptions, 'color' | 'lineType' | 'opacity' | 'type'>
): BarSeriesFields => {
  const facets = [bar.color, bar.lineType, bar.opacity];
  const primary = uniqueFields(facets.map((facet) => facetField(facet, 0)));
  const secondary = uniqueFields(facets.map((facet) => facetField(facet, 1)));
  const seriesFields = uniqueFields([...primary, ...secondary]);
  let dodgeFields: string[] | undefined;
  if (isDodgedAndStacked(bar as BarSpecOptions)) dodgeFields = bar.type === 'dodged' ? primary : secondary;
  const stackFields = dodgeFields && seriesFields.filter((field) => !dodgeFields.includes(field));
  return { color: facetField(bar.color, 0) ?? seriesFields[0], seriesFields, dodgeFields, stackFields };
};

/**
 * Gets the title of the axis at a position, joining a multi-line title.
 * @param axes
 * @param position
 * @returns string | undefined
 */
const getAxisTitle = (axes: AxisOptions[], position: Position): string | undefined => {
  const title = axes.find((axis) => axis.position === position)?.title;
  return Array.isArray(title) ? title.join(' ') : title || undefined;
};

/**
 * Gets the titles keyed by the field they label, in reading order: dimension, series, then metric.
 * @param options
 * @returns Record<string, string>
 */
const getFieldLabels = ({
  dimension,
  metric,
  color,
  seriesFields,
  dimensionTitle,
  metricTitle,
  legendTitle,
}: {
  dimension: string;
  metric: string;
  color?: string;
  seriesFields: string[];
  dimensionTitle?: string;
  metricTitle?: string;
  legendTitle?: string;
}): Record<string, string> => {
  const labels: Record<string, string> = {};
  if (dimensionTitle) labels[dimension] = dimensionTitle;
  if (color && (legendTitle || dimensionTitle || metricTitle)) {
    labels[color] = legendTitle ?? color;
    // Other series fields (e.g. a time-comparison period) tell series apart too, so they're read under their own names.
    for (const field of seriesFields) labels[field] ??= field;
  }
  if (metricTitle) labels[metric] = metricTitle;
  return labels;
};

/**
 * Gets the keyboard navigation configuration for the chart's first navigable mark.
 * @param options
 * @returns NavigableChart | undefined
 */
export const getNavigableChart = ({
  marks,
  axes = [],
  legends = [],
}: {
  marks: MarkOptions[];
  axes?: AxisOptions[];
  legends?: LegendOptions[];
}): NavigableChart | undefined => {
  const bar = marks.find((mark): mark is BarMarkOptions => mark.markType === 'bar');
  if (!bar) return undefined;
  const {
    dimension = DEFAULT_CATEGORICAL_DIMENSION,
    metric = DEFAULT_METRIC,
    orientation = 'vertical',
    type = 'stacked',
    colorOverride,
    order,
  } = bar;
  const { color, seriesFields, dodgeFields, stackFields } = getBarSeriesFields(bar);
  const isHorizontal = orientation === 'horizontal';
  const dimensionTitle = getAxisTitle(axes, isHorizontal ? 'left' : 'bottom');
  const metricTitle = getAxisTitle(axes, isHorizontal ? 'bottom' : 'left');
  const legendTitle =
    color === undefined
      ? undefined
      : legends.find((legend) => typeof legend.color !== 'string' || legend.color === color)?.title;
  const secondaryMetricTitle = getAxisTitle(axes, isHorizontal ? 'top' : 'right');
  const hasMetricAxisTitles = Boolean(metricTitle || secondaryMetricTitle);
  const hasBottomAxis = axes.some((axis) => axis.position === 'bottom');

  return {
    chartType: 'bar',
    markName: toCamelCase(bar.name || 'bar0'),
    dimension,
    metric,
    color,
    seriesFields,
    dodgeFields,
    stackFields,
    type,
    colorOverride,
    order,
    orientation,
    fieldLabels: getFieldLabels({ dimension, metric, color, seriesFields, dimensionTitle, metricTitle, legendTitle }),
    metricAxisTitles:
      hasMetricAxisTitles && isDualMetricAxis({ ...bar, type } as BarSpecOptions)
        ? { primary: metricTitle, secondary: secondaryMetricTitle }
        : undefined,
    hasChartInspect: Boolean(bar.chartInspects?.length),
    // A horizontal bar's categorical axis is the left one, so only a vertical bar gets a bottom-axis region.
    xAxis: !isHorizontal && hasBottomAxis ? { field: dimension, title: dimensionTitle } : undefined,
  };
};
