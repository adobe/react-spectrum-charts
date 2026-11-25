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
import { AxisOptions, HistogramOptions, MarkOptions } from '@spectrum-charts/vega-spec-builder-s2';

import { MessageKey, formatMessage } from '../intl/index.js';
import { HistogramProps } from '../types/index.js';
import { ChildrenToOptions } from './childOptions.types.js';

export const getHistogramOptions = (
  { children, onClick, ...histogramProps }: HistogramProps,
  childrenToOptions: ChildrenToOptions
): HistogramOptions => {
  const { chartInspects, chartPopovers } = childrenToOptions(children);
  return {
    ...histogramProps,
    chartInspects,
    chartPopovers,
    hasOnClick: Boolean(onClick),
    markType: 'histogram',
  };
};

/**
 * Gets the message key for a histogram's count axis title.
 * @param histogram - histogram options
 * @returns message key
 */
export const getHistogramAxisTitleKey = ({ cumulative, weight, yValue = 'count' }: HistogramOptions): MessageKey => {
  if (cumulative && yValue === 'count')
    return weight ? 'histogram.cumulativeSumTitle' : 'histogram.cumulativeCountTitle';
  if (cumulative) return 'histogram.cumulativePercentTitle';
  if (yValue === 'percent') return 'histogram.percentTitle';
  if (yValue === 'density') return 'histogram.densityTitle';
  return weight ? 'histogram.sumTitle' : 'histogram.countTitle';
};

/**
 * Gets the localized title for what a histogram's bars or cells measure.
 * @param histogram - histogram options
 * @param locale - message locale
 * @returns title
 */
export const getHistogramValueTitle = (histogram: HistogramOptions, locale: string): string =>
  formatMessage(locale, getHistogramAxisTitleKey(histogram), { field: histogram.weight ?? '' });

/**
 * Whether a histogram's bars show shares of rows rather than counts or densities.
 * @param histogram - histogram options
 * @returns boolean
 */
export const isHistogramShare = ({ cumulative, yValue = 'count' }: HistogramOptions): boolean =>
  yValue === 'percent' || (Boolean(cumulative) && yValue === 'density');

/**
 * Gives the count axes the first 1D histogram's localized title, and percentage labels for shares.
 * @param axes - axis options
 * @param marks - mark options
 * @param locale - message locale
 * @returns axis options
 */
export const applyHistogramAxisTitleDefaults = (
  axes: AxisOptions[],
  marks: MarkOptions[],
  locale: string
): AxisOptions[] => {
  const histogram = marks.find((mark): mark is HistogramOptions => mark.markType === 'histogram' && !mark.yMetric);
  if (!histogram) return axes;
  const title = getHistogramValueTitle(histogram, locale);
  const labelFormat = isHistogramShare(histogram) ? 'percentage' : undefined;
  const countPositions = histogram.orientation === 'horizontal' ? ['bottom', 'top'] : ['left', 'right'];
  return axes.map((axis) => {
    if (!countPositions.includes(axis.position)) return axis;
    return { ...axis, title: axis.title ?? title, labelFormat: axis.labelFormat ?? labelFormat };
  });
};

/**
 * Gives 2D histograms without a cell legend title the localized title for what the cells measure.
 * @param marks - mark options
 * @param locale - message locale
 * @returns mark options
 */
export const applyHistogramCellLegendTitleDefaults = (marks: MarkOptions[], locale: string): MarkOptions[] =>
  marks.map((mark) => {
    if (mark.markType !== 'histogram' || !mark.yMetric || mark.cellLegendTitle !== undefined) return mark;
    return {
      ...mark,
      cellLegendTitle: getHistogramValueTitle({ ...mark, cumulative: false, yValue: 'count' }, locale),
    };
  });
