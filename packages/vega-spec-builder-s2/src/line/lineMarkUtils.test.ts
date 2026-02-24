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
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DEFAULT_OPACITY_RULE,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  FADE_FACTOR,
  HOVERED_ITEM,
  LINE_TYPE_SCALE,
  OPACITY_SCALE,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { getLineGradientMark, getLineHoverMarks, getLineMark, getLineOpacity } from './lineMarkUtils';
import { defaultLineMarkOptions } from './lineTestUtils';

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
    const lineMark = getLineMark(
      { ...defaultLineMarkOptions, interactiveMarkName: 'line0', displayOnHover: true },
      'line0_facet'
    );
    expect(lineMark.encode?.update?.opacity).toEqual([DEFAULT_OPACITY_RULE]);
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
        signal: `line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
        signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
        signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
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
        signal: `line0_hoveredItem.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
        signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
        signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      { test: `isValid(${SELECTED_SERIES})`, signal: `${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}` },
      { value: 1 },
    ]);
  });

  test('should include displayOnHover rules if displayOnHover is true', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      displayOnHover: true,
    });
    expect(opacityRule).toEqual([DEFAULT_OPACITY_RULE]);
  });

  test('should add highlightedData rule for multiple series if isHighlightedByGroup is true', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      chartTooltips: [{}],
      isHighlightedByGroup: true,
    });
    expect(opacityRule).toHaveLength(4);
    expect(opacityRule[0]).toHaveProperty('test', `length(data('line0_highlightedData'))`);
  });
});

describe('getLineGradientMark()', () => {
  test('should return an area mark with gradient fill', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    expect(gradientMark).toHaveProperty('name', 'line0_gradient');
    expect(gradientMark).toHaveProperty('type', 'area');
    expect(gradientMark).toHaveProperty('interactive', false);
    expect(gradientMark.from).toEqual({ data: 'line0_facet' });
  });

  test('should have correct enter encoding with y, y2, fill, and fillOpacity', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    const enter = gradientMark.encode?.enter;
    expect(enter).toHaveProperty('y');
    expect(enter).toHaveProperty('y2', { signal: 'height' });
    expect(enter).toHaveProperty('fill');
    expect(enter).toHaveProperty('fillOpacity');
  });

  test('should use a signal-based gradient fill with color from scale', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    const fill = gradientMark.encode?.enter?.fill as { signal: string };
    expect(fill).toHaveProperty('signal');
    expect(fill.signal).toContain('gradient');
    expect(fill.signal).toContain('linear');
    expect(fill.signal).toContain('transparent');
    expect(fill.signal).toContain(COLOR_SCALE);
  });

  test('should have correct update encoding with x and opacity', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    const update = gradientMark.encode?.update;
    expect(update).toHaveProperty('x', { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' });
    expect(update).toHaveProperty('opacity');
  });

  test('should hide gradient when multiple series exist via scale domains', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    const opacity = gradientMark.encode?.update?.opacity as { test: string; value: number }[];
    expect(opacity[0]).toEqual({
      test: `length(domain('${COLOR_SCALE}')) > 1 || length(domain('${LINE_TYPE_SCALE}')) > 1 || length(domain('${OPACITY_SCALE}')) > 1`,
      value: 0,
    });
  });

  test('should scale fillOpacity with static opacity value', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, opacity: { value: 0.6 } },
      'line0_facet'
    );
    const fillOpacity = gradientMark.encode?.enter?.fillOpacity;
    expect(fillOpacity).toEqual({ value: 0.6 * 0.2 });
  });

  test('should scale fillOpacity with dynamic opacity facet', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, opacity: 'weight' },
      'line0_facet'
    );
    const fillOpacity = gradientMark.encode?.enter?.fillOpacity;
    expect(fillOpacity).toEqual({ signal: `scale('${OPACITY_SCALE}', datum.weight) * 0.2` });
  });

  test('should include hover opacity rules when interactive', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, interactiveMarkName: 'line0', chartTooltips: [{}] },
      'line0_facet'
    );
    const opacity = gradientMark.encode?.update?.opacity as unknown[];
    expect(Array.isArray(opacity)).toBe(true);
    expect(opacity[0]).toEqual({
      test: `length(domain('${COLOR_SCALE}')) > 1 || length(domain('${LINE_TYPE_SCALE}')) > 1 || length(domain('${OPACITY_SCALE}')) > 1`,
      value: 0,
    });
    expect(opacity.length).toBeGreaterThan(2);
  });

  test('should support dual metric axis y encoding', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, dualMetricAxis: true },
      'line0_facet'
    );
    const y = gradientMark.encode?.enter?.y;
    expect(Array.isArray(y)).toBe(true);
    expect((y as unknown[]).length).toBe(2);
  });
});
