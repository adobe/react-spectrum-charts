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
  HISTOGRAM_VALUE,
  HISTOGRAM_Y0,
  HISTOGRAM_Y1,
  HISTOGRAM_Y_BIN_END,
  HISTOGRAM_Y_BIN_START,
  MARK_ID,
  SERIES_ID,
} from '@spectrum-charts/core-s2/constants';

import { HistogramSpecOptions } from '../types/index.js';
import {
  addHistogramData,
  getAnchoredBinIndexBoundsExprs,
  getBinEndExpr,
  getBinStartsExpr,
  getBinTransforms,
  getCustomBinIndexExpr,
  getDefaultBinCountExpr,
  getDensityCurveExtentExpr,
  getDensityCurveScaleExpr,
  getHistogram1DBinsData,
  getHistogram2DBinsData,
  getHistogramAggregateTransform,
  getHistogramBaseField,
  getHistogramDensityCurveData,
  getHistogramDodgeTransforms,
  getHistogramIdTransforms,
  getHistogramSeriesData,
  getHistogramSeriesFields,
  getHistogramStackTransforms,
  getHistogramValueField,
  getHistogramValueTransforms,
  getHistogramValuesData,
  getHistogramXBinning,
  getHistogramYBinning,
  getUniformBinTransforms,
  getValidBinEdges,
  hasHistogramDensityCurve,
  isAnchored,
  isHistogramDodged,
  isHistogramStacked,
} from './histogramDataUtils.js';
import { colorSplitHistogramOptions, defaultHistogramOptions, histogram2DOptions } from './histogramTestUtils.js';

const getTransform = (transforms: Transforms[] | undefined, type: Transforms['type']) =>
  transforms?.find((transform) => transform.type === type);

describe('getHistogramValuesData()', () => {
  test('keeps only rows where the metric is a finite number', () => {
    expect(getHistogramValuesData(defaultHistogramOptions)).toStrictEqual({
      name: 'histogram0_values',
      source: FILTERED_TABLE,
      transform: [{ type: 'filter', expr: 'isNumber(datum.value) && isFinite(datum.value)' }],
    });
  });

  test('also requires a finite yMetric for 2D histograms', () => {
    const data = getHistogramValuesData(histogram2DOptions);
    expect(data.transform?.[0]).toHaveProperty(
      'expr',
      'isNumber(datum.value) && isFinite(datum.value) && isNumber(datum.y) && isFinite(datum.y)'
    );
  });
});

describe('getValidBinEdges()', () => {
  test('returns undefined without edges', () => {
    expect(getValidBinEdges()).toBeUndefined();
  });

  test('sorts, dedupes and drops non-finite edges', () => {
    expect(getValidBinEdges([10, 0, 5, 5, Number.NaN, Number.POSITIVE_INFINITY])).toStrictEqual([0, 5, 10]);
  });

  test('returns undefined when fewer than two edges remain', () => {
    expect(getValidBinEdges([1, 1, Number.NaN])).toBeUndefined();
  });
});

describe('getHistogramSeriesFields()', () => {
  test('returns the color key', () => {
    expect(getHistogramSeriesFields(colorSplitHistogramOptions)).toStrictEqual(['series']);
  });

  test('returns nothing for a static color', () => {
    expect(getHistogramSeriesFields(defaultHistogramOptions)).toStrictEqual([]);
  });

  test('ignores color for 2D histograms', () => {
    expect(getHistogramSeriesFields({ ...histogram2DOptions, color: 'series' })).toStrictEqual([]);
  });
});

describe('isHistogramStacked()', () => {
  test('stacks color-split series by default', () => {
    expect(isHistogramStacked(colorSplitHistogramOptions)).toBe(true);
  });

  test('does not stack overlaid series', () => {
    expect(isHistogramStacked({ ...colorSplitHistogramOptions, layout: 'overlaid' })).toBe(false);
  });

  test('does not stack a single series', () => {
    expect(isHistogramStacked(defaultHistogramOptions)).toBe(false);
  });
});

describe('getDefaultBinCountExpr()', () => {
  test('uses the Rice rule clamped between 5 and 50', () => {
    expect(getDefaultBinCountExpr('histogram0_values')).toBe(
      "max(5, min(50, ceil(2 * pow(length(data('histogram0_values')), 1 / 3))))"
    );
  });
});

describe('getUniformBinTransforms()', () => {
  test('bins over the data extent with the default bin count', () => {
    const transforms = getUniformBinTransforms(getHistogramXBinning(defaultHistogramOptions), 'histogram0_values');
    expect(transforms).toStrictEqual([
      { type: 'extent', field: 'value', signal: 'histogram0_extent' },
      {
        type: 'bin',
        field: 'value',
        extent: { signal: 'histogram0_extent' },
        maxbins: { signal: getDefaultBinCountExpr('histogram0_values') },
        nice: true,
        as: [HISTOGRAM_BIN_START, HISTOGRAM_BIN_END],
        signal: 'histogram0_binParams',
      },
      { type: 'filter', expr: `isFinite(datum.${HISTOGRAM_BIN_START})` },
    ]);
  });

  test('uses binCount as the maximum number of bins', () => {
    const transforms = getUniformBinTransforms(
      getHistogramXBinning({ ...defaultHistogramOptions, binCount: 12 }),
      'histogram0_values'
    );
    expect(getTransform(transforms, 'bin')).toHaveProperty('maxbins', 12);
  });

  test('uses binSize as the bin step', () => {
    const transforms = getUniformBinTransforms(
      getHistogramXBinning({ ...defaultHistogramOptions, binSize: 25 }),
      'histogram0_values'
    );
    expect(getTransform(transforms, 'bin')).toHaveProperty('step', 25);
  });

  test('bins over a custom extent without rounding it', () => {
    const transforms = getUniformBinTransforms(
      getHistogramXBinning({ ...defaultHistogramOptions, extent: [0, 95] }),
      'histogram0_values'
    );
    expect(getTransform(transforms, 'extent')).toBeUndefined();
    expect(getTransform(transforms, 'bin')).toHaveProperty('extent', [0, 95]);
    expect(getTransform(transforms, 'bin')).toHaveProperty('nice', false);
  });
});

describe('getCustomBinIndexExpr()', () => {
  test('finds the bin for two edges', () => {
    expect(getCustomBinIndexExpr('v', [0, 10])).toBe('v < 0 || v > 10 ? -1 : 0');
  });

  test('finds the bin for several edges', () => {
    expect(getCustomBinIndexExpr('v', [0, 5, 20, 50])).toBe('v < 0 || v > 50 ? -1 : v < 5 ? 0 : v < 20 ? 1 : 2');
  });
});

describe('custom bin edges', () => {
  const options = { ...defaultHistogramOptions, binEdges: [50, 0, 20] };

  test('bins with the sorted edges instead of the bin transform', () => {
    const data = getHistogram1DBinsData(options);
    expect(getTransform(data.transform, 'bin')).toBeUndefined();
    expect(data.transform?.slice(0, 4)).toStrictEqual([
      { type: 'formula', as: 'binStartIndex', expr: getCustomBinIndexExpr('datum.value', [0, 20, 50]) },
      { type: 'filter', expr: 'datum.binStartIndex >= 0' },
      { type: 'formula', as: HISTOGRAM_BIN_START, expr: '[0,20,50][datum.binStartIndex]' },
      { type: 'formula', as: HISTOGRAM_BIN_END, expr: '[0,20,50][datum.binStartIndex + 1]' },
    ]);
  });

  test('fills empty bins from the edges', () => {
    const binning = getHistogramXBinning(options);
    expect(getBinStartsExpr(binning)).toBe('[0,20]');
    expect(getBinEndExpr(binning)).toBe('[0,20,50][indexof([0,20,50], datum.binStart) + 1]');
  });
});

describe('getBinStartsExpr()', () => {
  test('lists every bin start from the bin parameters', () => {
    const expr = getBinStartsExpr(getHistogramXBinning(defaultHistogramOptions));
    expect(expr).toContain('isValid(histogram0_binParams)');
    expect(expr).toContain('sequence(histogram0_binParams.start');
    expect(expr).toContain(': []');
  });
});

describe('getHistogram1DBinsData()', () => {
  test('counts rows per bin and fills empty bins with zero', () => {
    const data = getHistogram1DBinsData(defaultHistogramOptions);
    expect(data.name).toBe('histogram0_bins');
    expect(data.source).toBe('histogram0_values');
    expect(getTransform(data.transform, 'aggregate')).toStrictEqual({
      type: 'aggregate',
      groupby: [HISTOGRAM_BIN_START],
      ops: ['count'],
      as: [HISTOGRAM_COUNT],
    });
    expect(getTransform(data.transform, 'impute')).toStrictEqual({
      type: 'impute',
      field: HISTOGRAM_COUNT,
      key: HISTOGRAM_BIN_START,
      keyvals: { signal: getBinStartsExpr(getHistogramXBinning(defaultHistogramOptions)) },
      groupby: [],
      method: 'value',
      value: 0,
    });
  });

  test('groups by the color key', () => {
    const data = getHistogram1DBinsData(colorSplitHistogramOptions);
    expect(getTransform(data.transform, 'aggregate')).toHaveProperty('groupby', [HISTOGRAM_BIN_START, 'series']);
    expect(getTransform(data.transform, 'impute')).toHaveProperty('groupby', ['series']);
  });

  test('sorts rows by bin', () => {
    const data = getHistogram1DBinsData(colorSplitHistogramOptions);
    expect(data.transform?.at(-1)).toStrictEqual({
      type: 'collect',
      sort: { field: [HISTOGRAM_BIN_START, 'series'] },
    });
  });
});

describe('getHistogramValueField()', () => {
  test.each([
    ['count', false, HISTOGRAM_COUNT],
    ['percent', false, HISTOGRAM_PERCENT],
    ['density', false, HISTOGRAM_DENSITY],
    ['count', true, HISTOGRAM_CUMULATIVE_COUNT],
    ['percent', true, HISTOGRAM_CUMULATIVE_PERCENT],
    ['density', true, HISTOGRAM_CUMULATIVE_PERCENT],
  ] as const)('yValue %s with cumulative %s plots %s', (yValue, cumulative, field) => {
    expect(getHistogramValueField({ ...defaultHistogramOptions, yValue, cumulative })).toBe(field);
  });
});

describe('getHistogramValueTransforms()', () => {
  test('computes percent and density from the total', () => {
    const transforms = getHistogramValueTransforms(defaultHistogramOptions);
    expect(transforms).toStrictEqual([
      { type: 'joinaggregate', groupby: [], ops: ['sum'], fields: [HISTOGRAM_COUNT], as: ['histogram0_total'] },
      {
        type: 'formula',
        as: HISTOGRAM_PERCENT,
        expr: 'datum.histogram0_total > 0 ? datum.count / datum.histogram0_total : 0',
      },
      { type: 'formula', as: HISTOGRAM_DENSITY, expr: 'datum.percent / (datum.binEnd - datum.binStart)' },
      { type: 'formula', as: HISTOGRAM_VALUE, expr: 'datum.count' },
    ]);
  });

  test('normalizes overlaid series by their own total', () => {
    const transforms = getHistogramValueTransforms({ ...colorSplitHistogramOptions, layout: 'overlaid' });
    expect(transforms[0]).toHaveProperty('groupby', ['series']);
  });

  test('normalizes stacked series by the overall total', () => {
    const transforms = getHistogramValueTransforms(colorSplitHistogramOptions);
    expect(transforms[0]).toHaveProperty('groupby', []);
  });

  test('accumulates counts and percents per series', () => {
    const transforms = getHistogramValueTransforms({ ...colorSplitHistogramOptions, cumulative: true });
    expect(getTransform(transforms, 'window')).toStrictEqual({
      type: 'window',
      sort: { field: HISTOGRAM_BIN_START },
      groupby: ['series'],
      ops: ['sum', 'sum'],
      fields: [HISTOGRAM_COUNT, HISTOGRAM_PERCENT],
      as: [HISTOGRAM_CUMULATIVE_COUNT, HISTOGRAM_CUMULATIVE_PERCENT],
      frame: [null, 0],
    });
  });
});

describe('getHistogramStackTransforms()', () => {
  test('starts every bar at zero without stacking', () => {
    expect(getHistogramStackTransforms(defaultHistogramOptions)).toStrictEqual([
      { type: 'formula', as: HISTOGRAM_Y0, expr: '0' },
      { type: 'formula', as: HISTOGRAM_Y1, expr: `datum.${HISTOGRAM_VALUE}` },
    ]);
  });

  test('stacks series within each bin and finds the top of each stack', () => {
    const transforms = getHistogramStackTransforms(colorSplitHistogramOptions);
    expect(transforms).toStrictEqual([
      { type: 'formula', as: 'histogram0_seriesOrder', expr: "indexof(domain('color'), datum.series)" },
      {
        type: 'stack',
        groupby: [HISTOGRAM_BIN_START],
        field: HISTOGRAM_VALUE,
        sort: { field: 'histogram0_seriesOrder' },
        as: [HISTOGRAM_Y0, HISTOGRAM_Y1],
      },
      {
        type: 'joinaggregate',
        groupby: [HISTOGRAM_BIN_START],
        ops: ['max'],
        fields: [HISTOGRAM_Y1],
        as: ['histogram0_stackTop'],
      },
    ]);
  });
});

describe('getHistogramIdTransforms()', () => {
  test('ids bins by their start', () => {
    expect(getHistogramIdTransforms(defaultHistogramOptions)).toStrictEqual([
      { type: 'formula', as: MARK_ID, expr: "'histogram0' + '|' + datum.binStart" },
    ]);
  });

  test('ids bins by start and series, and adds the series id', () => {
    expect(getHistogramIdTransforms(colorSplitHistogramOptions)).toStrictEqual([
      { type: 'formula', as: MARK_ID, expr: "'histogram0' + '|' + datum.binStart + '|' + datum.series" },
      { type: 'formula', as: SERIES_ID, expr: 'datum.series' },
    ]);
  });

  test('ids 2D cells by both bin starts', () => {
    expect(getHistogramIdTransforms(histogram2DOptions)[0]).toHaveProperty(
      'expr',
      "'histogram0' + '|' + datum.binStart + '|' + datum.yBinStart"
    );
  });
});

describe('getHistogram2DBinsData()', () => {
  test('bins both metrics and counts rows per cell', () => {
    const data = getHistogram2DBinsData({ ...histogram2DOptions, yBinCount: 4, yBinSize: 2, yExtent: [0, 8] });
    const bins = data.transform?.filter((transform) => transform.type === 'bin');
    expect(bins).toHaveLength(2);
    expect(bins?.[1]).toStrictEqual({
      type: 'bin',
      field: 'y',
      extent: [0, 8],
      maxbins: 4,
      step: 2,
      nice: false,
      as: [HISTOGRAM_Y_BIN_START, HISTOGRAM_Y_BIN_END],
      signal: 'histogram0_yBinParams',
    });
    expect(getTransform(data.transform, 'aggregate')).toHaveProperty('groupby', [
      HISTOGRAM_BIN_START,
      HISTOGRAM_BIN_END,
      HISTOGRAM_Y_BIN_START,
      HISTOGRAM_Y_BIN_END,
    ]);
    expect(getTransform(data.transform, 'impute')).toBeUndefined();
  });

  test('uses its own y extent signal', () => {
    expect(getHistogramYBinning(histogram2DOptions)).toHaveProperty('extentSignal', 'histogram0_yExtent');
  });
});

describe('addHistogramData()', () => {
  test('adds the values and bins data', () => {
    const data: Data[] = [];
    addHistogramData(data, defaultHistogramOptions);
    expect(data.map(({ name }) => name)).toStrictEqual(['histogram0_values', 'histogram0_bins']);
  });

  test('adds 2D bins data for a yMetric', () => {
    const data: Data[] = [];
    addHistogramData(data, histogram2DOptions);
    const aggregate = getTransform((data[1] as SourceData).transform, 'aggregate');
    expect(aggregate).toHaveProperty('groupby', [
      HISTOGRAM_BIN_START,
      HISTOGRAM_BIN_END,
      HISTOGRAM_Y_BIN_START,
      HISTOGRAM_Y_BIN_END,
    ]);
  });
});

describe('weight', () => {
  const weighted = { ...defaultHistogramOptions, weight: 'revenue' };

  test('sums the weight per bin alongside the row count', () => {
    expect(getHistogramBaseField(weighted)).toBe('sum');
    expect(getHistogramAggregateTransform(weighted, [HISTOGRAM_BIN_START])).toStrictEqual({
      type: 'aggregate',
      groupby: [HISTOGRAM_BIN_START],
      ops: ['count', 'sum'],
      fields: [null, 'revenue'],
      as: [HISTOGRAM_COUNT, 'sum'],
    });
  });

  test('zeroes the sum of empty bins and plots it', () => {
    const transforms = getHistogram1DBinsData(weighted).transform ?? [];
    expect(transforms).toContainEqual({ type: 'formula', as: 'sum', expr: 'isValid(datum.sum) ? datum.sum : 0' });
    expect(transforms).toContainEqual({ type: 'formula', as: HISTOGRAM_VALUE, expr: 'datum.sum' });
  });

  test('ignores rows without a finite weight', () => {
    expect(getHistogramValuesData(weighted).transform?.[0]).toHaveProperty(
      'expr',
      'isNumber(datum.value) && isFinite(datum.value) && isNumber(datum.revenue) && isFinite(datum.revenue)'
    );
  });
});

describe('binAnchor', () => {
  const anchored = getHistogramXBinning({ ...defaultHistogramOptions, binAnchor: 5 });

  test('counts bins in whole steps from the anchor, covering the whole range', () => {
    const transforms = getBinTransforms(anchored, 'histogram0_values');
    expect(getTransform(transforms, 'bin')).not.toHaveProperty('anchor');
    expect(transforms.slice(-3)).toStrictEqual([
      {
        type: 'formula',
        as: 'binStartIndex',
        expr: 'clamp(floor((datum.value - 5) / histogram0_binParams.step), floor((histogram0_extent[0] - 5) / histogram0_binParams.step), max(floor((histogram0_extent[0] - 5) / histogram0_binParams.step), ceil((histogram0_extent[1] - 5) / histogram0_binParams.step) - 1))',
      },
      { type: 'formula', as: HISTOGRAM_BIN_START, expr: '5 + histogram0_binParams.step * datum.binStartIndex' },
      { type: 'formula', as: HISTOGRAM_BIN_END, expr: '5 + histogram0_binParams.step * (datum.binStartIndex + 1)' },
    ]);
  });

  test('fills empty bins by index', () => {
    expect(getBinStartsExpr(anchored)).toContain('sequence(floor((histogram0_extent[0] - 5)');
    const data = getHistogram1DBinsData({ ...defaultHistogramOptions, binAnchor: 5 });
    expect(getTransform(data.transform, 'impute')).toHaveProperty('key', 'binStartIndex');
    expect(getTransform(data.transform, 'aggregate')).toHaveProperty('groupby', ['binStartIndex']);
  });

  test('uses a custom extent for the range', () => {
    const [first] = getAnchoredBinIndexBoundsExprs(
      getHistogramXBinning({ ...defaultHistogramOptions, binAnchor: 5, extent: [0, 100] })
    );
    expect(first).toBe('floor((0 - 5) / histogram0_binParams.step)');
  });

  test('is ignored with custom bin edges', () => {
    expect(isAnchored(getHistogramXBinning({ ...defaultHistogramOptions, binAnchor: 5, binEdges: [0, 10] }))).toBe(
      false
    );
  });
});

describe('dodged layout', () => {
  const dodged = { ...colorSplitHistogramOptions, layout: 'dodged' as const };

  test('only dodges color-split series', () => {
    expect(isHistogramDodged(dodged)).toBe(true);
    expect(isHistogramDodged({ ...defaultHistogramOptions, layout: 'dodged' })).toBe(false);
  });

  test('lists visible series in legend order', () => {
    expect(getHistogramSeriesData(dodged)).toStrictEqual({
      name: 'histogram0_series',
      source: 'histogram0_values',
      transform: [
        { type: 'aggregate', groupby: ['series'] },
        { type: 'formula', as: 'histogram0_seriesOrder', expr: "indexof(domain('color'), datum.series)" },
        { type: 'collect', sort: { field: 'histogram0_seriesOrder' } },
      ],
    });
  });

  test('places each series within its bin', () => {
    expect(getHistogramDodgeTransforms(dodged)).toStrictEqual([
      {
        type: 'formula',
        as: 'histogram0_dodgeIndex',
        expr: "indexof(pluck(data('histogram0_series'), 'series'), datum.series)",
      },
      { type: 'formula', as: 'histogram0_dodgeCount', expr: "max(length(data('histogram0_series')), 1)" },
    ]);
    expect(getHistogramDodgeTransforms(colorSplitHistogramOptions)).toStrictEqual([]);
  });

  test('adds the series data before the bins', () => {
    const data: Data[] = [];
    addHistogramData(data, dodged);
    expect(data.map(({ name }) => name)).toStrictEqual(['histogram0_values', 'histogram0_series', 'histogram0_bins']);
  });
});

describe('density curve', () => {
  const curve = { ...defaultHistogramOptions, densityCurve: true };

  const curveCases: [Partial<HistogramSpecOptions>, boolean][] = [
    [{}, true],
    [{ densityCurve: false }, false],
    [{ weight: 'revenue' }, false],
    [{ yMetric: 'y' }, false],
    [{ binEdges: [0, 10, 50] }, false],
    [{ binEdges: [0, 10, 50], yValue: 'density' }, true],
    [{ binEdges: [0, 10, 50], cumulative: true }, true],
  ];
  test.each(curveCases)('with %o draws a curve: %s', (overrides, expected) => {
    expect(hasHistogramDensityCurve({ ...curve, ...overrides })).toBe(expected);
  });

  test('scales the estimate to the bar heights', () => {
    expect(getDensityCurveScaleExpr(curve)).toBe('histogram0_binParams.step');
    expect(getDensityCurveScaleExpr({ ...curve, yValue: 'density' })).toBe('1');
    expect(getDensityCurveScaleExpr({ ...curve, cumulative: true })).toBe('1');
  });

  test('estimates over the binned range', () => {
    expect(getDensityCurveExtentExpr({ ...curve, binEdges: [50, 0, 10] })).toBe('[0,50]');
    expect(getDensityCurveExtentExpr(curve)).toContain('[histogram0_binParams.start, ');
  });

  test('builds a kde of smoothed counts for count bars', () => {
    expect(getHistogramDensityCurveData(curve)).toStrictEqual({
      name: 'histogram0_curveData',
      source: 'histogram0_values',
      transform: [
        {
          type: 'kde',
          field: 'value',
          groupby: [],
          extent: { signal: getDensityCurveExtentExpr(curve) },
          steps: 200,
          cumulative: false,
          counts: true,
          as: [HISTOGRAM_CURVE_X, 'histogram0_density'],
        },
        { type: 'formula', as: HISTOGRAM_CURVE_Y, expr: 'datum.histogram0_density * histogram0_binParams.step' },
      ],
    });
  });

  test('estimates each overlaid series separately', () => {
    const data = getHistogramDensityCurveData({
      ...colorSplitHistogramOptions,
      densityCurve: true,
      layout: 'overlaid',
    });
    expect(data?.transform?.[0]).toHaveProperty('groupby', ['series']);
  });

  test('is added after the bins', () => {
    const data: Data[] = [];
    addHistogramData(data, curve);
    expect(data.at(-1)?.name).toBe('histogram0_curveData');
  });
});
