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
  COLOR_SCALE,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DEFAULT_OPACITY_RULE,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  DIMENSION_HOVER_AREA,
  FADE_FACTOR,
  HOVERED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import type { Mark } from 'vega';

import { getHoverContext } from '../marks/hoverContext';
import { getLineHoverMarks, getLineMark, getLineOpacity, getLineYEncoding, getVoronoiYEncoding } from './lineMarkUtils';
import { defaultLineMarkOptions, defaultLineOptions } from './lineTestUtils';

describe('getLineMark()', () => {
  test('should return line mark', () => {
    const lineMark = getLineMark(defaultLineMarkOptions, 'line0_facet');
    expect(lineMark).toEqual({
      name: 'line0',
      description: 'line0',
      type: 'line',
      from: { data: 'line0_facet' },
      interactive: false,
      encode: {
        enter: {
          stroke: { field: 'series', scale: COLOR_SCALE },
          strokeDash: { value: [] },
          strokeOpacity: DEFAULT_OPACITY_RULE,
          strokeWidth: { value: 1 },
          y: [{ field: 'value', scale: 'yLinear' }],
          defined: { signal: 'isValid(datum["value"])' },
        },
        update: {
          x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
          opacity: [DEFAULT_OPACITY_RULE],
        },
      },
    });
  });

  test('should have no opacity rule for dimension popover highlighting', () => {
    const lineMark = getLineMark(
      { ...defaultLineMarkOptions, chartPopovers: [{ UNSAFE_highlightBy: 'dimension' }] },
      'line0_facet'
    );
    expect(lineMark.encode?.update?.opacity).toBeUndefined();
  });

  test('should have undefined strokeWidth if lineWidth if undefined', () => {
    const lineMark = getLineMark({ ...defaultLineMarkOptions, lineWidth: undefined }, 'line0_facet');
    expect(lineMark.encode?.enter?.strokeWidth).toBeUndefined();
  });

  test('adds metric range opacity rules if isMetricRange and displayOnHover', () => {
    const ctx = getHoverContext({ ...defaultLineOptions, chartTooltips: [{}] as [{}], interactiveMarkName: 'line0' });
    const lineMark = getLineMark(
      {
        ...defaultLineMarkOptions,
        interactiveMarkName: 'line0',
        displayOnHover: true,
        isMetricRange: true,
        hoverContext: ctx,
      },
      'line0_facet'
    );
    // show mode: 2 rules [{ test: combined, value: 1 }, { value: 0 }]
    expect(lineMark.encode?.update?.opacity).toHaveLength(2);
    expect(lineMark.encode?.update?.opacity?.[1]).toEqual({ value: 0 });
  });

  test('does not add metric range opacity rules if displayOnHover is false and isMetricRange', () => {
    const lineMark = getLineMark({ ...defaultLineMarkOptions, displayOnHover: false }, 'line0_facet');
    expect(lineMark.encode?.update?.opacity).toEqual([{ value: 1 }]);
  });
});

describe('getLineHoverMarks()', () => {
  test('should return 5 marks by default', () => {
    expect(
      getLineHoverMarks({ ...defaultLineMarkOptions, isHighlightedByDimension: true }, 'line0_facet')
    ).toHaveLength(5);
  });
  test('should return 4 marks if interactionMode is item', () => {
    expect(
      getLineHoverMarks(
        { ...defaultLineMarkOptions, isHighlightedByDimension: true, interactionMode: 'item' },
        'line0_facet'
      )
    ).toHaveLength(4);
  });
  test('should return 6 marks if interactionMode is dimension', () => {
    const marks = getLineHoverMarks(
      { ...defaultLineMarkOptions, isHighlightedByDimension: true, interactionMode: 'dimension' },
      'line0_facet'
    );
    expect(marks).toHaveLength(6);
    expect(marks[3].name).toBe('line0_xAxisVoronoiPoints');
    expect(marks[4].name).toBe('line0_xAxisVoronoi');
    expect(marks[5].name).toBe('line0_hoverGroup');
  });
  test('should return 7 marks if a popover is present', () => {
    expect(
      getLineHoverMarks(
        {
          ...defaultLineMarkOptions,
          isHighlightedByDimension: true,
          chartPopovers: [{ UNSAFE_highlightBy: 'dimension' }],
        },
        'line0_facet'
      )
    ).toHaveLength(7);
  });
  test('should have opacity of 0 if a selected item exists', () => {
    const marks = getLineHoverMarks(
      { ...defaultLineMarkOptions, isHighlightedByDimension: true, chartPopovers: [{}] },
      'line0_facet'
    );
    expect(marks[0].encode?.update?.opacity).toEqual({ signal: "length(data('line0_selectedData')) > 0 ? 0 : 1" });
  });
});

describe('getLineHoverMarks() hover hit-area y encoding', () => {
  const dataSource = 'line0_facet';

  const getHoverGroup = (marks: Mark[], lineName: string) =>
    marks.find((m) => m.type === 'group' && m.name === `${lineName}_hoverGroup`);

  test('item mode: hover symbol y includes metric range hover points', () => {
    const lineOptions = {
      ...defaultLineMarkOptions,
      isHighlightedByDimension: true,
      interactionMode: 'item' as const,
      metricRanges: [
        { metricEnd: 'metricEnd', metricStart: 'metricStart', metric: 'forecastedExpectedValue', hoverPoint: true },
      ],
    };
    const marks = getLineHoverMarks(lineOptions, dataSource);
    const hoverGroup = getHoverGroup(marks, lineOptions.name);
    expect(hoverGroup).toBeDefined();
    const nested = (hoverGroup as { marks?: Mark[] })?.marks ?? [];
    expect(nested.length).toBeGreaterThan(0);
    const expectedY = getVoronoiYEncoding(lineOptions, lineOptions.metric);
    nested.forEach((m) => {
      expect(m.encode?.enter?.y).toEqual(expectedY);
    });
  });

  test('item mode: when no MetricRange hover points, hover y matches getLineYEncoding (same result if interactionMode is dimension)', () => {
    const lineOptions = {
      ...defaultLineMarkOptions,
      isHighlightedByDimension: true,
      interactionMode: 'item' as const,
      metricRanges: [],
    };
    const marks = getLineHoverMarks(lineOptions, dataSource);
    const hoverGroup = getHoverGroup(marks, lineOptions.name);
    const nested = (hoverGroup as { marks?: Mark[] })?.marks ?? [];
    expect(nested[0]?.encode?.enter?.y).toEqual(getLineYEncoding(lineOptions, lineOptions.metric));
  });

  test('dimension mode: hover symbol y includes metric range hover points', () => {
    const lineOptions = {
      ...defaultLineMarkOptions,
      isHighlightedByDimension: true,
      interactionMode: 'dimension' as const,
      metricRanges: [
        { metricEnd: 'metricEnd', metricStart: 'metricStart', metric: 'forecastedExpectedValue', hoverPoint: true },
      ],
    };
    const marks = getLineHoverMarks(lineOptions, dataSource);
    const hoverGroup = getHoverGroup(marks, lineOptions.name);
    expect(hoverGroup).toBeDefined();
    const nested = (hoverGroup as { marks?: Mark[] })?.marks ?? [];
    expect(nested[0]?.encode?.enter?.y).toEqual(getVoronoiYEncoding(lineOptions, lineOptions.metric));
  });
});

describe('getVoronoiYEncoding()', () => {
  test('returns standard line y encoding when no MetricRange hover points', () => {
    const encoding = getVoronoiYEncoding({ ...defaultLineMarkOptions, metricRanges: [] }, 'value');
    expect(encoding).toEqual([{ scale: 'yLinear', field: 'value' }]);
  });

  test('returns conditional y encoding with clamped MetricRange fallback when hoverPoint is true', () => {
    const encoding = getVoronoiYEncoding(
      { ...defaultLineMarkOptions, metricRanges: [{ metricEnd: 'metricEnd', metricStart: 'metricStart', metric: 'metric', hoverPoint: true }] },
      'value'
    );
    expect(encoding).toEqual([
      { test: 'isValid(datum["value"])', scale: 'yLinear', field: 'value' },
      { test: 'isValid(datum["metric"])', signal: `clamp(scale('yLinear', datum['metric']), 0, height)` },
      { scale: 'yLinear', field: 'value' },
    ]);
  });

  test('clamps metric range y to [0, height - 1] so out-of-domain values do not create oversized voronoi cells', () => {
    const encoding = getVoronoiYEncoding(
      { ...defaultLineMarkOptions, metricRanges: [{ metricEnd: 'metricEnd', metricStart: 'metricStart', metric: 'forecastMetric', hoverPoint: true }] },
      'value'
    );
    const metricRuleEntry = (encoding as Array<{ test?: string; signal?: string }>).find(e => e.test?.includes('forecastMetric'));
    expect(metricRuleEntry).toHaveProperty('signal', `clamp(scale('yLinear', datum['forecastMetric']), 0, height)`);
  });

  test('excludes MetricRange metrics where hoverPoint is false', () => {
    const encoding = getVoronoiYEncoding(
      { ...defaultLineMarkOptions, metricRanges: [{ metricEnd: 'metricEnd', metricStart: 'metricStart', metric: 'metric', hoverPoint: false }] },
      'value'
    );
    expect(encoding).toEqual([{ scale: 'yLinear', field: 'value' }]);
  });
});

describe('getLineOpacity()', () => {
  test('should return a basic opacity rule when using default line options', () => {
    const opacityRule = getLineOpacity(defaultLineMarkOptions);
    expect(opacityRule).toEqual([{ value: 1 }]);
  });

  test('should include hover rules if line has a tooltip', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      chartTooltips: [{}],
    });
    expect(opacityRule).toEqual([
      {
        test: `isValid(line0_${HOVERED_ITEM})`,
        signal: `line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} || indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 || isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) && ${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
        signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
      },
      { value: 1 },
    ]);
  });

  test('should include select rules if line has a popover', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      popoverMarkName: 'line0',
      chartPopovers: [{}],
    });
    expect(opacityRule).toEqual([
      {
        test: 'isValid(line0_hoveredItem)',
        signal: `line0_hoveredItem.${SERIES_ID} === datum.${SERIES_ID} || indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 || isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) && ${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
        signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
      },
      { test: `isValid(${SELECTED_SERIES})`, signal: `${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}` },
      { value: 1 },
    ]);
  });

  test('should return default opacity when displayOnHover is true without isMetricRange (e.g. trendlines)', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      displayOnHover: true,
    });
    expect(opacityRule).toEqual([{ value: 1 }]);
  });

  test('includes dimension hover rule when displayOnHover is "metric" and interactionMode is dimension', () => {
    const ctx = getHoverContext({
      ...defaultLineOptions,
      chartTooltips: [{}] as [{}],
      interactiveMarkName: 'line0',
      interactionMode: 'dimension',
    });
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      displayOnHover: 'metric',
      interactionMode: 'dimension',
      isMetricRange: true,
      hoverContext: ctx,
    });
    // show mode: combined predicate includes dimension hover, 2 rules total
    expect(opacityRule).toHaveLength(2);
    expect(JSON.stringify(opacityRule[0])).toContain(`line0_dimensionHoverArea_${HOVERED_ITEM}`);
    expect(opacityRule[1]).toEqual({ value: 0 });
  });

  test('includes dimension hover rule when displayOnHover is true and interactionMode is dimension', () => {
    const ctx = getHoverContext({
      ...defaultLineOptions,
      chartTooltips: [{}] as [{}],
      interactiveMarkName: 'line0',
      interactionMode: 'dimension',
    });
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      displayOnHover: true,
      interactionMode: 'dimension',
      isMetricRange: true,
      hoverContext: ctx,
    });
    // show mode: combined predicate includes dimension hover, 2 rules total
    expect(opacityRule).toHaveLength(2);
    expect(JSON.stringify(opacityRule[0])).toContain(`line0_dimensionHoverArea_${HOVERED_ITEM}`);
    expect(opacityRule[1]).toEqual({ value: 0 });
  });

  test('returns opacity rules when displayOnHover is "metric" to show the line on hover', () => {
    const ctx = getHoverContext({
      ...defaultLineOptions,
      chartTooltips: [{}] as [{}],
      interactiveMarkName: 'line0',
    });
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      displayOnHover: 'metric',
      isMetricRange: true,
      hoverContext: ctx,
    });
    // show mode: combined predicate in one test rule + { value: 0 }
    expect(opacityRule).toHaveLength(2);
    expect(opacityRule[0]).toHaveProperty('value', 1);
    expect(JSON.stringify(opacityRule[0])).toContain(`line0_${HOVERED_ITEM}`);
    expect(JSON.stringify(opacityRule[0])).toContain(SELECTED_SERIES);
    expect(JSON.stringify(opacityRule[0])).toContain(CONTROLLED_HIGHLIGHTED_TABLE);
    expect(JSON.stringify(opacityRule[0])).toContain(CONTROLLED_HIGHLIGHTED_SERIES);
    expect(opacityRule[1]).toEqual({ value: 0 });
  });


  test('should add highlightedData rule for multiple series if isHighlightedByGroup is true', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      chartTooltips: [{}],
      isHighlightedByGroup: true,
    });
    expect(opacityRule).toHaveLength(3);
    expect(opacityRule[0]).toHaveProperty('test', `length(data('line0_highlightedData'))`);
  });

  test('should include dimension hover area and point hover rules when interactionMode is dimension', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      interactionMode: 'dimension',
      chartTooltips: [{}],
    });
    expect(opacityRule[0]).toEqual({
      test: `isValid(line0_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM})`,
      value: 1,
    });
    expect(opacityRule[1]).toEqual({
      test: `isValid(line0_${HOVERED_ITEM})`,
      signal: `line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
    });
    expect(opacityRule).toHaveLength(4);
  });
});
