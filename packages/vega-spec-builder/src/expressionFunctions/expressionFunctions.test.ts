/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { numberLocales } from '@spectrum-charts/locales';
import { Granularity } from '../types';
import { Locale, TimeLocale } from 'vega';

import {
  LabelDatum,
  LegendLabelWidthDatum,
  expressionFunctions,
  getLocaleCode,
  formatHorizontalTimeAxisLabels,
  formatVerticalAxisTimeLabelTooltips,
  formatLocaleCurrency,
  formatShortNumber,
  formatTimeDurationLabels,
  formatVerticalAxisTimeLabels,
} from './expressionFunctions';

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

describe('getLocaleCode()', () => {
  const originalLanguage = navigator.language;

  afterEach(() => {
    // restore original navigator.language
    Object.defineProperty(window.navigator, 'language', {
      value: originalLanguage,
      configurable: true,
    });
  });

  test('returns the locale string when input is a string', () => {
    expect(getLocaleCode('fr-FR')).toBe('fr-FR');
    expect(getLocaleCode('en-GB')).toBe('en-GB');
  });

  test('returns time locale string when provided in object', () => {
    expect(getLocaleCode({ time: 'de-DE' })).toBe('de-DE');
  });

  test('falls back to navigator.language when time is not a string', () => {
    Object.defineProperty(window.navigator, 'language', {
      value: 'es-ES',
      configurable: true,
    });
    // no time provided
    expect(getLocaleCode({} as Locale)).toBe('es-ES');
    // time provided but not a string (simulating TimeLocale object)
    expect(getLocaleCode({ time: {} as TimeLocale })).toBe('es-ES');
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

describe('wrapLabelText()', () => {
  const longText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris.';
  const shortText = 'Lorem ipsum';

  test('returns a single line when the text already fits within maxWidth', () => {
    expect(expressionFunctions.wrapLabelText(shortText, 200, 3)).toEqual([shortText]);
  });

  test('wraps long text across multiple lines by word, one line per array entry', () => {
    const lines = expressionFunctions.wrapLabelText(longText, 100, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.length).toBeGreaterThan(1);
    // every completed line (all but the last) must fit within maxWidth
    for (const line of lines.slice(0, -1)) {
      expect(expressionFunctions.getLabelWidth(line, 'normal', 12)).toBeLessThanOrEqual(100);
    }
  });

  test('truncates the final line with an ellipsis when text still overflows after wrapping to maxLines', () => {
    const lines = expressionFunctions.wrapLabelText(longText, 30, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
  });

  test('behaves like truncateText when maxLines is 1', () => {
    expect(expressionFunctions.wrapLabelText(longText, 60, 1)).toEqual([
      expressionFunctions.truncateText(longText, 60),
    ]);
  });

  test('never produces more lines than maxLines', () => {
    const lines = expressionFunctions.wrapLabelText(longText, 30, 2);
    expect(lines.length).toBeLessThanOrEqual(2);
  });

  // Issue A: a final line whose width falls in truncateText's reserved ellipsis band
  // (maxWidth - 4, maxWidth] must be kept verbatim, not ellipsized.
  test('keeps a final line that fits maxWidth even when it lands in the ellipsis-reserve band', () => {
    // 'hello world' is 11 wide, inside (12 - 4, 12]; it fits on one line and must not truncate.
    expect(expressionFunctions.wrapLabelText('hello world', 12, 3)).toEqual(['hello world']);
  });

  test('wraps a fitting trailing word onto a spare line instead of truncating it', () => {
    // Both words fit at width 8; the trailing word wraps rather than being ellipsized on line 1.
    expect(expressionFunctions.wrapLabelText('hello world', 8, 3)).toEqual(['hello', 'world']);
  });

  // Issue B: an over-wide word committed to an intermediate line is truncated progressively so the
  // line collapses toward maxWidth rather than overflowing the column.
  test('truncates an over-wide word on an intermediate line so it fits maxWidth', () => {
    const lines = expressionFunctions.wrapLabelText('Supercalifragilistic short', 12, 2);
    expect(lines).toHaveLength(2);
    expect(lines[0].endsWith('…')).toBe(true);
    expect(expressionFunctions.getLabelWidth(lines[0], 'normal', 12)).toBeLessThanOrEqual(12);
  });
});

describe('wrapTruncates()', () => {
  const longText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris.';
  const shortText = 'Lorem ipsum';

  test('returns false when the text fits within maxLines at maxWidth', () => {
    expect(expressionFunctions.wrapTruncates(shortText, 200, 3)).toBe(false);
  });

  test('returns false when the whole text fits on one line at a generous width', () => {
    expect(expressionFunctions.wrapTruncates(longText, 2000, 2)).toBe(false);
  });

  test('returns true when the text needs more than maxLines lines', () => {
    expect(expressionFunctions.wrapTruncates(longText, 30, 2)).toBe(true);
  });

  test('returns true when a single word is wider than maxWidth', () => {
    expect(expressionFunctions.wrapTruncates('Supercalifragilisticexpialidocious', 20, 3)).toBe(true);
  });

  test('agrees with wrapLabelText: truncates exactly when the wrapped result is ellipsized', () => {
    const lines = expressionFunctions.wrapLabelText(longText, 30, 2);
    const wasTruncated = lines[lines.length - 1].endsWith('…');
    expect(expressionFunctions.wrapTruncates(longText, 30, 2)).toBe(wasTruncated);
  });

  // Both use the same maxWidth threshold: within truncateText's reserved band (maxWidth - 4, maxWidth]
  // wrapTruncates must report "fits" and wrapLabelText must not ellipsize, so the fit prediction that
  // drives the column/wrap decision matches what actually renders.
  test('agrees with wrapLabelText in the ellipsis-reserve band: neither truncates a fitting label', () => {
    expect(expressionFunctions.wrapTruncates('hello world', 12, 3)).toBe(false);
    const lines = expressionFunctions.wrapLabelText('hello world', 12, 3);
    expect(lines.some((line) => line.endsWith('…'))).toBe(false);
  });
});

describe('getLegendColumnLayout()', () => {
  const item = (legendIndex: number, labelWidth = 40): LegendLabelWidthDatum => ({
    legendIndex,
    displayLabel: `Item ${legendIndex}`,
    labelWidth,
  });

  test('picks the largest candidate that fits at full width', () => {
    const items = [item(1), item(2), item(3), item(4), item(5)];
    const layout = expressionFunctions.getLegendColumnLayout(items, 600, [5, 3]);
    expect(layout.columns).toBe(5);
    // a non-last candidate fitting means labelLimit is unlimited
    expect(layout.labelLimit).toBe(0);
  });

  test('falls back to a smaller candidate when the larger one does not fit', () => {
    const items = [item(1, 300), item(2), item(3), item(4), item(5)];
    const layout = expressionFunctions.getLegendColumnLayout(items, 200, [5, 3]);
    expect(layout.columns).toBe(3);
  });

  test('falls back to the last candidate and uses its fair-share labelLimit when nothing fits', () => {
    const items = [item(1, 300), item(2, 300), item(3, 300)];
    const layout = expressionFunctions.getLegendColumnLayout(items, 140, [5, 3]);
    expect(layout.columns).toBe(3);
    expect(layout.labelLimit).toBeGreaterThan(0);
  });

  test('with labelWrap, a candidate that only fits once wrapped is chosen with labelLimit 0', () => {
    const displayLabel = 'Supercalifragilisticexpialidocious is quite long';
    const items = [
      { legendIndex: 1, displayLabel, labelWidth: expressionFunctions.getLabelWidth(displayLabel, 'normal', 14) },
    ];
    const layout = expressionFunctions.getLegendColumnLayout(items, 100, [1], 2);
    expect(layout.labelLimit).toBe(0);
    expect(layout.wrapWidth).toBeGreaterThan(0);
  });
});

describe('getLegendPages()', () => {
  const items = (n: number, labelWidth = 40): LegendLabelWidthDatum[] =>
    Array.from({ length: n }, (_, i) => ({ legendIndex: i + 1, displayLabel: `Item ${i}`, labelWidth }));

  test('returns a single page when everything fits within columns * maxRows', () => {
    const pages = expressionFunctions.getLegendPages(items(4), 600, [5, 3], 2);
    expect(pages).toEqual([{ columns: 5, start: 0, end: 3 }]);
  });

  test('splits into multiple pages with inclusive, contiguous start/end bounds', () => {
    const pages = expressionFunctions.getLegendPages(items(16), 600, [5, 3], 2);
    expect(pages).toEqual([
      { columns: 5, start: 0, end: 9 },
      { columns: 5, start: 10, end: 15 },
    ]);
  });

  // Regression: a long label destined for a later page must not shrink an earlier page's column
  // count (see planning/research/legend-pagination-columns-mismatch.md).
  test('a long label past a page boundary does not affect an earlier page column count', () => {
    const list = items(16);
    list[11] = { ...list[11], labelWidth: 300 };
    const pages = expressionFunctions.getLegendPages(list, 600, [5, 3], 2);

    expect(pages[0]).toEqual({ columns: 5, start: 0, end: 9 });
    const pageWithLongLabel = pages.find((p) => p.start <= 11 && p.end >= 11);
    expect(pageWithLongLabel?.columns).toBe(3);
  });

  test('guards against a non-positive maxRows looping forever', () => {
    const pages = expressionFunctions.getLegendPages(items(3), 600, [5, 3], 0);
    expect(pages.every((p) => p.end >= p.start)).toBe(true);
    expect(pages[pages.length - 1].end).toBe(2);
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

describe('formatVerticalAxisTimeLabelTooltips()', () => {
  let formatter: (datum: LabelDatum, granularity: Granularity) => string;
  beforeEach(() => {
    formatter = formatVerticalAxisTimeLabelTooltips();
  });

  test('should return the correct tooltip label for the given granularity', () => {
    expect(formatter({ index: 0, label: '2024', value: 1667890800000 }, 'year')).toBe('2022');
    expect(formatter({ index: 0, label: '2024', value: 1667890800000 }, 'month')).toBe('Nov 2022');
    expect(formatter({ index: 0, label: '2024', value: 1667890800000 }, 'quarter')).toBe('Q4 2022');
    expect(formatter({ index: 0, label: '2024', value: 1667890800000 }, 'week')).toBe('Nov 8');
    expect(formatter({ index: 0, label: '2024', value: 1667890800000 }, 'day')).toBe('Nov 8');
    expect(formatter({ index: 0, label: '2024', value: 1667890800000 }, 'hour')).toBe('Nov 8, 7 AM');
    expect(formatter({ index: 0, label: '2024', value: 1667890800000 }, 'minute')).toBe('Nov 8, 7:00 AM');
    expect(formatter({ index: 0, label: '2024', value: 1667890800000 }, 'second')).toBe('7:00:00 AM');
  });

  test('should return correct format for different locales', () => {
    const datum: LabelDatum = { index: 0, label: '2024', value: 1667890800000 }; // 2022-11-08T07:00:00Z
    const enUS = formatVerticalAxisTimeLabelTooltips('en-US');
    const enGB = formatVerticalAxisTimeLabelTooltips('en-GB');
    const deDE = formatVerticalAxisTimeLabelTooltips('de-DE');
    const frFR = formatVerticalAxisTimeLabelTooltips('fr-FR');
    
    expect(enUS(datum, 'day')).toBe('Nov 8');
    expect(enGB(datum, 'day')).toBe('8 Nov');
    expect(deDE(datum, 'day')).toBe('8. Nov.');
    expect(frFR(datum, 'day')).toBe('8 nov.');
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
