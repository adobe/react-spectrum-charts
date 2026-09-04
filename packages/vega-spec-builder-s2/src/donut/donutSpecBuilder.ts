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
  getRingWidthScale,
  getRingWidthSignal,
  getSliceGapScale,
  getSliceGapSignal,
  getSumData,
} from './donutUtils';
import {
  getAdvancedLabelData,
  getAdvancedLabelMarks,
  getAdvancedLabelScales,
  getAdvancedLabelSignals,
} from './advancedLabelUtils';
import {
  getSegmentLabelData,
  getSegmentLabelMarks,
  getSegmentLabelScales,
  getSegmentLabelSignals,
} from './segmentLabelUtils';

export const addDonut = produce<
  ScSpec,
  [
    DonutOptions & {
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      index?: number;
      idKey: string;
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
      startAngle = 0,
      holeRatio = DEFAULT_HOLE_RATIO,
      isBoolean = false,
      segmentLabels = [],
      advancedLabels = [],
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
      advancedLabels,
      startAngle,
      ...options,
    };

    if (isInteractive(donutOptions)) {
      spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, donutOptions.name);
    }
    spec.data = addData(spec.data ?? [], donutOptions);
    spec.scales = addScales(spec.scales ?? [], donutOptions);
    spec.marks = addMarks(spec.marks ?? [], donutOptions);
    spec.signals = addSignals(spec.signals ?? [], donutOptions);
  }
);

export const addData = produce<Data[], [DonutSpecOptions]>((data, options) => {
  const { color, legendHighlightSignals, name, isBoolean } = options;
  const filteredTableIndex = data.findIndex((d) => d.name === FILTERED_TABLE);

  //set up transform
  data[filteredTableIndex].transform = data[filteredTableIndex].transform ?? [];
  data[filteredTableIndex].transform?.push(...getPieTransforms(options));
  // Needed for both hover directions with a paired Legend: this mark's own hover highlighting the
  // legend (generic mark-hover loop in legendUtils.ts) and a legend hover fading this mark's arcs
  // (getLegendHighlightOpacityRules in donutUtils.ts) - both match on datum[SERIES_ID], which donut's
  // rows don't otherwise have, unlike Line/Bar.
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
    ...getAdvancedLabelData(options)
  );
});

const getPieTransforms = ({ startAngle, metric, name }: DonutSpecOptions): (FormulaTransform | PieTransform)[] => [
  {
    type: 'pie',
    field: metric,
    startAngle,
    endAngle: { signal: `${startAngle} + 2 * PI` },
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
    expr: `datum['${name}_arcLength'] / (2 * PI)`,
  },
];

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
    ...getAdvancedLabelScales(options)
  );
});

export const addMarks = produce<Mark[], [DonutSpecOptions]>((marks, options) => {
  marks.push(
    getEmptyStateArcMark(options),
    getArcMark(options),
    ...getDonutSummaryMarks(options),
    ...getSegmentLabelMarks(options),
    ...getAdvancedLabelMarks(options)
  );
});

export const addSignals = produce<Signal[], [DonutSpecOptions]>((signals, options) => {
  const { chartInspects, emphasizedItems, holeRatio, name } = options;
  if (holeRatio === DEFAULT_HOLE_RATIO) {
    signals.push(getRingWidthSignal(options));
  }
  signals.push(
    getSliceGapSignal(options),
    ...getDonutSummarySignals(options),
    ...getSegmentLabelSignals(options),
    ...getAdvancedLabelSignals(options)
  );
  if (!isInteractive(options)) return;
  // emphasize is currently a static state, mouse hover shouldn't fade/legend-sync/color-switch. excludeCondition makes HOVERED_ITEM stay null unconditionally.
  const excludeCondition = emphasizedItems?.length ? 'true' : undefined;
  addHoveredItemSignal(signals, name, undefined, 1, chartInspects[0]?.excludeDataKeys, excludeCondition);
});
