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
import { View, expressionFunction, parse } from 'vega';

import {
  CHART_SIZE_HOVER_STROKE_WIDTH,
  CHART_SIZE_STROKE_WIDTH,
  COLOR_SCALE,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DEFAULT_OPACITY_RULE,
  DEFAULT_STROKE_WIDTH_RULE,
  DEFAULT_TIME_DIMENSION,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  FADE_FACTOR,
  FILTERED_TABLE,
  MARK_ID,
  SERIES_ID,
  TABLE,
} from '@spectrum-charts/core-s2/constants';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { getSeriesFacet } from '../marks/markUtils.js';
import { AxisOptions, LineSpecOptions, MetricRangeOptions, MetricRangeSpecOptions } from '../types/index.js';
import {
  applyMetricRangeOptionDefaults,
  getMetricRangeData,
  getMetricRangeGroupMarks,
  getMetricRangeMark,
} from './metricRangeUtils.js';

const defaultMetricRangeOptions: MetricRangeOptions = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
};

const defaultMetricRangeSpecOptions: MetricRangeSpecOptions = {
  chartInspects: [],
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  name: 'line0MetricRange0',
};

const defaultLineOptions: LineSpecOptions = {
  connectAlternateSegments: true,
  chartActionBars: [],
  chartPopovers: [],
  chartInspects: [],
  color: DEFAULT_COLOR,
  colorScheme: DEFAULT_COLOR_SCHEME,
  dimension: DEFAULT_TIME_DIMENSION,
  forecasts: [],
  gradient: false,
  hasOnClick: false,
  hasOnContextMenu: false,
  idKey: MARK_ID,
  index: 0,
  interactiveMarkName: undefined,
  lineDirectLabels: [],
  linePointAnnotations: [],
  lineType: { value: 'solid' },
  markType: 'line',
  metric: DEFAULT_METRIC,
  metricRanges: [defaultMetricRangeOptions],
  name: 'line0',
  opacity: { value: 1 },
  popoverMarkName: undefined,
  scaleType: 'time',
  trendlines: [],
  lineCap: 'round',
  interpolate: undefined,
  dimensionHover: false,
  showHoverLabel: true,
};

const basicMetricRangeMarks = [
  {
    name: 'line0MetricRange0_line',
    description: 'line0MetricRange0_line',
    type: 'line',
    from: {
      data: 'line0MetricRange0_facet',
    },
    interactive: false,
    encode: {
      enter: {
        strokeCap: { value: 'round' },
      },
      update: {
        y: [{ scale: 'yLinear', field: 'metric' }],
        stroke: { scale: COLOR_SCALE, field: 'series' },
        strokeDash: { value: [3, 4] },
        strokeOpacity: DEFAULT_OPACITY_RULE,
        x: {
          scale: 'xTime',
          field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
        },
        defined: { signal: 'isValid(datum["metric"]) && isFinite(datum["metric"])' },
        opacity: [
          {
            test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
            signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
          },
          {
            test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
            signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
          },
          DEFAULT_OPACITY_RULE,
        ],
        strokeWidth: [
          {
            test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
            signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
          },
          {
            test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
            signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
          },
          DEFAULT_STROKE_WIDTH_RULE,
        ],
      },
    },
  },
  {
    name: 'line0MetricRange0_area',
    description: 'line0MetricRange0_area',
    type: 'area',
    from: {
      data: 'line0MetricRange0_facet',
    },
    interactive: false,
    encode: {
      update: {
        tooltip: undefined,
        fill: { scale: COLOR_SCALE, field: 'series' },
        y: [{ scale: 'yLinear', field: 'metricStart' }],
        y2: [{ scale: 'yLinear', field: 'metricEnd' }],
        defined: {
          signal:
            'isValid(datum["metricStart"]) && isFinite(datum["metricStart"]) && isValid(datum["metricEnd"]) && isFinite(datum["metricEnd"])',
        },
        cursor: undefined,
        x: { scale: 'xTime', field: DEFAULT_TRANSFORMED_TIME_DIMENSION },
        fillOpacity: { value: 0.2 },
        opacity: [DEFAULT_OPACITY_RULE],
      },
    },
  },
];

describe('applyMetricRangePropDefaults', () => {
  test('applies defaults', () => {
    expect(applyMetricRangeOptionDefaults({ metricEnd: 'metricStart', metricStart: 'metricEnd' }, 'line0', 0)).toEqual({
      chartInspects: [],
      displayOnHover: false,
      lineType: 'dashed',
      lineWidth: 'S',
      name: 'line0MetricRange0',
      rangeOpacity: 0.2,
      metricEnd: 'metricStart',
      metricStart: 'metricEnd',
      metric: 'value',
    });
  });
  test('skips assigned values', () => {
    expect(
      applyMetricRangeOptionDefaults(
        {
          lineType: 'solid',
          lineWidth: 'L',
          metricEnd: 'metricStart',
          metricStart: 'metricEnd',
          metric: 'testMetric',
          rangeOpacity: 0.5,
          displayOnHover: true,
        },
        'line0',
        0
      )
    ).toEqual({
      chartInspects: [],
      displayOnHover: true,
      lineType: 'solid',
      lineWidth: 'L',
      name: 'line0MetricRange0',
      rangeOpacity: 0.5,
      metric: 'testMetric',
      metricEnd: 'metricStart',
      metricStart: 'metricEnd',
    });
  });
});

describe('getMetricRangeMark', () => {
  test.each([false, true])(
    'range geometry follows its parent scale through hover and resize (dual=%s)',
    async (dualMetricAxis) => {
      Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
      expressionFunction('rscContainerWidth', (width: number) => width);
      const data = ['A', 'B'].flatMap((series, seriesIndex) =>
        [0, 1, 2, 3].map((index) => ({
          series,
          timestamp: Date.UTC(2026, 0, index + 1),
          value: (10 + index * 5) * (seriesIndex ? 100 : 1),
          lower: (8 + index * 5) * (seriesIndex ? 100 : 1),
          upper: index === 1 ? (dualMetricAxis ? null : Infinity) : (12 + index * 5) * (seriesIndex ? 100 : 1),
          isForecasted: index >= 2,
          pointMarked: true,
          label: `${series}: ${index}`,
        }))
      );
      const spec = buildSpec({
        data,
        legends: [{ highlight: true }],
        axes: [
          { position: 'left', name: dualMetricAxis ? undefined : 'custom', range: [0, 25] },
          ...(dualMetricAxis ? [{ position: 'right', range: [0, 2500] } satisfies AxisOptions] : []),
        ],
        marks: [
          {
            markType: 'line',
            name: 'testLine',
            color: 'series',
            dimension: 'timestamp',
            metricAxis: dualMetricAxis ? undefined : 'custom',
            dualMetricAxis,
            chartInspects: [{}],
            staticPoint: 'pointMarked',
            metricRanges: [{ metricStart: 'lower', metricEnd: 'upper', displayOnHover: true }],
          },
        ],
      });
      const view = new View(parse(spec), { renderer: 'none' }).insert(TABLE, data);
      try {
        await view.runAsync();
        expect((await view.toSVG()).includes('class="mark-area role-mark testLineMetricRange0_area"')).toBe(false);
        for (const [width, height] of [
          [400, 240],
          [600, 320],
        ]) {
          await view.width(width).height(height).resize().runAsync();
          for (const series of dualMetricAxis ? ['A', 'B'] : ['A']) {
            await view.signal(CONTROLLED_HIGHLIGHTED_SERIES, series).runAsync();
            const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
            const path = svg.querySelector('.testLineMetricRange0_area path')?.getAttribute('d');
            const scale = dualMetricAxis ? `yLinear${series === 'A' ? 'Primary' : 'Secondary'}` : 'custom';
            expect(path).toBeTruthy();
            expect(path).not.toContain('NaN');
            expect(path?.match(/M/g)).toHaveLength(2);
            expect(Number(path?.match(/^M0,([^L]+)/)?.[1])).toBeCloseTo(view.scale(scale)(series === 'A' ? 8 : 800), 3);
            expect(svg.querySelector('.testLineMetricRange0_group')?.getAttribute('clip-path')).toMatch(/^url\(#/);
          }
        }
      } finally {
        view.finalize();
      }
    }
  );

  test('creates MetricRange mark from basic input', () => {
    expect(getMetricRangeMark(defaultLineOptions, defaultMetricRangeSpecOptions)).toEqual(basicMetricRangeMarks);
  });

  test('keeps center-line opacity independent and interpolates the band like its parent', () => {
    const [line, area] = getMetricRangeMark(defaultLineOptions, { ...defaultMetricRangeSpecOptions, lineOpacity: 0.5 });
    expect(line.encode?.update?.strokeOpacity).toEqual({ value: 0.5 });
    expect(area.encode?.update?.fillOpacity).toEqual({ value: 0.2 });
  });

  test('boundary line opacity stays the static instant-rule array even when the parent line is animated', () => {
    // the boundary line renders under `${metricRangeName}_line`, which has no `_hoverFractionData` of
    // its own — getMetricRangeMark forces isHoverAnimate: false for exactly this reason, otherwise this
    // would reference a data source that was only ever created for the parent line's name
    const [lineMark] = getMetricRangeMark(
      { ...defaultLineOptions, interactiveMarkName: 'line0', isHoverAnimate: true },
      defaultMetricRangeSpecOptions
    );
    expect(Array.isArray((lineMark as { encode: { update: { opacity: unknown } } }).encode.update.opacity)).toBe(true);
  });
});

describe('getMetricRangeMark draw-in', () => {
  test('boundary line does not reference draw-in signals when the parent line draws in', () => {
    const marks = getMetricRangeMark({ ...defaultLineOptions, isDrawInAnimate: true }, defaultMetricRangeSpecOptions);
    expect(JSON.stringify(marks)).not.toContain('drawInAnim');
  });
});

describe('getMetricRangeGroupMarks', () => {
  test('creates MetricRange group mark from basic input', () => {
    expect(getMetricRangeGroupMarks(defaultLineOptions)).toEqual([
      {
        name: 'line0MetricRange0_group',
        type: 'group',
        clip: true,
        ...getSeriesFacet('line0MetricRange0_facet', FILTERED_TABLE, ['series']),
        marks: basicMetricRangeMarks,
      },
    ]);
  });
});

describe('getMetricRangeData', () => {
  test('creates metric range data from basic input', () => {
    const data = getMetricRangeData({
      ...defaultLineOptions,
      metricRanges: [{ ...defaultMetricRangeOptions, displayOnHover: true }],
    });
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty('name', 'line0MetricRange0_highlightedData');
  });
});
