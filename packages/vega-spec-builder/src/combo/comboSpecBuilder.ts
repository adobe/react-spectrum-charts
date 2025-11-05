/*
 * Copyright 2024 Adobe. All rights reserved.
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

import { DEFAULT_COLOR_SCHEME, DEFAULT_TIME_DIMENSION } from '@spectrum-charts/constants';
import { combineNames, toCamelCase } from '@spectrum-charts/utils';

import { addBar } from '../bar/barSpecBuilder';
import { addLine } from '../line/lineSpecBuilder';
import { BarOptions, ColorScheme, ComboOptions, HighlightedItem, LineOptions, ScSpec } from '../types';

export const addCombo = produce<
  ScSpec,
  [ComboOptions & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>(
  (
    spec,
    {
      colorScheme = DEFAULT_COLOR_SCHEME,
      highlightedItem,
      idKey,
      index = 0,
      name,
      marks = [],
      dimension = DEFAULT_TIME_DIMENSION,
    }
  ) => {
    let { barCount, lineCount } = initializeComponentCounts();
    const comboName = toCamelCase(name || `combo${index}`);

    // Pre-calculate all mark names once
    const allMarkNames = marks.map((mark) => {
      switch (mark.markType) {
        case 'bar':
          barCount++;
          return getComboMarkName(mark, comboName, barCount);
        case 'line':
          lineCount++;
          return getComboMarkName(mark, comboName, lineCount);
        default:
          return '';
      }
    });

    // Reset counters for processing
    barCount = -1;
    lineCount = -1;

    // Single pass: process marks and add to spec
    spec = [...marks].reduce((acc: ScSpec, mark, markIndex) => {
      let markName: string;

      // Get sibling names by excluding current mark
      const comboSiblingNames = allMarkNames.filter((_, index) => index !== markIndex);

      switch (mark.markType) {
        case 'bar':
          barCount++;
          markName = allMarkNames[markIndex];
          return addBar(acc, {
            ...mark,
            colorScheme,
            comboSiblingNames,
            highlightedItem,
            idKey,
            index: barCount,
            name: markName,
            dimension: getDimension(mark, dimension),
          });
        case 'line':
        default:
          lineCount++;
          markName = allMarkNames[markIndex];
          return addLine(acc, {
            ...mark,
            colorScheme,
            comboSiblingNames,
            highlightedItem,
            idKey,
            index: lineCount,
            name: markName,
            dimension: getDimension(mark, dimension),
          });
      }
    }, spec);

    return spec;
  }
);

const initializeComponentCounts = () => {
  return { barCount: -1, lineCount: -1 };
};

export const getComboMarkName = (mark: BarOptions | LineOptions, comboName: string, index: number) => {
  if (mark.name) {
    return mark.name;
  }
  const displayName = getDisplayName(mark.markType);
  return combineNames(comboName, `${displayName}${index}`);
};

const getDisplayName = (markType: string): string => {
  if (!markType) return '';
  return markType.charAt(0).toUpperCase() + markType.slice(1);
};

const getDimension = (mark: BarOptions | LineOptions, dimension?: string) => mark.dimension ?? dimension;
