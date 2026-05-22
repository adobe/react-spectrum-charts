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
  DEFAULT_OPACITY_RULE,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  HOVERED_ITEM,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { getHoverContext } from '../marks/hoverContext';
import { defaultLineOptions } from '../line/lineTestUtils';
import { AreaMarkOptions, getAreaMark, getAreaOpacity } from './areaUtils';

describe('getAreaMark', () => {
  test('basic options', () => {
    expect(
      getAreaMark({
        name: 'area0',
        color: DEFAULT_COLOR,
        colorScheme: DEFAULT_COLOR_SCHEME,
        metricStart: 'metricStart',
        metricEnd: 'metricEnd',
        isStacked: false,
        dimension: 'dimension',
        scaleType: 'linear',
        opacity: 0.5,
      })
    ).toStrictEqual({
      name: 'area0',
      description: 'area0',
      type: 'area',
      from: {
        data: 'area0_facet',
      },
      interactive: false,
      encode: {
        enter: {
          y: {
            scale: 'yLinear',
            field: 'metricStart',
          },
          y2: {
            scale: 'yLinear',
            field: 'metricEnd',
          },
          tooltip: undefined,

          fill: {
            scale: COLOR_SCALE,
            field: DEFAULT_COLOR,
          },
          defined: { signal: 'isValid(datum["metricStart"]) || isValid(datum["metricEnd"])' },
        },
        update: {
          cursor: undefined,
          x: {
            scale: 'xLinear',
            field: 'dimension',
          },
          fillOpacity: {
            value: 0.5,
          },
          opacity: [DEFAULT_OPACITY_RULE],
        },
      },
    });
  });

  test('stacked', () => {
    expect(
      getAreaMark({
        name: 'area0',
        color: DEFAULT_COLOR,
        colorScheme: DEFAULT_COLOR_SCHEME,
        metricStart: 'metricStart',
        metricEnd: 'metricEnd',
        isStacked: true,
        dimension: 'dimension',
        scaleType: 'linear',
        opacity: 0.5,
      })
    ).toStrictEqual({
      name: 'area0',
      description: 'area0',
      type: 'area',
      from: {
        data: 'area0_facet',
      },
      interactive: false,
      encode: {
        enter: {
          tooltip: undefined,
          y: {
            scale: 'yLinear',
            field: 'metricStart',
          },
          y2: {
            scale: 'yLinear',
            field: 'metricEnd',
          },
          fill: {
            scale: COLOR_SCALE,
            field: DEFAULT_COLOR,
          },
          stroke: {
            signal: BACKGROUND_COLOR,
          },
          strokeWidth: {
            value: 1.5,
          },
          strokeJoin: {
            value: 'round',
          },
          defined: { signal: 'isValid(datum["metricStart"]) || isValid(datum["metricEnd"])' },
        },
        update: {
          cursor: undefined,
          x: {
            scale: 'xLinear',
            field: 'dimension',
          },
          fillOpacity: {
            value: 0.5,
          },
          opacity: [DEFAULT_OPACITY_RULE],
        },
      },
    });
  });

  test('time scale', () => {
    expect(
      getAreaMark({
        name: 'area0',
        color: DEFAULT_COLOR,
        colorScheme: DEFAULT_COLOR_SCHEME,
        metricStart: 'metricStart',
        metricEnd: 'metricEnd',
        isStacked: false,
        dimension: 'dimension',
        scaleType: 'time',
        opacity: 0.5,
      })
    ).toStrictEqual({
      name: 'area0',
      description: 'area0',
      type: 'area',
      from: {
        data: 'area0_facet',
      },
      interactive: false,
      encode: {
        enter: {
          tooltip: undefined,

          y: {
            scale: 'yLinear',
            field: 'metricStart',
          },
          y2: {
            scale: 'yLinear',
            field: 'metricEnd',
          },
          fill: {
            scale: COLOR_SCALE,
            field: DEFAULT_COLOR,
          },
          defined: { signal: 'isValid(datum["metricStart"]) || isValid(datum["metricEnd"])' },
        },
        update: {
          cursor: undefined,
          x: {
            scale: 'xTime',
            field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
          },
          fillOpacity: {
            value: 0.5,
          },
          opacity: [DEFAULT_OPACITY_RULE],
        },
      },
    });
  });

  test('point scale', () => {
    expect(
      getAreaMark({
        name: 'area0',
        color: DEFAULT_COLOR,
        colorScheme: DEFAULT_COLOR_SCHEME,
        metricStart: 'metricStart',
        metricEnd: 'metricEnd',
        isStacked: false,
        dimension: 'dimension',
        scaleType: 'point',
        opacity: 0.5,
      })
    ).toStrictEqual({
      name: 'area0',
      description: 'area0',
      type: 'area',
      from: {
        data: 'area0_facet',
      },
      interactive: false,
      encode: {
        enter: {
          tooltip: undefined,
          y: {
            scale: 'yLinear',
            field: 'metricStart',
          },
          y2: {
            scale: 'yLinear',
            field: 'metricEnd',
          },
          fill: {
            scale: COLOR_SCALE,
            field: DEFAULT_COLOR,
          },
          defined: { signal: 'isValid(datum["metricStart"]) || isValid(datum["metricEnd"])' },
        },
        update: {
          cursor: undefined,
          x: {
            scale: 'xPoint',
            field: 'dimension',
          },
          fillOpacity: {
            value: 0.5,
          },
          opacity: [DEFAULT_OPACITY_RULE],
        },
      },
    });
  });
});

describe('getAreaOpacity', () => {
  const interactiveLineOpts = { ...defaultLineOptions, chartTooltips: [{}] as [{}], interactiveMarkName: 'line0' };
  const interactiveDimLineOpts = { ...interactiveLineOpts, interactionMode: 'dimension' as const };

  const baseMetricRangeOptions: AreaMarkOptions = {
    name: 'line0MetricRange0_area',
    color: DEFAULT_COLOR,
    colorScheme: DEFAULT_COLOR_SCHEME,
    metricStart: 'metricStart',
    metricEnd: 'metricEnd',
    isStacked: false,
    dimension: 'dimension',
    scaleType: 'linear',
    opacity: 0.2,
    isMetricRange: true,
    interactiveMarkName: 'line0',
    hoverContext: getHoverContext(interactiveLineOpts),
  };

  test('returns opacity rules to hide the area when displayOnHover is "range"', () => {
    const opacity = getAreaOpacity({ ...baseMetricRangeOptions, displayOnHover: 'range' });
    // show mode: combined predicate in a single test rule + { value: 0 }
    expect(opacity).toHaveLength(2);
    expect(JSON.stringify(opacity?.[0])).toContain(`line0_${HOVERED_ITEM}`);
    expect(opacity?.[1]).toEqual({ value: 0 });
  });

  test('shows the range area on dimension hover when displayOnHover is "range"', () => {
    const opacity = getAreaOpacity({
      ...baseMetricRangeOptions,
      displayOnHover: 'range',
      interactionMode: 'dimension',
      hoverContext: getHoverContext(interactiveDimLineOpts),
    });
    // show mode with dimension: combined predicate includes dimension signal, 2 rules total
    expect(opacity).toHaveLength(2);
    expect(JSON.stringify(opacity?.[0])).toContain(`line0_dimensionHoverArea_${HOVERED_ITEM}`);
    expect(opacity?.[1]).toEqual({ value: 0 });
  });

  test('shows the range area on dimension hover when displayOnHover is true', () => {
    const opacity = getAreaOpacity({
      ...baseMetricRangeOptions,
      displayOnHover: true,
      interactionMode: 'dimension',
      hoverContext: getHoverContext(interactiveDimLineOpts),
    });
    // fade mode with dimension: dimension rule first (value: 1), then item/controlled/selected, then default
    expect(opacity?.[0]).toEqual({
      test: `isValid(line0_dimensionHoverArea_${HOVERED_ITEM})`,
      value: 1,
    });
    // fade produces: dim + item + ctrl_table + selected_series + default = 5 rules
    expect(opacity).toHaveLength(5);
  });

  test('returns default opacity rule when displayOnHover is false for a metric range', () => {
    const opacity = getAreaOpacity({ ...baseMetricRangeOptions, displayOnHover: false });
    expect(opacity).toEqual([DEFAULT_OPACITY_RULE]);
  });
});
