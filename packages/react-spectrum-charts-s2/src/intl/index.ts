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
import { useCallback } from 'react';

import { LocalizedString, LocalizedStringDictionary, LocalizedStringFormatter } from '@internationalized/string';
import { useLocale } from '@react-spectrum/s2';
import { DEFAULT_LOCALE } from '@spectrum-charts/core-s2/constants';

import { MessageKey, messages } from './compiled.js';

export type { MessageKey } from './compiled.js';

type MessageVariables = Record<string, string | number>;

const dictionary = new LocalizedStringDictionary<MessageKey, LocalizedString>(messages, DEFAULT_LOCALE);
const formatters = new Map<string, LocalizedStringFormatter<MessageKey, LocalizedString>>();

/**
 * Gets the message language from the chart `locale` prop, which may be a code or separate number/time locales.
 * @param locale
 * @returns locale code
 */
export const getMessageLocale = (locale?: unknown): string => {
  if (typeof locale === 'string') return locale;
  if (locale && typeof locale === 'object') {
    const { number, time } = locale as { number?: unknown; time?: unknown };
    if (typeof number === 'string') return number;
    if (typeof time === 'string') return time;
  }
  return DEFAULT_LOCALE;
};

/**
 * Formats a built-in chart message in the given locale, falling back to en-US.
 * @param locale
 * @param key
 * @param variables
 * @returns localized string
 */
export const formatMessage = (locale: string, key: MessageKey, variables?: MessageVariables): string => {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new LocalizedStringFormatter(locale, dictionary);
    formatters.set(locale, formatter);
  }
  return formatter.format(key, variables);
};

/**
 * Gets the message locale from the chart's Spectrum Provider.
 * @returns locale code
 */
export const useChartLocale = () => useLocale().locale;

/**
 * Formats built-in chart messages in the chart's locale.
 * @returns formatter bound to the current locale
 */
export const useFormatMessage = () => {
  const locale = useChartLocale();
  return useCallback(
    (key: MessageKey, variables?: MessageVariables) => formatMessage(locale, key, variables),
    [locale]
  );
};
