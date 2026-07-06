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
  BACKGROUND_COLOR,
  CHART_SIZE_POINT_SIZE,
  CHART_SIZE_HOVER_STROKE_WIDTH,
  COLOR_SCALE,
  DEFAULT_COLOR,
  FADE_FACTOR,
  HOVERED_ITEM,
  SERIES_ID,
} from '@spectrum-charts/constants';

import {
  getHighlightBackgroundPoint,
  getHighlightPoint,
  getLineStaticPoint,
  getLineStaticPointBackground,
  getSecondaryHighlightPoint,
  getSelectionPoint,
} from './linePointUtils';
import { defaultLineMarkOptions, defaultLineOptions } from './lineTestUtils';

describe('getHighlightPoint()', () => {
  test('should return symbol mark with correct name and description', () => {
    const mark = getHighlightPoint(defaultLineMarkOptions);
    expect(mark.name).toBe('line0_point_highlight');
    expect(mark.description).toBe('line0_point_highlight');
  });

  test('should return symbol mark with correct properties', () => {
    const mark = getHighlightPoint(defaultLineMarkOptions);
    expect(mark.type).toBe('symbol');
    expect(mark.interactive).toBe(false);
    expect(mark.from).toEqual({ data: 'line0_highlightedData' });
  });

  test('should have correct encode structure', () => {
    const mark = getHighlightPoint(defaultLineMarkOptions);
    expect(mark.encode).toBeDefined();
    expect(mark.encode?.enter).toBeDefined();
    expect(mark.encode?.update).toBeDefined();
    expect(mark.encode?.enter?.y).toEqual([{ field: 'value', scale: 'yLinear' }]);
    expect(mark.encode?.enter?.fill).toEqual({ signal: BACKGROUND_COLOR });
    expect(mark.encode?.enter?.stroke).toEqual({ field: DEFAULT_COLOR, scale: COLOR_SCALE });
    expect(mark.encode?.enter?.strokeWidth).toEqual({ signal: CHART_SIZE_HOVER_STROKE_WIDTH });
  });

  test('should use CHART_SIZE_POINT_SIZE signal when pointSize is not provided', () => {
    const mark = getHighlightPoint(defaultLineMarkOptions);
    expect(mark.encode?.enter?.size).toEqual({ signal: CHART_SIZE_POINT_SIZE });
  });

  test('should use explicit pointSize value when provided', () => {
    const mark = getHighlightPoint({ ...defaultLineMarkOptions, pointSize: 100 });
    expect(mark.encode?.enter?.size).toEqual({ value: 100 });
  });

  test('should use custom name in mark name and description', () => {
    const customOptions = { ...defaultLineMarkOptions, name: 'customLine' };
    const mark = getHighlightPoint(customOptions);
    expect(mark.name).toBe('customLine_point_highlight');
    expect(mark.description).toBe('customLine_point_highlight');
    expect(mark.from).toEqual({ data: 'customLine_highlightedData' });
  });
});

describe('getSelectionPoint()', () => {
  test('should return symbol mark with correct name and description', () => {
    const mark = getSelectionPoint(defaultLineMarkOptions);
    expect(mark.name).toBe('line0_point_select');
    expect(mark.description).toBe('line0_point_select');
  });

  test('should return symbol mark with correct properties', () => {
    const mark = getSelectionPoint(defaultLineMarkOptions);
    expect(mark.type).toBe('symbol');
    expect(mark.interactive).toBe(false);
    expect(mark.from).toEqual({ data: 'line0_selectedData' });
  });

  test('should have correct encode structure', () => {
    const mark = getSelectionPoint(defaultLineMarkOptions);
    expect(mark.encode).toBeDefined();
    expect(mark.encode?.enter).toBeDefined();
    expect(mark.encode?.update).toBeDefined();
    expect(mark.encode?.enter?.y).toEqual([{ field: 'value', scale: 'yLinear' }]);
    expect(mark.encode?.enter?.fill).toEqual({ signal: BACKGROUND_COLOR });
    expect(mark.encode?.enter?.stroke).toEqual({ field: DEFAULT_COLOR, scale: COLOR_SCALE });
    expect(mark.encode?.enter?.strokeWidth).toEqual({ signal: CHART_SIZE_HOVER_STROKE_WIDTH });
  });

  test('should use CHART_SIZE_POINT_SIZE signal when pointSize is not provided', () => {
    const mark = getSelectionPoint(defaultLineMarkOptions);
    expect(mark.encode?.enter?.size).toEqual({ signal: CHART_SIZE_POINT_SIZE });
  });

  test('should use explicit pointSize value when provided', () => {
    const mark = getSelectionPoint({ ...defaultLineMarkOptions, pointSize: 100 });
    expect(mark.encode?.enter?.size).toEqual({ value: 100 });
  });

  test('should use custom name in mark name and description', () => {
    const customOptions = { ...defaultLineMarkOptions, name: 'customLine' };
    const mark = getSelectionPoint(customOptions);
    expect(mark.name).toBe('customLine_point_select');
    expect(mark.description).toBe('customLine_point_select');
    expect(mark.from).toEqual({ data: 'customLine_selectedData' });
  });

  test('should use selectedData instead of highlightedData', () => {
    const highlightMark = getHighlightPoint(defaultLineMarkOptions);
    const selectionMark = getSelectionPoint(defaultLineMarkOptions);
    expect(highlightMark.from).toEqual({ data: 'line0_highlightedData' });
    expect(selectionMark.from).toEqual({ data: 'line0_selectedData' });
    expect(highlightMark.name).toContain('highlight');
    expect(selectionMark.name).toContain('select');
  });
});

describe('getSecondaryHighlightPoint()', () => {
  const secondaryMetric = 'trendlineValue';

  test('should return symbol mark with correct name and description', () => {
    const mark = getSecondaryHighlightPoint(defaultLineMarkOptions, secondaryMetric);
    expect(mark.name).toBe('line0_secondaryPoint');
    expect(mark.description).toBe('line0_secondaryPoint');
  });

  test('should return symbol mark with correct properties', () => {
    const mark = getSecondaryHighlightPoint(defaultLineMarkOptions, secondaryMetric);
    expect(mark.type).toBe('symbol');
    expect(mark.interactive).toBe(false);
    expect(mark.from).toEqual({ data: 'line0_highlightedData' });
  });

  test('should have correct encode structure with secondary metric', () => {
    const mark = getSecondaryHighlightPoint(defaultLineMarkOptions, secondaryMetric);
    expect(mark.encode).toBeDefined();
    expect(mark.encode?.enter).toBeDefined();
    expect(mark.encode?.update).toBeDefined();
    expect(mark.encode?.enter?.y).toEqual([{ field: secondaryMetric, scale: 'yLinear' }]);
    expect(mark.encode?.enter?.fill).toEqual({ signal: BACKGROUND_COLOR });
    expect(mark.encode?.enter?.stroke).toEqual({ field: DEFAULT_COLOR, scale: COLOR_SCALE });
  });

  test('should use custom name in mark name and description', () => {
    const customOptions = { ...defaultLineMarkOptions, name: 'customLine' };
    const mark = getSecondaryHighlightPoint(customOptions, secondaryMetric);
    expect(mark.name).toBe('customLine_secondaryPoint');
    expect(mark.description).toBe('customLine_secondaryPoint');
    expect(mark.from).toEqual({ data: 'customLine_highlightedData' });
  });

  test('should use the secondary metric for y-axis encoding', () => {
    const metric1 = 'metric1';
    const metric2 = 'metric2';
    const mark1 = getSecondaryHighlightPoint(defaultLineMarkOptions, metric1);
    const mark2 = getSecondaryHighlightPoint(defaultLineMarkOptions, metric2);
    expect(mark1.encode?.enter?.y).toEqual([{ field: metric1, scale: 'yLinear' }]);
    expect(mark2.encode?.enter?.y).toEqual([{ field: metric2, scale: 'yLinear' }]);
  });

  test('should use highlightedData like the primary highlight point', () => {
    const mark = getSecondaryHighlightPoint(defaultLineMarkOptions, secondaryMetric);
    const highlightMark = getHighlightPoint(defaultLineMarkOptions);
    expect(mark.from).toEqual(highlightMark.from);
    expect(mark.from).toEqual({ data: 'line0_highlightedData' });
  });
});

describe('getLineStaticPoint()', () => {
  test('should return symbol mark with correct name and description', () => {
    const mark = getLineStaticPoint(defaultLineOptions);
    expect(mark.name).toBe('line0_staticPoints');
    expect(mark.description).toBe('line0_staticPoints');
  });

  test('should use staticPointData as data source', () => {
    const mark = getLineStaticPoint(defaultLineOptions);
    expect(mark.from).toEqual({ data: 'line0_staticPointData' });
  });

  test('should use solid fill with series color (not BACKGROUND_COLOR)', () => {
    const mark = getLineStaticPoint(defaultLineOptions);
    expect(mark.encode?.enter?.fill).toEqual({ field: DEFAULT_COLOR, scale: COLOR_SCALE });
  });

  test('should not be interactive', () => {
    const mark = getLineStaticPoint(defaultLineOptions);
    expect(mark.interactive).toBe(false);
  });

  test('should use CHART_SIZE_POINT_SIZE signal when pointSize is not provided', () => {
    const mark = getLineStaticPoint(defaultLineOptions);
    expect(mark.encode?.enter?.size).toEqual({ signal: CHART_SIZE_POINT_SIZE });
  });

  test('should use explicit pointSize value when provided', () => {
    const mark = getLineStaticPoint({ ...defaultLineOptions, pointSize: 100 });
    expect(mark.encode?.enter?.size).toEqual({ value: 100 });
  });

  test('should add hover opacity rule when interactiveMarkName is set', () => {
    const mark = getLineStaticPoint({ ...defaultLineOptions, interactiveMarkName: 'line0' });
    expect(mark.encode?.update?.opacity).toEqual([
      {
        test: `isValid(line0_${HOVERED_ITEM})`,
        signal: `line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      { value: 1 },
    ]);
  });

  test('should add group opacity rule when interactiveMarkName and isHighlightedByGroup are set', () => {
    const mark = getLineStaticPoint({
      ...defaultLineOptions,
      interactiveMarkName: 'line0',
      isHighlightedByGroup: true,
    });
    expect(mark.encode?.update?.opacity).toEqual([
      {
        test: `length(data('line0_highlightedData'))`,
        signal: `indexof(pluck(data('line0_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1 ? 1 : ${FADE_FACTOR}`,
      },
      { value: 1 },
    ]);
  });
});

describe('getHighlightBackgroundPoint()', () => {
  test('should return symbol mark with correct name and description', () => {
    const mark = getHighlightBackgroundPoint(defaultLineMarkOptions);
    expect(mark.name).toBe('line0_pointBackground');
    expect(mark.description).toBe('line0_pointBackground');
  });

  test('should use highlightedData as data source', () => {
    const mark = getHighlightBackgroundPoint(defaultLineMarkOptions);
    expect(mark.from).toEqual({ data: 'line0_highlightedData' });
  });

  test('should not be interactive', () => {
    const mark = getHighlightBackgroundPoint(defaultLineMarkOptions);
    expect(mark.interactive).toBe(false);
  });

  test('should use BACKGROUND_COLOR for fill and stroke', () => {
    const mark = getHighlightBackgroundPoint(defaultLineMarkOptions);
    expect(mark.encode?.enter?.fill).toEqual({ signal: BACKGROUND_COLOR });
    expect(mark.encode?.enter?.stroke).toEqual({ signal: BACKGROUND_COLOR });
  });

  test('should use CHART_SIZE_POINT_SIZE signal when pointSize is not provided', () => {
    const mark = getHighlightBackgroundPoint(defaultLineMarkOptions);
    expect(mark.encode?.enter?.size).toEqual({ signal: CHART_SIZE_POINT_SIZE });
  });

  test('should use explicit pointSize value when provided', () => {
    const mark = getHighlightBackgroundPoint({ ...defaultLineMarkOptions, pointSize: 100 });
    expect(mark.encode?.enter?.size).toEqual({ value: 100 });
  });
});

describe('getLineStaticPointBackground()', () => {
  test('should return symbol mark with correct name and description', () => {
    const mark = getLineStaticPointBackground(defaultLineOptions);
    expect(mark.name).toBe('line0_staticPointBackground');
    expect(mark.description).toBe('line0_staticPointBackground');
  });

  test('should use staticPointData as data source', () => {
    const mark = getLineStaticPointBackground(defaultLineOptions);
    expect(mark.from).toEqual({ data: 'line0_staticPointData' });
  });

  test('should not be interactive', () => {
    const mark = getLineStaticPointBackground(defaultLineOptions);
    expect(mark.interactive).toBe(false);
  });

  test('should use BACKGROUND_COLOR for fill and stroke', () => {
    const mark = getLineStaticPointBackground(defaultLineOptions);
    expect(mark.encode?.enter?.fill).toEqual({ signal: BACKGROUND_COLOR });
    expect(mark.encode?.enter?.stroke).toEqual({ signal: BACKGROUND_COLOR });
  });

  test('should use CHART_SIZE_POINT_SIZE signal when pointSize is not provided', () => {
    const mark = getLineStaticPointBackground(defaultLineOptions);
    expect(mark.encode?.enter?.size).toEqual({ signal: CHART_SIZE_POINT_SIZE });
  });

  test('should use explicit pointSize value when provided', () => {
    const mark = getLineStaticPointBackground({ ...defaultLineOptions, pointSize: 100 });
    expect(mark.encode?.enter?.size).toEqual({ value: 100 });
  });
});
