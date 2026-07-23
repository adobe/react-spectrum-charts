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
import merge from 'deepmerge';
import {
  BaseValueRef,
  Color,
  ColorValueRef,
  Data,
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
  DEFAULT_FONT_SIZE,
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
import { getColorValue, spectrumColors } from '@spectrum-charts/themes';

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
  return { signal: `max(1, floor(width / (min(${maxWidthExpr}, ${effectiveLabelLimit}) + ${symbolAndSpacingWidth})))` };
};

/**
 * Expression that resolves an entry's display label: the custom legendLabel if one exists for the
 * series, otherwise the raw entry value. Shared by the max-label-width and preferred-columns data.
 */
export const getDisplayLabelExpr = (name: string): string =>
  `indexof(pluck(${name}_labels, 'seriesName'), datum.${name}Entries) > -1 ? ${name}_labels[indexof(pluck(${name}_labels, 'seriesName'), datum.${name}Entries)].label : datum.${name}Entries`;

const getLabelWidthTransforms = (name: string): Data['transform'] => [
  { type: 'formula', as: 'displayLabel', expr: getDisplayLabelExpr(name) },
  { type: 'formula', as: 'labelWidth', expr: "getLabelWidth(datum.displayLabel, 'normal', 14)" },
  { type: 'window', ops: ['row_number'], as: ['legendIndex'] },
];

/**
 * Data source backing the live `_preferredColumns` layout decision: one row per *currently visible*
 * legend entry with its measured label width and a stable order index
 * Consumed by `getLegendColumnLayout` (see expressionFunctions.ts) via the
 * `${name}_columnLayout` signal, which drives the legend's actual rendered columns/labelLimit — this
 * is deliberately scoped to whatever's currently shown, so a page of short labels can use a wider
 * column count than a page with one long label.
 */
export const getLabelWidthsData = (name: string): Data => ({
  name: `${name}_labelWidths`,
  source: `${name}Aggregate`,
  transform: getLabelWidthTransforms(name),
});

/**
 * Data source backing `${name}_pages`: the same per-entry label-width measurement as
 * `${name}_labelWidths`, but sourced from the *unfiltered* `${name}AggregateAll` instead of the
 * `hiddenEntries`-filtered `${name}Aggregate`. needed to plan the full pagination sequence up front, over every entry
 */
export const getPagesLabelWidthsData = (name: string): Data => ({
  name: `${name}_pagesLabelWidths`,
  source: `${name}AggregateAll`,
  transform: getLabelWidthTransforms(name),
});

/**
 * Data source that caps the live-rendered legend entries at `columns * maxRows`, referencing the
 * live `${name}_columnLayout.columns` signal so the cap tracks whatever Vega just resolved for the
 * current width — not a value from a prior render.
 *
 * Only the legend's own `${name}Entries` scale domain points at this when `_maxRows` is set
 */
export const getRowCappedAggregateData = (name: string, maxRows: number): Data => ({
  name: `${name}AggregateCapped`,
  source: `${name}Aggregate`,
  transform: [
    { type: 'window', ops: ['row_number'], as: [`${name}RowIndex`] },
    { type: 'filter', expr: `datum.${name}RowIndex <= ${name}_columnLayout.columns * ${maxRows}` },
  ],
});

/**
 * Expression for the `${name}_columnLayout` signal: resolves the chosen column count, labelLimit,
 * and (when `_labelWrap` is combined with `_preferredColumns`) dynamic wrap width, via the
 * `getLegendColumnLayout` expression function.
 */
export const getColumnLayoutExpr = (name: string, preferredColumns: number[], labelWrap?: number): string =>
  `getLegendColumnLayout(data('${name}_labelWidths'), width, ${JSON.stringify(preferredColumns)}, ${
    labelWrap ?? 1
  })`;

/**
 * Expression for the `${name}_pages` signal: the full pagination plan for every legend entry
 * Only emitted when `_maxRows` is set.
 */
export const getPagesExpr = (
  name: string,
  preferredColumns: number[],
  maxRows: number,
  labelWrap?: number
): string =>
  `getLegendPages(data('${name}_pagesLabelWidths'), width, ${JSON.stringify(preferredColumns)}, ${maxRows}, ${
    labelWrap ?? 1
  })`;

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
  const { name, position, legendLabels, labelLimit, _labelWrap, _preferredColumns } = legendOptions;
  const symbolEncodings = getSymbolEncodings(facets, legendOptions);
  const hoverEncodings = getHoverEncodings(legendOptions, userMeta);
  // In combined _preferredColumns + _labelWrap mode, wrap labels at the chosen candidate's dynamic
  // width instead of the static labelLimit so text, dy, and truncation all track the column count.
  const usePreferredColumns =
    _preferredColumns !== undefined && _preferredColumns.length > 0 && ['top', 'bottom'].includes(position);
  const wrapWidthExpr =
    usePreferredColumns && _labelWrap && _labelWrap > 1 ? `${name}_columnLayout.wrapWidth` : undefined;
  const legendLabelsEncodings = getLegendLabelsEncodings(name, legendLabels, labelLimit, _labelWrap, wrapWidthExpr);
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

const getLegendLabelsEncodings = (
  name: string,
  legendLabels: LegendLabel[] | undefined,
  labelLimit: number | undefined,
  _labelWrap: number | undefined,
  wrapWidthExpr?: string
): LegendEncode => {
  if (_labelWrap && _labelWrap > 1) {
    // resolves to the custom legendLabel for the seriesName if one exists, otherwise falls back to the raw value
    const resolvedLabelExpr = legendLabels
      ? `indexof(pluck(${name}_labels, 'seriesName'), datum.value) > -1 ? ${name}_labels[indexof(pluck(${name}_labels, 'seriesName'), datum.value)].label : datum.value`
      : 'datum.value';
    // With _preferredColumns, wrap at the chosen candidate's dynamic width; otherwise the static labelLimit.
    const wrapWidth = wrapWidthExpr ?? `${labelLimit ?? DEFAULT_LEGEND_LABEL_LIMIT}`;
    const wrappedLinesExpr = `wrapLabelText(${resolvedLabelExpr}, ${wrapWidth}, ${_labelWrap}, 'normal', ${DEFAULT_FONT_SIZE})`;
    return {
      labels: {
        update: {

          text: { signal: wrappedLinesExpr },
          // Vega stacks label lines downwards, so this offset shift the label up by half of the label height so that the legend symbol stays centered
          dy: { signal: `-(length(${wrappedLinesExpr}) - 1) * ${DEFAULT_FONT_SIZE / 2}` },
        },
      },
    };
  }

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
          tooltip: getTooltip(descriptions, name), // only add tooltip if descriptions exist
        },
        update: {
          fill: { value: 'transparent' }, // need something here to trigger the tooltip
        },
      },
      labels: {
        update: {
          opacity: getOpacityEncoding(options, userMeta),
        },
      },
      symbols: {
        update: {
          opacity: getOpacityEncoding(options, userMeta),
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

const getTooltip = (descriptions: LegendDescription[] | undefined, name: string) => {
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
  const { color, lineType, lineWidth, name, opacity, symbolShape, colorScheme } = options;
  const enter: SymbolEncodeEntry = {
    fillOpacity: getSymbolFacetEncoding<number>({ facets, facetType: OPACITY_SCALE, customValue: opacity, name }),
    shape: getSymbolFacetEncoding<string>({
      facets,
      facetType: SYMBOL_SHAPE_SCALE,
      customValue: symbolShape,
      name,
    }),
    size: getSymbolFacetEncoding<number>({ facets, facetType: SYMBOL_SIZE_SCALE, name }),
    strokeDash: getSymbolFacetEncoding<number[]>({
      facets,
      facetType: LINE_TYPE_SCALE,
      customValue: lineType,
      name,
    }),
    strokeWidth: getSymbolFacetEncoding<number>({
      facets,
      facetType: LINE_WIDTH_SCALE,
      customValue: lineWidth,
      name,
    }),
  };
  const update: SymbolEncodeEntry = {
    fill: [
      ...getHiddenSeriesColorRule(options, 'gray-300'),
      getSymbolFacetEncoding<Color>({ facets, facetType: COLOR_SCALE, customValue: color, name }) ?? {
        value: spectrumColors[colorScheme]['categorical-100'],
      },
    ],
    stroke: [
      ...getHiddenSeriesColorRule(options, 'gray-300'),
      getSymbolFacetEncoding<Color>({ facets, facetType: COLOR_SCALE, customValue: color, name }) ?? {
        value: spectrumColors[colorScheme]['categorical-100'],
      },
    ],
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
        value: getColorValue(colorValue, colorScheme),
      },
    ];
  }
  return [{ test: 'indexof(hiddenSeries, datum.value) !== -1', value: getColorValue(colorValue, colorScheme) }];
};

/**
 * Gets the required encondings for show/hide toggleable legends
 * @param isToggleable
 * @returns
 */
export const getShowHideEncodings = (options: LegendSpecOptions): LegendEncode => {
  const { colorScheme } = options;
  const hiddenSeriesEncode: LegendEncode = {
    labels: {
      update: {
        fill: [...getHiddenSeriesColorRule(options, 'gray-500'), { value: getColorValue('gray-700', colorScheme) }],
      },
    },
  };

  return hiddenSeriesEncode;
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
