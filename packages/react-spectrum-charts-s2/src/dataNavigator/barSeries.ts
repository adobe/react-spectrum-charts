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
import { SERIES_ID } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

export interface BarFacetProps {
  color?: unknown;
  lineType?: unknown;
  opacity?: unknown;
  type?: 'dodged' | 'stacked';
}

export interface BarSeriesFields {
  /** The field read as the series' name in labels: `color`, or a dual facet's first field. */
  color?: string;
  /** Every field that divides the bar into series, in the order the chart's series id joins them. */
  seriesFields: string[];
  /** For a dodged-and-stacked bar, the fields that split each category into side-by-side groups. */
  dodgeFields?: string[];
  /** For a dodged-and-stacked bar, the remaining series fields, which tell a stack's segments apart. */
  stackFields?: string[];
}

/** The field a facet prop names at `index` (a dual facet's primary or secondary field). */
const facetField = (facet: unknown, index: 0 | 1): string | undefined => {
  const value = Array.isArray(facet) ? facet[index] : index === 0 ? facet : undefined;
  return typeof value === 'string' ? value : undefined;
};

const uniqueFields = (fields: (string | undefined)[]): string[] => [
  ...new Set(fields.filter((field): field is string => field !== undefined)),
];

/** Mirrors vega-spec-builder-s2's `isDodgedAndStacked` (barUtils.ts): any facet is a two-field array. */
export const isDodgedAndStackedBar = ({ color, lineType, opacity }: BarFacetProps): boolean =>
  [color, lineType, opacity].some((facet) => Array.isArray(facet) && facet.length === 2);

/**
 * A bar's series fields, mirroring the spec builder's `getFacetsFromOptions` and dodge grouping.
 * @param props
 * @returns BarSeriesFields
 */
export const getBarSeriesFields = (props: BarFacetProps): BarSeriesFields => {
  const facets = [props.color, props.lineType, props.opacity];
  const primary = uniqueFields(facets.map((facet) => facetField(facet, 0)));
  const secondary = uniqueFields(facets.map((facet) => facetField(facet, 1)));
  const seriesFields = uniqueFields([...primary, ...secondary]);
  const dodgeFields = isDodgedAndStackedBar(props) ? (props.type === 'dodged' ? primary : secondary) : undefined;
  const stackFields = dodgeFields && seriesFields.filter((field) => !dodgeFields.includes(field));
  return { color: facetField(props.color, 0) ?? seriesFields[0], seriesFields, dodgeFields, stackFields };
};

/** A row's series id the way the chart computes `rscSeriesId`: a single field's raw value, or every field joined with " | ". */
export const getSeriesKey = (row: SimpleData, seriesFields: string[]): unknown =>
  seriesFields.length === 1 ? row[seriesFields[0]] : seriesFields.map((field) => String(row[field])).join(' | ');

export interface ViewKeyedData {
  /** The rows, keyed the way the chart holds them: with the chart's series id and its (possibly parsed) dimension value. */
  data: SimpleData[];
  /** Each dimension value the chart parsed (e.g. a time dimension's date string, held as epoch ms), from `String(parsed)` to the original. */
  dimensionLabels?: Map<string, unknown>;
}

/**
 * Whether a chart table row is this data row: every primitive field matches, the dimension possibly parsed to epoch ms.
 * @param row
 * @param tableRow
 * @param dimension
 * @returns boolean
 */
const isSameRow = (row: SimpleData, tableRow: SimpleData, dimension?: string): boolean =>
  Object.entries(row).every(([key, value]) => {
    const tableValue = tableRow[key];
    if (Object.is(tableValue, value) || (typeof value === 'object' && value !== null) || typeof value === 'function') return true;
    return key === dimension && typeof tableValue === 'number' && new Date(value as string | number).getTime() === tableValue;
  });

/**
 * Keys rows by the chart's own values (read from its table rows when they line up), so navigation ids match the spec's.
 * @param data
 * @param tableRows
 * @param options
 * @returns ViewKeyedData
 */
export const withViewKeys = (
  data: SimpleData[],
  tableRows: SimpleData[] | undefined,
  { seriesFields, dimension }: { seriesFields: string[]; dimension?: string }
): ViewKeyedData => {
  // A stale or reordered table (e.g. the previous view while a new one embeds) is ignored rather than trusted by index.
  const table =
    tableRows?.length === data.length && tableRows.every((tableRow, index) => isSameRow(data[index], tableRow, dimension))
      ? tableRows
      : undefined;
  const tableIds = table?.every((row) => row[SERIES_ID] != null) ? table.map((row) => row[SERIES_ID]) : undefined;
  const dimensionLabels = new Map<string, unknown>();
  const parsedDimension = (row: SimpleData, index: number, field: string): unknown => {
    const parsed = table?.[index][field];
    if (parsed == null || parsed === row[field]) return row[field];
    dimensionLabels.set(String(parsed), row[field]);
    return parsed;
  };
  const addsSeriesIds = Boolean(tableIds || seriesFields.length);
  if (!addsSeriesIds && !(dimension && table)) return { data };
  const keyed = data.map((row, index) => {
    const next: SimpleData = { ...row };
    if (addsSeriesIds) next[SERIES_ID] = tableIds?.[index] ?? getSeriesKey(row, seriesFields);
    if (dimension && dimension in row) next[dimension] = parsedDimension(row, index, dimension);
    return next;
  });
  return { data: keyed, dimensionLabels: dimensionLabels.size ? dimensionLabels : undefined };
};
