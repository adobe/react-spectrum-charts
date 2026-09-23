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
import { produce } from 'immer';
import { Data, FormulaTransform, Mark, PieTransform, Scale, Signal } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_HOLE_RATIO,
  DEFAULT_METRIC,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { getSeriesIdTransform } from '../data/dataUtils';
import { isInteractive } from '../marks/markUtils';
import { addFieldToFacetScaleDomain } from '../scale/scaleSpecBuilder';
import { addHoveredItemSignal } from '../signal/signalSpecBuilder';
import { addUserMetaInteractiveMark } from '../specUtils';
import { ColorScheme, DonutOptions, DonutSpecOptions, HighlightedItem, ScSpec } from '../types';
import {
  getDonutSummaryData,
  getDonutSummaryMarks,
  getDonutSummaryScales,
  getDonutSummarySignals,
} from './donutSummaryUtils';
import {
  getArcMark,
  getEmptyStateArcMark,
  isDonutInteractive,
  getRingWidthScale,
  getRingWidthSignal,
  getSliceGapScale,
  getSliceGapSignal,
  getSumData,
} from './donutUtils';
import {
  getSegmentLabelData,
  getSegmentLabelMarks,
  getSegmentLabelScales,
  getSegmentLabelSignals,
  getRichSegmentLabelData,
  getRichSegmentLabelMarks,
  getRichSegmentLabelScales,
  getRichSegmentLabelSignals,
} from './segmentLabelUtils';

export const addDonut = produce<
  ScSpec,
  [
    DonutOptions & {
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      index?: number;
      idKey: string;
      legendHighlightSignals?: string[];
    }
  ]
>(
  (
    spec,
    {
      chartPopovers = [],
      chartInspects = [],
      color = DEFAULT_COLOR,
      colorScheme = DEFAULT_COLOR_SCHEME,
      donutSummaries = [],
      index = 0,
      metric = DEFAULT_METRIC,
      name,
      startAngle,
      holeRatio = DEFAULT_HOLE_RATIO,
      isBoolean = false,
      segmentLabels = [],
      sortOrder = 'valueDescending',
      variant = 'circle',
      ...options
    }
  ) => {
    // semicircle donuts default to a 9 o'clock start so the sweep runs clockwise through 12 to 3 o'clock
    const resolvedStartAngle = startAngle ?? (variant === 'semicircle' ? -Math.PI / 2 : 0);
    // put options back together now that all defaults are set
    const donutOptions: DonutSpecOptions = {
      chartPopovers,
      chartInspects,
      color,
      colorScheme,
      donutSummaries,
      holeRatio,
      index,
      isBoolean,
      metric,
      name: toCamelCase(name ?? `donut${index}`),
      segmentLabels,
      sortOrder,
      startAngle: resolvedStartAngle,
      variant,
      ...options,
    };

    if (isDonutInteractive(donutOptions)) {
      spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, donutOptions.name);
    }
    spec.data = addData(spec.data ?? [], donutOptions);
    spec.scales = addScales(spec.scales ?? [], donutOptions);
    spec.marks = addMarks(spec.marks ?? [], donutOptions);
    spec.signals = addSignals(spec.signals ?? [], donutOptions);
  }
);

export const addData = produce<Data[], [DonutSpecOptions]>((data, options) => {
  const { color, legendHighlightSignals, name, isBoolean, metric, sortOrder, variant } = options;
  const filteredTableIndex = data.findIndex((d) => d.name === FILTERED_TABLE);

  //set up transform
  data[filteredTableIndex].transform = data[filteredTableIndex].transform ?? [];
  // Semicircles default to largest-first but can preserve source order for ordinal data.
  if (variant === 'semicircle' && sortOrder === 'valueDescending') {
    data[filteredTableIndex].transform?.push({ type: 'collect', sort: { field: metric, order: 'descending' } });
  }
  data[filteredTableIndex].transform?.push(...getPieTransforms(options));
  // Adds SERIES_ID so hovering an arc can highlight its legend entry and hovering a legend entry can
  // fade this mark's arcs - donut rows don't have SERIES_ID by default like Line/Bar do
  if (isInteractive(options) || legendHighlightSignals?.length) {
    data[filteredTableIndex].transform?.push(...getSeriesIdTransform([color]));
  }

  if (isBoolean) {
    //select first data point for our boolean value
    data.push({
      name: `${name}_booleanData`,
      source: FILTERED_TABLE,
      transform: [
        {
          type: 'window',
          ops: ['row_number'],
          as: [`${name}_rscRowIndex`],
        },
        {
          type: 'filter',
          expr: `datum.${name}_rscRowIndex === 1`, // Keep only the first row
        },
      ],
    });
  }
  // used to detect the empty state (no data or all metric values are 0)
  data.push(
    getSumData(options),
    ...getDonutSummaryData(options),
    ...getSegmentLabelData(options),
    ...getRichSegmentLabelData(options)
  );
});

const getPieTransforms = ({
  startAngle,
  metric,
  name,
  variant,
}: DonutSpecOptions): (FormulaTransform | PieTransform)[] => {
  const sweep = variant === 'semicircle' ? 'PI' : '2 * PI';
  return [
    {
      type: 'pie',
      field: metric,
      startAngle,
      endAngle: { signal: `${startAngle} + ${sweep}` },
      as: [`${name}_startAngle`, `${name}_endAngle`],
    },
    {
      type: 'formula',
      as: `${name}_arcTheta`,
      expr: `(datum['${name}_startAngle'] + datum['${name}_endAngle']) / 2`,
    },
    {
      type: 'formula',
      as: `${name}_arcLength`,
      expr: `datum['${name}_endAngle'] - datum['${name}_startAngle']`,
    },
    {
      type: 'formula',
      as: `${name}_arcPercent`,
      expr: `datum['${name}_arcLength'] / (${sweep})`,
    },
  ];
};

export const addScales = produce<Scale[], [DonutSpecOptions]>((scales, options) => {
  const { color, holeRatio } = options;
  addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
  if (holeRatio === DEFAULT_HOLE_RATIO) {
    scales.push(getRingWidthScale(options));
  }
  scales.push(
    getSliceGapScale(options),
    ...getDonutSummaryScales(options),
    ...getSegmentLabelScales(options),
    ...getRichSegmentLabelScales(options)
  );
});

export const addMarks = produce<Mark[], [DonutSpecOptions]>((marks, options) => {
  marks.push(
    getEmptyStateArcMark(options),
    getArcMark(options),
    ...getDonutSummaryMarks(options),
    ...getSegmentLabelMarks(options),
    ...getRichSegmentLabelMarks(options)
  );
});

export const addSignals = produce<Signal[], [DonutSpecOptions]>((signals, options) => {
  const { chartInspects, holeRatio, name } = options;
  if (holeRatio === DEFAULT_HOLE_RATIO) {
    signals.push(getRingWidthSignal(options));
  }
  signals.push(
    getSliceGapSignal(options),
    ...getDonutSummarySignals(options),
    ...getSegmentLabelSignals(options),
    ...getRichSegmentLabelSignals(options)
  );
  if (!isDonutInteractive(options)) return;
  addHoveredItemSignal(signals, name, undefined, 1, chartInspects[0]?.excludeDataKeys);
});
