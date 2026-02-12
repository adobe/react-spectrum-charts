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
import { produce } from 'immer';
import { Compare, Data, FormulaTransform, SourceData, Transforms, ValuesData } from 'vega';

import {
  DEFAULT_TIME_DIMENSION,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  FILTERED_TABLE,
  SERIES_ID,
  TABLE,
} from '@spectrum-charts/constants';

import { ChartTooltipOptions } from '../types';

export const addTimeTransform = produce<Transforms[], [string]>((transforms, dimension) => {
  if (transforms.findIndex((transform) => transform.type === 'timeunit') === -1) {
    transforms.push(
      {
        type: 'formula',
        expr: `toDate(datum["${dimension}"])`,
        as: dimension,
      },
      {
        type: 'timeunit',
        field: dimension,
        units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds'],
        as: [DEFAULT_TRANSFORMED_TIME_DIMENSION, `${DEFAULT_TIME_DIMENSION}1`],
      }
    );
  }
});

export const getTransformSort = (order?: string): Compare | undefined => {
  if (order) {
    return { field: order };
  }
};

/**
 * gets the table data from the data array
 * @param data
 * @returns
 */
export const getTableData = (data: Data[]): ValuesData => {
  // ok to cast this here because we know that the data array will always have table data of type ValuesData
  return data.find((d) => d.name === TABLE) as ValuesData;
};
/**
 * gets the filtered table data from the data array
 * @param data
 * @returns
 */
export const getFilteredTableData = (data: Data[]): SourceData => {
  // ok to cast this here because we know that the data array will always have table data of type SourceData
  return data.find((d) => d.name === FILTERED_TABLE) as SourceData;
};

export const getSeriesIdTransform = (facets: string[]): FormulaTransform[] => {
  if (facets.length === 0) return [];
  const expr = facets.map((facet) => `datum.${facet}`).join(' + " | " + ');
  return [
    {
      type: 'formula',
      as: SERIES_ID,
      expr,
    },
  ];
};

/**
 * @param chartTooltips
 * @param validNumericKeys Optional list of keys that must be valid finite numbers in the data.
 *                         Rows where any of these are NaN, null, or undefined are excluded
 *                         so voronoi path marks do not receive invalid path parameters.
 * @returns spec data that filters out items where the `excludeDataKey` is true and invalid numeric values
 */
export const getFilteredTooltipData = (
  chartTooltips: ChartTooltipOptions[],
  validNumericKeys?: string[]
): { name: string; source: string; transform?: { type: 'filter'; expr: string }[] } => {
  const transforms: { type: 'filter'; expr: string }[] = [];

  if (validNumericKeys?.length) {
    validNumericKeys.forEach((key) => {
      transforms.push({
        type: 'filter',
        expr: `isValid(datum["${key}"]) && isFinite(datum["${key}"])`,
      });
    });
  }

  const excludeDataKeys = chartTooltips[0]?.excludeDataKeys;
  if (excludeDataKeys?.length) {
    excludeDataKeys.forEach((excludeDataKey) => {
      transforms.push({ type: 'filter', expr: `!datum.${excludeDataKey}` });
    });
  }

  return {
    name: `${FILTERED_TABLE}ForTooltip`,
    source: FILTERED_TABLE,
    transform: transforms.length ? transforms : undefined,
  };
};
