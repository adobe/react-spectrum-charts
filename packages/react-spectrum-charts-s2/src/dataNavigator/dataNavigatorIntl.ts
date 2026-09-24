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
import { LocalizedStringDictionary, LocalizedStringFormatter } from '@internationalized/string';

import { DataNavigatorMessageKey, dataNavigatorStrings } from './intl/compiled';

export const DEFAULT_DATA_NAVIGATOR_LOCALE = 'en-US';

const dictionary = new LocalizedStringDictionary(dataNavigatorStrings, DEFAULT_DATA_NAVIGATOR_LOCALE);

export interface DataNavigatorIntl {
  formatMessage: (key: DataNavigatorMessageKey, variables?: Record<string, string | number>) => string;
}

export const getDataNavigatorIntl = (locale: string = DEFAULT_DATA_NAVIGATOR_LOCALE): DataNavigatorIntl => {
  const formatter = new LocalizedStringFormatter(locale, dictionary);
  return {
    formatMessage: (key, variables) => formatter.format(key, variables),
  };
};
