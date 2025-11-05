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
import { Data, FormulaTransform, NumericValueRef, Signal, SourceData } from 'vega';

import {
  CONTROLLED_HIGHLIGHTED_ITEM,
  DIMENSION_HOVER_AREA,
  FADE_FACTOR,
  FILTERED_TABLE,
  GROUP_ID,
  HIGHLIGHTED_GROUP,
  HOVERED_ITEM,
  INTERACTION_MODE,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { getFilteredTableData } from '../data/dataUtils';
import { getHoverMarkNames } from '../marks/markUtils';
import {
  AreaSpecOptions,
  BarSpecOptions,
  ChartTooltipOptions,
  ChartTooltipSpecOptions,
  DonutSpecOptions,
  LineSpecOptions,
  ScatterSpecOptions,
  VennSpecOptions,
} from '../types';

type TooltipParentOptions =
  | AreaSpecOptions
  | BarSpecOptions
  | DonutSpecOptions
  | LineSpecOptions
  | ScatterSpecOptions
  | VennSpecOptions;

/**
 * gets all the tooltips
 * @param markOptions
 * @returns
 */
export const getTooltips = (markOptions: TooltipParentOptions): ChartTooltipSpecOptions[] => {
  return markOptions.chartTooltips.map((chartTooltip) => applyTooltipPropDefaults(chartTooltip, markOptions.name));
};

/**
 * Applies all defaults to ChartTooltipOptions
 * @param chartTooltipOptions
 * @returns ChartTooltipSpecOptions
 */
export const applyTooltipPropDefaults = (
  { highlightBy = 'item', targets = ['item'], ...options }: ChartTooltipOptions,
  markName: string
): ChartTooltipSpecOptions => {
  return {
    highlightBy,
    markName,
    targets,
    ...options,
  };
};

/**
 * Sets all the data needed for tooltips
 *
 * NOTE: this function mutates the data object so it should only be called from a produce function
 * @param data
 * @param chartTooltipOptions
 */
export const addTooltipData = (data: Data[], markOptions: TooltipParentOptions, addHighlightedData = true) => {
  const tooltips = getTooltips(markOptions);
  for (const { highlightBy, markName } of tooltips) {
    if (highlightBy === 'item') return;
    const filteredTable = getFilteredTableData(data);
    if (!filteredTable.transform) {
      filteredTable.transform = [];
    }
    if (highlightBy === 'dimension' && markOptions.markType !== 'donut' && markOptions.markType !== 'venn') {
      filteredTable.transform.push(getGroupIdTransform([markOptions.dimension], markName));
    } else if (highlightBy === 'series') {
      filteredTable.transform.push(getGroupIdTransform([SERIES_ID], markName));
    } else if (Array.isArray(highlightBy)) {
      filteredTable.transform.push(getGroupIdTransform(highlightBy, markName));
    }

    if (addHighlightedData) {
      data.push(getMarkHighlightedData(markName));
    }
  }
};

/**
 * Gets the group id transform
 * @param highlightBy
 * @param markName
 * @returns FormulaTransform
 */
export const getGroupIdTransform = (highlightBy: string[], markName: string): FormulaTransform => {
  return {
    type: 'formula',
    as: `${markName}_${GROUP_ID}`,
    expr: highlightBy.map((facet) => `datum.${facet}`).join(' + " | " + '),
  };
};

/**
 * Gets the highlighted data for a mark
 * @param markName
 * @returns
 */
const getMarkHighlightedData = (markName: string): SourceData => ({
  name: `${markName}_highlightedData`,
  source: FILTERED_TABLE,
  transform: [
    {
      type: 'filter',
      expr: `${HIGHLIGHTED_GROUP} === datum.${markName}_${GROUP_ID}`,
    },
  ],
});

export const isHighlightedByGroup = (markOptions: TooltipParentOptions) => {
  const tooltips = getTooltips(markOptions);
  return tooltips.some(({ highlightBy }) => highlightBy && highlightBy !== 'item');
};

/**
 * Tooltip highlights by item or dimension
 * @param markOptions
 * @returns
 */
export const isHighlightedByDimension = (markOptions: TooltipParentOptions) => {
  const tooltips = getTooltips(markOptions);
  return tooltips.some(
    ({ highlightBy }) => typeof highlightBy === 'string' && ['dimension', 'item'].includes(highlightBy)
  );
};

/**
 * adds the appropriate signals for tooltips
 *
 * NOTE: this function mutates the signals array so it should only be called from a produce function
 * @param signals
 * @param markOptions
 */
export const addTooltipSignals = (signals: Signal[], markOptions: TooltipParentOptions) => {
  if (isHighlightedByGroup(markOptions)) {
    const highlightedGroupSignal = signals.find((signal) => signal.name === HIGHLIGHTED_GROUP) as Signal;

    let markName = markOptions.name;
    let update = `datum.${markName}_${GROUP_ID}`;

    if ('interactionMode' in markOptions && markOptions.interactionMode === INTERACTION_MODE.ITEM) {
      for (const name of getHoverMarkNames(markName)) {
        addMouseEvents(highlightedGroupSignal, name, update);
      }
    }

    if (['scatter', 'line'].includes(markOptions.markType)) {
      update = `datum.${update}`;
      markName += '_voronoi';
    }

    addMouseEvents(highlightedGroupSignal, markName, update);
  }
};

const addMouseEvents = (highlightedGroupSignal: Signal, markName: string, update: string) => {
  if (highlightedGroupSignal.on === undefined) {
    highlightedGroupSignal.on = [];
  }
  highlightedGroupSignal.on.push(
    {
      events: `@${markName}:mouseover`,
      update,
    },
    { events: `@${markName}:mouseout`, update: 'null' }
  );
};

export const addHoveredItemOpacityRules = (
  opacityRules: ({ test?: string } & NumericValueRef)[],
  markOptions: TooltipParentOptions
) => {
  const { name: markName } = markOptions;
  // find the index of the first hover rule
  const startIndex = opacityRules.findIndex((rule) => rule.test?.includes(HOVERED_ITEM)) + 1;

  const hoveredItemSignal = `${markName}_${HOVERED_ITEM}`;

  let key = markOptions.idKey;
  if (isHighlightedByGroup(markOptions)) {
    key = `${markName}_${GROUP_ID}`;
  }

  const rules = [
    {
      test: `isValid(${hoveredItemSignal})`,
      signal: `${hoveredItemSignal}.${key} === datum.${key} ? 1 : ${FADE_FACTOR}`,
    },
    {
      test: `isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) && length(${CONTROLLED_HIGHLIGHTED_ITEM}) > 0 && indexof(${CONTROLLED_HIGHLIGHTED_ITEM}, datum.${markOptions.idKey}) === -1`,
      value: FADE_FACTOR,
    },
  ];

  addHoverdDimenstionAreaOpacityRules(rules, markOptions);

  if ('comboSiblingNames' in markOptions && markOptions.comboSiblingNames?.length) {
    const test = markOptions.comboSiblingNames
      .map((siblingName) => `isValid(${siblingName}_${HOVERED_ITEM})`)
      .join(' || ');
    console.log('test', test);
    rules.push({ test, value: FADE_FACTOR });
  }

  opacityRules.splice(startIndex, 0, ...rules);
};

export const addHoverdDimenstionAreaOpacityRules = (
  opacityRules: ({ test?: string } & NumericValueRef)[],
  markOptions: TooltipParentOptions
) => {
  if (!hasTooltipWithDimensionAreaTarget(markOptions.chartTooltips) || !('dimension' in markOptions)) return;
  const { name, dimension } = markOptions;
  const hoveredItemSignal = `${name}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;
  opacityRules.push({
    test: `isValid(${hoveredItemSignal})`,
    signal: `${hoveredItemSignal}.${dimension} === datum.${dimension} ? 1 : ${FADE_FACTOR}`,
  });
};

export const hasTooltipWithDimensionAreaTarget = (chartTooltips: ChartTooltipOptions[]) => {
  return chartTooltips.some(({ targets }) => targets?.includes('dimensionArea'));
};
