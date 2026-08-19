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
import { ArcMark, ColorValueRef, ProductionRule, Signal, SourceData, ThresholdScale } from 'vega';

import {
  DEFAULT_HOLE_RATIO,
  DONUT_RADIUS,
  DONUT_RING_WIDTHS,
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SLICE_GAPS,
  FILTERED_TABLE,
  SELECTED_ITEM,
} from '@spectrum-charts/constants';
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

/**
 * Gets the arc fill, forcing the secondary segment of a boolean donut to secondary-gray
 * @param options
 * @returns ColorValueRef | ProductionRule<ColorValueRef>
 */
const getArcFillEncoding = ({
  color,
  colorScheme,
  idKey,
  isBoolean,
  name,
}: DonutSpecOptions): ColorValueRef | ProductionRule<ColorValueRef> => {
  const normalColor = getColorProductionRule(color, colorScheme);
  if (!isBoolean) return normalColor;

  const isPrimaryTest = `datum.${idKey} === data('${name}_booleanData')[0].${idKey}`;
  return [{ test: `!(${isPrimaryTest})`, value: getS2ColorValue('gray-400', colorScheme) }, normalColor];
};

/**
 * Gets the threshold scale that snaps a donut's outer diameter to its nearest named size tier's fixed ring width
 * @param donutOptions
 * @returns ThresholdScale
 */
export const getRingWidthScale = ({ name }: DonutSpecOptions): ThresholdScale => ({
  name: `${name}_ringWidthScale`,
  type: 'threshold',
  domain: DONUT_SIZE_TIER_CUTPOINTS,
  range: DONUT_RING_WIDTHS,
});

/**
 * Gets the signal that resolves a donut's fixed ring width from its outer diameter
 * @param donutOptions
 * @returns Signal
 */
export const getRingWidthSignal = ({ name }: DonutSpecOptions): Signal => ({
  name: `${name}_ringWidth`,
  update: `scale('${name}_ringWidthScale', 2 * ${DONUT_RADIUS})`,
});

/**
 * Gets the threshold scale that snaps a donut's outer diameter to its nearest named size tier's fixed slice gap
 * @param donutOptions
 * @returns ThresholdScale
 */
export const getSliceGapScale = ({ name }: DonutSpecOptions): ThresholdScale => ({
  name: `${name}_sliceGapScale`,
  type: 'threshold',
  domain: DONUT_SIZE_TIER_CUTPOINTS,
  range: DONUT_SLICE_GAPS,
});

/**
 * Gets the signal that resolves a donut's fixed segment gap (in px) from its outer diameter
 * @param donutOptions
 * @returns Signal
 */
export const getSliceGapSignal = ({ name }: DonutSpecOptions): Signal => ({
  name: `${name}_sliceGap`,
  update: `scale('${name}_sliceGapScale', 2 * ${DONUT_RADIUS})`,
});

/**
 * Gets the donut's inner radius expression. Uses the fixed per-tier ring width when holeRatio is left at its
 * default, otherwise honors an explicitly customized holeRatio as a proportional ring
 * @param donutOptions
 * @returns vega expression string
 */
export const getDonutInnerRadiusExpr = ({ holeRatio, name }: DonutSpecOptions): string =>
  holeRatio === DEFAULT_HOLE_RATIO ? `(${DONUT_RADIUS} - ${name}_ringWidth)` : `${holeRatio} * ${DONUT_RADIUS}`;

export const getArcMark = (options: DonutSpecOptions): ArcMark => {
  const { chartPopovers, chartInspects, colorScheme, idKey, name } = options;
  return {
    type: 'arc',
    name,
    description: name,
    from: { data: FILTERED_TABLE },
    encode: {
      enter: {
        fill: getArcFillEncoding(options),
        x: { signal: 'width / 2' },
        y: { signal: 'height / 2' },
        tooltip: getInspectEncoding(chartInspects, name),
        stroke: { value: getS2ColorValue('static-blue', colorScheme) },
      },
      update: {
        startAngle: { field: `${name}_startAngle` },
        endAngle: { field: `${name}_endAngle` },
        // converts the per-tier fixed px slice gap (chart.donut.size.slice-gap) to an angle at the outer radius
        padAngle: { signal: `${name}_sliceGap / ${DONUT_RADIUS}` },
        innerRadius: { signal: getDonutInnerRadiusExpr(options) },
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
  const { colorScheme, name } = options;
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
        innerRadius: { signal: getDonutInnerRadiusExpr(options) },
        outerRadius: { signal: DONUT_RADIUS },
        opacity: [{ test: getDonutEmptyStateTest(name), value: 1 }, { value: 0 }],
      },
    },
  };
};
