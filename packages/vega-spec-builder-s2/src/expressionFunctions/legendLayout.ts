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
import { DEFAULT_FONT_SIZE, DEFAULT_LEGEND_COLUMN_PADDING } from '@spectrum-charts/core-s2/constants';

import { expressionFunctions } from './expressionFunctions.js';

export interface LegendLabelWidthDatum {
  entryKey: string;
  displayLabel: string;
  labelWidth: number;
}

export interface LegendPage {
  columns: number;
  start: number;
  end: number;
}

export interface LegendColumnLayout {
  columns: number;
  labelLimit: number;
  wrapWidth: number;
}

const LEGEND_ITEM_BASE = 22;
const LEGEND_COLUMN_FIT_MARGIN = 2;
const measure = (text: string) => expressionFunctions.getLabelWidth(text, 'normal', DEFAULT_FONT_SIZE);

/** Wraps labels using the same greedy word packing as the chart-internal legend. */
export function wrapLabelText(text: string, maxWidth: number, maxLines: number): string[] {
  const fitLine = (line: string) =>
    measure(line) <= maxWidth ? line : expressionFunctions.truncateText(line, maxWidth, 'normal', DEFAULT_FONT_SIZE);
  const words = text.split(/\s+/).filter(Boolean);
  const limit = Math.max(1, Math.floor(maxLines));
  if (limit <= 1 || !words.length) return [fitLine(text)];
  const lines: string[] = [];
  let current = '';
  let index = 0;
  while (index < words.length && lines.length < limit - 1) {
    const candidate = current ? `${current} ${words[index]}` : words[index];
    if (!current || measure(candidate) <= maxWidth) {
      current = candidate;
      index++;
    } else {
      lines.push(fitLine(current));
      current = '';
    }
  }
  lines.push(fitLine([current, ...words.slice(index)].filter(Boolean).join(' ')));
  return lines;
}

function wrapTruncates(text: string, width: number, maxLines: number): boolean {
  let lines = 1;
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (measure(word) > width) return true;
    const candidate = current ? `${current} ${word}` : word;
    if (!current || measure(candidate) <= width) current = candidate;
    else {
      if (++lines > Math.max(1, Math.floor(maxLines))) return true;
      current = word;
    }
  }
  return false;
}

const fairShare = (width: number, columns: number) =>
  (width - (columns - 1) * DEFAULT_LEGEND_COLUMN_PADDING) / columns - LEGEND_ITEM_BASE;

function fitsAtFullWidth(items: readonly LegendLabelWidthDatum[], width: number, columns: number): boolean {
  if (!items.length) return true;
  const widths: number[] = new Array(columns).fill(0);
  items.forEach((item, index) => {
    widths[index % columns] = Math.max(widths[index % columns], item.labelWidth);
  });
  return (
    widths.reduce((sum, value) => sum + Math.ceil(value) + LEGEND_ITEM_BASE + LEGEND_COLUMN_FIT_MARGIN, 0) +
      (columns - 1) * DEFAULT_LEGEND_COLUMN_PADDING <=
    width
  );
}

function fitsWhenWrapped(items: readonly LegendLabelWidthDatum[], width: number, columns: number, lines: number) {
  return items.every((item) => !wrapTruncates(item.displayLabel, fairShare(width, columns), lines));
}

function candidateLayout(
  items: readonly LegendLabelWidthDatum[],
  width: number,
  columns: number,
  last: number,
  lines: number
): LegendColumnLayout | undefined {
  const full = fitsAtFullWidth(items, width, columns);
  if (!full && !(lines > 1 && fitsWhenWrapped(items, width, columns, lines))) return;
  return {
    columns,
    labelLimit: lines > 1 || columns !== last ? 0 : fairShare(width, last),
    wrapWidth: lines > 1 ? (full ? width : fairShare(width, columns)) : 0,
  };
}

function fallbackLayout(width: number, columns: number, lines: number): LegendColumnLayout {
  return {
    columns,
    labelLimit: lines > 1 ? 0 : fairShare(width, columns),
    wrapWidth: lines > 1 ? fairShare(width, columns) : 0,
  };
}

/** Chooses the first preferred column count whose labels fit, including word wrapping. */
export function getLegendColumnLayout(
  items: readonly LegendLabelWidthDatum[],
  width: number,
  candidates: readonly number[],
  lines = 1
): LegendColumnLayout {
  const last = candidates.at(-1);
  if (last === undefined) return { columns: 1, labelLimit: 0, wrapWidth: 0 };
  for (const columns of candidates) {
    const layout = candidateLayout(items, width, columns, last, lines);
    if (layout) return layout;
  }
  return fallbackLayout(width, last, lines);
}

/** Plans each page using only the entries that would appear on that page. */
export function getLegendPages(
  items: readonly LegendLabelWidthDatum[],
  width: number,
  candidates: readonly number[],
  maxRows: number,
  lines = 1
): LegendPage[] {
  const pages: LegendPage[] = [];
  let start = 0;
  while (start < items.length) {
    const remaining = items.slice(start);
    const columns =
      candidates.find((candidate) => {
        const page = remaining.slice(0, candidate * Math.max(1, maxRows));
        return fitsAtFullWidth(page, width, candidate) || (lines > 1 && fitsWhenWrapped(page, width, candidate, lines));
      }) ??
      candidates.at(-1) ??
      1;
    const size = Math.max(1, Math.min(remaining.length, columns * Math.max(1, maxRows)));
    pages.push({ columns, start, end: start + size - 1 });
    start += size;
  }
  return pages;
}

/** Keeps the rendered column count in sync with the current page's original plan. */
export function getLegendColumnLayoutForPage(
  visible: readonly LegendLabelWidthDatum[],
  items: readonly LegendLabelWidthDatum[],
  pages: readonly LegendPage[],
  candidates: readonly number[],
  width: number,
  lines = 1
): LegendColumnLayout {
  const last = candidates.at(-1);
  const lastPage = pages.at(-1);
  if (!visible.length || !lastPage || last === undefined) return { columns: 1, labelLimit: 0, wrapWidth: 0 };
  const index = items.findIndex((item) => item.entryKey === visible[0].entryKey);
  const page = pages.find((candidate) => candidate.start === index) ?? lastPage;
  return candidateLayout(visible, width, page.columns, last, lines) ?? fallbackLayout(width, last, lines);
}
