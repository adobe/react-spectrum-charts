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
import { TextValueRef } from 'vega';

import { getD3FormatSpecifierFromNumberFormat } from './specUtils';
import { NumberFormat } from './types';

/**
 * gets the number format tests and signals based on the numberFormat
 * @param numberFormat
 * @returns
 */
export const getTextNumberFormat = (
  numberFormat: NumberFormat | string,
  datumProperty: string = 'value',
  currencyLocale?: string,
  currencyCode?: string
): ({
  test?: string;
} & TextValueRef)[] => {
  const test = `isNumber(datum['${datumProperty}'])`;
  if (numberFormat === 'shortNumber') {
    return [{ test, signal: `formatShortNumber(datum['${datumProperty}'])` }];
  }
  if (numberFormat === 'shortCurrency') {
    return [
      {
        test: `${test} && abs(datum['${datumProperty}']) >= 1000`,
        signal: `upper(replace(format(datum['${datumProperty}'], '$.3~s'), /(\\d+)G/, '$1B'))`,
      },
      {
        test,
        signal: `format(datum['${datumProperty}'], '$')`,
      },
    ];
  }
  if (currencyCode && currencyLocale) {
    return [{ test, signal: `formatLocaleCurrency(datum, "${currencyLocale}", "${currencyCode}", "${numberFormat}")` }];
  }
  const d3FormatSpecifier = getD3FormatSpecifierFromNumberFormat(numberFormat);
  return [{ test, signal: `format(datum['${datumProperty}'], '${d3FormatSpecifier}')` }];
};
