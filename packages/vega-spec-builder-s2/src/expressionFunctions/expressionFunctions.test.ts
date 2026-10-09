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
import { Spec, View, changeset, expressionFunction, parse } from 'vega';
import { expressionInterpreter } from 'vega-interpreter';

import { numberLocales } from '@spectrum-charts/core-s2/locales';

import {
  LabelDatum,
  expressionFunctions,
  formatHorizontalTimeAxisLabels,
  formatLocaleCurrency,
  formatPercentWithValue,
  formatShortNumber,
  formatTimeDurationLabels,
  formatVerticalAxisTimeLabels,
  hoverFraction,
  isDonutLabelVisible,
} from './expressionFunctions.js';

describe('isDonutLabelVisible()', () => {
  const data = [
    { id: 'large', hemisphere: 'left', boxes: [[10, 80, 86, 114]], topY: 86, arcLength: 4 },
    { id: 'middle', hemisphere: 'left', boxes: [[10, 80, 106, 134]], topY: 106, arcLength: 3 },
    { id: 'small', hemisphere: 'left', boxes: [[10, 80, 132, 160]], topY: 132, arcLength: 2 },
    { id: 'separate-x', hemisphere: 'left', boxes: [[90, 150, 90, 110]], topY: 90, arcLength: 1.5 },
    { id: 'other-side', hemisphere: 'right', boxes: [[10, 80, 86, 114]], topY: 86, arcLength: 1 },
  ];
  const isVisible = (datum: (typeof data)[number]) =>
    isDonutLabelVisible(data, datum, 'hemisphere', 'boxes', 'arcLength', 'id');

  test('keeps fixed labels that do not overlap an accepted label', () => {
    expect(isVisible(data[0])).toBe(true);
    expect(isVisible(data[2])).toBe(true);
    expect(isVisible(data[3])).toBe(true);
    expect(isVisible(data[4])).toBe(true);
  });

  test('hides a smaller label that overlaps an accepted label', () => {
    expect(isVisible(data[1])).toBe(false);
  });

  describe('with a hovered label', () => {
    const isVisibleWhileHovering = (datum: (typeof data)[number], hoveredId: unknown) =>
      isDonutLabelVisible(data, datum, 'hemisphere', 'boxes', 'arcLength', 'id', hoveredId);

    test('shows the hovered label and hides the higher-priority labels it overlaps', () => {
      expect(isVisibleWhileHovering(data[1], 'middle')).toBe(true);
      expect(isVisibleWhileHovering(data[0], 'middle')).toBe(false);
      expect(isVisibleWhileHovering(data[2], 'middle')).toBe(false);
    });

    test('keeps labels that do not overlap the hovered label', () => {
      expect(isVisibleWhileHovering(data[3], 'middle')).toBe(true);
      expect(isVisibleWhileHovering(data[4], 'middle')).toBe(true);
    });

    test('does not affect labels in the other hemisphere', () => {
      data.forEach((datum) => {
        expect(isVisibleWhileHovering(datum, 'other-side')).toBe(isVisible(datum));
      });
    });

    test.each([null, undefined, 'missing'])('matches the default visibility when hoveredId is %s', (hoveredId) => {
      data.forEach((datum) => {
        expect(isVisibleWhileHovering(datum, hoveredId)).toBe(isVisible(datum));
      });
    });
  });
});

describe('formatLocaleCurrency()', () => {
  test('formats US currency correctly', () => {
    const formatter = formatLocaleCurrency();
    const datum: LabelDatum = { index: 0, label: '', value: 1234.56 };

    expect(formatter(datum, 'en-US', 'USD', 'currency')).toBe('$1,234.56');
  });
  test('formats US currency position with EUR currencyCode', () => {
    const formatter = formatLocaleCurrency();
    const datum: LabelDatum = { index: 0, label: '', value: 1234.56 };

    expect(formatter(datum, 'en-US', 'EUR', 'currency')).toBe('€1,234.56');
  });
  test('formats US currency position with JPY currencyCode and fr-FR separators', () => {
    const formatter = formatLocaleCurrency(numberLocales['fr-FR']);
    const datum: LabelDatum = { index: 0, label: '', value: 1234.56 };

    expect(formatter(datum, 'en-US', 'JPY', 'currency')).toBe('¥1 234,56');
  });
  test('formats FR currency position with JPY currencyCode and de-DE separators', () => {
    const formatter = formatLocaleCurrency(numberLocales['de-DE']);
    const datum: LabelDatum = { index: 0, label: '', value: 1234.56 };

    expect(formatter(datum, 'fr-FR', 'JPY', 'currency')).toBe('1.234,56 JPY');
  });
  test('rounds decimals to 2 places', () => {
    const formatter = formatLocaleCurrency(numberLocales['de-DE']);
    const datum: LabelDatum = { index: 0, label: '', value: 1234.5678 };

    expect(formatter(datum, 'fr-FR', 'JPY', 'currency')).toBe('1.234,57 JPY');
  });
  test('adds custom number format precision', () => {
    const formatter = formatLocaleCurrency(numberLocales['de-DE']);
    const datum: LabelDatum = { index: 0, label: '', value: 1234.5678 };

    expect(formatter(datum, 'fr-FR', 'JPY', ',.4f')).toBe('1.234,5678 JPY');
  });
  test('returns value if value is a string', () => {
    const formatter = formatLocaleCurrency(numberLocales['de-DE']);
    const datum: LabelDatum = { index: 0, label: '', value: '1234.56' };

    expect(formatter(datum, 'fr-FR', 'JPY', 'currency')).toBe('1234.56');
  });

  describe('error handling', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('invalid format falls back to default value', () => {
      const formatter = formatLocaleCurrency(numberLocales['de-DE']);
      const datum: LabelDatum = { index: 0, label: '', value: 1234.56 };

      expect(formatter(datum, 'en-US', 'JPY', '.invalidf')).toBe('1.234,56 €');
      expect(console.error).toHaveBeenCalled();
    });
  });
});

describe('getLabelWidth()', () => {
  let measureText: jest.SpyInstance;
  let getLabelWidth: typeof expressionFunctions.getLabelWidth;

  beforeEach(() => {
    measureText = jest.spyOn(CanvasRenderingContext2D.prototype, 'measureText');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ getLabelWidth } = require('./expressionFunctions.js').expressionFunctions);
    });
  });
  afterEach(() => jest.restoreAllMocks());

  test('should reuse one canvas and cache repeated measurements', () => {
    const createElement = jest.spyOn(document, 'createElement');
    const first = getLabelWidth('cache me', 'bold', 13);
    const second = getLabelWidth('cache me', 'bold', 13);
    getLabelWidth('cache me too', 'bold', 13);

    expect(second).toBe(first);
    expect(measureText).toHaveBeenCalledTimes(2);
    expect(createElement.mock.calls.filter(([tag]) => tag === 'canvas')).toHaveLength(1);
  });

  test('should cache by font as well as text', () => {
    getLabelWidth('font key', 'bold', 14);
    getLabelWidth('font key', 'normal', 14);
    getLabelWidth('font key', 'bold', 16);
    getLabelWidth('font key', 'bold', 16);

    expect(measureText).toHaveBeenCalledTimes(3);
  });

  test('should evict only the oldest entry when the cache is full', () => {
    for (let i = 0; i < 5000; i++) getLabelWidth(`label ${i}`, 'bold', 12);
    getLabelWidth('overflow', 'bold', 12);
    measureText.mockClear();

    getLabelWidth('label 1', 'bold', 12);
    expect(measureText).not.toHaveBeenCalled();
    getLabelWidth('label 0', 'bold', 12);
    expect(measureText).toHaveBeenCalledTimes(1);
  });

  describe('with document.fonts', () => {
    const listeners: Record<string, () => void> = {};
    const fonts = {
      status: 'loaded',
      addEventListener: (type: string, listener: () => void) => (listeners[type] = listener),
    };
    beforeEach(() => {
      fonts.status = 'loaded';
      Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
    });
    afterEach(() => {
      delete (document as { fonts?: unknown }).fonts;
    });

    test('should not cache while fonts are loading', () => {
      fonts.status = 'loading';
      getLabelWidth('loading', 'bold', 12);
      getLabelWidth('loading', 'bold', 12);

      expect(measureText).toHaveBeenCalledTimes(2);
    });

    test('should clear the cache when fonts finish loading', () => {
      getLabelWidth('font swap', 'bold', 12);
      listeners.loadingdone();
      getLabelWidth('font swap', 'bold', 12);

      expect(measureText).toHaveBeenCalledTimes(2);
    });
  });
});

describe('truncateText()', () => {
  const longText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit.';
  const shortText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  test('should truncate text that is too long', () => {
    expect(expressionFunctions.truncateText(longText, 24)).toBe('Lorem ipsum dolor s…');
    expect(expressionFunctions.truncateText(longText, 100)).toBe(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsu…'
    );
  });
  test('should not truncate text that is shorter than maxLength', () => {
    expect(expressionFunctions.truncateText(shortText, 100)).toBe(shortText);
  });
});

describe('formatTimeDurationLabels()', () => {
  const formatDurationsEnUS = formatTimeDurationLabels(numberLocales['en-US']);
  const formatDurationsFrFr = formatTimeDurationLabels(numberLocales['fr-FR']);
  const formatDurationsDeDe = formatTimeDurationLabels(numberLocales['de-DE']);

  test('should format hour durations correctly', () => {
    expect(formatDurationsEnUS({ index: 0, label: '0', value: 1 })).toBe('0:01');
    expect(formatDurationsEnUS({ index: 0, label: '0', value: 61 })).toBe('1:01');
    expect(formatDurationsEnUS({ index: 0, label: '0', value: 3661 })).toBe('1:01:01');
    expect(formatDurationsEnUS({ index: 0, label: '0', value: -3661 })).toBe('-1:01:01');
    expect(formatDurationsEnUS({ index: 0, label: '0', value: 3603661 })).toBe('1,001:01:01');
    expect(formatDurationsFrFr({ index: 0, label: '0', value: 3603661 })).toBe('1\u00a0001:01:01');
    expect(formatDurationsDeDe({ index: 0, label: '0', value: 3603661 })).toBe('1.001:01:01');
  });
  test('should default to using en-US', () => {
    const formatDurations = formatTimeDurationLabels();
    expect(formatDurations({ index: 0, label: '0', value: 3603661 })).toBe('1,001:01:01');
  });
  test('should return original string if type of value is string', () => {
    expect(formatDurationsEnUS({ index: 0, label: '0', value: 'hello world!' })).toBe('hello world!');
  });
});

describe('formatHorizontalTimeAxisLabels()', () => {
  let formatter: (datum: LabelDatum) => string;
  beforeEach(() => {
    formatter = formatHorizontalTimeAxisLabels();
  });

  test('should return label if index is 0', () => {
    expect(formatter({ index: 0, label: '2024', value: 1 })).toBe('2024');
    expect(formatter({ index: 0, label: 'Nov', value: 1 })).toBe('Nov');
    expect(formatter({ index: 0, label: 'Nov', value: 2 })).toBe('Nov');
    expect(formatter({ index: 0, label: 'Nov 15', value: 1 })).toBe('Nov 15');
  });

  test('should return "" when previous label was the same', () => {
    expect(formatter({ index: 0, label: '2024', value: 2 })).toBe('2024');
    expect(formatter({ index: 1, label: '2024', value: 2 })).toBe('');
  });
});

describe('formatVerticalAxisTimeLabels()', () => {
  let formatter: (datum: LabelDatum) => string;
  beforeEach(() => {
    formatter = formatVerticalAxisTimeLabels();
  });

  test('should return full label if index is 0', () => {
    expect(formatter({ index: 0, label: '2024 \u2000Jan', value: 1 })).toBe('2024 \u2000Jan');
    expect(formatter({ index: 0, label: 'Nov \u200015', value: 1 })).toBe('Nov \u200015');
    expect(formatter({ index: 0, label: 'Nov \u200015', value: 2 })).toBe('Nov \u200015');
    expect(formatter({ index: 0, label: 'Nov 15 \u200012 AM', value: 1 })).toBe('Nov 15 \u200012 AM');
  });

  test('should drop the larger time granularity when previous label was the same larger time granularity', () => {
    expect(formatter({ index: 0, label: '2024 \u2000Jan', value: 1 })).toBe('2024 \u2000Jan');
    expect(formatter({ index: 1, label: '2024 \u2000Feb', value: 1 })).toBe('Feb');
  });
});

describe('formatShortNumber()', () => {
  test('should revturn the correst string based on the value', () => {
    expect(formatShortNumber('en-US')(123)).toBe('123');
    expect(formatShortNumber('en-US')(1234)).toBe('1.2K');
    expect(formatShortNumber('en-US')(12345)).toBe('12K');
    expect(formatShortNumber('en-US')(123456)).toBe('123K');
    expect(formatShortNumber('en-US')(1234567)).toBe('1.2M');
    expect(formatShortNumber('en-US')(12345678)).toBe('12M');
    expect(formatShortNumber('en-US')(123456789)).toBe('123M');
    expect(formatShortNumber('en-US')(1234567890)).toBe('1.2B');
    expect(formatShortNumber('en-US')(12345678900)).toBe('12B');
    expect(formatShortNumber('en-US')(123456789000)).toBe('123B');
    expect(formatShortNumber('en-US')(1234567890000)).toBe('1.2T');
    expect(formatShortNumber('en-US')(12345678900000)).toBe('12T');
    expect(formatShortNumber('en-US')(123456789000000)).toBe('123T');
    expect(formatShortNumber('en-US')(1234567890000000)).toBe('1235T');
  });
  test('should return the correct string based on locale', () => {
    expect(formatShortNumber('en-US')(123456789)).toBe('123M');
    expect(formatShortNumber('es-ES')(123456789)).toBe('123\u00a0M');
    expect(formatShortNumber('fr-FR')(123456789)).toBe('123\u00a0M');
    expect(formatShortNumber('de-DE')(123456789)).toBe('123\u00a0Mio.');
    expect(formatShortNumber('ja-JP')(123456789)).toBe('1.2億');
    expect(formatShortNumber('zh-CN')(123456789)).toBe('1.2亿');
    expect(formatShortNumber('zh-TW')(123456789)).toBe('1.2億');
    expect(formatShortNumber('ko-KR')(123456789)).toBe('1.2억');
    expect(formatShortNumber('ru-RU')(123456789)).toBe('123\u00a0млн');
    expect(formatShortNumber('pt-BR')(123456789)).toBe('123\u00a0mi');
  });
  test('should use custom decimal symbol if provided', () => {
    expect(
      formatShortNumber({
        decimal: ',',
        thousands: '\u00a0',
        grouping: [3],
        currency: ['', '\u00a0€'],
        percent: '\u202f%',
      })(1234567)
    ).toBe('1,2M');
  });
});

describe('formatPercentWithValue()', () => {
  test('should format the percent to one decimal followed by the short number value', () => {
    expect(formatPercentWithValue('en-US')(0.652, 23456)).toBe('65.2% (23K)');
    expect(formatPercentWithValue('en-US')(0.5, 900)).toBe('50.0% (900)');
  });
  test('should default to en-US', () => {
    expect(formatPercentWithValue()(0.257, 10390)).toBe('25.7% (10K)');
  });
  test('should use the chart locale', () => {
    expect(formatPercentWithValue('fr-FR')(0.652, 23456)).toBe('65,2\u202f% (23\u00a0k)');
  });
  test('should fall back to en-US percent formatting when only a time locale is provided', () => {
    expect(formatPercentWithValue({ time: 'fr-FR' })(0.652, 900)).toBe('65.2% (900)');
  });
});

describe('hoverFraction()', () => {
  test('returns the fraction for the matching row', () => {
    const rows = [
      { id: 'a', fraction: 0.2 },
      { id: 'b', fraction: 0.8 },
    ];
    expect(hoverFraction(rows, 'id', 'b', 0.5)).toBe(0.8);
  });

  test('returns the fallback when there are no rows or no match', () => {
    expect(hoverFraction(undefined, 'id', 'a', 0.5)).toBe(0.5);
    expect(hoverFraction([{ id: 'a', fraction: 0.2 }], 'id', 'z', 0.5)).toBe(0.5);
  });

  test('uses the first row when keys repeat, matching indexof', () => {
    const rows = [
      { id: 'a', fraction: 0.1 },
      { id: 'a', fraction: 0.9 },
    ];
    expect(hoverFraction(rows, 'id', 'a', 0.5)).toBe(0.1);
  });

  test('reads the requested field instead of the fraction', () => {
    const rows = [{ id: 'a', fraction: 0.2, deemphasisOpacity: 0.6 }];
    expect(hoverFraction(rows, 'id', 'a', 1, 'deemphasisOpacity')).toBe(0.6);
    expect(hoverFraction(rows, 'id', 'z', 1, 'deemphasisOpacity')).toBe(1);
  });

  test('reads fractions live when rows are modified in place', () => {
    const rows = [{ id: 'a', fraction: 0.2 }];
    expect(hoverFraction(rows, 'id', 'a', 0.5)).toBe(0.2);
    rows[0].fraction = 0.7;
    expect(hoverFraction(rows, 'id', 'a', 0.5)).toBe(0.7);
  });

  describe('in a Vega view with the CSP-safe interpreter', () => {
    let view: View | undefined;

    beforeEach(() => {
      expressionFunction('hoverFraction', hoverFraction);
    });

    afterEach(() => {
      view?.finalize();
      view = undefined;
    });

    const spec: Spec = {
      data: [
        { name: 'items', values: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
        {
          name: 'fractions',
          values: [
            { id: 'a', fraction: 0.5 },
            { id: 'b', fraction: 0.5 },
          ],
        },
      ],
      marks: [
        {
          type: 'rect',
          name: 'rects',
          from: { data: 'items' },
          encode: { update: { opacity: { signal: "hoverFraction(data('fractions'), 'id', datum.id, 0.25)" } } },
        },
      ],
    };

    type SceneRoot = { items: { items: { items: { opacity: number }[] }[] }[] };
    const getOpacities = (chart: View) =>
      (chart as unknown as { scenegraph: () => { root: SceneRoot } }).scenegraph().root.items[0].items[0].items.map(({ opacity }) => opacity);

    test('re-encodes when the fraction data is modified or grows', async () => {
      view = new View(parse(spec, undefined, { ast: true }), { renderer: 'none', expr: expressionInterpreter });
      await view.runAsync();
      expect(getOpacities(view)).toEqual([0.5, 0.5, 0.25]);

      await view.change('fractions', changeset().modify((d: { id: string }) => d.id === 'b', 'fraction', 0.1)).runAsync();
      expect(getOpacities(view)).toEqual([0.5, 0.1, 0.25]);

      await view.change('fractions', changeset().insert({ id: 'c', fraction: 0.9 })).runAsync();
      expect(getOpacities(view)).toEqual([0.5, 0.1, 0.9]);
    });
  });
});
