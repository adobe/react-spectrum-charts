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
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_SYMBOL_WIDTH,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';
import { spectrum2Colors } from '@spectrum-charts/themes';

import { LegendSpecOptions } from '../types';
import { defaultLegendOptions } from './legendTestUtils';
import {
  getClickEncodings,
  getColumns,
  getHiddenSeriesColorRule,
  getSymbolEncodings,
  getSymbolType,
  mergeLegendEncodings,
} from './legendUtils';
import type { Facet } from './legendUtils';

describe('getSymbolEncodings()', () => {
  test('no factes and no custom values, should return all the defaults', () => {
    expect(getSymbolEncodings([], defaultLegendOptions)).toStrictEqual({
      entries: { name: 'legend0_legendEntry' },
      symbols: {
        enter: {},
        update: {
          fill: [{ value: spectrum2Colors.light['categorical-100'] }],
          stroke: [{ value: spectrum2Colors.light['categorical-100'] }],
        },
      },
    });
  });

  describe('colorOverrides', () => {
    test('returns production rules with one override and scale fallback when color and colorOverrides are set', () => {
      const options: LegendSpecOptions = {
        ...defaultLegendOptions,
        color: 'browser',
        colorOverrides: { Firefox: '#e34850' },
      };
      const result = getSymbolEncodings([], options);
      const fill = result.symbols.update?.fill as unknown[];
      expect(fill).toHaveLength(2);
      expect(fill[0]).toStrictEqual({
        test: "data('legend0Aggregate')[datum.index].browser === \"Firefox\"",
        value: '#e34850',
      });
      expect(fill[1]).toHaveProperty('signal');
      expect((fill[1] as { signal: string }).signal).toContain("scale('color'");
    });

    test('returns multiple override rules in order before scale fallback', () => {
      const options: LegendSpecOptions = {
        ...defaultLegendOptions,
        color: 'browser',
        colorOverrides: { Firefox: '#e34850', Chrome: '#2680eb', Safari: '#2d9d78' },
      };
      const result = getSymbolEncodings([], options);
      const fill = result.symbols.update?.fill as unknown[];
      expect(fill).toHaveLength(4);
      expect(fill[0]).toStrictEqual({
        test: "data('legend0Aggregate')[datum.index].browser === \"Firefox\"",
        value: '#e34850',
      });
      expect(fill[1]).toStrictEqual({
        test: "data('legend0Aggregate')[datum.index].browser === \"Chrome\"",
        value: '#2680eb',
      });
      expect(fill[2]).toStrictEqual({
        test: "data('legend0Aggregate')[datum.index].browser === \"Safari\"",
        value: '#2d9d78',
      });
      expect(fill[3]).toHaveProperty('signal');
    });

    test('uses scale-only path when colorOverrides is empty object', () => {
      const options: LegendSpecOptions = {
        ...defaultLegendOptions,
        color: 'browser',
        colorOverrides: {},
      };
      const result = getSymbolEncodings([], options);
      const fill = result.symbols.update?.fill as unknown[];
      expect(fill).toHaveLength(1);
      expect(fill[0]).toHaveProperty('signal');
    });

    test('uses scale-only path when colorOverrides is set but no color field (no color option, no color facet)', () => {
      const options: LegendSpecOptions = {
        ...defaultLegendOptions,
        colorOverrides: { Firefox: '#e34850' },
      };
      const result = getSymbolEncodings([], options);
      const fill = result.symbols.update?.fill as unknown[];
      expect(fill).toHaveLength(1);
      expect(fill[0]).toStrictEqual({ value: spectrum2Colors.light['categorical-100'] });
    });

    test('uses color field from facets when color is not a string but color facet exists', () => {
      const facets: Facet[] = [{ facetType: COLOR_SCALE, field: 'browser' }];
      const options: LegendSpecOptions = {
        ...defaultLegendOptions,
        colorOverrides: { Firefox: '#e34850' },
      };
      const result = getSymbolEncodings(facets, options);
      const fill = result.symbols.update?.fill as unknown[];
      expect(fill).toHaveLength(2);
      expect(fill[0]).toStrictEqual({
        test: "data('legend0Aggregate')[datum.index].browser === \"Firefox\"",
        value: '#e34850',
      });
    });

    test('places hidden-series rules before colorOverride rules when isToggleable', () => {
      const options: LegendSpecOptions = {
        ...defaultLegendOptions,
        color: 'browser',
        colorOverrides: { Firefox: '#e34850' },
        isToggleable: true,
      };
      const result = getSymbolEncodings([], options);
      const fill = result.symbols.update?.fill as unknown[];
      expect(fill.length).toBeGreaterThanOrEqual(2);
      expect(fill[0]).toHaveProperty('test');
      expect((fill[0] as { test: string }).test).toMatch(/hiddenSeries|filteredTable/i);
      expect(fill[1]).toStrictEqual({
        test: "data('legend0Aggregate')[datum.index].browser === \"Firefox\"",
        value: '#e34850',
      });
    });

    test('escapes dimension value in test expression via JSON.stringify', () => {
      const dimVal = 'Label with "quotes"';
      const options: LegendSpecOptions = {
        ...defaultLegendOptions,
        color: 'label',
        colorOverrides: { [dimVal]: '#e34850' },
      };
      const result = getSymbolEncodings([], options);
      const fill = result.symbols.update?.fill as unknown[];
      const expectedTest = `data('legend0Aggregate')[datum.index].label === ${JSON.stringify(dimVal)}`;
      expect(fill[0]).toStrictEqual({
        test: expectedTest,
        value: '#e34850',
      });
    });

    test('fill and stroke receive the same colorEncoding', () => {
      const options: LegendSpecOptions = {
        ...defaultLegendOptions,
        color: 'browser',
        colorOverrides: { Firefox: '#e34850' },
      };
      const result = getSymbolEncodings([], options);
      expect(result.symbols.update?.fill).toStrictEqual(result.symbols.update?.stroke);
    });
  });
});

describe('getClickEncodings()', () => {
  test('should return empty object with default options', () => {
    const encodings = getClickEncodings(defaultLegendOptions);
    expect(encodings).toEqual({});
  });
  test('should return entries encodings if isToggleable and no keys', () => {
    const encodings = getClickEncodings({ ...defaultLegendOptions, isToggleable: true });
    expect(encodings).toHaveProperty('entries');
  });
  test('should return entries encodings if hasOnClick', () => {
    const encodings = getClickEncodings({ ...defaultLegendOptions, hasOnClick: true });
    expect(encodings).toHaveProperty('entries');
  });
  test('should return entries encodings if chartPopovers', () => {
    const encodings = getClickEncodings({ ...defaultLegendOptions, chartPopovers: [{}] });
    expect(encodings).toHaveProperty('entries');
  });
});

describe('mergeLegendEncodings()', () => {
  test('should keep last value', () => {
    expect(
      mergeLegendEncodings([
        { entries: { name: 'legendEntry' } },
        { entries: { name: 'legendEntry2' } },
        { entries: { name: 'legendEntry3' } },
      ])
    ).toStrictEqual({ entries: { name: 'legendEntry3' } });
  });

  test('should combine unique keys', () => {
    expect(
      mergeLegendEncodings([
        { entries: { name: 'legendEntry' } },
        { labels: { name: 'legendLabel' } },
        { title: { name: 'legendTitle' } },
      ])
    ).toStrictEqual({
      entries: { name: 'legendEntry' },
      labels: { name: 'legendLabel' },
      title: { name: 'legendTitle' },
    });
  });

  test('should merge deep properties', () => {
    expect(
      mergeLegendEncodings([
        {
          entries: {
            name: 'legendEntry',
            enter: { cursor: { value: 'default' }, fill: { value: 'transparent' } },
          },
        },
        { entries: { name: 'legendEntry', interactive: true, enter: { cursor: { value: 'pointer' } } } },
      ])
    ).toStrictEqual({
      entries: {
        name: 'legendEntry',
        interactive: true,
        enter: { cursor: { value: 'pointer' }, fill: { value: 'transparent' } },
      },
    });
  });
});

describe('getSymbolType()', () => {
  test('should return the symbolShape if a static value is provided', () => {
    expect(getSymbolType({ value: 'diamond' })).toStrictEqual('diamond');
  });
  test('should default to circle if static value is not provided', () => {
    expect(getSymbolType('series')).toStrictEqual('circle');
  });
});

describe('getHiddenSeriesColorRule()', () => {
  test('should return empty array if not toggleable and no hiddenSeries', () => {
    expect(getHiddenSeriesColorRule(defaultLegendOptions, 'gray-300')).toEqual([]);
  });

  test('should use filteredTable if there are keys', () => {
    const colorRules = getHiddenSeriesColorRule(
      { ...defaultLegendOptions, isToggleable: true, keys: ['key1'] },
      'gray-300'
    );
    expect(colorRules[0].test).toContain(FILTERED_TABLE);
  });

  test('should look at hiddenSeries if there are not any keys', () => {
    const colorRules = getHiddenSeriesColorRule({ ...defaultLegendOptions, isToggleable: true }, 'gray-300');
    expect(colorRules[0].test).toContain('hiddenSeries');
  });
});

describe('getColumns()', () => {
  test('should return undefined for left position', () => {
    expect(getColumns('left')).toBeUndefined();
  });

  test('should return undefined for right position', () => {
    expect(getColumns('right')).toBeUndefined();
  });

  test('should return default signal for top position without labelLimit', () => {
    expect(getColumns('top')).toEqual({ signal: 'floor(width / 220)' });
  });

  test('should return default signal for bottom position without labelLimit', () => {
    expect(getColumns('bottom')).toEqual({ signal: 'floor(width / 220)' });
  });

  test('should return default signal when labelLimit is undefined', () => {
    expect(getColumns('top', undefined)).toEqual({ signal: 'floor(width / 220)' });
  });

  test('should return default signal when labelLimit is 0', () => {
    expect(getColumns('bottom', 0)).toEqual({ signal: 'floor(width / 220)' });
  });

  test('should return default signal when labelLimit is negative', () => {
    expect(getColumns('top', -10)).toEqual({ signal: 'floor(width / 220)' });
  });

  test('should calculate columns based on labelLimit when provided', () => {
    const labelLimit = 100;
    const expectedItemWidth = labelLimit + DEFAULT_LEGEND_SYMBOL_WIDTH + DEFAULT_LEGEND_COLUMN_PADDING;
    const expectedSignal = `max(1, floor(width / ${expectedItemWidth}))`;

    expect(getColumns('top', labelLimit)).toEqual({ signal: expectedSignal });
  });

  test('should calculate columns with different labelLimit values', () => {
    const labelLimit50 = 50;
    const expectedItemWidth50 = 50 + DEFAULT_LEGEND_SYMBOL_WIDTH + DEFAULT_LEGEND_COLUMN_PADDING;
    expect(getColumns('bottom', labelLimit50)).toEqual({
      signal: `max(1, floor(width / ${expectedItemWidth50}))`,
    });

    const labelLimit200 = 200;
    const expectedItemWidth200 = 200 + DEFAULT_LEGEND_SYMBOL_WIDTH + DEFAULT_LEGEND_COLUMN_PADDING; // 200 + 16 + 20 = 236
    expect(getColumns('top', labelLimit200)).toEqual({
      signal: `max(1, floor(width / ${expectedItemWidth200}))`,
    });
  });
});
