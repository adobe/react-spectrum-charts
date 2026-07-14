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
import { SourceData } from 'vega';

import { DEFAULT_LEGEND_COLUMN_PADDING, DEFAULT_LEGEND_LABEL_LIMIT, DEFAULT_LEGEND_SYMBOL_WIDTH, FILTERED_TABLE } from '@spectrum-charts/constants';
import { spectrumColors } from '@spectrum-charts/themes';

import { defaultLegendOptions } from './legendTestUtils';
import {
  getClickEncodings,
  getColumns,
  getDisplayLabelExpr,
  getHiddenSeriesColorRule,
  getPreferredColumns,
  getPreferredColumnsData,
  getPreferredLabelLimit,
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

// Mirrors getFitExpr in legendUtils.ts: (n - 1) * DEFAULT_LEGEND_COLUMN_PADDING (20) inter-column padding
const getExpectedFitExpr = (name: string, n: number) => {
  const interColumnPadding = (n - 1) * DEFAULT_LEGEND_COLUMN_PADDING;
  return `length(data('${name}_fit_${n}')) > 0 && (data('${name}_fit_${n}')[0].totalWidth + ${interColumnPadding} <= width)`;
};

describe('getPreferredColumns()', () => {
  test('should chain candidates in order and fall back to the last value', () => {
    expect(getPreferredColumns('legend0', [5, 3])).toEqual({
      signal: `${getExpectedFitExpr('legend0', 5)} ? 5 : ${getExpectedFitExpr('legend0', 3)} ? 3 : 3`,
    });
  });

  test('should use the legend name in the data reference', () => {
    expect(getPreferredColumns('myLegend', [4])).toEqual({
      signal: `${getExpectedFitExpr('myLegend', 4)} ? 4 : 4`,
    });
  });
});

describe('getPreferredLabelLimit()', () => {
  test('should emit 0 only while a non-last candidate fits, else the fair-share width for the last count', () => {
    // last value n=3 fair share: (width - (3-1)*20) / 3 - (18 swatch + 4 labelOffset)
    expect(getPreferredLabelLimit('legend0', [5, 3])).toEqual({
      signal: `(${getExpectedFitExpr('legend0', 5)}) ? 0 : (width - 40) / 3 - 22`,
    });
  });

  test('should always emit the fair-share width when there is a single candidate', () => {
    expect(getPreferredLabelLimit('legend0', [3])).toEqual({ signal: '(width - 40) / 3 - 22' });
  });
});

describe('getPreferredColumnsData()', () => {
  test('should emit an indexed label-widths source plus one fit source per candidate', () => {
    const data = getPreferredColumnsData('legend0', [5, 3]);
    expect(data.map((d) => d.name)).toEqual(['legend0_labelWidths', 'legend0_fit_5', 'legend0_fit_3']);
  });

  test('should index entries with a row_number window matching Vega entry order', () => {
    const [labelWidths] = getPreferredColumnsData('legend0', [5, 3]);
    expect((labelWidths as SourceData).source).toEqual('legend0Aggregate');
    expect(labelWidths.transform).toContainEqual({ type: 'window', ops: ['row_number'], as: ['legendIndex'] });
    expect(labelWidths.transform).toContainEqual({
      type: 'formula',
      as: 'displayLabel',
      expr: getDisplayLabelExpr('legend0'),
    });
  });

  test('should assign each entry to column = index % N per candidate', () => {
    const [, fit5, fit3] = getPreferredColumnsData('legend0', [5, 3]);
    expect(fit5.transform?.[0]).toEqual({ type: 'formula', as: 'col', expr: '(datum.legendIndex - 1) % 5' });
    expect(fit3.transform?.[0]).toEqual({ type: 'formula', as: 'col', expr: '(datum.legendIndex - 1) % 3' });
  });

  test('should size each column to its widest label then sum the column totals', () => {
    const [, fit5] = getPreferredColumnsData('legend0', [5, 3]);
    expect(fit5.transform).toContainEqual({
      type: 'aggregate',
      groupby: ['col'],
      fields: ['labelWidth'],
      ops: ['max'],
      as: ['colWidth'],
    });
    // per-column chrome: 18 swatch + 4 labelOffset
    expect(fit5.transform).toContainEqual({ type: 'formula', as: 'colTotal', expr: 'datum.colWidth + 22' });
    expect(fit5.transform).toContainEqual({
      type: 'aggregate',
      fields: ['colTotal'],
      ops: ['sum'],
      as: ['totalWidth'],
    });
  });
});
