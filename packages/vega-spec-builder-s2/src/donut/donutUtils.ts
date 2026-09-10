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
import { ArcMark, SourceData } from 'vega';

import { DONUT_RADIUS, FILTERED_TABLE, SELECTED_ITEM } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getColorProductionRule, getCursor, getMarkOpacity, getInspectEncoding } from '../marks/markUtils';
import { DonutSpecOptions } from '../types';

/**
 * Gets the test expression that is true when the donut has no data or all metric values sum to 0.
 * When the metric sum is 0, the vega pie transform produces NaN angles which cannot be rendered.
 * @param name donut name
 * @returns vega expression string
 */
export const getDonutEmptyStateTest = (name: string): string =>
  `length(data('${FILTERED_TABLE}')) === 0 || !data('${name}_sumData')[0]['sum']`;

/**
 * Gets the data source that aggregates the sum of the metric.
 * Used to detect the empty state (no data or all metric values are 0).
 * @param donutOptions
 * @returns SourceData
 */
export const getSumData = ({ metric, name }: DonutSpecOptions): SourceData => ({
  name: `${name}_sumData`,
  source: FILTERED_TABLE,
  transform: [
    {
      type: 'aggregate',
      fields: [metric],
      ops: ['sum'],
      as: ['sum'],
    },
  ],
});

export const getArcMark = (options: DonutSpecOptions): ArcMark => {
  const { chartPopovers, chartInspects, color, colorScheme, holeRatio, idKey, name } = options;
  return {
    type: 'arc',
    name,
    description: name,
    from: { data: FILTERED_TABLE },
    encode: {
      enter: {
        fill: getColorProductionRule(color, colorScheme),
        x: { signal: 'width / 2' },
        y: { signal: 'height / 2' },
        tooltip: getInspectEncoding(chartInspects, name),
        stroke: { value: getS2ColorValue('static-blue', colorScheme) },
      },
      update: {
        startAngle: { field: `${name}_startAngle` },
        endAngle: { field: `${name}_endAngle` },
        padAngle: { value: 0.01 },
        innerRadius: { signal: `${holeRatio} * ${DONUT_RADIUS}` },
        outerRadius: { signal: DONUT_RADIUS },
        // hide the segments when there isn't any data to display, the empty state ring is shown instead
        opacity: [{ test: getDonutEmptyStateTest(name), value: 0 }, ...getMarkOpacity(options)],
        cursor: getCursor(chartPopovers),
        strokeWidth: [{ test: `${SELECTED_ITEM} === datum.${idKey}`, value: 2 }, { value: 0 }],
      },
    },
  };
};

/**
 * Gets the empty state arc mark. This is a light gray ring that is only visible
 * when the donut has no data or all metric values sum to 0.
 * @param donutOptions
 * @returns ArcMark
 */
export const getEmptyStateArcMark = (options: DonutSpecOptions): ArcMark => {
  const { colorScheme, holeRatio, name } = options;
  return {
    type: 'arc',
    name: `${name}_emptyState`,
    description: `${name}_emptyState`,
    interactive: false,
    encode: {
      enter: {
        fill: { value: getS2ColorValue('gray-200', colorScheme) },
        x: { signal: 'width / 2' },
        y: { signal: 'height / 2' },
        startAngle: { value: 0 },
        endAngle: { signal: '2 * PI' },
      },
      update: {
        innerRadius: { signal: `${holeRatio} * ${DONUT_RADIUS}` },
        outerRadius: { signal: DONUT_RADIUS },
        opacity: [{ test: getDonutEmptyStateTest(name), value: 1 }, { value: 0 }],
      },
    },
  };
};
