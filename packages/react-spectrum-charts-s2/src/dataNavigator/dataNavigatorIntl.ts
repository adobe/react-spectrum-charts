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
import { DateFormatter } from '@internationalized/date';
import { LocalizedStringDictionary, LocalizedStringFormatter } from '@internationalized/string';

import { DataNavigatorMessageKey, dataNavigatorStrings } from './intl/compiled';

/** Locale used when a caller does not provide one, and the fallback for any untranslated key. */
export const DEFAULT_DATA_NAVIGATOR_LOCALE = 'en-US';

const dictionary = new LocalizedStringDictionary(dataNavigatorStrings, DEFAULT_DATA_NAVIGATOR_LOCALE);

export interface DataNavigatorIntl {
  /** Formats a compiled message from the catalog, localizing plurals/selects/numbers for the locale. */
  formatMessage: (key: DataNavigatorMessageKey, variables?: Record<string, string | number>) => string;
  /** Formats a Date for the locale via Intl.DateTimeFormat. */
  formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string;
}

/** Builds locale-bound formatters for the data navigator's accessible descriptions. */
export const getDataNavigatorIntl = (locale: string = DEFAULT_DATA_NAVIGATOR_LOCALE): DataNavigatorIntl => {
  const stringFormatter = new LocalizedStringFormatter(locale, dictionary);
  return {
    formatMessage: (key, variables) => stringFormatter.format(key, variables),
    formatDate: (date, options) => new DateFormatter(locale, options).format(date),
  };
};
