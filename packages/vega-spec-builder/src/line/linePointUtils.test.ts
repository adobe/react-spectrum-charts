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
  DEFAULT_SYMBOL_SIZE,
  DEFAULT_SYMBOL_STROKE_WIDTH,
  MARK_ID,
  SELECTED_GROUP,
  SELECTED_ITEM,
} from '@spectrum-charts/constants';

import {
  getHighlightPoint,
  getHighlightPointFill,
  getHighlightPointSize,
  getHighlightPointStroke,
  getHighlightPointStrokeOpacity,
  getHighlightPointStrokeWidth,
  getSecondaryHighlightPoint,
  getSelectionPoint,
} from './linePointUtils';
import { defaultLineMarkOptions } from './lineTestUtils';

describe('getHighlightPointFill()', () => {
  test('should return simple background rule with default optionsdefaultLineMarkOptions', () => {
    const rules = getHighlightPointFill(defaultLineMarkOptions);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toEqual({ signal: BACKGROUND_COLOR });
  });

  test('should include a static point rule if staticPoint is set', () => {
    const staticPoint = 'test';
    const rules = getHighlightPointFill({ ...defaultLineMarkOptions, staticPoint });
    expect(rules).toHaveLength(2);
    expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
  });

  test('should include selection rule if hasPopover', () => {
    const rules = getHighlightPointFill({ ...defaultLineMarkOptions, chartPopovers: [{}] });
    expect(rules).toHaveLength(2);
    expect(rules[0]).toHaveProperty(
      'test',
      `(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.line0_selectedGroupId)`
    );
  });
});

describe('getHighlightPointStroke()', () => {
  test('should return simple series color rule with default optionsdefaultLineMarkOptions', () => {
    const rules = getHighlightPointStroke(defaultLineMarkOptions);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toEqual({ scale: COLOR_SCALE, field: DEFAULT_COLOR });
  });

  test('should include a static point rule if staticPoint is set', () => {
    const staticPoint = 'test';
    const rules = getHighlightPointStroke({ ...defaultLineMarkOptions, staticPoint });
    expect(rules).toHaveLength(2);
    expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
  });

  test('should include selection rule if hasPopover', () => {
    const rules = getHighlightPointStroke({ ...defaultLineMarkOptions, chartPopovers: [{}] });
    expect(rules).toHaveLength(2);
    expect(rules[0]).toHaveProperty(
      'test',
      `(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.line0_selectedGroupId)`
    );
  });
});

describe('getHighlightPointStrokeOpacity()', () => {
  test('should return simple series color rule with default optionsdefaultLineMarkOptions', () => {
    const rules = getHighlightPointStrokeOpacity(defaultLineMarkOptions);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toEqual({ value: 1 });
  });

  test('should include a static point rule if staticPoint is set', () => {
    const staticPoint = 'test';
    const rules = getHighlightPointStrokeOpacity({ ...defaultLineMarkOptions, staticPoint });
    expect(rules).toHaveLength(2);
    expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
  });
});

describe('getHighlightPointSize()', () => {
  test('should return simple symbol size rule with default optionsdefaultLineMarkOptions', () => {
    const rules = getHighlightPointSize(defaultLineMarkOptions);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toEqual({ value: DEFAULT_SYMBOL_SIZE });
  });

  test('should include a static point rule if staticPoint is set', () => {
    const staticPoint = 'test';
    const rules = getHighlightPointSize({ ...defaultLineMarkOptions, staticPoint });
    expect(rules).toHaveLength(2);
    expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
  });
});

describe('getHighlightPointStrokeWidth()', () => {
  test('should return simple stroke width rule with default optionsdefaultLineMarkOptions', () => {
    const rules = getHighlightPointStrokeWidth(defaultLineMarkOptions);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toEqual({ value: DEFAULT_SYMBOL_STROKE_WIDTH });
  });

  test('should include a static point rule if staticPoint is set', () => {
    const staticPoint = 'test';
    const rules = getHighlightPointStrokeWidth({ ...defaultLineMarkOptions, staticPoint });
    expect(rules).toHaveLength(2);
    expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
  });
});

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
    expect(mark.encode?.enter?.y).toEqual({ field: 'value', scale: 'yLinear' });
    expect(mark.encode?.enter?.stroke).toEqual({ field: DEFAULT_COLOR, scale: COLOR_SCALE });
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
    expect(mark.encode?.enter?.y).toEqual({ field: 'value', scale: 'yLinear' });
    expect(mark.encode?.enter?.stroke).toEqual({ field: DEFAULT_COLOR, scale: COLOR_SCALE });
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
    expect(mark.encode?.enter?.y).toEqual({ field: secondaryMetric, scale: 'yLinear' });
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
    expect(mark1.encode?.enter?.y).toEqual({ field: metric1, scale: 'yLinear' });
    expect(mark2.encode?.enter?.y).toEqual({ field: metric2, scale: 'yLinear' });
  });

  test('should use highlightedData like the primary highlight point', () => {
    const mark = getSecondaryHighlightPoint(defaultLineMarkOptions, secondaryMetric);
    const highlightMark = getHighlightPoint(defaultLineMarkOptions);
    expect(mark.from).toEqual(highlightMark.from);
    expect(mark.from).toEqual({ data: 'line0_highlightedData' });
  });
});
