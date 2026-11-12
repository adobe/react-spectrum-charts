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
import { FormatLocaleDefinition, formatLocale } from 'd3-format';
import { TimeLocaleDefinition, timeFormatLocale } from 'd3-time-format';

import { getLocale } from '@spectrum-charts/core-s2/locales';

import { AxisOptions } from './types.js';

export type LocaleInput = NonNullable<Parameters<typeof getLocale>[0]>;

/**
 * Converts a datum value to display text; null and undefined become an empty string.
 * @param value
 * @returns string
 */
export const toText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value instanceof Date ? value.toString() : JSON.stringify(value);
  return String(value as string | number | boolean | bigint | symbol);
};

/** Locale-bound number and time formatters, equivalent to Vega's `format` and `timeFormat` expressions. */
export interface Formatter {
  number: (specifier: string) => (value: number) => string;
  time: (specifier: string) => (value: Date | number) => string;
  shortNumber: (value: number) => string;
  duration: (value: number) => string;
  currency: (value: number, currencyLocale: string, currencyCode: string, numberFormat: string) => string;
}

const formatterCache = new Map<string, Formatter>();

/**
 * Gets cached formatters for a locale.
 * @param locale
 * @returns Formatter
 */
export const getFormatter = (locale: LocaleInput = 'en-US'): Formatter => {
  const cacheKey = typeof locale === 'string' ? locale : JSON.stringify(locale);
  const cached = formatterCache.get(cacheKey);
  if (cached) return cached;

  const { number, time } = getLocale(locale);
  const d3Number = formatLocale((number ?? getLocale('en-US').number) as FormatLocaleDefinition);
  const d3Time = timeFormatLocale((time ?? getLocale('en-US').time) as TimeLocaleDefinition);
  const localeCode = typeof locale === 'string' ? locale : undefined;
  const numberFormats = new Map<string, (value: number) => string>();
  const timeFormats = new Map<string, (value: Date | number) => string>();

  const numberFormat = (specifier: string) => {
    let fn = numberFormats.get(specifier);
    if (!fn) {
      fn = d3Number.format(specifier);
      numberFormats.set(specifier, fn);
    }
    return fn;
  };
  const timeFormat = (specifier: string) => {
    let fn = timeFormats.get(specifier);
    if (!fn) {
      const format = d3Time.format(specifier);
      fn = (value: Date | number) => format(value instanceof Date ? value : new Date(value));
      timeFormats.set(specifier, fn);
    }
    return fn;
  };

  const zeroPadded = numberFormat('02,d');
  const integer = numberFormat(',d');
  const compact = new Intl.NumberFormat(localeCode ?? navigator.language, { notation: 'compact' });
  const decimalSymbol = new Intl.NumberFormat(localeCode ?? navigator.language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
    .format(1.1)
    .replaceAll(/\d/g, '');
  const customDecimal =
    typeof locale === 'object' && typeof locale.number === 'object' ? locale.number.decimal : undefined;

  const formatter: Formatter = {
    number: numberFormat,
    time: timeFormat,
    shortNumber: (value) => {
      const short = compact.format(value);
      return customDecimal ? short.replace(decimalSymbol, customDecimal) : short;
    },
    duration: (value) => {
      const sign = value < 0 ? '-' : '';
      const abs = Math.abs(value);
      const seconds = zeroPadded(Math.floor(abs % 60));
      if (abs < 3600) return `${sign}${integer(Math.floor(abs / 60))}:${seconds}`;
      return `${sign}${integer(Math.floor(abs / 3600))}:${zeroPadded(Math.floor((abs / 60) % 60))}:${seconds}`;
    },
    currency: (value, currencyLocale, currencyCode, format) => {
      try {
        const template = new Intl.NumberFormat(currencyLocale, {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: 0,
        }).format(0);
        const precision = format === 'currency' ? 2 : Number.parseInt(format.split('.')[1].replace('f', ''));
        return template.replace('0', numberFormat(`,.${precision}f`)(value));
      } catch {
        return numberFormat('$,.2f')(value);
      }
    },
  };
  formatterCache.set(cacheKey, formatter);
  return formatter;
};

const D3_SPECIFIERS: Record<string, string> = { currency: '$,.2f', standardNumber: ',', percentage: '~%' };

/**
 * Formats a number using an RSC `numberFormat` (named format or d3 specifier).
 * @param value
 * @param numberFormat
 * @param formatter
 * @param currencyLocale
 * @param currencyCode
 * @returns formatted string
 */
export const formatNumber = (
  value: number,
  numberFormat: string,
  formatter: Formatter,
  currencyLocale?: string,
  currencyCode?: string
): string => {
  if (numberFormat === 'shortNumber') return formatter.shortNumber(value);
  if (numberFormat === 'shortCurrency') {
    if (Math.abs(value) >= 1000)
      return formatter
        .number('$.3~s')(value)
        .replace(/(\d+)G/, '$1B')
        .toUpperCase();
    return formatter.number('$')(value);
  }
  if (currencyCode && currencyLocale) return formatter.currency(value, currencyLocale, currencyCode, numberFormat);
  return formatter.number(D3_SPECIFIERS[numberFormat] ?? numberFormat)(value);
};

/**
 * Gets the label formatter for a non-time axis, matching the Vega axis label encoding.
 * @param axis
 * @param formatter
 * @returns label formatter
 */
export const getAxisLabelFormatter = (
  { labelFormat, numberFormat = 'shortNumber', currencyLocale, currencyCode }: AxisOptions,
  formatter: Formatter
): ((value: unknown) => string) => {
  if (labelFormat === 'percentage') {
    return (value) => (typeof value === 'number' ? formatter.number('~%')(value) : String(value));
  }
  if (labelFormat === 'duration') {
    return (value) => (typeof value === 'number' ? formatter.duration(value) : String(value));
  }
  return (value) =>
    typeof value === 'number'
      ? formatNumber(value, numberFormat, formatter, currencyLocale, currencyCode)
      : String(value);
};
