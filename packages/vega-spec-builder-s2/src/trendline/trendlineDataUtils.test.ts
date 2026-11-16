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
import { Data, View, expressionFunction, parse } from 'vega';

import {
  DEFAULT_COLOR,
  DEFAULT_TIME_DIMENSION,
  FILTERED_TABLE,
  MS_PER_DAY,
  SERIES_ID,
  TRENDLINE_VALUE,
} from '@spectrum-charts/core-s2/constants';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { baseData } from '../specUtils.js';
import {
  addTableDataTransforms,
  addTrendlineData,
  getAggregateTrendlineData,
  getRegressionTrendlineData,
  getTrendlineStatisticalTransforms,
} from './trendlineDataUtils.js';
import { defaultLineOptions, defaultTrendlineOptions } from './trendlineTestUtils.js';

const getDefaultData = (): Data[] => JSON.parse(JSON.stringify(baseData));

beforeAll(() => {
  Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
  expressionFunction('rscContainerWidth', () => 400);
});

test.each(['empty', 'all-null'])('precomputed %s fits leave the source chart intact', async (fit) => {
  const rows = [
    { series: 'A', datetime: 0, value: 1 },
    { series: 'A', datetime: 1000, value: 2 },
  ];
  const spec = buildSpec({
    data: rows,
    animations: false,
    marks: [
      {
        markType: 'line',
        color: 'series',
        trendlines: [{ data: fit === 'empty' ? [] : rows.map((row) => ({ ...row, value: null })) }],
      },
    ],
  });
  const view = new View(parse(JSON.parse(JSON.stringify(spec))), { renderer: 'none' }).insert('table', rows);
  try {
    await view.width(400).height(200).runAsync();
    const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
    expect(svg.querySelector('.line0 path')?.getAttribute('d')).toMatch(/^M/);
    for (const path of svg.querySelectorAll('.line0Trendline0 path')) {
      expect(path.getAttribute('d')).toBeNull();
    }
    expect(view.data('table').map((row) => row.value)).toEqual([1, 2]);
  } finally {
    view.finalize();
  }
});

test.each([
  { datetime: NaN, value: 1 },
  { datetime: null, value: 1 },
  { datetime: 0, value: Infinity },
  { datetime: 0 },
])('rejects invalid precomputed coordinates explicitly (%j)', (row) => {
  const data = getDefaultData();
  expect(() =>
    addTrendlineData(data, {
      ...defaultLineOptions,
      trendlines: [{ data: [row] }],
    })
  ).toThrow('finite numeric dimensions and finite or null metrics');
});

test('rejects interactive compositions for precomputed trends explicitly', () => {
  expect(() =>
    addTrendlineData(getDefaultData(), {
      ...defaultLineOptions,
      trendlines: [{ data: [], chartInspects: [{}] }],
    })
  ).toThrow('horizontal, noninteractive Line trendline');
});

test('precomputed Line trends retain gaps, parent dual scales, visibility and resize geometry', async () => {
  const rows = ['A', 'B'].flatMap((series, seriesIndex) =>
    [10, 20, 30].map((value, index) => ({
      series,
      timestamp: Date.UTC(2026, 0, index + 1),
      value: value * (seriesIndex ? 100 : 1),
    }))
  );
  const data = rows.map((row, index) => ({ ...row, value: index % 3 === 1 ? null : row.value }));
  const spec = buildSpec({
    data: rows,
    axes: [
      { position: 'left', range: [0, 30] },
      { position: 'right', range: [0, 3000] },
    ],
    legends: [{ highlight: false }],
    animations: false,
    marks: [
      {
        markType: 'line',
        name: 'testLine',
        dimension: 'timestamp',
        color: 'series',
        dualMetricAxis: true,
        chartInspects: [{}],
        trendlines: [{ data, displayOnHover: true }],
      },
    ],
  });
  const view = new View(parse(JSON.parse(JSON.stringify(spec))), { renderer: 'none' }).insert('table', rows);
  try {
    for (const height of [200, 320]) {
      for (const series of ['A', 'B']) {
        await view.width(400).height(height).signal('controlledHighlightedSeries', series).runAsync();
        const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
        const paths = svg.querySelectorAll('.testLineTrendline0 path');
        expect(paths).toHaveLength(1);
        const path = paths[0].getAttribute('d') ?? '';
        expect(path).not.toMatch(/NaN|Infinity/);
        expect(path.match(/M/g)).toHaveLength(2);
        expect(Number(path.match(/^M[^,]+,([\d.]+)/)?.[1])).toBeCloseTo((height * 2) / 3, 2);
      }
    }
    await view.signal('hiddenSeries', ['B']).runAsync();
    expect(view.data('testLineTrendline0_highResolutionData').map((row) => row.series)).toEqual(['A', 'A', 'A']);
    expect(view.data('table').map((row) => row.value)).toEqual([10, 20, 30, 1000, 2000, 3000]);
  } finally {
    view.finalize();
  }
});

describe('addTrendlineData()', () => {
  test('should add normalized dimension for regression trendline', () => {
    const trendlineData = getDefaultData();
    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'linear' }],
    });
    expect(trendlineData[0].transform).toHaveLength(4);
    expect(trendlineData[0].transform?.[1]).toStrictEqual({
      as: ['datetimeMin'],
      fields: ['datetime'],
      ops: ['min'],
      type: 'joinaggregate',
    });
    expect(trendlineData[0].transform?.[2]).toStrictEqual({
      as: 'datetimeNormalized',
      expr: `(datum.datetime - datum.datetimeMin + ${MS_PER_DAY}) / ${MS_PER_DAY}`,
      type: 'formula',
    });
  });

  test('should not add normalized dimension in not regression trendline', () => {
    const trendlineData = getDefaultData();
    addTrendlineData(trendlineData, defaultLineOptions);
    expect(trendlineData[0].transform).toHaveLength(1);
  });

  test('should add datasource for trendline', () => {
    const trendlineData = getDefaultData();
    expect(trendlineData).toHaveLength(2);
    addTrendlineData(trendlineData, defaultLineOptions);
    expect(trendlineData).toHaveLength(3);
    expect(trendlineData[2]).toStrictEqual({
      name: 'line0Trendline0_highResolutionData',
      source: FILTERED_TABLE,
      transform: [
        {
          type: 'filter',
          expr: 'isValid(datum["value"])',
        },
        {
          as: [TRENDLINE_VALUE, `${DEFAULT_TIME_DIMENSION}Min`, `${DEFAULT_TIME_DIMENSION}Max`],
          fields: ['value', DEFAULT_TIME_DIMENSION, DEFAULT_TIME_DIMENSION],
          groupby: ['series'],
          ops: ['mean', 'min', 'max'],
          type: 'aggregate',
        },
        {
          type: 'formula',
          expr: `datum.${DEFAULT_COLOR}`,
          as: SERIES_ID,
        },
      ],
    });
  });

  test('should add data sources for hover interactions if ChartInspect exists', () => {
    const trendlineData = getDefaultData();
    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ chartInspects: [{}] }],
    });
    expect(trendlineData).toHaveLength(7);
    expect(trendlineData[5]).toHaveProperty('name', 'line0_allTrendlineData');
    expect(trendlineData[6]).toHaveProperty('name', 'line0Trendline_highlightedData');
  });

  test('should add _highResolutionData if doing a regression method', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'linear' }],
    });
    expect(trendlineData).toHaveLength(3);
    expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
  });

  test('should add _params and _data if doing a regression method and there is an inspect on the trendline', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'linear', chartInspects: [{}] }],
    });
    expect(trendlineData).toHaveLength(7);
    expect(trendlineData[3]).toHaveProperty('name', 'line0Trendline0_params');
    expect(trendlineData[4]).toHaveProperty('name', 'line0Trendline0_data');
  });

  test('should add sort transform, then window trandform, and then dimension range filter transform for movingAverage', () => {
    const trendlineData = getDefaultData();
    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'movingAverage-3', dimensionRange: [1, 2] }],
    });
    expect(trendlineData).toHaveLength(3);
    expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_data');
    expect(trendlineData[2].transform).toHaveLength(4);
    expect(trendlineData[2].transform?.[0]).toHaveProperty('type', 'collect');
    expect(trendlineData[2].transform?.[1]).toHaveProperty('type', 'window');
    expect(trendlineData[2].transform?.[2]).toHaveProperty('type', 'filter');
    expect(trendlineData[2].transform?.[3]).toHaveProperty('type', 'filter');
  });

  test('should add filter transforms for regression method if trendline has excludeDataKey', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'linear', excludeDataKeys: ['exclude1', 'exclude2'] }],
    });
    expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
    expect(trendlineData[2].transform).toHaveLength(6);
    expect(trendlineData[2].transform?.[0]).toStrictEqual({
      type: 'filter',
      expr: '!datum.exclude1',
    });
    expect(trendlineData[2].transform?.[1]).toStrictEqual({
      type: 'filter',
      expr: '!datum.exclude2',
    });
  });

  test('should always include metric validity filter for regression method', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'linear' }],
    });
    expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
    expect(trendlineData[2].transform).toHaveLength(4);
    expect(trendlineData[2].transform?.[0]).toStrictEqual({
      type: 'filter',
      expr: 'isValid(datum["value"])',
    });
  });

  test('should filter regression output to prevent NaN trendline values from rendering', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'linear' }],
    });
    // transforms for _highResolutionData: inputFilter[0], regression[1], outputFilter[2], seriesId[3]
    expect(trendlineData[2].transform?.[1]).toHaveProperty('type', 'regression');
    expect(trendlineData[2].transform?.[2]).toStrictEqual({
      type: 'filter',
      expr: `isValid(datum["${TRENDLINE_VALUE}"])`,
    });
  });

  test('should add filter transforms for aggregate method if trendline has excludeDataKey', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'median', excludeDataKeys: ['exclude1', 'exclude2'] }],
    });
    expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
    expect(trendlineData[2].transform).toHaveLength(5);
    expect(trendlineData[2].transform?.[0]).toStrictEqual({
      type: 'filter',
      expr: '!datum.exclude1',
    });
    expect(trendlineData[2].transform?.[1]).toStrictEqual({
      type: 'filter',
      expr: '!datum.exclude2',
    });
  });

  test('should always include metric validity filter for aggregate method', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'median' }],
    });
    expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
    expect(trendlineData[2].transform).toHaveLength(3);
    expect(trendlineData[2].transform?.[0]).toStrictEqual({
      type: 'filter',
      expr: 'isValid(datum["value"])',
    });
  });

  test('should add filter transform for window method if trendline has excludeDataKey', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'movingAverage-2', excludeDataKeys: ['exclude1', 'exclude2'] }],
    });
    expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_data');
    expect(trendlineData[2].transform).toHaveLength(5);
    expect(trendlineData[2].transform?.[0]).toStrictEqual({
      type: 'filter',
      expr: '!datum.exclude1',
    });
    expect(trendlineData[2].transform?.[1]).toStrictEqual({
      type: 'filter',
      expr: '!datum.exclude2',
    });
  });

  test('should always include trendline value validity filter for window method', () => {
    const trendlineData = getDefaultData();

    addTrendlineData(trendlineData, {
      ...defaultLineOptions,
      trendlines: [{ method: 'movingAverage-2' }],
    });
    expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_data');
    expect(trendlineData[2].transform).toHaveLength(3);
    expect(trendlineData[2].transform?.[2]).toStrictEqual({
      type: 'filter',
      expr: `isValid(datum["${TRENDLINE_VALUE}"])`,
    });
  });

  test('should add data sources for exponential or power trendlines on time scales', () => {
    const expData = getDefaultData();
    addTrendlineData(expData, { ...defaultLineOptions, trendlines: [{ method: 'exponential' }] });
    expect(expData).toHaveLength(3);
    expect(expData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');

    const powData = getDefaultData();
    addTrendlineData(powData, { ...defaultLineOptions, trendlines: [{ method: 'power' }] });
    expect(powData).toHaveLength(3);
    expect(powData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
  });

  test('should use isValid metric filter for all regression methods', () => {
    const linearData = getDefaultData();
    addTrendlineData(linearData, { ...defaultLineOptions, trendlines: [{ method: 'linear' }] });
    expect(linearData[2].transform?.[0]).toStrictEqual({ type: 'filter', expr: 'isValid(datum["value"])' });

    const expData = getDefaultData();
    addTrendlineData(expData, { ...defaultLineOptions, trendlines: [{ method: 'exponential' }] });
    expect(expData[2].transform?.[0]).toStrictEqual({ type: 'filter', expr: 'isValid(datum["value"])' });

    const powData = getDefaultData();
    addTrendlineData(powData, { ...defaultLineOptions, trendlines: [{ method: 'power' }] });
    expect(powData[2].transform?.[0]).toStrictEqual({ type: 'filter', expr: 'isValid(datum["value"])' });
  });
});

describe('getAggregateTrendlineData()', () => {
  test('should return one data source if there are not any interactive children', () => {
    const data = getAggregateTrendlineData(defaultLineOptions, defaultTrendlineOptions, [DEFAULT_COLOR]);
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
  });
  test('should return two data sources if there are interactive children', () => {
    const data = getAggregateTrendlineData(defaultLineOptions, { ...defaultTrendlineOptions, chartInspects: [{}] }, [
      DEFAULT_COLOR,
    ]);
    expect(data).toHaveLength(2);
    expect(data[1]).toHaveProperty('name', 'line0Trendline0_data');
  });
});

describe('getRegressionTrendlineData()', () => {
  test('should return one data source if there are not any interactive children', () => {
    const data = getRegressionTrendlineData(defaultLineOptions, defaultTrendlineOptions, [DEFAULT_COLOR]);
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
  });
  test('should return three data sources if there are interactive children', () => {
    const data = getRegressionTrendlineData(defaultLineOptions, { ...defaultTrendlineOptions, chartInspects: [{}] }, [
      DEFAULT_COLOR,
    ]);
    expect(data).toHaveLength(3);
    expect(data[1]).toHaveProperty('name', 'line0Trendline0_params');
    expect(data[2]).toHaveProperty('name', 'line0Trendline0_data');
  });
});

describe('getTrendlineStatisticalTransforms()', () => {
  test('should return the aggregate transform for aggregate methods', () => {
    const aggregateTransforms = getTrendlineStatisticalTransforms(
      defaultLineOptions,
      { ...defaultTrendlineOptions, method: 'average' },
      true
    );
    expect(aggregateTransforms).toHaveLength(1);
    expect(aggregateTransforms[0]).toHaveProperty('type', 'aggregate');
  });
  test('should return the regression transform for regression methods', () => {
    const aggregateTransforms = getTrendlineStatisticalTransforms(
      defaultLineOptions,
      { ...defaultTrendlineOptions, method: 'linear' },
      true
    );
    expect(aggregateTransforms).toHaveLength(1);
    expect(aggregateTransforms[0]).toHaveProperty('type', 'regression');
  });
  test('should return the window transform for window methods', () => {
    const aggregateTransforms = getTrendlineStatisticalTransforms(
      defaultLineOptions,
      { ...defaultTrendlineOptions, method: 'movingAverage-2' },
      true
    );
    expect(aggregateTransforms).toHaveLength(2);
    expect(aggregateTransforms[0]).toHaveProperty('type', 'collect');
    expect(aggregateTransforms[1]).toHaveProperty('type', 'window');
  });
  test('should append partial window filter transforms when hidePartialWindows is true', () => {
    const aggregateTransforms = getTrendlineStatisticalTransforms(
      defaultLineOptions,
      { ...defaultTrendlineOptions, method: 'movingAverage-7', hidePartialWindows: true },
      true
    );
    expect(aggregateTransforms).toHaveLength(4);
    expect(aggregateTransforms[2]).toHaveProperty('type', 'window');
    expect(aggregateTransforms[2]).toHaveProperty('ops', ['row_number']);
    expect(aggregateTransforms[3]).toHaveProperty('type', 'filter');
    expect(aggregateTransforms[3]).toHaveProperty('expr', 'datum._maRowNumber > 6');
  });
});

describe('addTableDataTransforms()', () => {
  test('should add normalized dimension transform if regression method and time scale type', () => {
    const transforms = addTableDataTransforms([], {
      ...defaultLineOptions,
      scaleType: 'time' as const,
      trendlines: [{ method: 'linear' }],
    });
    expect(transforms).toHaveLength(3);
    expect(transforms[0]).toHaveProperty('type', 'joinaggregate');
    expect(transforms[1]).toHaveProperty('type', 'formula');
    expect(transforms[2]).toHaveProperty('type', 'extent');
  });
  test('should add extent transforms if there are trendlines with regression methods', () => {
    const transforms = addTableDataTransforms([], {
      ...defaultLineOptions,
      scaleType: 'linear' as const,
      trendlines: [{ method: 'linear' }],
    });
    expect(transforms).toHaveLength(1);
    expect(transforms[0]).toHaveProperty('type', 'extent');
  });
  test('should not add any transforms if there are not any regression trendlines', () => {
    expect(
      addTableDataTransforms([], {
        ...defaultLineOptions,
        scaleType: 'linear' as const,
        trendlines: [{ method: 'average' }],
      })
    ).toHaveLength(0);
    expect(
      addTableDataTransforms([], {
        ...defaultLineOptions,
        scaleType: 'linear' as const,
        trendlines: [{ method: 'movingAverage-2' }],
      })
    ).toHaveLength(0);
  });
  test('should not add normalized dimension transform if it is not a time scale', () => {
    const transforms = addTableDataTransforms([], {
      ...defaultLineOptions,
      scaleType: 'linear' as const,
      trendlines: [{ method: 'linear' }],
    });
    expect(transforms).toHaveLength(1);
    expect(transforms[0]).toHaveProperty('type', 'extent');
  });
});
