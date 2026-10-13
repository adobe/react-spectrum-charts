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
import { formatLocale } from 'd3-format';
import { FontWeight, Locale, NumberLocale, TimeLocale } from 'vega';

import { DONUT_LABEL_COLLISION_GAP } from '@spectrum-charts/core-s2/constants';
import {
  LocaleCode,
  NumberLocaleCode,
  TimeLocaleCode,
  getLocale,
  numberLocales,
} from '@spectrum-charts/core-s2/locales';
import { ADOBE_CLEAN_FONT } from '@spectrum-charts/core-s2/tokens';

import { NumberFormat } from '../types/index.js';

export interface LabelDatum {
  index: number;
  label: string;
  value: string | number;
}

export const getExpressionFunctions = (
  locale:
    | Locale
    | LocaleCode
    | { number?: NumberLocaleCode | NumberLocale; time?: TimeLocaleCode | TimeLocale } = 'en-US'
) => {
  const { number: numberLocale } = getLocale(locale);
  const localeCode = typeof locale === 'string' ? locale : locale?.number;
  return {
    formatTimeDurationLabels: formatTimeDurationLabels(numberLocale),
    formatLocaleCurrency: formatLocaleCurrency(numberLocale),
    formatShortNumber: formatShortNumber(localeCode),
    consoleLog,
    cubicBezier,
    donutSliceStrokeWidth,
    formatHorizontalTimeAxisLabels: formatHorizontalTimeAxisLabels(),
    formatVerticalAxisTimeLabels: formatVerticalAxisTimeLabels(),
    getLabelWidth,
    hoverFraction,
    isDonutLabelVisible,
    truncateText,
  };
};

/**
 * Formats a number using the compact notation.
 * @param numberLocale
 * @returns formatted string
 */
export const formatShortNumber = (numberLocale?: string | NumberLocale) => {
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
 * Formats a percent of total followed by the short number value, e.g. `65.2% (23K)`.
 * @param locale
 * @returns formatted string
 */
export const formatPercentWithValue = (locale: Parameters<typeof getLocale>[0] = 'en-US') => {
  const { number: numberLocale } = getLocale(locale);
  const localeCode = typeof locale === 'string' ? locale : locale?.number;
  const formatPercent = formatLocale(numberLocale ?? numberLocales['en-US']).format('.1%');
  // matches getTextNumberFormat's 'shortNumber' so the value reads the same as the segment label
  const formatValue = formatShortNumber(localeCode);
  return (percent: number, value: number) => `${formatPercent(percent)} (${formatValue(value)})`;
};

/**
 * Formats currency values using a currency specific locale and currency code for the position and
 * type of currency symbol.
 * Applies thousands and decimal separators based on the numberFormat.
 * @returns string
 */
export const formatLocaleCurrency = (numberLocale: NumberLocale = numberLocales['en-US']) => {
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
export const formatTimeDurationLabels = (numberLocale: NumberLocale = numberLocales['en-US']) => {
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

const LABEL_WIDTH_CACHE_MAX_SIZE = 5000;
const labelWidthCache = new Map<string, number>();
let measureContext: CanvasRenderingContext2D | null | undefined;

/**
 * Gets the shared canvas context used to measure text, creating it on first use.
 * @returns canvas 2d context or null if unavailable
 */
const getMeasureContext = (): CanvasRenderingContext2D | null => {
  if (measureContext === undefined) {
    measureContext = document.createElement('canvas').getContext('2d');
    // Widths measured before a web font loads use the fallback font, so drop them once fonts finish loading.
    document.fonts?.addEventListener?.('loadingdone', () => labelWidthCache.clear());
  }
  return measureContext;
};

/**
 * Figures out the rendered width of text by drawing it on a canvas
 * @param text
 * @param fontWeight
 * @param fontSize
 * @returns width in pixels
 */
const getLabelWidth = (text: string, fontWeight: FontWeight = 'bold', fontSize: number = 12) => {
  const font = `${fontWeight} ${fontSize}px ${ADOBE_CLEAN_FONT}`;
  const key = `${font}|${text}`;
  const cached = labelWidthCache.get(key);
  if (cached !== undefined) return cached;

  const context = getMeasureContext();
  if (context === null) return 0;

  context.font = font;
  const width = context.measureText(text).width;
  if (document.fonts?.status !== 'loading') {
    if (labelWidthCache.size >= LABEL_WIDTH_CACHE_MAX_SIZE) {
      labelWidthCache.delete(labelWidthCache.keys().next().value as string);
    }
    labelWidthCache.set(key, width);
  }
  return width;
};

/**
 * Gets the smallest top y of a donut label's collision boxes.
 * @param candidate
 * @param collisionBoxesField
 * @returns top y in pixels
 */
const getTopY = (candidate: Record<string, unknown>, collisionBoxesField: string): number =>
  Math.min(...(candidate[collisionBoxesField] as number[][]).map(([, , topY]) => topY));

/**
 * Checks whether a donut label candidate is the hovered item.
 * @param candidate
 * @param idField
 * @param hoveredId
 * @returns whether the candidate is hovered
 */
const isHovered = (candidate: Record<string, unknown>, idField: string, hoveredId?: unknown): boolean =>
  hoveredId !== undefined && hoveredId !== null && candidate[idField] === hoveredId;

/**
 * Keeps fixed-position donut labels in priority order when their rendered blocks do not overlap.
 * @param data
 * @param datum
 * @param hemisphereField
 * @param collisionBoxesField
 * @param priorityField
 * @param idField
 * @param hoveredId
 * @returns whether the label should be visible
 */
export const isDonutLabelVisible = (
  data: Record<string, unknown>[],
  datum: Record<string, unknown>,
  hemisphereField: string,
  collisionBoxesField: string,
  priorityField: string,
  idField: string,
  hoveredId?: unknown
): boolean => {
  const gap = DONUT_LABEL_COLLISION_GAP;
  const hemisphere = datum[hemisphereField];
  const candidates = data
    .filter((candidate) => candidate[hemisphereField] === hemisphere)
    .sort((a, b) => {
      const hoveredDifference = Number(isHovered(b, idField, hoveredId)) - Number(isHovered(a, idField, hoveredId));
      if (hoveredDifference) return hoveredDifference;
      const priorityDifference = Number(b[priorityField]) - Number(a[priorityField]);
      return priorityDifference || getTopY(a, collisionBoxesField) - getTopY(b, collisionBoxesField);
    });
  const accepted: Record<string, unknown>[] = [];

  for (const candidate of candidates) {
    const collisionBoxes = candidate[collisionBoxesField] as number[][];
    const overlaps = accepted.some((visibleCandidate) => {
      const visibleCollisionBoxes = visibleCandidate[collisionBoxesField] as number[][];
      return collisionBoxes.some(([leftX, rightX, topY, bottomY]) =>
        visibleCollisionBoxes.some(
          ([visibleLeftX, visibleRightX, visibleTopY, visibleBottomY]) =>
            leftX < visibleRightX + gap &&
            rightX > visibleLeftX - gap &&
            topY < visibleBottomY + gap &&
            bottomY > visibleTopY - gap
        )
      );
    });
    const isDatum =
      candidate === datum ||
      (candidate[idField] !== undefined && datum[idField] !== undefined && candidate[idField] === datum[idField]);
    if (overlaps) {
      if (isDatum) return false;
      continue;
    }
    accepted.push(candidate);
    if (isDatum) return true;
  }

  return false;
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

type HoverFractionRow = Record<string, unknown> & { fraction?: number };
const hoverFractionIndexes = new WeakMap<HoverFractionRow[], Map<unknown, HoverFractionRow>>();

/**
 * Returns a hover animation value (the fraction by default) for `key`, indexing the rows once per data array.
 * @param rows - the hoverFractionData values
 * @param keyField - the identity field the rows are keyed by
 * @param key - the identity of the item being encoded
 * @param fallback - the value to use when no row matches
 * @param field - the row field to read
 * @returns number
 */
export const hoverFraction = (
  rows: HoverFractionRow[] | undefined,
  keyField: string,
  key: unknown,
  fallback: number,
  field = 'fraction'
): number => {
  if (!rows) return fallback;
  let index = hoverFractionIndexes.get(rows);
  if (!index) {
    index = new Map();
    for (const row of rows) {
      if (!index.has(row[keyField])) index.set(row[keyField], row);
    }
    hoverFractionIndexes.set(rows, index);
  }
  return (index.get(key)?.[field] as number | undefined) ?? fallback;
};

const DONUT_MIN_VISIBLE_SLICE_WIDTH = 1;

/**
 * Clamps a slice's stroke width so a sliver of fill stays visible at the inner radius.
 * @param requestedWidth
 * @param innerRadius
 * @param startAngle
 * @param endAngle
 * @param cutoff - draw-in sweep angle; omit when not animating
 * @returns stroke width in px
 */
export const donutSliceStrokeWidth = (
  requestedWidth: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
  cutoff?: number
): number => {
  const arcLength =
    cutoff === undefined ? endAngle - startAngle : Math.min(endAngle, cutoff) - Math.min(startAngle, cutoff);
  const arcAngle = Math.min(Math.PI, Math.max(0, arcLength));
  const availableWidth = 2 * Math.max(0, innerRadius) * Math.sin(arcAngle / 2);
  return Math.min(requestedWidth, Math.max(0, availableWidth - DONUT_MIN_VISIBLE_SLICE_WIDTH));
};

const BEZIER_EPSILON = 1e-6;

/**
 * Evaluates a CSS-style cubic-bezier easing curve (P0 = 0,0 and P3 = 1,1) at progress `t`.
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param t - linear progress, clamped to 0-1
 * @returns eased progress
 */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number, t: number): number => {
  if (Number.isNaN(t) || t <= 0) return 0;
  if (t >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;

  // Newton-Raphson converges in a few steps for typical curves
  let s = t;
  for (let i = 0; i < 8; i++) {
    const error = sampleX(s) - t;
    if (Math.abs(error) < BEZIER_EPSILON) return sampleY(s);
    const slope = (3 * ax * s + 2 * bx) * s + cx;
    if (Math.abs(slope) < BEZIER_EPSILON) break;
    s -= error / slope;
  }

  // bisection fallback for flat slopes, where Newton can't make progress
  let low = 0;
  let high = 1;
  s = t;
  for (let i = 0; i < 30; i++) {
    const x = sampleX(s);
    if (Math.abs(x - t) < BEZIER_EPSILON) break;
    if (x < t) low = s;
    else high = s;
    s = (low + high) / 2;
  }
  return sampleY(s);
};

export const expressionFunctions = {
  consoleLog,
  cubicBezier,
  donutSliceStrokeWidth,
  formatHorizontalTimeAxisLabels: formatHorizontalTimeAxisLabels(),
  formatVerticalAxisTimeLabels: formatVerticalAxisTimeLabels(),
  getLabelWidth,
  hoverFraction,
  isDonutLabelVisible,
  truncateText,
};
