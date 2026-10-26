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
import { FilterTransform, FormulaTransform } from 'vega';

import {
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  GROUP_ID,
  HOVERED_ITEM,
  SELECTED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/core-s2/constants';

import {
  getHoverLabelData,
  getInBoundsHoverData,
  getInPlotMetricFilter,
  getLineHighlightedData,
  getLineHoverRules,
  getPrimarySeriesOtherExpr,
} from './lineDataUtils.js';
import { defaultLineOptions } from './lineTestUtils.js';

describe('getInBoundsHoverData()', () => {
  test('filters invalid and out-of-bounds metrics without filtering the rendered line data', () => {
    expect(getInBoundsHoverData(defaultLineOptions, 'filteredTableForInspect')).toEqual({
      name: 'line0_visibleHoverData',
      source: 'filteredTableForInspect',
      transform: [
        {
          type: 'filter',
          expr: 'isValid(datum["value"]) && isFinite(datum["value"]) && inrange(scale(\'yLinear\', datum["value"]), [0, height])',
        },
      ],
    });
  });

  test('uses the forecast metric and custom metric scale', () => {
    const data = getInBoundsHoverData(
      {
        ...defaultLineOptions,
        metricAxis: 'customMetric',
        forecasts: [{ metric: 'forecastValue', start: 5 }],
      },
      'filteredTableForInspect'
    );
    expect(data.transform?.[0]).toHaveProperty(
      'expr',
      expect.stringContaining(`scale('customMetric', datum["line0_effectiveValue"])`)
    );
  });
});

describe('getInPlotMetricFilter()', () => {
  test('uses the provided metric field', () => {
    expect(getInPlotMetricFilter(defaultLineOptions, 'other')).toHaveProperty(
      'expr',
      'isValid(datum["other"]) && isFinite(datum["other"]) && inrange(scale(\'yLinear\', datum["other"]), [0, height])'
    );
  });
});

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
  test('should limit controlled items to the highlighted series and legend-hovered series', () => {
    const expr = (
      getLineHighlightedData({ ...defaultLineOptions, legendHighlightSignals: ['legend0_hoveredSeries'] })
        .transform?.[0] as FilterTransform
    ).expr;
    expect(expr).toContain(`(!isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) || ${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID})`);
    expect(expr).toContain(`(!isValid(legend0_hoveredSeries) || legend0_hoveredSeries === datum.${SERIES_ID})`);
  });
});

describe('getHoverLabelData()', () => {
  test('uses the raw metric field when there is no forecast', () => {
    const scaledYFormula = getHoverLabelData(defaultLineOptions).transform?.[2] as FormulaTransform;
    expect(scaledYFormula.expr).toBe(`scale('yLinear', datum["${defaultLineOptions.metric}"])`);
  });

  test('uses the forecast-aware effectiveValue field when a forecast is active', () => {
    const scaledYFormula = getHoverLabelData({
      ...defaultLineOptions,
      forecasts: [{ metric: 'forecastValue', start: 5 }],
    }).transform?.[2] as FormulaTransform;
    expect(scaledYFormula.expr).toBe(`scale('yLinear', datum["${defaultLineOptions.name}_effectiveValue"])`);
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
  test('without interactiveMarkName, popoverMarkName, or comboSiblingNames only includes the controlled rules', () => {
    const rules = getLineHoverRules(defaultLineOptions);
    expect(rules).toStrictEqual([
      {
        as: 'controlledTableMatch',
        expr: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}')) ? (indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : 0) : null`,
      },
      {
        as: 'controlledSeriesMatch',
        expr: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) ? (${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null`,
      },
    ]);
  });

  test('with interactiveMarkName adds a hoveredMatch rule keyed off the hovered-item signal', () => {
    const rules = getLineHoverRules({ ...defaultLineOptions, interactiveMarkName: 'line0' });
    expect(rules[0]).toStrictEqual({
      as: 'hoveredMatch',
      expr: `isValid(line0_${HOVERED_ITEM}) ? (line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : 0) : null`,
    });
  });

  test('with interactiveMarkName and isHighlightedByGroup, hoveredMatch checks the highlightedData set instead', () => {
    const rules = getLineHoverRules({
      ...defaultLineOptions,
      interactiveMarkName: 'line0',
      isHighlightedByGroup: true,
    });
    expect(rules[0]).toStrictEqual({
      as: 'hoveredMatch',
      expr: `length(data('line0_highlightedData')) ? (indexof(pluck(data('line0_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1 ? 1 : 0) : null`,
    });
  });

  test('with popoverMarkName adds a popoverMatch rule keyed off the selected series', () => {
    const rules = getLineHoverRules({ ...defaultLineOptions, popoverMarkName: 'line0' });
    const popoverRule = rules.find((r) => r.as === 'popoverMatch');
    expect(popoverRule).toStrictEqual({
      as: 'popoverMatch',
      expr: `isValid(${SELECTED_SERIES}) ? (${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null`,
    });
  });

  test('with comboSiblingNames adds a comboSiblingMatch rule checking every sibling hovered-item signal', () => {
    const rules = getLineHoverRules({ ...defaultLineOptions, comboSiblingNames: ['bar0', 'bar1'] });
    const comboRule = rules.find((r) => r.as === 'comboSiblingMatch');
    expect(comboRule).toStrictEqual({
      as: 'comboSiblingMatch',
      expr: `(isValid(bar0_${HOVERED_ITEM}) || isValid(bar1_${HOVERED_ITEM})) ? 1 : 0`,
    });
  });

  test('composes all rules together in order when every condition applies', () => {
    const rules = getLineHoverRules({
      ...defaultLineOptions,
      interactiveMarkName: 'line0',
      popoverMarkName: 'line0',
      comboSiblingNames: ['bar0'],
    });
    expect(rules.map((r) => r.as)).toStrictEqual([
      'hoveredMatch',
      'controlledTableMatch',
      'controlledSeriesMatch',
      'popoverMatch',
      'comboSiblingMatch',
    ]);
  });
});
