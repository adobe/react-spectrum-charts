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
  AnimationType,
  COLOR_SCALE,
  DEFAULT_ANIMATION_TYPES,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_HOLE_RATIO,
  DEFAULT_METRIC,
  FILTERED_TABLE,
  SERIES_ID,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { getSeriesIdTransform, getTableData } from '../data/dataUtils';
import {
  addHoverAnimLastChangeData,
  addHoverAnimationSignals,
  getHoverAnimStateData,
  getHoverFractionData,
  getHoverSeriesFractionData,
  getHoverTargetData,
} from '../marks/hoverAnimationUtils';
import { isInteractive } from '../marks/markUtils';
import { addFieldToFacetScaleDomain } from '../scale/scaleSpecBuilder';
import { addHoveredItemSignal } from '../signal/signalSpecBuilder';
import { addUserMetaAnimatedMark, addUserMetaInteractiveMark } from '../specUtils';
import { ChartData, ColorScheme, DonutOptions, DonutSpecOptions, HighlightedItem, ScSpec } from '../types';
import {
  getDonutSummaryData,
  getDonutSummaryMarks,
  getDonutSummarySignals,
} from './donutSummaryUtils';
import {
  getArcMark,
  getDonutAnimIdField,
  getDonutHoverRules,
  getDonutStartAngle,
  getEmptyStateArcMark,
  isDonutInteractive,
  getRingWidthSignal,
  getLabelRingGapSignals,
  getSizeTierScale,
  getSizeTierSignal,
  getSliceGapSignal,
  getSumData,
} from './donutUtils';
import {
  getSegmentLabelData,
  getSegmentLabelMarks,
  getSegmentLabelSignals,
  getRichSegmentLabelData,
  getRichSegmentLabelMarks,
  getRichSegmentLabelSignals,
} from './segmentLabelUtils';

export const addDonut = produce<
  ScSpec,
  [
    DonutOptions & {
      animations?: boolean;
      animationTypes?: AnimationType[];
      colorScheme?: ColorScheme;
      data?: ChartData[];
      highlightedItem?: HighlightedItem;
      highlightedSeries?: string | number;
      index?: number;
      idKey: string;
      legendHighlightSignals?: string[];
    }
  ]
>(
  (
    spec,
    {
      animations,
      animationTypes,
      chartPopovers = [],
      chartInspects = [],
      color = DEFAULT_COLOR,
      colorScheme = DEFAULT_COLOR_SCHEME,
      donutSummaries = [],
      data,
      index = 0,
      metric = DEFAULT_METRIC,
      name,
      holeRatio = DEFAULT_HOLE_RATIO,
      isBoolean = false,
      segmentLabels = [],
      sortOrder = 'valueDescending',
      variant = 'circle',
      ...options
    }
  ) => {
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
      variant,
      segmentIds: data?.map((_, index) => index + 1) ?? [],
      ...options,
    };
    donutOptions.isHoverAnimate =
      animations !== false &&
      (animationTypes ?? DEFAULT_ANIMATION_TYPES).includes('hover') &&
      (isDonutInteractive(donutOptions) ||
        donutOptions.highlightedItem !== undefined ||
        donutOptions.highlightedSeries !== undefined);

    if (isDonutInteractive(donutOptions)) {
      spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, donutOptions.name);
    }
    if (donutOptions.isHoverAnimate) {
      spec.usermeta = addUserMetaAnimatedMark(spec.usermeta, donutOptions.name);
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
  if (options.isHoverAnimate) {
    const keyField = getDonutAnimIdField(name);
    const table = getTableData(data);
    table.transform = [
      ...(table.transform ?? []),
      ...getSeriesIdTransform([color]),
      { type: 'window', ops: ['row_number'], as: [keyField] },
    ];
    data.push(
      getHoverTargetData({
        name,
        groupby: [keyField, options.idKey, SERIES_ID],
        rules: getDonutHoverRules(options),
      }),
      getHoverAnimStateData({ name, keys: options.segmentIds ?? [], keyField }),
      getHoverFractionData(name),
      getHoverSeriesFractionData(name, keyField)
    );
    addHoverAnimLastChangeData(data, name);
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

const getPieTransforms = (options: DonutSpecOptions): (FormulaTransform | PieTransform)[] => {
  const { metric, name, variant } = options;
  const startAngle = getDonutStartAngle(options);
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
  const { color } = options;
  addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
  scales.push(getSizeTierScale(options));
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
  if (options.isHoverAnimate) {
    addHoverAnimationSignals(signals, name);
  }
  if (holeRatio === DEFAULT_HOLE_RATIO) {
    signals.push(getRingWidthSignal(options));
  }
  signals.push(
    getSizeTierSignal(options),
    ...getLabelRingGapSignals(options),
    getSliceGapSignal(options),
    ...getDonutSummarySignals(options),
    ...getSegmentLabelSignals(options),
    ...getRichSegmentLabelSignals(options)
  );
  if (!isDonutInteractive(options)) return;
  addHoveredItemSignal(signals, name, undefined, 1, chartInspects[0]?.excludeDataKeys);
});
