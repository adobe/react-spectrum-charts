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
import { extent } from 'd3-array';
import { ScaleBand, ScaleLinear, ScalePoint, ScaleTime, scaleBand, scaleLinear, scalePoint, scaleTime } from 'd3-scale';

import {
  DEFAULT_LINE_TYPES,
  DISCRETE_PADDING,
  MARK_ID,
  PADDING_RATIO,
  SERIES_ID,
} from '@spectrum-charts/core-s2/constants';

import { toText } from './format.js';
import { Theme } from './theme.js';
import { Datum, FacetRef, LineType, ResolvedChartOptions, SupportedMarkOptions } from './types.js';

export const TRANSFORMED_TIME = 'datetime0';

const STROKE_DASHES: Record<string, number[]> = {
  solid: [],
  dashed: [7, 4],
  dotted: [0, 4],
  dotDash: [2, 3, 7, 4],
  shortDash: [3, 4],
  longDash: [11, 4],
  twoDash: [5, 2, 11, 2],
};

/**
 * Converts an RSC line type to a stroke dash array.
 * @param lineType
 * @returns dash array
 */
export const getStrokeDash = (lineType: LineType): number[] =>
  Array.isArray(lineType) ? lineType : STROKE_DASHES[lineType] ?? [];

/** An ordinal scale over a facet field; static facets resolve to their value. */
export interface FacetScale<T> {
  field?: string;
  domain: unknown[];
  get: (row: Datum) => T;
}

/** Everything derived from options and data that marks, axes and legends share. */
export interface ChartData {
  table: Datum[];
  /** Rows of visible series. */
  filteredTable: Datum[];
  /** Rows of visible series (all rows when every series is hidden); used for metric and dimension domains. */
  domainTable: Datum[];
  facets: string[];
  seriesIds: string[];
  /** First row of each series, for reading series-level fields like legend group ids. */
  seriesRows: Map<string, Datum>;
  color: FacetScale<string>;
  lineType: FacetScale<number[]>;
  opacity: FacetScale<number>;
  colorRange: string[];
}

export const unique = (rows: Datum[], field: string): unknown[] => {
  const seen = new Set<unknown>();
  for (const row of rows) seen.add(row[field]);
  return [...seen];
};

const getSeriesRows = (table: Datum[]): Map<string, Datum> => {
  const rows = new Map<string, Datum>();
  for (const row of table) {
    const id = row[SERIES_ID];
    if (id !== undefined && !rows.has(toText(id))) rows.set(toText(id), row);
  }
  return rows;
};

const facetField = <T>(facet: FacetRef<T> | undefined): string | undefined =>
  typeof facet === 'string' ? facet : undefined;

/**
 * Gets the data-driven facet fields of every mark, in color, lineType, opacity order.
 * @param marks
 * @returns facet fields
 */
export const getFacetFields = (
  marks: SupportedMarkOptions[]
): { color: string[]; lineType: string[]; opacity: string[] } => {
  const fields = { color: [] as string[], lineType: [] as string[], opacity: [] as string[] };
  for (const mark of marks) {
    const color = facetField(mark.color ?? { value: 'categorical-100' });
    const lineType = facetField(mark.lineType);
    const opacity = facetField(mark.opacity);
    if (color && !fields.color.includes(color)) fields.color.push(color);
    if (lineType && !fields.lineType.includes(lineType)) fields.lineType.push(lineType);
    if (opacity && !fields.opacity.includes(opacity)) fields.opacity.push(opacity);
  }
  return fields;
};

export const getPalette = (colors: ResolvedChartOptions['colors'], theme: Theme): string[] => {
  if (Array.isArray(colors))
    return colors.map((color) => (Array.isArray(color) ? theme.color(color[0]) : theme.color(color)));
  return theme.palette(colors ?? 's2Categorical20');
};

export const ordinal = <T>(field: string | undefined, domain: unknown[], range: T[], fallback: T): FacetScale<T> => {
  const index = new Map(domain.map((value, i) => [value, i]));
  return {
    field,
    domain,
    get: (row) => {
      if (!field || !range.length) return fallback;
      const i = index.get(row[field]);
      return i === undefined ? range[0] : range[i % range.length];
    },
  };
};

/**
 * Prepares table rows and facet scales.
 * @param options
 * @param theme
 * @returns ChartData
 */
export const prepareData = (options: ResolvedChartOptions, theme: Theme): ChartData => {
  const { data, marks = [], hiddenSeries = [], lineTypes, opacities } = options;
  const fields = getFacetFields(marks);
  const facets = [...fields.color, ...fields.lineType, ...fields.opacity].filter((f, i, all) => all.indexOf(f) === i);
  const hasTime = marks.some((mark) => (mark.scaleType ?? 'time') === 'time');
  const dimension = marks[0]?.dimension ?? 'datetime';

  const table = data.map((datum, i) => {
    const row: Datum = { ...datum, [MARK_ID]: i + 1 };
    if (facets.length) row[SERIES_ID] = facets.map((f) => row[f]).join(' | ');
    if (hasTime) row[TRANSFORMED_TIME] = floorToSecond(row[dimension]);
    return row;
  });
  const hidden = new Set(hiddenSeries);
  const visible = facets.length ? table.filter((row) => !hidden.has(row[SERIES_ID] as string)) : table;

  const colorRange = getPalette(options.colors, theme);
  const colorField = fields.color[0];
  const lineTypeField = fields.lineType[0];
  const opacityField = fields.opacity[0];
  const firstMark = marks[0];
  const staticColor = typeof firstMark?.color === 'object' ? theme.color(firstMark.color.value) : colorRange[0];
  const staticLineType = typeof firstMark?.lineType === 'object' ? getStrokeDash(firstMark.lineType.value) : [];
  const staticOpacity = typeof firstMark?.opacity === 'object' ? firstMark.opacity.value : 1;
  const opacityDomain = opacityField ? unique(table, opacityField) : [];

  return {
    table,
    filteredTable: visible,
    domainTable: visible.length ? visible : table,
    facets,
    seriesIds: unique(table, SERIES_ID).filter((id) => id !== undefined) as string[],
    seriesRows: getSeriesRows(table),
    colorRange,
    color: ordinal(colorField, colorField ? unique(table, colorField) : [], colorRange, staticColor),
    lineType: ordinal(
      lineTypeField,
      lineTypeField ? unique(table, lineTypeField) : [],
      getLineTypeRange(lineTypes),
      staticLineType
    ),
    opacity: ordinal(opacityField, opacityDomain, getOpacityRange(opacities, opacityDomain.length), staticOpacity),
  };
};

/**
 * Gets the lineType scale range, using the first line type of each two-dimensional entry.
 * @param lineTypes
 * @returns stroke dash arrays
 */
export const getLineTypeRange = (
  lineTypes: ResolvedChartOptions['lineTypes'] = DEFAULT_LINE_TYPES as LineType[]
): number[][] =>
  lineTypes.map((lineType) =>
    getStrokeDash(Array.isArray(lineType) && typeof lineType[0] !== 'number' ? lineType[0] : lineType)
  );

/**
 * Gets the opacity scale range, defaulting to a point scale over the domain.
 * @param opacities
 * @param count domain size
 * @returns opacities
 */
export const getOpacityRange = (opacities: ResolvedChartOptions['opacities'], count: number): number[] =>
  opacities?.length
    ? (opacities as (number | number[])[]).map((o) => (Array.isArray(o) ? o[0] : o))
    : getPointOpacities(count);

/** Default opacity point scale: range [1, 0], padding 1, align 1. */
const getPointOpacities = (count: number): number[] => {
  const scale = scalePoint<number>()
    .domain([...new Array(count).keys()])
    .range([1, 0])
    .padding(1)
    .align(1);
  return [...new Array(count).keys()].map((i) => scale(i) ?? 1);
};

const floorToSecond = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  const time = value instanceof Date ? value.getTime() : new Date(value as string | number).getTime();
  return Math.floor(time / 1000) * 1000;
};

export type XScale = ScaleTime<number, number> | ScaleLinear<number, number> | ScalePoint<string> | ScaleBand<string>;

export type DimensionScaleType = 'time' | 'linear' | 'point' | 'band';

/** Whether the dimension scale maps stringified values to discrete positions. */
export const isDiscreteScaleType = (type: string | undefined): boolean => type === 'point' || type === 'band';

/** Half the bandwidth of a band scale, added to band axis ticks and labels. */
export const getBandOffset = (scale: unknown): number => {
  const { bandwidth } = scale as { bandwidth?: () => number };
  return bandwidth ? bandwidth() / 2 : 0;
};

/**
 * Zooms a continuous domain about its center so the data sits `padding` pixels inside the range.
 * @param domain
 * @param width
 * @param padding pixels
 * @returns padded domain
 */
const padDomain = ([min, max]: [number, number], width: number, padding: number): [number, number] => {
  // the domain values that land at the edges once the data occupies [padding, width - padding]
  const inner = scaleLinear().domain([padding, width - padding]).range([min, max]);
  return [inner(0), inner(width)];
};

/**
 * Creates the dimension scale.
 * @param type
 * @param rows
 * @param field
 * @param width
 * @param padding pixel padding for continuous scales, or the outer step padding for point and band scales
 * @returns XScale
 */
export const getDimensionScale = (
  type: DimensionScaleType,
  rows: Datum[],
  field: string,
  width: number,
  padding?: number
): XScale => {
  if (type === 'band') {
    return scaleBand<string>()
      .domain(unique(rows, field).map(String))
      .range([0, width])
      .paddingInner(PADDING_RATIO)
      .paddingOuter(padding ?? DISCRETE_PADDING - (1 - PADDING_RATIO) / 2);
  }
  if (type === 'point') {
    return scalePoint<string>()
      .domain(unique(rows, field).map(String))
      .range([0, width])
      .padding(padding ?? 0.5);
  }
  const values = rows.map((row) => Number(row[type === 'time' ? TRANSFORMED_TIME : field]));
  let [min = 0, max = 0] = extent(values.filter((v) => !Number.isNaN(v)));
  // linear scales include zero by default
  if (type === 'linear') [min, max] = [Math.min(min, 0), Math.max(max, 0)];
  if (padding && min !== max) [min, max] = padDomain([min, max], width, padding);
  if (type === 'time')
    return scaleTime()
      .domain([new Date(min), new Date(max)])
      .range([0, width]);
  return scaleLinear().domain([min, max]).range([0, width]);
};

/**
 * Creates the metric scale: nice and zero-based.
 * @param rows
 * @param fields
 * @param height
 * @param range custom axis range, which disables nice and zero
 * @returns linear scale
 */
/** Primary and secondary metric scales for a Line `dualMetricAxis`; the last color series uses the secondary. */
export interface DualMetricScales {
  primary: ScaleLinear<number, number>;
  secondary: ScaleLinear<number, number>;
  firstSeriesId: unknown;
  lastSeriesId: unknown;
}

/**
 * Creates the dual metric axis scales, each domain falling back to all its rows when its series are hidden.
 * @param data
 * @param fields metric fields
 * @param height
 * @param hiddenSeries
 * @returns scales
 */
export const getDualMetricScales = (
  data: ChartData,
  fields: string[],
  height: number,
  hiddenSeries: string[]
): DualMetricScales => {
  const { domain } = data.color;
  const firstSeriesId = domain[0];
  const lastSeriesId = domain.at(-1);
  const hidden = new Set(hiddenSeries);
  const domainRows = (rows: Datum[]) => {
    const visible = rows.filter((row) => !hidden.has(row[SERIES_ID] as string));
    return visible.length ? visible : rows;
  };
  const primaryRows = data.table.filter((row) => row[SERIES_ID] !== lastSeriesId);
  const secondaryRows = data.table.filter((row) => row[SERIES_ID] === lastSeriesId);
  return {
    primary: getMetricScale(domainRows(primaryRows), fields, height),
    secondary: getMetricScale(domainRows(secondaryRows), fields, height),
    firstSeriesId,
    lastSeriesId,
  };
};

export type MetricScales = Record<string, ScaleLinear<number, number>>;

/**
 * Creates a metric scale per `metricAxis` name from the metrics of the marks that use it.
 * @param marks
 * @param rows
 * @param height
 * @param metricFields
 * @returns scales by name
 */
export const getNamedMetricScales = (
  marks: SupportedMarkOptions[],
  rows: Datum[],
  height: number,
  metricFields: (mark: SupportedMarkOptions) => string[]
): MetricScales => {
  const fields: Record<string, string[]> = {};
  for (const mark of marks) {
    if ('metricAxis' in mark && mark.metricAxis) (fields[mark.metricAxis] ??= []).push(...metricFields(mark));
  }
  return Object.fromEntries(Object.entries(fields).map(([name, f]) => [name, getMetricScale(rows, f, height)]));
};

export const getMetricScale = (
  rows: Datum[],
  fields: string[],
  height: number,
  range?: [number, number]
): ScaleLinear<number, number> => {
  if (range) return scaleLinear().domain(range).range([height, 0]);
  let min = 0;
  let max = 0;
  for (const row of rows) {
    for (const field of fields) {
      const value = Number(row[field]);
      if (row[field] === null || row[field] === undefined || Number.isNaN(value)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }
  return scaleLinear().domain([min, max]).range([height, 0]).nice();
};
