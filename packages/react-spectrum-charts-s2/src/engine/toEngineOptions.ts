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
import type {
  BaseChartOptions,
  DonutChartOptions,
  ReferenceLineOptions as EngineReferenceLine,
  LineChartOptions,
  XAxisOptions,
  YAxisOptions,
} from '@spectrum-charts/chart-engine';
import { DEFAULT_COLOR, DEFAULT_METRIC, DEFAULT_TIME_DIMENSION } from '@spectrum-charts/core-s2/constants';
import { getColorValue } from '@spectrum-charts/core-s2/tokens';
import type { AxisOptions, ChartOptions, DonutOptions, LineOptions, NumberFormat } from '@spectrum-charts/vega-spec-builder-s2';

type SharedOptions = Pick<
  BaseChartOptions<unknown>,
  'width' | 'height' | 'theme' | 'palette' | 'title' | 'description' | 'legend' | 'tooltip' | 'animation'
>;
type LineOnlyOptions = Omit<LineChartOptions, keyof BaseChartOptions<unknown>>;
type DonutOnlyOptions = Omit<DonutChartOptions, keyof BaseChartOptions<unknown>>;

export type EngineConfig =
  | { type: 'line'; options: SharedOptions & LineOnlyOptions }
  | { type: 'donut'; options: SharedOptions & DonutOnlyOptions };

const NUMBER_FORMATS: Record<string, string> = {
  currency: '$,.2f',
  shortCurrency: '$.3~s',
  shortNumber: '.3~s',
  standardNumber: ',',
  percentage: '.0%',
};

/**
 * Converts RSC chart options into engine options, or returns why the engine can't draw them.
 * @param chartOptions
 * @returns EngineConfig | string
 */
export const toEngineOptions = (chartOptions: ChartOptions): EngineConfig | string => {
  const { marks } = chartOptions;
  if (marks.length !== 1) return `the engine draws exactly one mark (got ${marks.length})`;
  const mark = marks[0];
  const shared = getSharedOptions(chartOptions);
  if (mark.markType === 'line') return { type: 'line', options: { ...shared, ...getLineOptions(mark, chartOptions.axes ?? []) } };
  if (mark.markType === 'donut') return { type: 'donut', options: { ...shared, ...getDonutOptions(mark) } };
  return `the engine doesn't support the ${mark.markType} mark`;
};

const getSharedOptions = ({
  animations,
  chartHeight,
  chartWidth,
  colors,
  colorScheme = 'light',
  description,
  legends,
  marks,
  title,
  titles,
}: ChartOptions): SharedOptions => {
  const legend = legends?.[0];
  const mark = marks[0];
  return {
    width: chartWidth,
    height: chartHeight,
    theme: colorScheme,
    palette: getPalette(colors, colorScheme),
    title: titles?.[0]?.text ?? title,
    description,
    legend: legend ? { position: legend.position, title: legend.title } : false,
    tooltip: Boolean('chartInspects' in mark && mark.chartInspects?.length),
    animation: animations !== false,
  };
};

const getPalette = (colors: ChartOptions['colors'], colorScheme: 'light' | 'dark'): string[] | undefined => {
  if (!Array.isArray(colors) || !colors.every((c) => typeof c === 'string')) return undefined;
  return colors.map((c) => getColorValue(c as string, colorScheme));
};

const getFormat = (numberFormat?: NumberFormat): string | undefined =>
  numberFormat ? (NUMBER_FORMATS[numberFormat] ?? numberFormat) : undefined;

const getAxis = (axis: AxisOptions | undefined): XAxisOptions & YAxisOptions => {
  if (!axis) return { hidden: true };
  const title = Array.isArray(axis.title) ? axis.title.join(' ') : axis.title;
  const format = axis.labelFormat === 'percentage' ? '.0%' : getFormat(axis.numberFormat);
  return { title, grid: axis.grid, format, tickMarks: axis.ticks };
};

const isXAxis = (axis: AxisOptions) => axis.position === 'bottom' || axis.position === 'top';

const getReferenceLines = (axes: AxisOptions[]): EngineReferenceLine[] =>
  axes.flatMap((axis) =>
    (axis.referenceLines ?? []).map((line) => ({
      axis: isXAxis(axis) ? 'x' : 'y',
      value: line.value,
      label: line.label,
      kind: line.secondary ? 'secondary' : 'primary',
    }))
  );

const getLineOptions = (line: LineOptions, axes: AxisOptions[]): LineOnlyOptions => {
  const { color, dimension = DEFAULT_TIME_DIMENSION, metric = DEFAULT_METRIC, lineType, scaleType = 'time' } = line;
  const xAxis = axes.find(isXAxis);
  const yAxis = axes.find((a) => !isXAxis(a));
  const directLabel = line.lineDirectLabels?.[0];
  return {
    x: dimension,
    y: metric,
    series: typeof color === 'string' ? color : undefined,
    lineStyle: typeof lineType === 'string' ? lineType : undefined,
    curve: line.interpolate === 'monotone' ? 'monotone' : 'linear',
    area: line.gradient,
    hover: line.dimensionHover ? 'x' : 'point',
    minimal: line.isSparkline,
    xAxis: { ...getAxis(xAxis), type: scaleType === 'point' ? 'band' : scaleType },
    yAxis: { ...getAxis(yAxis), position: yAxis?.position === 'left' ? 'left' : 'right' },
    referenceLines: getReferenceLines(axes),
    directLabels: directLabel
      ? {
          category: directLabel.value === 'series' ? (directLabel.position ?? 'end') : false,
          value: directLabel.value === 'last' ? 'end' : false,
        }
      : false,
  };
};

const getDonutOptions = (donut: DonutOptions): DonutOnlyOptions => {
  const { color = DEFAULT_COLOR, metric = DEFAULT_METRIC, sortOrder, variant, isBoolean } = donut;
  const summary = donut.donutSummaries?.[0];
  return {
    category: color,
    value: metric,
    sort: sortOrder === 'data' ? 'none' : 'descending',
    variant: variant === 'semicircle' ? 'semicircle' : 'full',
    binary: isBoolean,
    center: summary ? { label: summary.label, value: summary.hideValue ? false : undefined } : false,
    directLabels: donut.segmentLabels?.length ? 'lightweight' : false,
  };
};
