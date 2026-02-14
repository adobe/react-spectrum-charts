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
import { buildQueries } from '@testing-library/react';

const queryAllMarksByGroupName = (container: HTMLElement, markName: string, tagName = 'path') =>
  [...container.querySelectorAll(`g.${markName} > ${tagName}`)] as HTMLElement[];

const getMultipleError = (_c, markName) => `Found multiple marks under the group name ${markName}`;
const getMissingError = (_c, markName) => `Unable to find any marks under the group name ${markName}`;

const [
  queryMarksByGroupName,
  getAllMarksByGroupName,
  getMarksByGroupName,
  findAllMarksByGroupName,
  findMarksByGroupName,
] = buildQueries<[string, string?]>(queryAllMarksByGroupName, getMultipleError, getMissingError);

export {
  queryMarksByGroupName,
  queryAllMarksByGroupName,
  getMarksByGroupName,
  getAllMarksByGroupName,
  findAllMarksByGroupName,
  findMarksByGroupName,
};

const queryAllLegendEntries = (container: HTMLElement) =>
  [...container.querySelectorAll(`g.role-legend-entry g.role-scope > g > path.foreground`)] as HTMLElement[];

const getMultipleLegendError = () => `Found multiple legend entries`;
const getMissingLegendError = () => `Unable to find any legend entries`;

const [queryLegendEntries, getAllLegendEntries, getLegendEntries, findAllLegendEntries, findLegendEntries] =
  buildQueries(queryAllLegendEntries, getMultipleLegendError, getMissingLegendError);

export {
  queryLegendEntries,
  queryAllLegendEntries,
  getLegendEntries,
  getAllLegendEntries,
  findAllLegendEntries,
  findLegendEntries,
};

const queryAllLegendSymbols = (container: HTMLElement) =>
  [...container.querySelectorAll(`g.role-legend-entry g.role-legend-symbol > path`)] as HTMLElement[];

const getMultipleLegendSymbolsError = () => `Found multiple legend symbols`;
const getMissingLegendSymbolsError = () => `Unable to find any legend symbols`;

const [queryLegendSymbols, getAllLegendSymbols, getLegendSymbols, findAllLegendSymbols, findLegendSymbols] =
  buildQueries(queryAllLegendSymbols, getMultipleLegendSymbolsError, getMissingLegendSymbolsError);

export {
  queryLegendSymbols,
  queryAllLegendSymbols,
  getLegendSymbols,
  getAllLegendSymbols,
  findAllLegendSymbols,
  findLegendSymbols,
};

const queryAllAxisLabels = (container: HTMLElement) =>
  [...container.querySelectorAll(`g.role-axis-label > text`)] as HTMLElement[];

const getMultipleAxisLabelError = () => `Found multiple legend entries`;
const getMissingAxisLabelError = () => `Unable to find any legend entries`;

const [queryAxisLabels, getAllAxisLabels, getAxisLabels, findAllAxisLabels, findAxisLabels] = buildQueries(
  queryAllAxisLabels,
  getMultipleAxisLabelError,
  getMissingAxisLabelError
);

export { queryAxisLabels, queryAllAxisLabels, getAxisLabels, getAllAxisLabels, findAllAxisLabels, findAxisLabels };
