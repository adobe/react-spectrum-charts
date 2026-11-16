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
import { Data, FormulaTransform, WindowTransform } from 'vega';

import { MARK_ID } from '@spectrum-charts/core-s2/constants';

import { getTableData } from './dataUtils.js';

export interface RowKeyOptions {
  /** mark name */
  name: string;
  /** field with a unique value for each row; `MARK_ID` when the consumer didn't set one */
  idKey: string;
  /** fields that identify a row other than its occurrence, e.g. the dimension and series facets */
  fields: string[];
}

/**
 * Gets the field a mark's items are keyed by, so data updates keep existing items instead of re-entering them.
 * @param options
 * @returns string
 */
export const getRowKeyField = ({ name, idKey }: Pick<RowKeyOptions, 'name' | 'idKey'>): string =>
  idKey === MARK_ID ? `${name}_rowKey` : idKey;

/**
 * Gets an expression that joins values unambiguously by prefixing strings with their length.
 * @param values - expressions
 * @returns expression string
 */
const getJoinedKeyExpr = (values: string[]): string =>
  values.map((value) => `(isString(${value}) ? length(${value}) + ':' + ${value} : '' + ${value})`).join(" + '|' + ");

/**
 * Gets the TABLE transforms that key each row by its fields and its occurrence among rows with the same fields.
 * @param options
 * @returns transforms, or none when `idKey` already identifies rows
 */
export const getRowKeyTransforms = ({ name, idKey, fields }: RowKeyOptions): (WindowTransform | FormulaTransform)[] => {
  // MARK_ID can't be the key: it's regenerated on every data update
  if (idKey !== MARK_ID) return [];
  const occurrenceField = `${name}_rowOccurrence`;
  const uniqueFields = [...new Set(fields.filter(Boolean))];
  return [
    { type: 'window', groupby: uniqueFields, ops: ['row_number'], as: [occurrenceField] },
    {
      type: 'formula',
      as: getRowKeyField({ name, idKey }),
      expr: getJoinedKeyExpr([...uniqueFields.map((field) => `datum.${field}`), `datum.${occurrenceField}`]),
    },
  ];
};

/**
 * Adds the row key transforms to the TABLE data source.
 * @param data
 * @param options
 */
export const addRowKeyTransforms = (data: Data[], options: RowKeyOptions): void => {
  const tableData = getTableData(data);
  tableData.transform = [...(tableData.transform ?? []), ...getRowKeyTransforms(options)];
};
