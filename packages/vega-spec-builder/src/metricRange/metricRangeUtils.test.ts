/*
 * Copyright 2023 Adobe. All rights reserved.
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
  BACKGROUND_COLOR,
  COLOR_SCALE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DEFAULT_OPACITY_RULE,
  DEFAULT_TIME_DIMENSION,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  FILTERED_TABLE,
  MARK_ID,
} from '@spectrum-charts/constants';

import { LineSpecOptions, MetricRangeOptions, MetricRangeSpecOptions } from '../types';
import {
  applyMetricRangeOptionDefaults,
  getMetricRangeAllHoverPoints,
  getMetricRangeData,
  getMetricRangeGroupMarks,
  getMetricRangeHoverPoints,
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
  chartTooltips: [],
  hoverPoint: false,
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
  chartTooltips: [],
  color: DEFAULT_COLOR,
  colorScheme: DEFAULT_COLOR_SCHEME,
  dimension: DEFAULT_TIME_DIMENSION,
  hasOnClick: false,
  linePointAnnotations: [],
  idKey: MARK_ID,
  index: 0,
  interactiveMarkName: undefined,
  lineType: { value: 'solid' },
  markType: 'line',
  metric: DEFAULT_METRIC,
  metricRanges: [defaultMetricRangeOptions],
  name: 'line0',
  opacity: { value: 1 },
  popoverMarkName: undefined,
  scaleType: 'time',
  trendlines: [],
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
        strokeDash: { value: [3, 4] },
        strokeOpacity: DEFAULT_OPACITY_RULE,
        strokeWidth: { value: 1.5 },
        defined: { signal: 'isValid(datum["metric"])' },
      },
      update: {
        x: {
          scale: 'xTime',
          field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
        },
        opacity: [DEFAULT_OPACITY_RULE],
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
        defined: { signal: 'isValid(datum["metricStart"]) || isValid(datum["metricEnd"])' },
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
      chartTooltips: [],
      displayOnHover: false,
      hoverPoint: false,
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
          hoverPoint: true,
        },
        'line0',
        0
      )
    ).toEqual({
      chartTooltips: [],
      displayOnHover: true,
      hoverPoint: true,
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
  test('creates MetricRange mark with line opacity', () => {
    const [lineMark] = getMetricRangeMark(defaultLineOptions, {
      ...defaultMetricRangeSpecOptions,
      lineOpacity: { value: 0.2 }
    });
    expect(lineMark.encode?.enter?.strokeOpacity).toEqual({ value: 0.2 });
  });
  describe('defined encoding (creates gaps when metric values are null/undefined)', () => {
    test('line and area mark have defined set in enter so null metric values creates a break', () => {
      const [lineMark, areaMark] = getMetricRangeMark(defaultLineOptions, defaultMetricRangeSpecOptions);
      const definedLineSignal = `isValid(datum["${defaultMetricRangeSpecOptions.metric}"])`;
      expect(lineMark.encode?.enter?.defined).toEqual({ signal: definedLineSignal });

      const definedAreaSignal = `isValid(datum["${defaultMetricRangeSpecOptions.metricStart}"]) || isValid(datum["${defaultMetricRangeSpecOptions.metricEnd}"])`;
      expect(areaMark.encode?.enter?.defined).toEqual({ signal: definedAreaSignal });
    });
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

  test('always returns only group marks (hover points are added separately via getMetricRangeAllHoverPoints)', () => {
    const interactiveLineOptions = {
      ...defaultLineOptions,
      interactiveMarkName: 'line0',
      metricRanges: [{ ...defaultMetricRangeOptions, hoverPoint: true }],
    };
    const marks = getMetricRangeGroupMarks(interactiveLineOptions);
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toBe('group');
  });
});

describe('getMetricRangeAllHoverPoints', () => {
  test('returns empty array when hoverPoint is false', () => {
    const interactiveLineOptions = { ...defaultLineOptions, interactiveMarkName: 'line0' };
    expect(getMetricRangeAllHoverPoints(interactiveLineOptions)).toHaveLength(0);
  });

  test('returns two symbol marks when hoverPoint is true and interactiveMarkName is set', () => {
    const interactiveLineOptions = {
      ...defaultLineOptions,
      interactiveMarkName: 'line0',
      metricRanges: [{ ...defaultMetricRangeOptions, hoverPoint: true }],
    };
    const marks = getMetricRangeAllHoverPoints(interactiveLineOptions);
    expect(marks).toHaveLength(2);
    expect(marks[0].name).toBe('line0MetricRange0_pointBackground');
    expect(marks[1].name).toBe('line0MetricRange0_point_highlight');
  });

  test('returns empty array when interactiveMarkName is undefined', () => {
    const lineOptions = {
      ...defaultLineOptions,
      metricRanges: [{ ...defaultMetricRangeOptions, hoverPoint: true }],
    };
    expect(getMetricRangeAllHoverPoints(lineOptions)).toHaveLength(0);
  });
});

describe('getMetricRangeHoverPoints', () => {
  const interactiveLineOptions = { ...defaultLineOptions, interactiveMarkName: 'line0' };

  test('returns two symbol marks: background and highlight', () => {
    const marks = getMetricRangeHoverPoints(interactiveLineOptions, defaultMetricRangeSpecOptions);
    expect(marks).toHaveLength(2);
    expect(marks[0].type).toBe('symbol');
    expect(marks[1].type).toBe('symbol');
  });

  test('both marks source from the MetricRange hoverPointData', () => {
    const marks = getMetricRangeHoverPoints(interactiveLineOptions, defaultMetricRangeSpecOptions);
    expect(marks[0].from?.data).toBe('line0MetricRange0_hoverPointData');
    expect(marks[1].from?.data).toBe('line0MetricRange0_hoverPointData');
  });

  test('both marks are non-interactive', () => {
    const marks = getMetricRangeHoverPoints(interactiveLineOptions, defaultMetricRangeSpecOptions);
    expect(marks[0].interactive).toBe(false);
    expect(marks[1].interactive).toBe(false);
  });

  test('background mark uses background color for fill and stroke', () => {
    const [bg] = getMetricRangeHoverPoints(interactiveLineOptions, defaultMetricRangeSpecOptions);
    expect(bg.encode?.enter?.fill).toHaveProperty('signal', BACKGROUND_COLOR);
    expect(bg.encode?.enter?.stroke).toHaveProperty('signal', BACKGROUND_COLOR);
  });

  test('highlight mark uses background color for fill and series color for stroke', () => {
    const [, highlight] = getMetricRangeHoverPoints(interactiveLineOptions, defaultMetricRangeSpecOptions);
    expect(highlight.encode?.update?.fill).toHaveProperty('signal', BACKGROUND_COLOR);
    expect(highlight.encode?.enter?.stroke).toBeDefined();
    expect(highlight.encode?.enter?.stroke).not.toHaveProperty('signal', BACKGROUND_COLOR);
    expect(highlight.encode?.update?.stroke).toBeDefined();
    expect(highlight.encode?.update?.strokeOpacity).toBeDefined();
  });

  test('both marks have opacity rule that hides them when metric is not valid', () => {
    const [bg, highlight] = getMetricRangeHoverPoints(interactiveLineOptions, defaultMetricRangeSpecOptions);
    const expectedOpacity = [{ test: `isValid(datum["${defaultMetricRangeSpecOptions.metric}"])`, value: 1 }, { value: 0 }];
    expect(bg.encode?.update?.opacity).toEqual(expectedOpacity);
    expect(highlight.encode?.update?.opacity).toEqual(expectedOpacity);
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

  test('adds filtered hoverPointData source when hoverPoint is true and line is interactive', () => {
    const data = getMetricRangeData({
      ...defaultLineOptions,
      interactiveMarkName: 'line0',
      metricRanges: [{ ...defaultMetricRangeOptions, hoverPoint: true }],
    });
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty('name', 'line0MetricRange0_hoverPointData');
    expect(data[0]).toHaveProperty('source', 'line0_highlightedData');
    expect(data[0].transform).toEqual([{ type: 'filter', expr: `isValid(datum["${defaultMetricRangeOptions.metric}"])` }]);
  });

  test('does not add filtered highlightedData source when hoverPoint is true but line is not interactive', () => {
    const data = getMetricRangeData({
      ...defaultLineOptions,
      metricRanges: [{ ...defaultMetricRangeOptions, hoverPoint: true }],
    });
    expect(data).toHaveLength(0);
  });
});
