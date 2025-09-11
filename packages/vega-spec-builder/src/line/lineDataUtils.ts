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
import { SourceData } from 'vega';

import { GROUP_ID, HIGHLIGHTED_GROUP, HIGHLIGHTED_ITEM, SELECTED_ITEM } from '@spectrum-charts/constants';

/**
 * gets the data used for highlighting hovered data points
 * @param name
 * @param source
 * @returns
 */
export const getLineHighlightedData = (
  name: string,
  idKey: string,
  source: string,
  hasPopover: boolean,
  hasGroupId: boolean
): SourceData => {
  const highlightedExpr = hasGroupId
    ? `${HIGHLIGHTED_GROUP} === datum.${name}_${GROUP_ID}`
    : `isArray(${HIGHLIGHTED_ITEM}) && indexof(${HIGHLIGHTED_ITEM}, datum.${idKey}) > -1  || ${HIGHLIGHTED_ITEM} === datum.${idKey}`;
  const expr = hasPopover
    ? `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${idKey} || !${SELECTED_ITEM} && ${highlightedExpr}`
    : highlightedExpr;
  return {
    name: `${name}_highlightedData`,
    source,
    transform: [
      {
        type: 'filter',
        expr,
      },
    ],
  };
};

/**
 * gets the data used for displaying points
 * @param name
 * @param staticPoint
 * @param source
 * @param isSparkline
 * @param isMethodLast
 * @returns
 */
export const getLineStaticPointData = (
  name: string,
  staticPoint: string | undefined,
  source: string,
  isSparkline: boolean | undefined,
  isMethodLast: boolean | undefined
): SourceData => {
  const expr =
    isSparkline && isMethodLast ? "datum === data('table')[data('table').length - 1]" : `datum.${staticPoint} === true`;
  return {
    name: `${name}_staticPointData`,
    source,
    transform: [
      {
        type: 'filter',
        expr,
      },
    ],
  };
};
