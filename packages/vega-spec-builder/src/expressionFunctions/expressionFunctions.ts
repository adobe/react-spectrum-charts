/*
 * Copyright 2023 Adobe. All rights reserved.
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
import { FontWeight, Locale, NumberLocale, TimeLocale } from 'vega';

import { DEFAULT_FONT_SIZE, DEFAULT_LEGEND_COLUMN_PADDING } from '@spectrum-charts/constants';
import { LocaleCode, NumberLocaleCode, TimeLocaleCode, getLocale, numberLocales } from '@spectrum-charts/locales';
import { ADOBE_CLEAN_FONT } from '@spectrum-charts/themes';

import { NumberFormat, Granularity } from '../types';

export interface LabelDatum {
  index: number;
  label: string;
  value: string | number;
}

export interface LegendLabelWidthDatum {
  legendIndex: number;
  displayLabel: string;
  labelWidth: number;
}

export interface LegendColumnLayout {
  columns: number;
  /** 0 means unlimited, matching Vega's own labelLimit convention */
  labelLimit: number;
  /** dynamic wrap width for the chosen column count; only meaningful when labelWrap > 1 */
  wrapWidth: number;
}

export interface LegendPage {
  columns: number;
  start: number;
  end: number;
}

export const getExpressionFunctions = (
  locale:
    | Locale
    | LocaleCode
    | { number?: NumberLocaleCode | NumberLocale; time?: TimeLocaleCode | TimeLocale } = 'en-US'
) => {
  const { number: numberLocale } = getLocale(locale);
  const localeCode = typeof locale === 'string' ? locale : locale?.number;
  const dateLocaleCode = getLocaleCode(locale);
  return {
    formatTimeDurationLabels: formatTimeDurationLabels(numberLocale),
    formatLocaleCurrency: formatLocaleCurrency(numberLocale),
    formatShortNumber: formatShortNumber(localeCode),
    consoleLog,
    formatHorizontalTimeAxisLabels: formatHorizontalTimeAxisLabels(),
    formatVerticalAxisTimeLabels: formatVerticalAxisTimeLabels(),
    formatVerticalAxisTimeLabelTooltips: formatVerticalAxisTimeLabelTooltips(dateLocaleCode),
    getLabelWidth,

    getLegendColumnLayout,
    getLegendPages,
    truncateText,
    wrapLabelText,
    wrapTruncates,
  };
};

export const getLocaleCode = (locale: Locale | LocaleCode | { time?: TimeLocaleCode | TimeLocale }) => {
  if (typeof locale === 'string') {
    return locale;
  }
  if (typeof locale.time === 'string') {
    return locale.time;
  }
  return navigator.language;
};

/**
 * Formats a number using the compact notation.
 * @param numberLocale
 * @returns formatted string
 */
export const formatShortNumber = (numberLocale?: string | FormatLocaleDefinition) => {
  const locale = typeof numberLocale === 'string' ? numberLocale : navigator.language;
  const customDecimalSymbol = typeof numberLocale === 'object' ? numberLocale.decimal : undefined;
  return (value: number) => {
    // get the decimal symbol for the locale by formatting a number with decimals
    const decimalSymbol = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      .format(1.1)
      .replaceAll(/\d/g, '');

    const shortNumber = Intl.NumberFormat(locale, { notation: 'compact' }).format(value);
    if (customDecimalSymbol) {
      return shortNumber.replace(decimalSymbol, customDecimalSymbol);
    }
    return shortNumber;
  };
};

/**
 * Formats currency values using a currency specific locale and currency code for the position and
 * type of currency symbol.
 * Applies thousands and decimal separators based on the numberFormat.
 * @returns string
 */
export const formatLocaleCurrency = (numberLocale: FormatLocaleDefinition = numberLocales['en-US']) => {
  return ({ value }: LabelDatum, currencyLocale: string, currencyCode: string, numberFormat: NumberFormat) => {
    if (typeof value === 'string') return value;

    try {
      const formatOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 0,
      };
      // Get currency template with positioning and symbol based on currencyLocale and currencyCode.
      const currencyTemplate = new Intl.NumberFormat(currencyLocale, formatOptions).format(0);

      let precision = 2;
      // Parse the precision if numberFormat is a format string.
      if (numberFormat !== 'currency') {
        precision = Number.parseInt(numberFormat.split('.')[1].replace('f', ''));
      }

      // Format the value using the chart locale and the precision, then swap it into the currency template.
      const d3Formatter = formatLocale(numberLocale);
      return currencyTemplate.replace('0', d3Formatter.format(`,.${precision}f`)(value));
    } catch (error) {
      console.error('Error formatting currency: ', error);
      // Fallback to chart locale formatting.
      return formatLocale(numberLocale).format('$,.2f')(value);
    }
  };
};

/**
 * Hides labels that are the same as the previous label
 * @returns string
 */
export const formatHorizontalTimeAxisLabels = () => {
  let prevLabel: string;
  return (datum: LabelDatum) => {
    const showLabel = datum.index === 0 || prevLabel !== datum.label;
    prevLabel = datum.label;
    return showLabel ? datum.label : '';
  };
};

export const formatVerticalAxisTimeLabelTooltips = (timeLocale?: string) => {
  return (datum: LabelDatum, granularity: Granularity) => {
    const date = new Date(datum.value);
    
    let options: Intl.DateTimeFormatOptions = {};
    switch (granularity) {
      case 'second':
        options = { hour: 'numeric', minute: '2-digit', second: '2-digit' };
        break;
      case 'minute':
        options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
        break;
      case 'hour':
        options = { month: 'short', day: 'numeric', hour: 'numeric' };
        break;
      case 'day':
        options = { month: 'short', day: 'numeric'};
        break;
      case 'week':
        options = { month: 'short', day: 'numeric'};
        break;
      case 'month':
        options = { month: 'short', year: 'numeric' };
        break;
      case 'quarter': {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const year = new Intl.DateTimeFormat(timeLocale, { year: 'numeric' }).format(date);
        return `Q${quarter} ${year}`;
      }
      case 'year':
        options = { year: 'numeric' };
        break;
      default:
        options = {};
    } 
    
    return new Intl.DateTimeFormat(timeLocale, options).format(date);
  };
};

/**
 * Hides the larger granularity instead of repeating it for each tick
 * @returns string
 */
export const formatVerticalAxisTimeLabels = () => {
  let prevLabel: string;
  return (datum: LabelDatum) => {
    const labels = datum.label.split('\u2000');
    const label = labels[0];

    const showLabel = datum.index === 0 || prevLabel !== label;
    prevLabel = label;
    return showLabel ? datum.label : labels[1];
  };
};

/**
 * Formats a duration in seconds as HH:MM:SS.
 * Function is initialized with a number locale. This ensures that the thousands separator is correct for the locale
 * @param numberLocale
 * @returns formatted sting (HH:MM:SS)
 */
export const formatTimeDurationLabels = (numberLocale: FormatLocaleDefinition = numberLocales['en-US']) => {
  const d3 = formatLocale(numberLocale);
  // 0 padded, minimum 2 digits, thousands separator, integer format
  const zeroPaddedFormat = d3.format('02,d');
  // Thousands separator, integer format
  const format = d3.format(',d');
  return ({ value }: LabelDatum) => {
    if (typeof value === 'string') return value;

    const sign = value < 0 ? '-' : '';
    const absoluteValue = Math.abs(value);
    const seconds = zeroPaddedFormat(Math.floor(absoluteValue % 60));

    // If the duration is less than an hour, only show minutes and seconds
    if (absoluteValue < 3600) {
      const minutes = format(Math.floor(absoluteValue / 60));
      return `${sign}${minutes}:${seconds}`;
    }

    const hours = format(Math.floor(absoluteValue / 60 / 60));
    const minutes = zeroPaddedFormat(Math.floor((absoluteValue / 60) % 60));
    return `${sign}${hours}:${minutes}:${seconds}`;
  };
};

/**
 * Utility function that will log the value to the console and return it
 * @param value
 * @returns
 */
const consoleLog = (value) => {
  console.log(value);
  return value;
};

/**
 * Figures out the rendered width of text by drawing it on a canvas
 * @param text
 * @param fontWeight
 * @param fontSize
 * @returns width in pixels
 */
const getLabelWidth = (text: string, fontWeight: FontWeight = 'bold', fontSize: number = 12) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context === null) return 0;

  context.font = `${fontWeight} ${fontSize}px ${ADOBE_CLEAN_FONT}`;
  return context.measureText(text).width;
};

const truncateText = (text: string, maxWidth: number, fontWeight: FontWeight = 'normal', fontSize: number = 12) => {
  maxWidth = maxWidth - 4;
  const textWidth = getLabelWidth(text, fontWeight, fontSize);
  const elipsisWidth = getLabelWidth('\u2026', fontWeight, fontSize);
  if (textWidth <= maxWidth) return text;

  let truncatedText = text.slice(0, -1).trim();

  for (let i = truncatedText.length; i > 0; i--) {
    truncatedText = truncatedText.slice(0, -1).trim();
    if (getLabelWidth(truncatedText, fontWeight, fontSize) + elipsisWidth <= maxWidth) break;
  }

  if (truncatedText.length === 0) return text;
  return truncatedText + '\u2026';
};

/**
 * Wraps text by word into up to maxLines lines, each no wider than maxWidth.
 * Every committed line — intermediate and final — is truncated with an ellipsis only when it
 * genuinely exceeds maxWidth, so a line that fits is kept verbatim (no phantom ellipsis in the
 * `maxWidth - 4` band `truncateText` reserves) and an over-wide line (e.g. a single word wider than
 * the column) is shortened progressively rather than overflowing.
 * @param text
 * @param maxWidth
 * @param maxLines
 * @param fontWeight
 * @param fontSize
 * @returns array of line strings, one entry per rendered line
 */
const wrapLabelText = (
  text: string,
  maxWidth: number,
  maxLines: number,
  fontWeight: FontWeight = 'normal',
  fontSize: number = 12
): string[] => {
  // Truncate a line only when it actually overflows maxWidth. truncateText reserves ellipsis space
  // (maxWidth - 4), so calling it on a line that already fits would ellipsize text that renders fine
  // and diverge from wrapTruncates (which tests fit at maxWidth with no reservation).
  // Truncate a line only when it actually overflows maxWidth. truncateText reserves ellipsis space
  // (maxWidth - 4), so calling it on a line that already fits would ellipsize text that renders fine
  // and diverge from wrapTruncates (which tests fit at maxWidth with no reservation).
  const fitLine = (line: string) =>
    getLabelWidth(line, fontWeight, fontSize) <= maxWidth ? line : truncateText(line, maxWidth, fontWeight, fontSize);

  const words = text.split(/\s+/).filter(Boolean);
  const lineLimit = Math.max(1, Math.floor(maxLines));

  if (lineLimit <= 1 || words.length === 0) {
    return [fitLine(text)];
  }

  const lines: string[] = [];
  let currentLine = '';
  let wordIndex = 0;

  while (wordIndex < words.length && lines.length < lineLimit - 1) {
    const word = words[wordIndex];
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || getLabelWidth(candidateLine, fontWeight, fontSize) <= maxWidth) {
      currentLine = candidateLine;
      wordIndex++;
    } else {
      lines.push(fitLine(currentLine));
      currentLine = '';
    }
  }

  const remainingWords = words.slice(wordIndex);
  const finalLine = currentLine ? `${currentLine} ${remainingWords.join(' ')}`.trim() : remainingWords.join(' ');
  lines.push(fitLine(finalLine));

  return lines;
};

/**
 * Tests whether wrapping `text` by word into at most `maxLines` lines, each no wider than `maxWidth`,
 * would require truncation — i.e. some text cannot be shown. Returns `true` when a single word is
 * wider than `maxWidth`, or when the greedy word-pack needs more than `maxLines` lines. Mirrors
 * `wrapLabelText`'s greedy packing so the prediction matches the rendered result.
 * @param text
 * @param maxWidth
 * @param maxLines
 * @param fontWeight
 * @param fontSize
 * @returns true if the text would truncate/overflow, false if it fully fits
 */
const wrapTruncates = (
  text: string,
  maxWidth: number,
  maxLines: number,
  fontWeight: FontWeight = 'normal',
  fontSize: number = 12
): boolean => {
  const words = text.split(/\s+/).filter(Boolean);
  const lineLimit = Math.max(1, Math.floor(maxLines));
  if (words.length === 0) return false;

  let lineCount = 1;
  let currentLine = '';
  for (const word of words) {
    // a single word wider than the column can never fit on any line → will truncate
    if (getLabelWidth(word, fontWeight, fontSize) > maxWidth) return true;
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || getLabelWidth(candidateLine, fontWeight, fontSize) <= maxWidth) {
      currentLine = candidateLine;
    } else {
      lineCount++;
      if (lineCount > lineLimit) return true;
      currentLine = word;
    }
  }
  return false;
};

// Rendered width of the default size-250 circle legend symbol (2 * sqrt(250 / PI)), plus the gap
// Vega's theme leaves at its default (labelOffset), used as the per-item chrome in every column.
const LEGEND_SYMBOL_RENDERED_WIDTH = 18;
const LEGEND_LABEL_OFFSET = 4;
const LEGEND_ITEM_BASE = LEGEND_SYMBOL_RENDERED_WIDTH + LEGEND_LABEL_OFFSET;
// Safety margin added only to the full-width fit estimate (not the fair-share wrap width, which must
// stay exact) to match Vega's own per-column Math.ceil and symbol stroke overhang.
const LEGEND_COLUMN_FIT_MARGIN = 2;

const getFairShareWidth = (width: number, columns: number): number =>
  (width - (columns - 1) * DEFAULT_LEGEND_COLUMN_PADDING) / columns - LEGEND_ITEM_BASE;

// Matches Vega's per-entry column assignment (column = index % columns) and per-column sizing
// (align: 'each', each column sized to its own widest label).
const fitsAtFullWidth = (items: LegendLabelWidthDatum[], width: number, columns: number): boolean => {
  if (!items.length) return true;
  const colWidths = new Array(columns).fill(0);
  items.forEach((item, i) => {
    const col = i % columns;
    colWidths[col] = Math.max(colWidths[col], item.labelWidth);
  });
  const totalWidth = colWidths.reduce(
    (sum, w) => sum + Math.ceil(w) + LEGEND_ITEM_BASE + LEGEND_COLUMN_FIT_MARGIN,
    0
  );
  return totalWidth + (columns - 1) * DEFAULT_LEGEND_COLUMN_PADDING <= width;
};

const fitsWhenWrapped = (
  items: LegendLabelWidthDatum[],
  width: number,
  columns: number,
  labelWrap: number
): boolean => {
  const wrapWidth = getFairShareWidth(width, columns);
  return items.every((item) => !wrapTruncates(item.displayLabel, wrapWidth, labelWrap, 'normal', DEFAULT_FONT_SIZE));
};

/**
 * Builds the layout for a candidate `n` that qualifies (fits, at full width or wrapped), or
 * `undefined` if it doesn't. Isolates the fit test and the resulting labelLimit/wrapWidth
 * computation so `getLegendColumnLayout`'s loop body stays a single, flat check.
 */
const getColumnLayoutForCandidate = (
  items: LegendLabelWidthDatum[],
  width: number,
  n: number,
  lastCandidate: number,
  useWrap: boolean,
  labelWrap: number
): LegendColumnLayout | undefined => {
  const fullWidthFits = fitsAtFullWidth(items, width, n);
  const wrapFits = useWrap && !fullWidthFits && fitsWhenWrapped(items, width, n, labelWrap);
  if (!fullWidthFits && !wrapFits) return undefined;

  if (useWrap) {
    return { columns: n, labelLimit: 0, wrapWidth: fullWidthFits ? width : getFairShareWidth(width, n) };
  }
  const isLast = n === lastCandidate;
  return { columns: n, labelLimit: isLast ? getFairShareWidth(width, lastCandidate) : 0, wrapWidth: 0 };
};

/** Layout used when no candidate fits: force the last (smallest) candidate, truncating to its fair share. */
const getFallbackColumnLayout = (width: number, lastCandidate: number, useWrap: boolean): LegendColumnLayout => ({
  columns: lastCandidate,
  labelLimit: useWrap ? 0 : getFairShareWidth(width, lastCandidate),
  wrapWidth: useWrap ? getFairShareWidth(width, lastCandidate) : 0,
});

/**
 * Picks the largest candidate column count whose labels fit the available width, falling back to
 * the last (smallest) candidate if none fit. This is the single source of truth for the
 * `_preferredColumns` layout decision: it drives both the legend's actual rendered `columns`/
 * `labelLimit` (via a signal referencing this function) and, via `getLegendPages`, upfront
 * pagination planning outside of Vega — both call this exact same logic against the same measured
 * label widths, so they can never disagree about how a given set of items would lay out.
 * @param items ordered legend entries with their measured label widths (see `${name}_labelWidths`)
 * @param width available width for the legend
 * @param candidates ordered list of candidate column counts, e.g. [5, 3]
 * @param labelWrap max lines a label may wrap onto before truncating; 1 (default) disables wrapping
 */
const getLegendColumnLayout = (
  items: LegendLabelWidthDatum[],
  width: number,
  candidates: number[],
  labelWrap = 1
): LegendColumnLayout => {
  const lastCandidate = candidates.at(-1);
  if (lastCandidate === undefined) return { columns: 1, labelLimit: 0, wrapWidth: 0 };
  const useWrap = labelWrap > 1;

  for (const n of candidates) {
    const layout = getColumnLayoutForCandidate(items, width, n, lastCandidate, useWrap, labelWrap);
    if (layout) {
      return layout;
    }
  }

  return getFallbackColumnLayout(width, lastCandidate, useWrap);
};

/**
 * Picks the column count for a page starting at the front of `remaining`, testing each candidate
 * `n` against only the `n * rows` items that would actually land on the page if `n` wins — not the
 * full `remaining` tail. A label further down the list (destined for a later page) must never
 * influence this page's column count; testing against the whole tail let a long label past the page
 * boundary fail a larger candidate's fit test even though that label never renders on this page.
 */
const getPageColumnCount = (
  remaining: LegendLabelWidthDatum[],
  width: number,
  candidates: number[],
  rows: number,
  labelWrap: number
): number => {
  const lastCandidate = candidates.at(-1);
  if (lastCandidate === undefined) return 1;
  const useWrap = labelWrap > 1;

  for (const n of candidates) {
    const pageItems = remaining.slice(0, n * rows);
    const fullWidthFits = fitsAtFullWidth(pageItems, width, n);
    if (fullWidthFits || (useWrap && fitsWhenWrapped(pageItems, width, n, labelWrap))) {
      return n;
    }
  }
  return lastCandidate;
};

/**
 * Splits the full ordered legend entry list into pages of at most `columns * maxRows` items each,
 * recomputing `columns` from scratch for each page's own labels via `getPageColumnCount` (so a page
 * of short labels can use a wider candidate than a page with one long label) — bounded to just the
 * items that would land on that page, so a label on a later page can never affect this page's
 * column count. Exposed via the `${name}_pages` signal for pagination UIs built outside RSC.
 * @param items ordered legend entries with their measured label widths (see `${name}_labelWidths`)
 * @param width available width for the legend
 * @param candidates ordered list of candidate column counts, e.g. [5, 3]
 * @param maxRows maximum rows of entries allowed per page
 * @param labelWrap max lines a label may wrap onto before truncating; 1 (default) disables wrapping
 */
const getLegendPages = (
  items: LegendLabelWidthDatum[],
  width: number,
  candidates: number[],
  maxRows: number,
  labelWrap = 1
): LegendPage[] => {
  const rows = Math.max(1, maxRows);
  const pages: LegendPage[] = [];
  let start = 0;
  while (start < items.length) {
    const remaining = items.slice(start);
    const columns = getPageColumnCount(remaining, width, candidates, rows, labelWrap);
    const pageSize = Math.max(1, Math.min(remaining.length, columns * rows));
    pages.push({ columns, start, end: start + pageSize - 1 });
    start += pageSize;
  }
  return pages;
};

export const expressionFunctions = {
  consoleLog,
  formatHorizontalTimeAxisLabels: formatHorizontalTimeAxisLabels(),
  formatVerticalAxisTimeLabels: formatVerticalAxisTimeLabels(),
  formatVerticalAxisTimeLabelTooltips: formatVerticalAxisTimeLabelTooltips(),
  getLabelWidth,
  getLegendColumnLayout,
  getLegendPages,
  truncateText,
  wrapLabelText,
  wrapTruncates,
};
