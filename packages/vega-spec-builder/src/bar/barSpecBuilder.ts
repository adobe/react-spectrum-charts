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
import { BandScale, Data, FormulaTransform, Mark, OrdinalScale, Scale, Signal } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DIMENSION_HOVER_AREA,
  FILTERED_TABLE,
  LAST_RSC_SERIES_ID,
  LINE_TYPE_SCALE,
  OPACITY_SCALE,
  PADDING_RATIO,
  SERIES_ID,
  STACK_ID,
  TIME,
  TRELLIS_PADDING,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { addPopoverData, getPopovers } from '../chartPopover/chartPopoverUtils';
import {
  addTooltipData,
  addTooltipSignals,
  hasTooltipWithDimensionAreaTarget,
} from '../chartTooltip/chartTooltipUtils';
import { addTimeTransform, getTableData, getTransformSort } from '../data/dataUtils';
import { getInteractiveMarkName } from '../marks/markUtils';
import {
  addDomainFields,
  addFieldToFacetScaleDomain,
  addMetricScale,
  getDefaultScale,
  getMetricScale,
  getScaleIndexByName,
  getScaleIndexByType,
} from '../scale/scaleSpecBuilder';
import { getDualAxisScaleNames } from '../scale/scaleUtils';
import {
  addHoveredItemSignal,
  getFirstRscSeriesIdSignal,
  getGenericValueSignal,
  getLastRscSeriesIdSignal,
} from '../signal/signalSpecBuilder';
import { addUserMetaInteractiveMark, getFacetsFromOptions } from '../specUtils';
import { addTrendlineData, getTrendlineMarks, setTrendlineSignals } from '../trendline';
import { BarOptions, BarSpecOptions, ColorScheme, HighlightedItem, ScSpec } from '../types';
import {
  getBarPadding,
  getBaseScaleName,
  getDimensionSelectionRing,
  getOrientationProperties,
  getScaleValues,
  isDodgedAndStacked,
  isDualMetricAxis,
} from './barUtils';
import { getDodgedMarks } from './dodgedBarUtils';
import { getDodgedAndStackedBarMark, getStackedBarMarks } from './stackedBarUtils';
import { addTrellisScale, getTrellisGroupMark, isTrellised } from './trellisedBarUtils';

export const addBar = produce<
  ScSpec,
  [
    BarOptions & {
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      index?: number;
      idKey: string;
      comboSiblingNames?: string[];
    }
  ]
>(
  (
    spec,
    {
      barAnnotations = [],
      chartPopovers = [],
      chartTooltips = [],
      color = { value: 'categorical-100' },
      colorScheme = DEFAULT_COLOR_SCHEME,
      dimension = DEFAULT_CATEGORICAL_DIMENSION,
      dualMetricAxis = false,
      hasOnClick = false,
      hasSquareCorners = false,
      index = 0,
      lineType = { value: 'solid' },
      lineWidth = 0,
      metric = DEFAULT_METRIC,
      metricAxis,
      name,
      opacity = { value: 1 },
      orientation = 'vertical',
      paddingRatio = PADDING_RATIO,
      trellisOrientation = 'horizontal',
      trellisPadding = TRELLIS_PADDING,
      type = 'stacked',
      trendlines = [],
      ...options
    }
  ) => {
    const barName = toCamelCase(name || `bar${index}`);
    // put options back together now that all defaults are set
    const barOptions: BarSpecOptions = {
      barAnnotations,
      chartPopovers,
      chartTooltips,
      dimensionScaleType: 'band',
      dualMetricAxis,
      orientation,
      color,
      colorScheme,
      dimension,
      hasOnClick,
      hasSquareCorners,
      index,
      interactiveMarkName: getInteractiveMarkName(
        { chartPopovers, chartTooltips, hasOnClick, highlightedItem: options.highlightedItem, trendlines },
        barName
      ),
      lineType,
      lineWidth,
      metric,
      metricAxis,
      name: barName,
      opacity,
      paddingRatio,
      trellisOrientation,
      trellisPadding,
      trendlines,
      type,
      ...options,
    };

    spec.usermeta = {
      ...spec.usermeta,
      chartOrientation: barOptions.orientation,
    };

    spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, barOptions.interactiveMarkName);

    spec.data = addData(spec.data ?? [], barOptions);
    spec.signals = addSignals(spec.signals ?? [], barOptions);
    spec.scales = addScales(spec.scales ?? [], barOptions);
    spec.marks = addMarks(spec.marks ?? [], barOptions);
  }
);

export const addSignals = produce<Signal[], [BarSpecOptions]>((signals, options) => {
  const {
    barAnnotations,
    chartTooltips,
    chartPopovers,
    hasOnClick,
    name,
    paddingRatio,
    paddingOuter: barPaddingOuter,
    trendlines,
  } = options;
  // We use this value to calculate ReferenceLine positions.
  const { paddingInner } = getBarPadding(paddingRatio, barPaddingOuter);
  signals.push(getGenericValueSignal('paddingInner', paddingInner));

  if (isDualMetricAxis(options)) {
    signals.push(getFirstRscSeriesIdSignal(), getLastRscSeriesIdSignal());
  }

  if (!barAnnotations.length && !chartPopovers.length && !chartTooltips.length && !trendlines.length && !hasOnClick) {
    return;
  }
  addHoveredItemSignal(signals, name, undefined, 1, chartTooltips[0]?.excludeDataKeys);
  if (hasTooltipWithDimensionAreaTarget(chartTooltips)) {
    addHoveredItemSignal(signals, `${name}_${DIMENSION_HOVER_AREA}`);
  }
  addTooltipSignals(signals, options);
  setTrendlineSignals(signals, options);
});

export const addData = produce<Data[], [BarSpecOptions]>((data, options) => {
  const { dimension, dimensionDataType, metric, order, type } = options;
  if (dimensionDataType === TIME) {
    const tableData = getTableData(data);
    tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
  }

  const index = data.findIndex((d) => d.name === FILTERED_TABLE);
  data[index].transform = data[index].transform ?? [];
  if (type === 'stacked' || isDodgedAndStacked(options)) {
    data[index].transform?.push({
      type: 'stack',
      groupby: getStackFields(options),
      field: metric,
      sort: getTransformSort(order),
      as: [`${metric}0`, `${metric}1`],
    });

    data[index].transform?.push(getStackIdTransform(options));
    data.push(getStackAggregateData(options));
  }
  if (type === 'dodged' || isDodgedAndStacked(options)) {
    data.push(getDodgedGroupAggregateData(options));
    data[index].transform?.push(getDodgeGroupTransform(options));
  }

  addDualMetricAxisData(data, options);
  addTrendlineData(data, options);
  addTooltipData(data, options);
  addPopoverData(data, options);
});

/**
 * data aggregate used to calculate the min and max of the stack
 * used to figure out the corner radius of the bars
 * @param facets
 * @param barSpecOptions
 * @returns vega Data object
 */
export const getStackAggregateData = (options: BarSpecOptions): Data => {
  const { metric, name } = options;
  return {
    name: `${name}_stacks`,
    source: FILTERED_TABLE,
    transform: [
      {
        type: 'aggregate',
        groupby: getStackFields(options),
        fields: [`${metric}1`, `${metric}1`],
        ops: ['min', 'max'],
      },
      getStackIdTransform(options),
    ],
  };
};

export const getStackIdTransform = (options: BarSpecOptions): FormulaTransform => {
  return {
    type: 'formula',
    as: STACK_ID,
    expr: getStackFields(options)
      .map((facet) => `datum.${facet}`)
      .join(' + "," + '),
  } as FormulaTransform;
};

const getStackFields = ({ trellis, color, dimension, lineType, opacity, type }: BarSpecOptions): string[] => {
  const { facets, secondaryFacets } = getFacetsFromOptions({ color, lineType, opacity });
  return [
    ...(trellis ? [trellis] : []),
    dimension,
    ...(type === 'dodged' ? facets : []),
    ...(type === 'stacked' ? secondaryFacets : []),
  ];
};

export const getDodgedGroupAggregateData = (options: BarSpecOptions): Data => {
  const { dimension, name } = options;
  return {
    name: `${name}_groups`,
    source: FILTERED_TABLE,
    transform: [
      {
        type: 'aggregate',
        groupby: [dimension],
      },
    ],
  };
};

export const getDodgeGroupTransform = ({ color, lineType, name, opacity, type }: BarSpecOptions): FormulaTransform => {
  const { facets, secondaryFacets } = getFacetsFromOptions({ color, lineType, opacity });
  return {
    type: 'formula',
    as: `${name}_dodgeGroup`,
    expr: (type === 'dodged' ? facets : secondaryFacets).map((facet) => `datum.${facet}`).join(' + "," + '),
  };
};

export const addDualMetricAxisData = (data: Data[], options: BarSpecOptions) => {
  if (isDualMetricAxis(options)) {
    const baseScaleName = getBaseScaleName(options);
    const scaleNames = getDualAxisScaleNames(baseScaleName);

    if (scaleNames.primaryDomain && scaleNames.secondaryDomain) {
      data.push(
        {
          name: scaleNames.primaryDomain,
          source: FILTERED_TABLE,
          transform: [{ type: 'filter', expr: `datum.${SERIES_ID} !== ${LAST_RSC_SERIES_ID}` }],
        },
        {
          name: scaleNames.secondaryDomain,
          source: FILTERED_TABLE,
          transform: [{ type: 'filter', expr: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}` }],
        }
      );
    }
  }
};

export const addScales = produce<Scale[], [BarSpecOptions]>((scales, options) => {
  const { color, lineType, opacity, metricAxis } = options;
  const { metricAxis: axisType } = getOrientationProperties(options.orientation);

  addMetricScale(scales, getScaleValues(options), axisType);

  if (metricAxis) {
    addMetricScale(scales, getScaleValues(options), axisType, metricAxis);
  }

  if (isDualMetricAxis(options)) {
    const baseScaleName = getBaseScaleName(options);
    const scaleNames = getDualAxisScaleNames(baseScaleName);
    addMetricScale(scales, getScaleValues(options), axisType, scaleNames.primaryScale, scaleNames.primaryDomain);
    addMetricScale(scales, getScaleValues(options), axisType, scaleNames.secondaryScale, scaleNames.secondaryDomain);
  }
  addDimensionScale(scales, options);
  addTrellisScale(scales, options);
  addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
  addFieldToFacetScaleDomain(scales, LINE_TYPE_SCALE, lineType);
  addFieldToFacetScaleDomain(scales, OPACITY_SCALE, opacity);
  addSecondaryScales(scales, options);
});

export const addDimensionScale = (
  scales: Scale[],
  { dimension, paddingRatio, paddingOuter: barPaddingOuter, orientation }: BarSpecOptions
) => {
  const { dimensionAxis } = getOrientationProperties(orientation);
  const index = getScaleIndexByType(scales, 'band', dimensionAxis);
  scales[index] = addDomainFields(scales[index], [dimension]);
  const { paddingInner, paddingOuter } = getBarPadding(paddingRatio, barPaddingOuter);

  scales[index] = { ...scales[index], paddingInner, paddingOuter } as BandScale;
};

/**
 * adds scales for the secondary dimensions
 * If a bar is stacked and dodged,
 * @param scales
 * @param param1
 */
export const addSecondaryScales = (scales: Scale[], options: BarSpecOptions) => {
  const { color, lineType, opacity } = options;
  if (isDodgedAndStacked(options)) {
    [
      {
        value: color,
        scaleName: 'colors',
        secondaryScaleName: 'secondaryColor',
      },
      {
        value: lineType,
        scaleName: 'lineTypes',
        secondaryScaleName: 'secondaryLineType',
      },
      {
        value: opacity,
        scaleName: 'opacities',
        secondaryScaleName: 'secondaryOpacity',
      },
    ].forEach(({ value, scaleName, secondaryScaleName }) => {
      if (Array.isArray(value) && value.length === 2) {
        // secondary value scale used for 2D scales
        const secondaryIndex = getScaleIndexByName(scales, secondaryScaleName, 'ordinal');
        scales[secondaryIndex] = addDomainFields(scales[secondaryIndex], [value[1]]);

        const primaryIndex = getScaleIndexByName(scales, scaleName, 'ordinal');
        const primaryScale = scales[primaryIndex] as OrdinalScale;
        primaryScale.range = { signal: scaleName };
        scales[primaryIndex] = addDomainFields(primaryScale, [value[0]]);
      }
    });
  }
};

export const addMarks = produce<Mark[], [BarSpecOptions]>((marks, options) => {
  const { chartPopovers, name, type } = options;
  const barMarks: Mark[] = [];
  if (isDodgedAndStacked(options)) {
    barMarks.push(getDodgedAndStackedBarMark(options));
  } else if (type === 'stacked') {
    barMarks.push(...getStackedBarMarks(options));
  } else {
    barMarks.push(...getDodgedMarks(options));
  }

  const popovers = getPopovers(chartPopovers, name);
  if (popovers.some((popover) => popover.UNSAFE_highlightBy === 'dimension')) {
    barMarks.push(getDimensionSelectionRing(options));
  }

  // if this is a trellis plot, we add the bars and the repeated scale to the trellis group
  if (isTrellised(options)) {
    const repeatedScale = getRepeatedScale(options);
    marks.push(getTrellisGroupMark(options, barMarks, repeatedScale));
  } else {
    marks.push(...barMarks);
  }

  marks.push(...getTrendlineMarks(options));
});

export const getRepeatedScale = (options: BarSpecOptions): Scale => {
  const { orientation, trellisOrientation } = options;
  // if the orientations match then the metric scale is repeated, otherwise the dimension scale is repeated
  // ex. vertical bar in a vertical trellis will have multiple copies of the metric scale
  if (orientation === trellisOrientation) {
    const { metricAxis } = getOrientationProperties(orientation);
    return getMetricScale(getScaleValues(options), metricAxis, orientation);
  } else {
    return getDimensionScale(options);
  }
};

/**
 * Generates a dimension scale and returns it
 * NOTE: does not check if the dimension scale already exists
 * @param param0
 * @returns
 */
const getDimensionScale = ({
  dimension,
  orientation,
  paddingRatio,
  paddingOuter: barPaddingOuter,
}: BarSpecOptions): BandScale => {
  const { dimensionAxis } = getOrientationProperties(orientation);
  let scale = getDefaultScale('band', dimensionAxis, orientation);
  scale = addDomainFields(scale, [dimension]);
  const { paddingInner, paddingOuter } = getBarPadding(paddingRatio, barPaddingOuter);
  return { ...scale, paddingInner, paddingOuter } as BandScale;
};
