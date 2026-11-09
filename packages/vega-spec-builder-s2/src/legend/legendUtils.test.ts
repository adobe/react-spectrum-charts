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
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_LABEL_LIMIT,
  DEFAULT_LEGEND_SYMBOL_WIDTH,
  DEFAULT_OPACITY_RULE,
  FADE_FACTOR,
  FILTERED_TABLE,
  GROUP_ID,
  ROUNDED_SQUARE_PATH,
  SERIES_ID,
} from '@spectrum-charts/core-s2/constants';
import { spectrum2Colors } from '@spectrum-charts/core-s2/tokens';

import { getDeemphasisRamp } from '../marks/hoverAnimationUtils.js';
import { defaultLegendOptions } from './legendTestUtils.js';
import {
  getClickEncodings,
  getColumns,
  getHiddenSeriesColorRule,
  getLegendOpacity,
  getOpacityEncoding,
  getShowHideEncodings,
  getSymbolEncodings,
  getSymbolType,
  mergeLegendEncodings,
} from './legendUtils.js';

const hiddenTest = 'indexof(hiddenSeries, datum.value) !== -1';

describe('getSymbolEncodings()', () => {
  test('no facets and no custom values, should return all the defaults', () => {
    expect(getSymbolEncodings([], defaultLegendOptions)).toStrictEqual({
      entries: { name: 'legend0_legendEntry' },
      symbols: {
        enter: {},
        update: {
          fill: [
            { test: hiddenTest, value: spectrum2Colors.light['gray-500'] },
            { value: spectrum2Colors.light['categorical-100'] },
          ],
          stroke: [{ test: hiddenTest, value: 'transparent' }, { value: spectrum2Colors.light['categorical-100'] }],
          shape: { signal: `legendSymbolShape(${JSON.stringify(ROUNDED_SQUARE_PATH)}, ${hiddenTest})` },
        },
      },
    });
  });

  test('isToggleable: true should use a gray-700 hidden fill rule and a transparent hidden stroke rule', () => {
    const encodings = getSymbolEncodings([], { ...defaultLegendOptions, isToggleable: true });
    expect(encodings.symbols?.update?.fill).toStrictEqual([
      { test: hiddenTest, value: spectrum2Colors.light['gray-700'] },
      { value: spectrum2Colors.light['categorical-100'] },
    ]);
    // Stroke color (not width, which Vega's legend layout parser requires to stay a single
    // value) is made transparent so the icon's fine linework isn't outlined/bolded.
    expect(encodings.symbols?.update?.stroke).toStrictEqual([
      { test: hiddenTest, value: 'transparent' },
      { value: spectrum2Colors.light['categorical-100'] },
    ]);
  });

  test('should pass a custom symbol shape to legendSymbolShape', () => {
    const encodings = getSymbolEncodings([], { ...defaultLegendOptions, symbolShape: { value: 'circle' } });
    expect(encodings.symbols?.update?.shape).toStrictEqual({ signal: `legendSymbolShape("circle", ${hiddenTest})` });
  });

  test('should pass a faceted symbol shape signal to legendSymbolShape', () => {
    const encodings = getSymbolEncodings([], { ...defaultLegendOptions, symbolShape: 'shape' });
    expect(encodings.symbols?.update?.shape).toStrictEqual({
      signal: `legendSymbolShape(scale('symbolShape', data('legend0Aggregate')[datum.index].shape), ${hiddenTest})`,
    });
  });

  test('isToggleable with keys should use filteredTable rule for the shape and color swap', () => {
    const encodings = getSymbolEncodings([], { ...defaultLegendOptions, isToggleable: true, keys: ['key1'] });
    const shape = encodings.symbols?.update?.shape as { signal: string };
    expect(shape.signal).toContain(FILTERED_TABLE);
    expect(shape.signal).toContain(GROUP_ID);

    const hiddenFillRule = encodings.symbols?.update?.fill?.[0] as { test?: string; value?: string };
    expect(hiddenFillRule?.test).toContain(FILTERED_TABLE);
    expect(hiddenFillRule?.value).toBe(spectrum2Colors.light['gray-700']);

    const hiddenStrokeRule = encodings.symbols?.update?.stroke?.[0] as { test?: string; value?: string };
    expect(hiddenStrokeRule?.test).toContain(FILTERED_TABLE);
    expect(hiddenStrokeRule?.value).toBe('transparent');
  });
});

describe('getShowHideEncodings()', () => {
  test('isToggleable should return gray-700 for all labels with no hidden rule', () => {
    const encodings = getShowHideEncodings({ ...defaultLegendOptions, isToggleable: true });
    expect(encodings.labels?.update?.fill).toStrictEqual([{ value: spectrum2Colors.light['gray-700'] }]);
  });

  test('controlled hiddenSeries (non-toggleable) should gray-out hidden labels to gray-500', () => {
    const encodings = getShowHideEncodings({ ...defaultLegendOptions, hiddenSeries: ['Mac'] });
    const fill = encodings.labels?.update?.fill as { test?: string; value?: string }[];
    expect(fill[0]?.test).toContain('hiddenSeries');
    expect(fill[0]?.value).toBe(spectrum2Colors.light['gray-500']);
    expect(fill[1]).toStrictEqual({ value: spectrum2Colors.light['gray-700'] });
  });

  test('non-toggleable without hiddenSeries should still gray-out labels when hiddenSeries changes later', () => {
    const encodings = getShowHideEncodings(defaultLegendOptions);
    expect(encodings.labels?.update?.fill).toStrictEqual([
      { test: hiddenTest, value: spectrum2Colors.light['gray-500'] },
      { value: spectrum2Colors.light['gray-700'] },
    ]);
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
  test('should return a hiddenSeries rule even if not toggleable and no hiddenSeries', () => {
    expect(getHiddenSeriesColorRule(defaultLegendOptions, 'gray-300')).toEqual([
      { test: hiddenTest, value: spectrum2Colors.light['gray-300'] },
    ]);
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
    expect(getColumns('top', 'legend0', undefined)).toEqual(
      getExpectedColumnsSignal('legend0', DEFAULT_LEGEND_LABEL_LIMIT)
    );
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

describe('getLegendOpacity()', () => {
  test('falls back to getOpacityEncoding when userMeta has no animatedMarks', () => {
    const options = { ...defaultLegendOptions, highlight: true };
    expect(getLegendOpacity(options, {})).toStrictEqual(getOpacityEncoding(options, {}));
  });

  test('falls back to getOpacityEncoding when animatedMarks is empty', () => {
    const options = { ...defaultLegendOptions, highlight: true };
    expect(getLegendOpacity(options, { animatedMarks: [] })).toStrictEqual(getOpacityEncoding(options, {}));
  });

  test('builds a per-series animated rule for an ungrouped legend, reading the series-aggregated fraction data', () => {
    // line's fraction data is already one row per series, so this aggregate is a no-op
    const fractionData = `data('line0_hoverSeriesFractionData')`;
    const fraction = `hoverFraction(${fractionData}, '${SERIES_ID}', datum.value, ${FADE_FACTOR})`;
    const ramp = getDeemphasisRamp(fraction);

    expect(getLegendOpacity(defaultLegendOptions, { animatedMarks: ['line0'] })).toStrictEqual([
      {
        test: `length(${fractionData})`,
        signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
      },
      DEFAULT_OPACITY_RULE,
    ]);
  });

  test('uses the group fraction data and legend group id field when keys are provided', () => {
    const options = { ...defaultLegendOptions, keys: ['category'] };
    const fractionData = `data('line0_hoverGroupFractionData')`;
    const fraction = `hoverFraction(${fractionData}, '${options.name}_${GROUP_ID}', datum.value, ${FADE_FACTOR})`;
    const ramp = getDeemphasisRamp(fraction);

    expect(getLegendOpacity(options, { animatedMarks: ['line0'] })).toStrictEqual([
      {
        test: `length(${fractionData})`,
        signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
      },
      DEFAULT_OPACITY_RULE,
    ]);
  });

  test('adds one rule per registered animated mark, plus the fallback rule', () => {
    const result = getLegendOpacity(defaultLegendOptions, { animatedMarks: ['line0', 'line1'] });
    expect(Array.isArray(result) && result).toHaveLength(3);
    expect(Array.isArray(result) && result[2]).toEqual(DEFAULT_OPACITY_RULE);
  });
});
