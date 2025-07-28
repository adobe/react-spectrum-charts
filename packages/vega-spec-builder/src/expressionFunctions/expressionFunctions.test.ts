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

import {
  LabelDatum,
  expressionFunctions,
  formatHorizontalTimeAxisLabels,
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
