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
import { View } from 'vega';

import { SELECTED_GROUP, SELECTED_ITEM, SELECTED_SERIES, SERIES_ID } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

// No import from '../components' or React in this file — it's reachable from
// vegaChartController/attachVegaChartController.ts, which must stay import-safe under SSR
// (no `window` access at module scope, and no accidental pull-in of browser-only component code).

/**
 * IMMUTABLE
 *
 * Adds the value to the target array if it doesn't exist, otherwise removes it
 * @param target
 * @param value
 * @returns
 */
export const toggleStringArrayValue = (target: string[], value: string): string[] => {
  if (target.includes(value)) {
    return target.filter((item) => item !== value);
  }
  return [...target, value];
};

/**
 * Sets the values of the selectedId and selectedSeries signals
 * @param param0
 */
export const setSelectedSignals = ({
  idKey,
  selectedData,
  view,
}: {
  idKey: string;
  selectedData: Datum | null;
  view: View;
}) => {
  view.signal(SELECTED_ITEM, selectedData?.[idKey] ?? null);
  view.signal(SELECTED_SERIES, selectedData?.[SERIES_ID] ?? null);

  const selectedGroupKey = Object.keys(selectedData ?? {}).find((k) => k.endsWith('_selectedGroupId'));

  // Always write the group signal so it doesn't get "stuck" with a previous value.
  view.signal(SELECTED_GROUP, selectedGroupKey ? selectedData?.[selectedGroupKey] ?? null : null);
};
