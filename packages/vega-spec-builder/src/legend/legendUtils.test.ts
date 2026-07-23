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
import { DEFAULT_LEGEND_COLUMN_PADDING, DEFAULT_LEGEND_LABEL_LIMIT, DEFAULT_LEGEND_SYMBOL_WIDTH, FILTERED_TABLE } from '@spectrum-charts/constants';
import { spectrumColors } from '@spectrum-charts/themes';

import { defaultLegendOptions } from './legendTestUtils';
import {
  getClickEncodings,
  getColumns,
  getHiddenSeriesColorRule,
  getSymbolEncodings,
  getSymbolType,
  mergeLegendEncodings,
} from './legendUtils';

describe('getSymbolEncodings()', () => {
  test('no factes and no custom values, should return all the defaults', () => {
    expect(getSymbolEncodings([], defaultLegendOptions)).toStrictEqual({
      entries: { name: 'legend0_legendEntry' },
      symbols: {
        enter: {},
        update: {
          fill: [{ value: spectrumColors.light['categorical-100'] }],
          stroke: [{ value: spectrumColors.light['categorical-100'] }],
        },
      },
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

const getExpectedColumnsSignal = (name: string, effectiveLabelLimit: number) => {
  const symbolAndSpacingWidth = DEFAULT_LEGEND_SYMBOL_WIDTH + DEFAULT_LEGEND_COLUMN_PADDING;
  const maxWidthExpr = `length(data('${name}_maxLabelWidth')) > 0 ? data('${name}_maxLabelWidth')[0].maxLabelWidth : ${effectiveLabelLimit}`;
  return { signal: `max(1, floor(width / (min(${maxWidthExpr}, ${effectiveLabelLimit}) + ${symbolAndSpacingWidth})))` };
};

describe('getColumns()', () => {
  test('should return undefined for left position', () => {
    expect(getColumns('left', 'legend0')).toBeUndefined();
  });

  test('should return undefined for right position', () => {
    expect(getColumns('right', 'legend0')).toBeUndefined();
  });

  test('should use DEFAULT_LEGEND_LABEL_LIMIT when no labelLimit provided for top position', () => {
    expect(getColumns('top', 'legend0')).toEqual(getExpectedColumnsSignal('legend0', DEFAULT_LEGEND_LABEL_LIMIT));
  });

  test('should use DEFAULT_LEGEND_LABEL_LIMIT when no labelLimit provided for bottom position', () => {
    expect(getColumns('bottom', 'legend0')).toEqual(getExpectedColumnsSignal('legend0', DEFAULT_LEGEND_LABEL_LIMIT));
  });

  test('should use DEFAULT_LEGEND_LABEL_LIMIT when labelLimit is undefined', () => {
    expect(getColumns('top', 'legend0', undefined)).toEqual(getExpectedColumnsSignal('legend0', DEFAULT_LEGEND_LABEL_LIMIT));
  });

  test('should use measured label widths capped at labelLimit when labelLimit is provided', () => {
    expect(getColumns('top', 'legend0', 100)).toEqual(getExpectedColumnsSignal('legend0', 100));
  });

  test('should use measured label widths capped at labelLimit for various labelLimit values', () => {
    expect(getColumns('bottom', 'legend0', 50)).toEqual(getExpectedColumnsSignal('legend0', 50));
    expect(getColumns('top', 'legend0', 200)).toEqual(getExpectedColumnsSignal('legend0', 200));
  });

  test('should use legend name in the data reference', () => {
    expect(getColumns('top', 'myLegend', 100)).toEqual(getExpectedColumnsSignal('myLegend', 100));
  });
});

