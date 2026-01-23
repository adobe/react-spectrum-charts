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
import { TimeLocale } from 'vega';

// Mock the module before importing
jest.mock('@spectrum-charts/locales', () => {
  const actual = jest.requireActual('@spectrum-charts/locales');
  return {
    ...actual,
    getLocale: jest.fn(actual.getLocale),
  };
});

import { getLocale } from '@spectrum-charts/locales';

import { formatBigNumber } from './bigNumberFormatUtils';

const mockGetLocale = getLocale as jest.MockedFunction<typeof getLocale>;

describe('Big Number format utility functions', () => {
  const actualGetLocale = jest.requireActual('@spectrum-charts/locales').getLocale;
  
  describe('formatBigNumber', () => {
    const US_NUMBER_LOCALE = actualGetLocale('en-US').number;
    const DE_NUMBER_LOCALE = actualGetLocale('de-DE').number;

    const COMMA_FORMAT = ',';
    const CURRENCY_FORMAT = '$,.2f';

    test('should use % format when numberType is percentage', () => {
      const formattedString = formatBigNumber(0.123, 'percentage', undefined, US_NUMBER_LOCALE);
      expect(formattedString).toBe('12.3%');
    });

    test('should not format when numberFormat is undefined', () => {
      const formattedString = formatBigNumber(123456, 'linear', undefined, US_NUMBER_LOCALE);
      expect(formattedString).toBe('123456');
    });

    test('should format according to default locale when numberLocale is undefined', () => {
      const formattedString = formatBigNumber(123456, 'linear', COMMA_FORMAT, undefined);
      expect(formattedString).toBe('123,456');
    });

    test('should format when locale is en-US and numberFormat is basic comma format', () => {
      const formattedString = formatBigNumber(123456, 'linear', COMMA_FORMAT, US_NUMBER_LOCALE);
      expect(formattedString).toBe('123,456');
    });

    test('should format when locale is de-DE and numberFormat is currency format', () => {
      const formattedString = formatBigNumber(1234.56, 'linear', CURRENCY_FORMAT, DE_NUMBER_LOCALE);
      expect(formattedString).toBe('1.234,56 €');
    });
  });

  describe('formatBigNumber - error handling', () => {
    const COMMA_FORMAT = ',';

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should throw error when both numberLocale and default locale number are undefined', () => {
      mockGetLocale.mockReturnValueOnce({
        number: undefined,
        time: {} as TimeLocale,
      });

      expect(() => {
        formatBigNumber(123456, 'linear', COMMA_FORMAT, undefined);
      }).toThrow('Unable to resolve number locale');
    });

    test('should use provided numberLocale even if default locale is undefined', () => {
      const US_NUMBER_LOCALE_MOCK = {
        decimal: '.',
        thousands: ',',
        grouping: [3],
        currency: ['$', ''] as [string, string],
      };

      mockGetLocale.mockReturnValueOnce({
        number: undefined,
        time: {} as TimeLocale,
      });

      const formattedString = formatBigNumber(123456, 'linear', COMMA_FORMAT, US_NUMBER_LOCALE_MOCK);
      expect(formattedString).toBe('123,456');
    });
  });
});
