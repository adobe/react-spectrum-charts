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
import { BandScale, Data, FormulaTransform, Mark, OrdinalScale, Scale, Signal } from 'vega';

import {
  AnimationType,
  COLOR_SCALE,
  DEFAULT_ANIMATION_TYPES,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DIMENSION_HOVER_AREA,
  FILTERED_TABLE,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  FOCUSED_REGION,
  GROUP_ID,
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
  addInspectData,
  addInspectSignals,
  getGroupIdTransform,
  getInspects,
  isHighlightedByGroup,
} from '../chartInspect/chartInspectUtils';
import { addTimeTransform, getTableData, getTransformSort } from '../data/dataUtils';
import {
  addHoverAnimLastChangeData,
  addHoverAnimationSignals,
  getHoverAnimStateData,
  getHoverFractionData,
  getHoverSeriesFractionData,
  getHoverTargetData,
} from '../marks/hoverAnimationUtils';
import { getInteractiveMarkName, isInteractive } from '../marks/markUtils';
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
import {
  addUserMetaAccessibleNavigationMark,
  addUserMetaAnimatedMark,
  addUserMetaDivergingBarMark,
  addUserMetaInteractiveMark,
  getFacetsFromOptions,
} from '../specUtils';
import { getBarDirectLabelMarks, getBarDirectLabelSpecOptions } from '../barDirectLabel/barDirectLabelUtils';
import { addTrendlineData, getTrendlineMarks, setTrendlineSignals } from '../trendline';
import { BarOptions, BarSpecOptions, ChartData, ColorScheme, HighlightedItem, ScSpec } from '../types';
import { getChartFocusRing } from './barFocusRingUtils';
import {
  getBarAnimIdField,
  getBarHoverRules,
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
      animations?: boolean;
      animationTypes?: AnimationType[];
      accessibleNavigation?: boolean;
      colorScheme?: ColorScheme;
      data?: ChartData[];
      highlightedItem?: HighlightedItem;
      highlightedSeries?: string | number;
      index?: number;
      idKey: string;
      comboSiblingNames?: string[];
      legendHighlightSignals?: string[];
    }
  ]
>(
  (
    spec,
    {
      animations,
      animationTypes,
      barAnnotations = [],
      barDirectLabels = [],
      chartPopovers = [],
      chartInspects = [],
      color = { value: 'categorical-100' },
      colorScheme = DEFAULT_COLOR_SCHEME,
      data,
      dimension = DEFAULT_CATEGORICAL_DIMENSION,
      diverging = false,
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
    const { facets, secondaryFacets } = getFacetsFromOptions({ color, lineType, opacity });
    // both facets matter for per-bar uniqueness (e.g. dodged-and-stacked bars), unlike getStackFields
    const barIds = getUniqueBarIds(data, dimension, [...facets, ...secondaryFacets], options.trellis);
    // put options back together now that all defaults are set
    const barOptions: BarSpecOptions = {
      barAnnotations,
      barDirectLabels,
      barIds,
      chartPopovers,
      chartInspects,
      dimensionScaleType: 'band',
      diverging,
      dualMetricAxis,
      orientation,
      color,
      colorScheme,
      dimension,
      hasOnClick,
      hasSquareCorners,
      index,
      interactiveMarkName: getInteractiveMarkName(
        { chartPopovers, chartInspects, hasOnClick, highlightedItem: options.highlightedItem, trendlines },
        barName
      ),
      lineType,
      lineWidth,
      metric,
      metricAxis,
      name: barName,
      opacity,
      paddingRatio,
      popoverMarkName: chartPopovers.length ? barName : undefined,
      trellisOrientation,
      trellisPadding,
      trendlines,
      type,
      ...options,
    };
    barOptions.isHighlightedByGroup = isHighlightedByGroup(barOptions);
    barOptions.isHoverAnimate = usesBarHoverAnimation(animations, animationTypes, barOptions);

    spec.usermeta = {
      ...spec.usermeta,
      chartOrientation: barOptions.orientation,
    };

    // dimension is gated by isInteractive(), not interactiveMarkName (broader, e.g. highlightedItem-only bars)
    spec.usermeta = addUserMetaInteractiveMark(
      spec.usermeta,
      barOptions.interactiveMarkName,
      isInteractive(barOptions) ? barOptions.dimension : undefined
    );
    if (barOptions.isHoverAnimate) {
      spec.usermeta = addUserMetaAnimatedMark(spec.usermeta, barName);
    }
    if (options.accessibleNavigation) {
      spec.usermeta = addUserMetaAccessibleNavigationMark(
        spec.usermeta,
        barName,
        barOptions.dimension,
        typeof barOptions.color === 'string' ? barOptions.color : undefined
      );
    }

    // diverging is single-series only: dodged and faceted (multi-row-per-category) bars have no well-defined sign
    const hasSeriesFacet = facets.length > 0;
    if (diverging && type !== 'dodged' && !hasSeriesFacet) {
      spec.usermeta = addUserMetaDivergingBarMark(
        spec.usermeta,
        barOptions.name,
        barOptions.dimension,
        barOptions.metric
      );
    }

    spec.data = addData(spec.data ?? [], barOptions);
    spec.signals = addSignals(spec.signals ?? [], barOptions);
    spec.scales = addScales(spec.scales ?? [], barOptions);
    spec.marks = addMarks(spec.marks ?? [], barOptions);
  }
);

/**
 * Whether the bar participates in the hover-animation system. Unlike line's `usesHoverAnimation`
 * (opt-out via `animations === false`), bar requires an explicit `animations={true}` -- bar's
 * animated path is new and not yet the default experience, so it must be opted into per chart.
 */
const usesBarHoverAnimation = (
  animations: boolean | undefined,
  animationTypes: AnimationType[] | undefined,
  options: BarSpecOptions
): boolean =>
  animations === true &&
  (animationTypes ?? DEFAULT_ANIMATION_TYPES).includes('hover') &&
  (isInteractive(options) ||
    options.highlightedItem !== undefined ||
    options.highlightedSeries !== undefined ||
    (options.legendHighlightSignals?.length ?? 0) > 0);

/** Unique composite hover-animation identity per rendered bar, computed from the real data (see `BarSpecOptions.barIds`). */
const getUniqueBarIds = (
  data: ChartData[] | undefined,
  dimension: string,
  facets: string[],
  trellis?: string
): string[] => {
  if (!data?.length) return [];
  const fields = [...(trellis ? [trellis] : []), dimension, ...facets];
  return [...new Set(data.map((row) => fields.map((f) => (row as Record<string, unknown>)[f]).join(' | ')))];
};

export const addSignals = produce<Signal[], [BarSpecOptions]>((signals, options) => {
  const {
    barAnnotations,
    chartInspects,
    chartPopovers,
    hasOnClick,
    isHoverAnimate,
    name,
    paddingRatio,
    paddingOuter: barPaddingOuter,
    trendlines,
  } = options;
  // We use this value to calculate ReferenceLine positions.
  const { paddingInner } = getBarPadding(paddingRatio, barPaddingOuter);
  signals.push(getGenericValueSignal('paddingInner', paddingInner));

  if (options.accessibleNavigation) {
    signals.push(
      getGenericValueSignal(FOCUSED_ITEM),
      getGenericValueSignal(FOCUSED_REGION),
      getGenericValueSignal(FOCUSED_DIMENSION)
    );
  }

  if (isDualMetricAxis(options)) {
    signals.push(getFirstRscSeriesIdSignal(), getLastRscSeriesIdSignal());
  }

  if (isHoverAnimate) {
    addHoverAnimationSignals(signals, name);
  }

  if (!barAnnotations.length && !chartPopovers.length && !chartInspects.length && !trendlines.length && !hasOnClick) {
    return;
  }
  addHoveredItemSignal(signals, name, undefined, 1, chartInspects[0]?.excludeDataKeys);
  // gated by isInteractive() to match the rect mark and opacity rule that consume this signal
  if (isInteractive(options)) {
    addHoveredItemSignal(signals, `${name}_${DIMENSION_HOVER_AREA}`);
    // the bar mark sits on top of the dimensionHoverArea rect and occludes it, so also wire the bar's
    // own hover directly onto this signal - otherwise hovering a bar (rather than the padding around it)
    // never triggers the dimension fade rule that reads this signal.
    addHoveredItemSignal(signals, `${name}_${DIMENSION_HOVER_AREA}`, name);
  }
  addInspectSignals(signals, options);
  setTrendlineSignals(signals, options);
});

export const addData = produce<Data[], [BarSpecOptions]>((data, options) => {
  const { dimension, dimensionDataType, metric, order, type } = options;
  if (dimensionDataType === TIME) {
    const tableData = getTableData(data);
    tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
  }

  addBarHoverData(data, options);

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
  addInspectData(data, options);
  addPopoverData(data, options);
});

/** Adds the hover-animation engine's data sources for a bar mark (see `marks/hoverAnimationUtils.ts`). */
const addBarHoverData = (data: Data[], options: BarSpecOptions): void => {
  const { color, dimension, isHighlightedByGroup: highlightedByGroup, isHoverAnimate, lineType, name, opacity, trellis } = options;
  if (!isHoverAnimate) return;

  const { facets, secondaryFacets } = getFacetsFromOptions({ color, lineType, opacity });
  const barAnimIdField = getBarAnimIdField(name);
  const tableData = getTableData(data);
  tableData.transform = tableData.transform ?? [];
  tableData.transform.push({
    type: 'formula',
    as: barAnimIdField,
    expr: [...(trellis ? [trellis] : []), dimension, ...facets, ...secondaryFacets]
      .map((f) => `datum.${f}`)
      .join(' + " | " + '),
  });

  // dimension must be its own groupby field since dimensionHoverMatch compares datum.${dimension} directly
  const groupby = [barAnimIdField, options.idKey, SERIES_ID, dimension];
  if (highlightedByGroup) {
    const groupFields = getGroupHighlightFields(options);
    if (groupFields) {
      tableData.transform.push(getGroupIdTransform(groupFields, name));
      groupby.push(`${name}_${GROUP_ID}`);
    }
  }

  data.push(
    getHoverTargetData({ name, groupby, rules: getBarHoverRules(options) }),
    getHoverAnimStateData({ name, keys: options.barIds ?? [], keyField: barAnimIdField }),
    getHoverFractionData(name),
    getHoverSeriesFractionData(name, barAnimIdField)
  );
  addHoverAnimLastChangeData(data, name);
};

/** Resolves the fields a `ChartInspect`'s `highlightBy` refers to. Mirrors `chartInspectUtils.addInspectData`. */
const getGroupHighlightFields = (options: BarSpecOptions): string[] | undefined => {
  const inspect = getInspects(options).find(({ highlightBy }) => highlightBy && highlightBy !== 'item');
  if (!inspect) return undefined;
  if (inspect.highlightBy === 'dimension') return [options.dimension];
  if (inspect.highlightBy === 'series') return [SERIES_ID];
  if (Array.isArray(inspect.highlightBy)) return inspect.highlightBy;
  return undefined;
};

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

  for (const [i, label] of options.barDirectLabels.entries()) {
    marks.push(...getBarDirectLabelMarks(getBarDirectLabelSpecOptions(label, i, options), options));
  }

  if (options.accessibleNavigation) {
    marks.push(getChartFocusRing(options));
  }
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
