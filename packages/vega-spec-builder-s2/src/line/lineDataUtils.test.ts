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
import { FilterTransform } from 'vega';

import {
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  GROUP_ID,
  HOVERED_ITEM,
  SELECTED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { getLineHighlightedData, getLineHoverRules, getPrimarySeriesOtherExpr } from './lineDataUtils';
import { defaultLineOptions } from './lineTestUtils';

describe('getLineHighlightedData()', () => {
  test('should include select signal if hasPopover', () => {
    const expr = (
      getLineHighlightedData({ ...defaultLineOptions, chartPopovers: [{}] }).transform?.[0] as FilterTransform
    ).expr;
    expect(expr.includes(SELECTED_ITEM)).toBeTruthy();
  });
  test('should not include select signal if does not hasPopover', () => {
    const expr = (getLineHighlightedData(defaultLineOptions).transform?.[0] as FilterTransform).expr;
    expect(expr.includes(SELECTED_ITEM)).toBeFalsy();
  });
  test('should use groupId if hadGroupId', () => {
    const expr = (
      getLineHighlightedData({
        ...defaultLineOptions,
        chartPopovers: [{}],
        chartInspects: [{ highlightBy: 'dimension' }],
        isHighlightedByGroup: true,
      }).transform?.[0] as FilterTransform
    ).expr;
    expect(expr.includes(GROUP_ID)).toBeTruthy();
  });
});

describe('getPrimarySeriesOtherExpr()', () => {
  test('with string array uses JSON.stringify for series reference', () => {
    const expr = getPrimarySeriesOtherExpr(['series1', 'series2'], 'datum');
    expect(expr).toBe(`indexof(["series1","series2"], datum.${SERIES_ID}) < 0`);
  });

  test('with number uses slice of color domain', () => {
    const expr = getPrimarySeriesOtherExpr(3, 'datum');
    expect(expr).toBe(`indexof(slice(domain('color'), 0, 3), datum.${SERIES_ID}) < 0`);
  });

  test('uses provided datumPath', () => {
    const expr = getPrimarySeriesOtherExpr(['series1'], 'datum.datum');
    expect(expr).toContain('datum.datum');
  });
});

describe('getLineHoverRules()', () => {
  const asNames = (options: Parameters<typeof getLineHoverRules>[0]) => getLineHoverRules(options).map((r) => r.as);

  test('always includes the two controlled-highlight rules', () => {
    const rules = getLineHoverRules(defaultLineOptions);
    expect(asNames(defaultLineOptions)).toEqual(['controlledTableMatch', 'controlledSeriesMatch']);
    expect(rules.find((r) => r.as === 'controlledTableMatch')?.expr).toBe(
      `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}')) ? (indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : 0) : null`
    );
    expect(rules.find((r) => r.as === 'controlledSeriesMatch')?.expr).toBe(
      `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) ? (${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null`
    );
  });

  test('adds hoveredMatch first when interactiveMarkName is set (item hover)', () => {
    const options = { ...defaultLineOptions, interactiveMarkName: 'line0' };
    expect(asNames(options)).toEqual(['hoveredMatch', 'controlledTableMatch', 'controlledSeriesMatch']);
    expect(getLineHoverRules(options)[0].expr).toBe(
      `isValid(line0_${HOVERED_ITEM}) ? (line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : 0) : null`
    );
  });

  test('hoveredMatch uses the highlightedData set when isHighlightedByGroup is true', () => {
    const options = { ...defaultLineOptions, interactiveMarkName: 'line0', isHighlightedByGroup: true };
    expect(getLineHoverRules(options)[0].expr).toBe(
      `length(data('line0_highlightedData')) ? (indexof(pluck(data('line0_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1 ? 1 : 0) : null`
    );
  });

  test('adds popoverMatch (keyed on selected series) when popoverMarkName is set', () => {
    const options = { ...defaultLineOptions, popoverMarkName: 'line0' };
    expect(asNames(options)).toContain('popoverMatch');
    expect(getLineHoverRules(options).find((r) => r.as === 'popoverMatch')?.expr).toBe(
      `isValid(${SELECTED_SERIES}) ? (${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null`
    );
  });

  test('adds one comboSiblingMatch covering every sibling name', () => {
    const options = { ...defaultLineOptions, comboSiblingNames: ['line1', 'line2'] };
    const combo = getLineHoverRules(options).find((r) => r.as === 'comboSiblingMatch');
    expect(combo?.expr).toBe(`(isValid(line1_${HOVERED_ITEM}) || isValid(line2_${HOVERED_ITEM})) ? 1 : 0`);
  });

  test('composes all rule types in a stable order', () => {
    const options = {
      ...defaultLineOptions,
      interactiveMarkName: 'line0',
      popoverMarkName: 'line0',
      comboSiblingNames: ['line1'],
    };
    expect(asNames(options)).toEqual([
      'hoveredMatch',
      'controlledTableMatch',
      'controlledSeriesMatch',
      'popoverMatch',
      'comboSiblingMatch',
    ]);
  });
});
