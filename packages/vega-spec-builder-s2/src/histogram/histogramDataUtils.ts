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
import { Data, SourceData, Transforms } from 'vega';

import {
  COLOR_SCALE,
  FILTERED_TABLE,
  HISTOGRAM_BIN_END,
  HISTOGRAM_BIN_START,
  HISTOGRAM_COUNT,
  HISTOGRAM_CUMULATIVE_COUNT,
  HISTOGRAM_CUMULATIVE_PERCENT,
  HISTOGRAM_CURVE_X,
  HISTOGRAM_CURVE_Y,
  HISTOGRAM_DENSITY,
  HISTOGRAM_PERCENT,
  HISTOGRAM_SUM,
  HISTOGRAM_VALUE,
  HISTOGRAM_Y0,
  HISTOGRAM_Y1,
  HISTOGRAM_Y_BIN_END,
  HISTOGRAM_Y_BIN_START,
} from '@spectrum-charts/core-s2/constants';

import { getSeriesIdTransform } from '../data/dataUtils.js';
import { HistogramSpecOptions } from '../types/index.js';

/** Binning settings for one axis of a histogram. */
export interface HistogramAxisBinning {
  anchor?: number;
  as: [string, string];
  binCount?: number;
  binEdges?: number[];
  binSize?: number;
  extent?: [number, number];
  extentSignal: string;
  field: string;
  paramsSignal: string;
}

const MIN_DEFAULT_BINS = 5;
const MAX_DEFAULT_BINS = 50;

/**
 * Gets the name of the data source that holds the rows with finite values to bin.
 * @param name - histogram name
 * @returns data name
 */
export const getHistogramValuesDataName = (name: string): string => `${name}_values`;

/**
 * Gets the name of the data source that holds one row per bin (and series).
 * @param name - histogram name
 * @returns data name
 */
export const getHistogramBinsDataName = (name: string): string => `${name}_bins`;

/**
 * Whether the histogram bins two metrics into a grid of cells.
 * @param options - histogram spec options
 * @returns boolean
 */
export const isHistogram2D = ({ yMetric }: Pick<HistogramSpecOptions, 'yMetric'>): boolean => Boolean(yMetric);

/**
 * Gets the data keys that split the histogram into series.
 * @param options - histogram spec options
 * @returns series fields
 */
export const getHistogramSeriesFields = ({
  color,
  yMetric,
}: Pick<HistogramSpecOptions, 'color' | 'yMetric'>): string[] => (typeof color === 'string' && !yMetric ? [color] : []);

/**
 * Whether series split by `color` stack on top of each other.
 * @param options - histogram spec options
 * @returns boolean
 */
export const isHistogramStacked = (options: HistogramSpecOptions): boolean =>
  options.layout === 'stacked' && getHistogramSeriesFields(options).length > 0;

/**
 * Whether series split by `color` sit side by side within each bin.
 * @param options - histogram spec options
 * @returns boolean
 */
export const isHistogramDodged = (options: HistogramSpecOptions): boolean =>
  options.layout === 'dodged' && getHistogramSeriesFields(options).length > 0;

/**
 * Gets the field each bin's bar height is built from: the row count, or the sum of `weight`.
 * @param options - histogram spec options
 * @returns field name
 */
export const getHistogramBaseField = ({ weight }: Pick<HistogramSpecOptions, 'weight'>): string =>
  weight ? HISTOGRAM_SUM : HISTOGRAM_COUNT;

/**
 * Gets the aggregate that counts rows per bin, and sums `weight` when set.
 * @param options - histogram spec options
 * @param groupby - fields to group by
 * @returns aggregate transform
 */
export const getHistogramAggregateTransform = ({ weight }: HistogramSpecOptions, groupby: string[]): Transforms =>
  weight
    ? {
        type: 'aggregate',
        groupby,
        ops: ['count', 'sum'],
        fields: [null, weight],
        as: [HISTOGRAM_COUNT, HISTOGRAM_SUM],
      }
    : { type: 'aggregate', groupby, ops: ['count'], as: [HISTOGRAM_COUNT] };

/**
 * Sorts and dedupes custom bin edges, ignoring them when fewer than two finite edges remain.
 * @param binEdges - edges from the binEdges prop
 * @returns valid edges or undefined
 */
export const getValidBinEdges = (binEdges?: number[]): number[] | undefined => {
  if (!binEdges) return undefined;
  const edges = [...new Set(binEdges.filter((edge) => Number.isFinite(edge)))].sort((a, b) => a - b);
  return edges.length >= 2 ? edges : undefined;
};

/**
 * Gets the x axis binning settings.
 * @param options - histogram spec options
 * @returns HistogramAxisBinning
 */
export const getHistogramXBinning = ({
  binAnchor,
  binCount,
  binEdges,
  binSize,
  extent,
  metric,
  name,
}: HistogramSpecOptions): HistogramAxisBinning => ({
  anchor: binAnchor,
  as: [HISTOGRAM_BIN_START, HISTOGRAM_BIN_END],
  binCount,
  binEdges: getValidBinEdges(binEdges),
  binSize,
  extent,
  extentSignal: `${name}_extent`,
  field: metric,
  paramsSignal: `${name}_binParams`,
});

/**
 * Gets the y axis binning settings for a 2D histogram.
 * @param options - histogram spec options
 * @returns HistogramAxisBinning
 */
export const getHistogramYBinning = ({
  name,
  yBinCount,
  yBinSize,
  yExtent,
  yMetric,
}: HistogramSpecOptions): HistogramAxisBinning => ({
  as: [HISTOGRAM_Y_BIN_START, HISTOGRAM_Y_BIN_END],
  binCount: yBinCount,
  binSize: yBinSize,
  extent: yExtent,
  extentSignal: `${name}_yExtent`,
  field: yMetric ?? '',
  paramsSignal: `${name}_yBinParams`,
});

/**
 * Gets the default maximum bin count from the number of rows (Rice rule).
 * @param valuesData - name of the data source with the rows to bin
 * @returns signal expression
 */
export const getDefaultBinCountExpr = (valuesData: string): string => {
  const rice = `ceil(2 * pow(length(data('${valuesData}')), 1 / 3))`;
  return `max(${MIN_DEFAULT_BINS}, min(${MAX_DEFAULT_BINS}, ${rice}))`;
};

/**
 * Gets the transforms that bin a field into evenly sized bins.
 * @param binning - axis binning settings
 * @param valuesData - name of the data source with the rows to bin
 * @returns transforms
 */
export const getUniformBinTransforms = (binning: HistogramAxisBinning, valuesData: string): Transforms[] => {
  const { as, binCount, binSize, extent, extentSignal, field, paramsSignal } = binning;
  const transforms: Transforms[] = [];
  if (!extent) {
    transforms.push({ type: 'extent', field, signal: extentSignal });
  }
  transforms.push(
    {
      type: 'bin',
      field,
      extent: extent ?? { signal: extentSignal },
      maxbins: binCount ?? { signal: getDefaultBinCountExpr(valuesData) },
      ...(binSize ? { step: binSize } : {}),
      // a custom extent sets exact bin edges, so it isn't rounded out to nice values
      nice: !extent,
      as,
      signal: paramsSignal,
    },
    // values outside a custom extent land in infinite bins
    { type: 'filter', expr: `isFinite(datum.${as[0]})` }
  );
  return transforms;
};

/**
 * Gets an expression for the index of the custom bin a value falls in, or -1 outside the edges.
 * @param value - expression for the value
 * @param edges - ascending bin edges
 * @returns expression string
 */
export const getCustomBinIndexExpr = (value: string, edges: number[]): string => {
  const last = edges.length - 1;
  let expr = String(last - 1);
  for (let i = last - 2; i >= 0; i--) {
    expr = `${value} < ${edges[i + 1]} ? ${i} : ${expr}`;
  }
  return `${value} < ${edges[0]} || ${value} > ${edges[last]} ? -1 : ${expr}`;
};

/**
 * Gets the transforms that bin a field into custom, possibly uneven bins.
 * @param binning - axis binning settings
 * @param edges - ascending bin edges
 * @returns transforms
 */
export const getCustomBinTransforms = ({ as, field }: HistogramAxisBinning, edges: number[]): Transforms[] => {
  const indexField = `${as[0]}Index`;
  const edgesArray = JSON.stringify(edges);
  return [
    { type: 'formula', as: indexField, expr: getCustomBinIndexExpr(`datum.${field}`, edges) },
    { type: 'filter', expr: `datum.${indexField} >= 0` },
    { type: 'formula', as: as[0], expr: `${edgesArray}[datum.${indexField}]` },
    { type: 'formula', as: as[1], expr: `${edgesArray}[datum.${indexField} + 1]` },
  ];
};

/**
 * Gets the transforms that bin a field.
 * @param binning - axis binning settings
 * @param valuesData - name of the data source with the rows to bin
 * @returns transforms
 */
export const getBinTransforms = (
  binning: HistogramAxisBinning,
  valuesData: string,
  withAnchoredEdges = true
): Transforms[] => {
  if (binning.binEdges) return getCustomBinTransforms(binning, binning.binEdges);
  if (!isAnchored(binning)) return getUniformBinTransforms(binning, valuesData);
  return [
    ...getUniformBinTransforms(binning, valuesData),
    ...getAnchoredBinIndexTransforms(binning),
    ...(withAnchoredEdges ? getAnchoredBinEdgeTransforms(binning) : []),
  ];
};

/**
 * Whether evenly sized bins line up with `binAnchor`.
 * @param binning - axis binning settings
 * @returns boolean
 */
export const isAnchored = ({ anchor, binEdges }: HistogramAxisBinning): boolean => anchor !== undefined && !binEdges;

/**
 * Gets the field holding an anchored bin's whole-step index from the anchor.
 * @param binning - axis binning settings
 * @returns field name
 */
export const getAnchoredBinIndexField = ({ as }: HistogramAxisBinning): string => `${as[0]}Index`;

/**
 * Gets expressions for the first and last anchored bin indexes that cover the binned range.
 * @param binning - axis binning settings
 * @returns [first index, last index]
 */
export const getAnchoredBinIndexBoundsExprs = (binning: HistogramAxisBinning): [string, string] => {
  const { anchor, extent, extentSignal, paramsSignal: p } = binning;
  const [low, high] = extent ? [String(extent[0]), String(extent[1])] : [`${extentSignal}[0]`, `${extentSignal}[1]`];
  const first = `floor((${low} - ${anchor}) / ${p}.step)`;
  // the range's maximum belongs to the last bin, even when it sits exactly on an edge
  return [first, `max(${first}, ceil((${high} - ${anchor}) / ${p}.step) - 1)`];
};

/**
 * Gets the transform that places each value in a bin counted in whole steps from the anchor.
 * @param binning - axis binning settings
 * @returns transforms
 */
export const getAnchoredBinIndexTransforms = (binning: HistogramAxisBinning): Transforms[] => {
  const { anchor, field, paramsSignal: p } = binning;
  const [first, last] = getAnchoredBinIndexBoundsExprs(binning);
  return [
    {
      type: 'formula',
      as: getAnchoredBinIndexField(binning),
      expr: `clamp(floor((datum.${field} - ${anchor}) / ${p}.step), ${first}, ${last})`,
    },
  ];
};

/**
 * Gets the transforms that set an anchored bin's edges from its index.
 * @param binning - axis binning settings
 * @returns transforms
 */
export const getAnchoredBinEdgeTransforms = (binning: HistogramAxisBinning): Transforms[] => {
  const { anchor, as, paramsSignal: p } = binning;
  const index = `datum.${getAnchoredBinIndexField(binning)}`;
  return [
    { type: 'formula', as: as[0], expr: `${anchor} + ${p}.step * ${index}` },
    { type: 'formula', as: as[1], expr: `${anchor} + ${p}.step * (${index} + 1)` },
  ];
};

/**
 * Gets the field empty bins are filled in by: the bin start, or the anchored bin index.
 * @param binning - axis binning settings
 * @returns field name
 */
export const getBinKeyField = (binning: HistogramAxisBinning): string =>
  isAnchored(binning) ? getAnchoredBinIndexField(binning) : binning.as[0];

/**
 * Gets an expression for the start of every bin, so bins without rows can be filled in with zero.
 * @param binning - axis binning settings
 * @returns signal expression
 */
export const getBinStartsExpr = (binning: HistogramAxisBinning): string => {
  const { binEdges, paramsSignal: p } = binning;
  if (binEdges) return JSON.stringify(binEdges.slice(0, -1));
  const isValidParams = `isValid(${p}) && isFinite(${p}.start) && isFinite(${p}.stop) && ${p}.step > 0`;
  if (isAnchored(binning)) {
    const [first, last] = getAnchoredBinIndexBoundsExprs(binning);
    return `${isValidParams} ? sequence(${first}, ${last} + 0.5) : []`;
  }
  // the binned range ends on the first whole step at or past stop
  const end = `${p}.start + ceil((${p}.stop - ${p}.start) / ${p}.step - 1e-9) * ${p}.step`;
  return `${isValidParams} ? sequence(${p}.start, ${end} - ${p}.step / 2, ${p}.step) : []`;
};

/**
 * Gets the expression for the end of a bin from its start.
 * @param binning - axis binning settings
 * @returns expression string
 */
export const getBinEndExpr = ({ as, binEdges, paramsSignal: p }: HistogramAxisBinning): string => {
  if (binEdges) {
    const edgesArray = JSON.stringify(binEdges);
    return `${edgesArray}[indexof(${edgesArray}, datum.${as[0]}) + 1]`;
  }
  // matches the bin transform's own end calculation for floating point agreement
  return `${p}.start + ${p}.step * (1 + (datum.${as[0]} - ${p}.start) / ${p}.step)`;
};

/**
 * Gets the data source with the rows whose binned fields are finite numbers.
 * @param options - histogram spec options
 * @returns SourceData
 */
export const getHistogramValuesData = (options: HistogramSpecOptions): SourceData => {
  const fields = [options.metric, options.yMetric, options.weight].filter(Boolean) as string[];
  const expr = fields.map((field) => `isNumber(datum.${field}) && isFinite(datum.${field})`).join(' && ');
  return {
    name: getHistogramValuesDataName(options.name),
    source: FILTERED_TABLE,
    transform: [{ type: 'filter', expr }],
  };
};

/**
 * Gets the field the plotted bar height is read from.
 * @param options - histogram spec options
 * @returns field name
 */
export const getHistogramValueField = (options: HistogramSpecOptions): string => {
  const { cumulative, yValue } = options;
  if (cumulative) return yValue === 'count' ? HISTOGRAM_CUMULATIVE_COUNT : HISTOGRAM_CUMULATIVE_PERCENT;
  if (yValue === 'percent') return HISTOGRAM_PERCENT;
  if (yValue === 'density') return HISTOGRAM_DENSITY;
  return getHistogramBaseField(options);
};

/**
 * Gets the transforms that turn counts into percents, densities and cumulative values.
 * @param options - histogram spec options
 * @returns transforms
 */
export const getHistogramValueTransforms = (options: HistogramSpecOptions): Transforms[] => {
  const seriesFields = getHistogramSeriesFields(options);
  const totalField = `${options.name}_total`;
  // stacked segments share the whole histogram's total so the stack reads as the overall distribution
  const totalGroupby = isHistogramStacked(options) ? [] : seriesFields;
  const base = getHistogramBaseField(options);
  const transforms: Transforms[] = [
    { type: 'joinaggregate', groupby: totalGroupby, ops: ['sum'], fields: [base], as: [totalField] },
    {
      type: 'formula',
      as: HISTOGRAM_PERCENT,
      expr: `datum.${totalField} > 0 ? datum.${base} / datum.${totalField} : 0`,
    },
    {
      type: 'formula',
      as: HISTOGRAM_DENSITY,
      expr: `datum.${HISTOGRAM_PERCENT} / (datum.${HISTOGRAM_BIN_END} - datum.${HISTOGRAM_BIN_START})`,
    },
  ];
  if (options.cumulative) {
    transforms.push({
      type: 'window',
      sort: { field: HISTOGRAM_BIN_START },
      groupby: seriesFields,
      ops: ['sum', 'sum'],
      fields: [base, HISTOGRAM_PERCENT],
      as: [HISTOGRAM_CUMULATIVE_COUNT, HISTOGRAM_CUMULATIVE_PERCENT],
      frame: [null, 0],
    });
  }
  transforms.push({ type: 'formula', as: HISTOGRAM_VALUE, expr: `datum.${getHistogramValueField(options)}` });
  return transforms;
};

/**
 * Gets the transforms that set each bar's bottom and top, stacking series when needed.
 * @param options - histogram spec options
 * @returns transforms
 */
export const getHistogramStackTransforms = (options: HistogramSpecOptions): Transforms[] => {
  const seriesFields = getHistogramSeriesFields(options);
  if (isHistogramStacked(options)) {
    const orderField = `${options.name}_seriesOrder`;
    return [
      // stack series in the color scale's order so segments match the legend
      { type: 'formula', as: orderField, expr: `indexof(domain('${COLOR_SCALE}'), datum.${seriesFields[0]})` },
      {
        type: 'stack',
        groupby: [HISTOGRAM_BIN_START],
        field: HISTOGRAM_VALUE,
        sort: { field: orderField },
        as: [HISTOGRAM_Y0, HISTOGRAM_Y1],
      },
      {
        type: 'joinaggregate',
        groupby: [HISTOGRAM_BIN_START],
        ops: ['max'],
        fields: [HISTOGRAM_Y1],
        as: [getHistogramStackTopField(options.name)],
      },
    ];
  }
  return [
    { type: 'formula', as: HISTOGRAM_Y0, expr: '0' },
    { type: 'formula', as: HISTOGRAM_Y1, expr: `datum.${HISTOGRAM_VALUE}` },
  ];
};

/**
 * Gets the field that holds the top of a bin's stack.
 * @param name - histogram name
 * @returns field name
 */
export const getHistogramStackTopField = (name: string): string => `${name}_stackTop`;

/**
 * Gets the transform that gives every bin row a unique id.
 * @param options - histogram spec options
 * @returns transforms
 */
export const getHistogramIdTransforms = (options: HistogramSpecOptions): Transforms[] => {
  const { idKey, name } = options;
  const keyFields = [
    HISTOGRAM_BIN_START,
    ...(isHistogram2D(options) ? [HISTOGRAM_Y_BIN_START] : []),
    ...getHistogramSeriesFields(options),
  ];
  const expr = [`'${name}'`, ...keyFields.map((field) => `datum.${field}`)].join(` + '|' + `);
  return [{ type: 'formula', as: idKey, expr }, ...getSeriesIdTransform(getHistogramSeriesFields(options))];
};

/**
 * Gets the data source with one row per bin and series of a 1D histogram.
 * @param options - histogram spec options
 * @returns SourceData
 */
export const getHistogram1DBinsData = (options: HistogramSpecOptions): SourceData => {
  const valuesData = getHistogramValuesDataName(options.name);
  const binning = getHistogramXBinning(options);
  const seriesFields = getHistogramSeriesFields(options);
  return {
    name: getHistogramBinsDataName(options.name),
    source: valuesData,
    transform: [
      ...getBinTransforms(binning, valuesData, false),
      getHistogramAggregateTransform(options, [getBinKeyField(binning), ...seriesFields]),
      // bins without rows are drawn at zero height so gaps in the distribution stay visible
      {
        type: 'impute',
        field: HISTOGRAM_COUNT,
        key: getBinKeyField(binning),
        keyvals: { signal: getBinStartsExpr(binning) },
        groupby: seriesFields,
        method: 'value',
        value: 0,
      },
      ...(isAnchored(binning)
        ? getAnchoredBinEdgeTransforms(binning)
        : [{ type: 'formula' as const, as: HISTOGRAM_BIN_END, expr: getBinEndExpr(binning) }]),
      ...getHistogramImputedSumTransforms(options),
      ...getHistogramValueTransforms(options),
      ...getHistogramStackTransforms(options),
      ...getHistogramDodgeTransforms(options),
      ...getHistogramIdTransforms(options),
      { type: 'collect', sort: { field: [HISTOGRAM_BIN_START, ...seriesFields] } },
    ],
  };
};

/**
 * Gets the data source with one row per non-empty cell of a 2D histogram.
 * @param options - histogram spec options
 * @returns SourceData
 */
export const getHistogram2DBinsData = (options: HistogramSpecOptions): SourceData => {
  const valuesData = getHistogramValuesDataName(options.name);
  const totalField = `${options.name}_total`;
  const base = getHistogramBaseField(options);
  return {
    name: getHistogramBinsDataName(options.name),
    source: valuesData,
    transform: [
      ...getBinTransforms(getHistogramXBinning(options), valuesData),
      ...getBinTransforms(getHistogramYBinning(options), valuesData),
      getHistogramAggregateTransform(options, [
        HISTOGRAM_BIN_START,
        HISTOGRAM_BIN_END,
        HISTOGRAM_Y_BIN_START,
        HISTOGRAM_Y_BIN_END,
      ]),
      { type: 'joinaggregate', ops: ['sum'], fields: [base], as: [totalField] },
      {
        type: 'formula',
        as: HISTOGRAM_PERCENT,
        expr: `datum.${totalField} > 0 ? datum.${base} / datum.${totalField} : 0`,
      },
      ...getHistogramIdTransforms(options),
    ],
  };
};

/**
 * Adds the histogram's data sources.
 *
 * NOTE: this function mutates the data array so it should only be called from a produce function
 * @param data - spec data
 * @param options - histogram spec options
 */
export const addHistogramData = (data: Data[], options: HistogramSpecOptions): void => {
  data.push(getHistogramValuesData(options));
  if (isHistogramDodged(options)) data.push(getHistogramSeriesData(options));
  data.push(isHistogram2D(options) ? getHistogram2DBinsData(options) : getHistogram1DBinsData(options));
  const curve = getHistogramDensityCurveData(options);
  if (curve) data.push(curve);
};

/**
 * Gets the transform that sets `sum` to zero on bins filled in without rows.
 * @param options - histogram spec options
 * @returns transforms
 */
export const getHistogramImputedSumTransforms = ({ weight }: HistogramSpecOptions): Transforms[] =>
  weight
    ? [{ type: 'formula', as: HISTOGRAM_SUM, expr: `isValid(datum.${HISTOGRAM_SUM}) ? datum.${HISTOGRAM_SUM} : 0` }]
    : [];

/**
 * Gets the name of the data source that lists the visible series in legend order.
 * @param name - histogram name
 * @returns data name
 */
export const getHistogramSeriesDataName = (name: string): string => `${name}_series`;

/**
 * Gets the data source that lists the visible series in the color scale's order, for dodging.
 * @param options - histogram spec options
 * @returns SourceData
 */
export const getHistogramSeriesData = (options: HistogramSpecOptions): SourceData => {
  const [series] = getHistogramSeriesFields(options);
  const orderField = `${options.name}_seriesOrder`;
  return {
    name: getHistogramSeriesDataName(options.name),
    source: getHistogramValuesDataName(options.name),
    transform: [
      { type: 'aggregate', groupby: [series] },
      { type: 'formula', as: orderField, expr: `indexof(domain('${COLOR_SCALE}'), datum.${series})` },
      { type: 'collect', sort: { field: orderField } },
    ],
  };
};

/**
 * Gets the fields holding a dodged bar's position among its bin's series.
 * @param name - histogram name
 * @returns [index field, count field]
 */
export const getHistogramDodgeFields = (name: string): [string, string] => [`${name}_dodgeIndex`, `${name}_dodgeCount`];

/**
 * Gets the transforms that place each dodged series within its bin.
 * @param options - histogram spec options
 * @returns transforms
 */
export const getHistogramDodgeTransforms = (options: HistogramSpecOptions): Transforms[] => {
  if (!isHistogramDodged(options)) return [];
  const [series] = getHistogramSeriesFields(options);
  const seriesData = getHistogramSeriesDataName(options.name);
  const [indexField, countField] = getHistogramDodgeFields(options.name);
  return [
    { type: 'formula', as: indexField, expr: `indexof(pluck(data('${seriesData}'), '${series}'), datum.${series})` },
    { type: 'formula', as: countField, expr: `max(length(data('${seriesData}')), 1)` },
  ];
};

/**
 * Whether the histogram draws a density curve; it needs an unweighted 1D histogram with a known bin width.
 * @param options - histogram spec options
 * @returns boolean
 */
export const hasHistogramDensityCurve = (options: HistogramSpecOptions): boolean => {
  const { cumulative, densityCurve, weight, yValue } = options;
  if (!densityCurve || weight || isHistogram2D(options)) return false;
  return !getValidBinEdges(options.binEdges) || yValue === 'density' || cumulative;
};

/**
 * Gets the name of the density curve data source.
 * @param name - histogram name
 * @returns data name
 */
export const getHistogramDensityCurveDataName = (name: string): string => `${name}_curveData`;

/**
 * Gets the expression that scales a density estimate to the bar heights.
 * @param options - histogram spec options
 * @returns expression string
 */
export const getDensityCurveScaleExpr = (options: HistogramSpecOptions): string => {
  if (options.cumulative || options.yValue === 'density') return '1';
  return `${getHistogramXBinning(options).paramsSignal}.step`;
};

/**
 * Gets the expression for the range the density curve is estimated over: the binned range.
 * @param options - histogram spec options
 * @returns expression string
 */
export const getDensityCurveExtentExpr = (options: HistogramSpecOptions): string => {
  const binning = getHistogramXBinning(options);
  if (binning.binEdges) return JSON.stringify([binning.binEdges[0], binning.binEdges.at(-1)]);
  const p = binning.paramsSignal;
  if (isAnchored(binning)) {
    const [first, last] = getAnchoredBinIndexBoundsExprs(binning);
    const anchor = binning.anchor;
    return `isValid(${p}) && ${p}.step > 0 ? [${anchor} + ${p}.step * ${first}, ${anchor} + ${p}.step * (${last} + 1)] : [0, 1]`;
  }
  const end = `${p}.start + ceil((${p}.stop - ${p}.start) / ${p}.step - 1e-9) * ${p}.step`;
  return `isValid(${p}) && isFinite(${p}.start) && ${p}.step > 0 ? [${p}.start, ${end}] : [0, 1]`;
};

/**
 * Gets the data source for the density curve, one estimate per series unless series are stacked.
 * @param options - histogram spec options
 * @returns SourceData or undefined
 */
export const getHistogramDensityCurveData = (options: HistogramSpecOptions): SourceData | undefined => {
  if (!hasHistogramDensityCurve(options)) return undefined;
  const densityField = `${options.name}_density`;
  return {
    name: getHistogramDensityCurveDataName(options.name),
    source: getHistogramValuesDataName(options.name),
    transform: [
      {
        type: 'kde',
        field: options.metric,
        groupby: isHistogramStacked(options) ? [] : getHistogramSeriesFields(options),
        extent: { signal: getDensityCurveExtentExpr(options) },
        steps: 200,
        cumulative: options.cumulative,
        counts: options.yValue === 'count',
        as: [HISTOGRAM_CURVE_X, densityField],
      },
      { type: 'formula', as: HISTOGRAM_CURVE_Y, expr: `datum.${densityField} * ${getDensityCurveScaleExpr(options)}` },
    ],
  };
};
