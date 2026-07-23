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
import merge from 'deepmerge';
import {
  BaseValueRef,
  Color,
  ColorValueRef,
  FilterTransform,
  GuideEncodeEntry,
  LegendEncode,
  NumericValueRef,
  ProductionRule,
  SignalRef,
  SymbolEncodeEntry,
} from 'vega';

import {
  COLOR_SCALE,
  COMPONENT_NAME,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_LABEL_LIMIT,
  DEFAULT_LEGEND_SYMBOL_WIDTH,
  DEFAULT_OPACITY_RULE,
  FADE_FACTOR,
  FILTERED_TABLE,
  GROUP_ID,
  HIGHLIGHTED_GROUP,
  HOVERED_ITEM,
  HOVERED_SERIES,
  LINE_TYPE_SCALE,
  LINE_WIDTH_SCALE,
  OPACITY_SCALE,
  SELECTED_GROUP,
  SELECTED_SERIES,
  SERIES_ID,
  SYMBOL_SHAPE_SCALE,
  SYMBOL_SIZE_SCALE,
} from '@spectrum-charts/constants';
import { getS2ColorValue, spectrum2Colors } from '@spectrum-charts/themes';

import { getPathFromSymbolShape } from '../specUtils';
import {
  ColorValueV6,
  FacetRef,
  FacetType,
  LegendDescription,
  LegendLabel,
  LegendSpecOptions,
  Position,
  SecondaryFacetType,
  UserMeta,
} from '../types';
import { getDeemphasisRamp } from '../marks/hoverAnimationUtils';

export interface Facet {
  facetType: FacetType | SecondaryFacetType;
  field: string;
}

/**
 * Get the number of columns for the legend.
 * Uses actual measured label widths (via the ${name}_maxLabelWidth data source) capped at labelLimit
 * so columns are based on real content rather than a fixed estimate.
 */
export const getColumns = (position: Position, name: string, labelLimit?: number): SignalRef | undefined => {
  if (['left', 'right'].includes(position)) return;

  const symbolAndSpacingWidth = DEFAULT_LEGEND_SYMBOL_WIDTH + DEFAULT_LEGEND_COLUMN_PADDING;
  const effectiveLabelLimit = labelLimit ?? DEFAULT_LEGEND_LABEL_LIMIT;
  const maxWidthExpr = `length(data('${name}_maxLabelWidth')) > 0 ? data('${name}_maxLabelWidth')[0].maxLabelWidth : ${effectiveLabelLimit}`;
  // rscContainerWidth (not raw `width`) — `width` is autosize's live plot-area signal, and a
  // horizontal legend's own rendered size (driven by its column count) is itself one of the
  // inputs autosize uses to compute `width`. Binding columns to `width` creates a feedback loop
  // that never settles: fewer columns -> taller/wider legend -> autosize shrinks width -> even
  // fewer columns -> ... which runs away to 0 on any dataflow pulse (e.g. hover).
  return { signal: `max(1, floor(rscContainerWidth(width) / (min(${maxWidthExpr}, ${effectiveLabelLimit}) + ${symbolAndSpacingWidth})))` };
};

/**
 * Gets the filter transform for hidden entries
 * @param hiddenEntries
 * @returns
 */
export const getHiddenEntriesFilter = (hiddenEntries: string[], name: string): FilterTransform[] => {
  if (!hiddenEntries.length) return [];
  return [
    {
      type: 'filter',
      expr: `indexof(${JSON.stringify(hiddenEntries)}, datum.${name}Entries) === -1`,
    },
  ];
};

/**
 * Get the legend encodings
 * @param facets
 * @param legendOptions
 * @returns
 */
export const getEncodings = (facets: Facet[], legendOptions: LegendSpecOptions, userMeta: UserMeta): LegendEncode => {
  const symbolEncodings = getSymbolEncodings(facets, legendOptions);
  const hoverEncodings = getHoverEncodings(legendOptions, userMeta);
  const legendLabelsEncodings = getLegendLabelsEncodings(legendOptions.name, legendOptions.legendLabels);
  const showHideEncodings = getShowHideEncodings(legendOptions);
  const clickEncodings = getClickEncodings(legendOptions);
  // merge the encodings together
  return mergeLegendEncodings([
    symbolEncodings,
    legendLabelsEncodings,
    hoverEncodings,
    showHideEncodings,
    clickEncodings,
  ]);
};

const getLegendLabelsEncodings = (name: string, legendLabels: LegendLabel[] | undefined): LegendEncode => {
  if (legendLabels) {
    return {
      labels: {
        update: {
          text: [
            {
              // Test whether a legendLabel exists for the seriesName, if not use the seriesName
              test: `indexof(pluck(${name}_labels, 'seriesName'), datum.value) > -1`,
              signal: `${name}_labels[indexof(pluck(${name}_labels, 'seriesName'), datum.value)].label`,
            },
            { signal: 'datum.value' },
          ],
        },
      },
    };
  }
  return {};
};

const getHoverEncodings = (options: LegendSpecOptions, userMeta: UserMeta): LegendEncode => {
  const { highlight, highlightedSeries, name, hasMouseInteraction, descriptions, chartPopovers } = options;
  if (highlight || highlightedSeries || descriptions || chartPopovers?.length || userMeta.interactiveMarks?.length) {
    return {
      entries: {
        name: `${name}_legendEntry`,
        interactive: true,
        enter: {
          tooltip: getLegendDescriptionEncoding(descriptions, name), // only add tooltip if descriptions exist
        },
        update: {
          fill: { value: 'transparent' }, // need something here to trigger the tooltip
        },
      },
      labels: {
        update: {
          opacity: getLegendOpacity(options, userMeta),
        },
      },
      symbols: {
        update: {
          opacity: getLegendOpacity(options, userMeta),
        },
      },
    };
  } else if (hasMouseInteraction) {
    return {
      entries: {
        name: `${name}_legendEntry`,
        interactive: true,
        enter: {
          fill: { value: 'transparent' },
        },
      },
    };
  }

  return {};
};

export const getLegendOpacity = (options: LegendSpecOptions, userMeta: UserMeta): ProductionRule<NumericValueRef> | undefined => {
  const rules: ProductionRule<NumericValueRef> = [];

  for (const markName of userMeta.animatedMarks || []) {
    const isGrouped = !!options.keys?.length;
    const fractionData = isGrouped ? `data('${markName}_hoverGroupFractionData')` : `data('${markName}_hoverFractionData')`;
    const lookupField = isGrouped ? `${options.name}_${GROUP_ID}` : SERIES_ID;
    const seriesLookup = `indexof(pluck(${fractionData}, '${lookupField}'), datum.value)`;
    // default to the neutral emphasis level when a legend entry has no animation row
    const fraction = `(${fractionData}[${seriesLookup}] || {fraction: ${FADE_FACTOR}}).fraction`;
    // fade deemphasized entries to FADE_FACTOR; neutral and emphasized both stay fully opaque
    const ramp = getDeemphasisRamp(fraction);
    rules.push({
      test: `length(${fractionData})`,
      signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
    });
  }

  if (rules.length) {
    return [...rules, DEFAULT_OPACITY_RULE];
  }

  // Fall back to old rules if no animated marks are present (not using hover animation system)
  return getOpacityEncoding(options, userMeta);
}

const getLegendDescriptionEncoding = (descriptions: LegendDescription[] | undefined, name: string) => {
  if (descriptions?.length) {
    return { signal: `merge(datum, {'${COMPONENT_NAME}': '${name}'})` };
  }
  return undefined;
};

/**
 * simple opacity encoding for legend labels and the symbol stroke opacity
 * @param legendOptions
 * @returns opactiy encoding
 */
export const getOpacityEncoding = (
  { highlight, highlightedItem, highlightedSeries, keys, chartPopovers, name: legendName }: LegendSpecOptions,
  userMeta: UserMeta
): ProductionRule<NumericValueRef> | undefined => {
  const highlightSignalName = keys?.length ? HIGHLIGHTED_GROUP : CONTROLLED_HIGHLIGHTED_SERIES;
  const selectedSignalName = keys?.length ? SELECTED_GROUP : SELECTED_SERIES;

  const rules: ProductionRule<NumericValueRef> = [];

  if (chartPopovers?.length) {
    rules.push({
      test: `isValid(${selectedSignalName})`,
      signal: `${selectedSignalName} === datum.value ? 1 : ${FADE_FACTOR}`,
    });
  }
  if (highlight) {
    rules.push({
      test: `isValid(${legendName}_${HOVERED_SERIES})`,
      signal: `${legendName}_${HOVERED_SERIES} === datum.value ? 1 : ${FADE_FACTOR}`,
    });
  }
  if (highlightedItem) {
    rules.push({
      test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
      signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
    });
  }
  if (highlightedSeries) {
    rules.push({
      test: `isValid(${highlightSignalName})`,
      signal: `${highlightSignalName} === datum.value ? 1 : ${FADE_FACTOR}`,
    });
  }
  for (const markName of userMeta.interactiveMarks || []) {
    rules.push({
      test: `isValid(${markName}_${HOVERED_ITEM})`,
      signal: `${markName}_${HOVERED_ITEM}.${SERIES_ID} === datum.value ? 1 : ${FADE_FACTOR}`,
    });
  }

  if (rules.length) {
    return [...rules, DEFAULT_OPACITY_RULE];
  }
  return undefined;
};

export const getSymbolEncodings = (facets: Facet[], options: LegendSpecOptions): LegendEncode => {
  const { color, lineType, lineWidth, name, opacity, symbolShape, colorScheme, isToggleable, hiddenSeries, keys } = options;
  const shapeFacetRef = getSymbolFacetEncoding<string>({
    facets,
    facetType: SYMBOL_SHAPE_SCALE,
    customValue: symbolShape,
    name,
  });
  const enter: SymbolEncodeEntry = {
    fillOpacity: getSymbolFacetEncoding<number>({ facets, facetType: OPACITY_SCALE, customValue: opacity, name }),
    shape: shapeFacetRef,
    size: getSymbolFacetEncoding<number>({ facets, facetType: SYMBOL_SIZE_SCALE, name }),
    strokeDash: getSymbolFacetEncoding<number[]>({
      facets,
      facetType: LINE_TYPE_SCALE,
      customValue: lineType,
      name,
    }),
    // Must stay a single value/signal — Vega's legend-layout sizeExpression breaks on production-rule arrays here.
    strokeWidth: getSymbolFacetEncoding<number>({
      facets,
      facetType: LINE_WIDTH_SCALE,
      customValue: lineWidth,
      name,
    }),
  };
  const colorRef = getSymbolFacetEncoding<Color>({ facets, facetType: COLOR_SCALE, customValue: color, name }) ?? {
    value: spectrum2Colors[colorScheme]['categorical-100'],
  };
  // Hidden entries swap shape to the "eye off" icon, colored to match the legend label text (not the series color).
  const isHidden = isToggleable || hiddenSeries.length > 0;
  const hiddenSeriesTest = keys?.length
    ? `indexof(pluck(data('${FILTERED_TABLE}'), '${name}_${GROUP_ID}'), datum.value) === -1`
    : 'indexof(hiddenSeries, datum.value) !== -1';
  const hiddenIconColor = getS2ColorValue(isToggleable ? 'gray-700' : 'gray-500', colorScheme);
  const hiddenFillRule = { test: hiddenSeriesTest, value: hiddenIconColor };
  // Transparent, not zero-width: strokeWidth can't be conditional (see note above), and Vega's default 1.5px outline would bold the icon's fine linework.
  const hiddenStrokeRule = { test: hiddenSeriesTest, value: 'transparent' };
  const hiddenShapeRule = { test: hiddenSeriesTest, value: getPathFromSymbolShape('visibility-off') };
  const update: SymbolEncodeEntry = {
    fill: isHidden ? [hiddenFillRule, colorRef] : [colorRef],
    stroke: isHidden ? [hiddenStrokeRule, colorRef] : [colorRef],
    shape: isHidden ? [hiddenShapeRule, shapeFacetRef ?? { value: getPathFromSymbolShape('rounded-square') }] : undefined,
  };
  // Remove undefined values
  const symbols: GuideEncodeEntry<SymbolEncodeEntry> = JSON.parse(JSON.stringify({ enter, update }));
  return {
    entries: {
      name: `${name}_legendEntry`,
    },
    symbols,
  };
};

const getSymbolFacetEncoding = <T>({
  customValue,
  facets,
  facetType,
  name,
}: {
  customValue?: FacetRef<T>;
  facets?: Facet[];
  facetType: FacetType;
  name: string;
}): BaseValueRef<T> | undefined => {
  if (customValue) {
    if (typeof customValue === 'string') {
      return { signal: `scale('${facetType}', data('${name}Aggregate')[datum.index].${customValue})` };
    }
    return { value: customValue.value };
  }

  if (!facets) return;

  const secondaryFacetMapping: { [key in FacetType]: { scale: SecondaryFacetType; signal: string } } = {
    color: { scale: 'secondaryColor', signal: 'colors' },
    linearColor: { scale: 'secondaryColor', signal: 'colors' },
    lineType: { scale: 'secondaryLineType', signal: 'lineTypes' },
    lineWidth: { scale: 'secondaryLineWidth', signal: 'lineWidths' },
    opacity: { scale: 'secondaryOpacity', signal: 'opacities' },
    symbolShape: { scale: 'secondarySymbolShape', signal: 'symbolShapes' },
    symbolSize: { scale: 'secondarySymbolSize', signal: 'symbolSizes' },
    symbolPathWidth: { scale: 'secondarySymbolPathWidth', signal: 'symbolPathWidths' },
  };

  const facet = facets.find((f) => f.facetType === facetType);
  if (!facet) return;
  const secondaryFacet = facets.find((f) => f.facetType === secondaryFacetMapping[facetType].scale);
  if (secondaryFacet) {
    const { scale, signal } = secondaryFacetMapping[facetType];
    return {
      signal: `scale('${signal}', data('${name}Aggregate')[datum.index].${facet.field})[indexof(domain('${scale}'), data('${name}Aggregate')[datum.index].${secondaryFacet.field})% length(scale('${signal}', data('${name}Aggregate')[datum.index].${facet.field}))]`,
    };
  }

  return { signal: `scale('${facetType}', data('${name}Aggregate')[datum.index].${facet.field})` };
};

export const getHiddenSeriesColorRule = (
  { colorScheme, hiddenSeries, isToggleable, keys, name }: LegendSpecOptions,
  colorValue: ColorValueV6
): ({
  test?: string;
} & ColorValueRef)[] => {
  if (!isToggleable && !hiddenSeries.length) return [];
  if (keys?.length) {
    return [
      {
        test: `indexof(pluck(data('${FILTERED_TABLE}'), '${name}_${GROUP_ID}'), datum.value) === -1`,
        value: getS2ColorValue(colorValue, colorScheme),
      },
    ];
  }
  return [{ test: 'indexof(hiddenSeries, datum.value) !== -1', value: getS2ColorValue(colorValue, colorScheme) }];
};

/**
 * Gets the required encondings for show/hide toggleable legends
 * @param isToggleable
 * @returns
 */
export const getShowHideEncodings = (options: LegendSpecOptions): LegendEncode => {
  const { colorScheme, isToggleable } = options;
  // Toggleable legends use the eye-icon overlay UX — labels always stay at full opacity (gray-700).
  // Controlled hiddenSeries (non-toggleable) preserves the gray-500 gray-out on hidden labels.
  const labelFillRules = isToggleable
    ? [{ value: getS2ColorValue('gray-700', colorScheme) }]
    : [...getHiddenSeriesColorRule(options, 'gray-500'), { value: getS2ColorValue('gray-700', colorScheme) }];
  return {
    labels: {
      update: {
        fill: labelFillRules,
      },
    },
  };
};

/**
 * Gets the required encondings for clickable legends
 * @param options
 * @returns
 */
export const getClickEncodings = (options: LegendSpecOptions): LegendEncode => {
  const { isToggleable, keys, name, hasOnClick, chartPopovers } = options;

  let clickEncode: LegendEncode = {};
  if ((isToggleable && !keys) || hasOnClick || chartPopovers?.length) {
    clickEncode = {
      entries: {
        name: `${name}_legendEntry`,
        interactive: true,
        enter: {
          fill: { value: 'transparent' },
          cursor: { value: 'pointer' },
        },
      },
    };
  }
  return clickEncode;
};

/**
 * Merge multiple vega spec legend encodings
 * @param encodings
 * @returns
 */
export const mergeLegendEncodings = (encodings: LegendEncode[]): LegendEncode => {
  let mergedEncodings = {};
  for (const encoding of encodings) {
    mergedEncodings = merge(mergedEncodings, encoding);
  }
  return mergedEncodings;
};

/**
 * Gets the symbol type (shape) for the legend
 * @param symbolShape
 * @returns symbolShape
 */
export const getSymbolType = (symbolShape: FacetRef<string> | undefined): string => {
  if (symbolShape && typeof symbolShape === 'object' && 'value' in symbolShape)
    return getPathFromSymbolShape(symbolShape.value);
  return 'circle';
};
