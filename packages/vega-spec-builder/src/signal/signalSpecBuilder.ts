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
import { Signal } from 'vega';

import {
  COLOR_SCALE,
  FILTERED_TABLE,
  FIRST_RSC_SERIES_ID,
  GROUP_ID,
  HOVERED_ITEM,
  HOVERED_SERIES,
  LAST_RSC_SERIES_ID,
} from '@spectrum-charts/constants';

/**
 * Does signal with given name exist?
 */
export const hasSignalByName = (signals: Signal[], name: string) => {
  return signals.some((signal) => signal.name === name);
};

/**
 *  Returns a controlled hover signal.
 *  Controlled hover signals get manually updated via the view in Chart.tsx
 */
export const getControlledHoveredIdSignal = (name: string): Signal => {
  return {
    name: `${name}_controlledHoveredId`,
    value: null,
    on: [{ events: `@${name}:mouseout`, update: 'null' }],
  };
};

/**
 *  Returns a controlled hover signal.
 *  Controlled hover signals get manually updated via the view in Chart.tsx
 */
export const getControlledHoveredGroupSignal = (name: string): Signal => {
  return {
    name: `${name}_controlledHoveredGroup`,
    value: null,
    on: [{ events: `@${name}:mouseout`, update: 'null' }],
  };
};

/**
 * Returns the highlighted series signal
 */
export const addHighlightSignalLegendHoverEvents = (
  signals: Signal[],
  legendName: string,
  includeHiddenSeries: boolean,
  keys?: string[]
) => {
  signals.push({
    name: `${legendName}_${HOVERED_SERIES}`,
    value: null,
    on: [
      {
        events: `@${legendName}_legendEntry:mouseover`,
        update: getHighlightSignalUpdateExpression(legendName, includeHiddenSeries, keys),
      },
      { events: `@${legendName}_legendEntry:mouseout`, update: 'null' },
    ],
  });
};

export const getHighlightSignalUpdateExpression = (
  legendName: string,
  includeHiddenSeries: boolean,
  keys?: string[]
) => {
  const hoveredSeriesExpression = `domain("${legendName}Entries")[datum.index]`;
  if (!includeHiddenSeries) return hoveredSeriesExpression;
  if (keys?.length) {
    return `indexof(pluck(data("${FILTERED_TABLE}"),"${legendName}_${GROUP_ID}"), ${hoveredSeriesExpression}) !== -1 ? ${hoveredSeriesExpression} : null`;
  }
  return `indexof(hiddenSeries, ${hoveredSeriesExpression}) === -1 ? ${hoveredSeriesExpression} : null`;
};

/**
 * Returns the legendLabels series signal
 */
export const getLegendLabelsSeriesSignal = (value: unknown = null): Signal => {
  return {
    name: 'legendLabels',
    value,
  };
};

/**
 * Returns a basic value based signal
 */
export const getGenericValueSignal = (name: string, value: unknown = null): Signal => {
  return { name, value };
};

/**
 * Returns a basic value based signal
 */
export const getGenericUpdateSignal = (name: string, update: string): Signal => {
  return { name, update };
};

/**
 * Returns a signal that tracks the first series in the series order for dual Y-axis charts
 */
export const getFirstRscSeriesIdSignal = (): Signal => ({
  name: `${FIRST_RSC_SERIES_ID}`,
  value: null,
  update: `length(domain("${COLOR_SCALE}")) > 0 ? domain("${COLOR_SCALE}")[0] : null`,
});

/**
 * Returns a signal that tracks the last series in the series order for dual Y-axis charts
 */
export const getLastRscSeriesIdSignal = (): Signal => ({
  name: `${LAST_RSC_SERIES_ID}`,
  value: null,
  update: `length(domain("${COLOR_SCALE}")) > 0 ? peek(domain("${COLOR_SCALE}")) : null`,
});

export const addHoveredItemSignal = (
  signals: Signal[],
  markName: string,
  targetName?: string,
  datumOrder = 1,
  excludeDataKeys?: string[]
): void => {
  targetName = targetName || markName;
  const signalName = `${markName}_${HOVERED_ITEM}`;

  let signal = signals.find((signal) => signal.name === signalName);
  if (!signal) {
    signal = {
      description: `Tracks the hovered item for ${markName}`,
      name: signalName,
      value: null,
      on: [],
    };
    signals.push(signal);
  }

  if (signal.on === undefined) {
    signal.on = [];
  }

  const datum = new Array(datumOrder).fill('datum').join('.');

  const excludeDataKeysCondition = excludeDataKeys?.map((excludeDataKey) => `${datum}.${excludeDataKey}`).join(' || ');

  const update = excludeDataKeysCondition ? `(${excludeDataKeysCondition}) ? null : ${datum}` : datum;

  signal.on.push({ events: `@${targetName}:mouseover`, update }, { events: `@${targetName}:mouseout`, update: 'null' });
};
