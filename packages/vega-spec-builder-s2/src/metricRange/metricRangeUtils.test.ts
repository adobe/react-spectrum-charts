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
import {
  COLOR_SCALE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DEFAULT_OPACITY_RULE,
  DEFAULT_STROKE_WIDTH_RULE,
  DEFAULT_TIME_DIMENSION,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  FILTERED_TABLE,
  MARK_ID,
} from '@spectrum-charts/constants';

import { LineSpecOptions, MetricRangeOptions, MetricRangeSpecOptions } from '../types';
import {
  applyMetricRangeOptionDefaults,
  getMetricRangeData,
  getMetricRangeGroupMarks,
  getMetricRangeMark,
} from './metricRangeUtils';

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
        y: [{ scale: 'yLinear', field: 'metric' }],
        stroke: { scale: COLOR_SCALE, field: 'series' },
        strokeCap: { value: 'round' },
        strokeDash: { value: [3, 4] },
        strokeOpacity: DEFAULT_OPACITY_RULE,
      },
      update: {
        x: {
          scale: 'xTime',
          field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
        },
        opacity: [DEFAULT_OPACITY_RULE],
        strokeWidth: [DEFAULT_STROKE_WIDTH_RULE],
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
      enter: {
        tooltip: undefined,
        y: { scale: 'yLinear', field: 'metricStart' },
        y2: { scale: 'yLinear', field: 'metricEnd' },
        fill: { scale: COLOR_SCALE, field: 'series' },
      },
      update: {
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
  test('creates MetricRange mark from basic input', () => {
    expect(getMetricRangeMark(defaultLineOptions, defaultMetricRangeSpecOptions)).toEqual(basicMetricRangeMarks);
  });

  test('boundary line opacity stays the static instant-rule array even when the parent line is animated', () => {
    // the boundary line renders under `${metricRangeName}_line`, which has no `_hoverFractionData` of
    // its own — getMetricRangeMark forces isAnimate: false for exactly this reason, otherwise this
    // would reference a data source that was only ever created for the parent line's name
    const [lineMark] = getMetricRangeMark(
      { ...defaultLineOptions, interactiveMarkName: 'line0', isAnimate: true },
      defaultMetricRangeSpecOptions
    );
    expect(Array.isArray((lineMark as { encode: { update: { opacity: unknown } } }).encode.update.opacity)).toBe(
      true
    );
  });
});

describe('getMetricRangeGroupMarks', () => {
  test('creates MetricRange group mark from basic input', () => {
    expect(getMetricRangeGroupMarks(defaultLineOptions)).toEqual([
      {
        name: 'line0MetricRange0_group',
        type: 'group',
        clip: true,
        from: {
          facet: {
            name: 'line0MetricRange0_facet',
            data: FILTERED_TABLE,
            groupby: ['series'],
          },
        },
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
