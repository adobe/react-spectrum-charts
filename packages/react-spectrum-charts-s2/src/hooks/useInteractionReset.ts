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
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { Item, Spec, TooltipHandler, View } from 'vega';

import { useChartContext } from '../context/RscChartContext.js';
import { UseLegendProps } from './useLegend.js';

const LEGEND_ENTRIES_SCALE = /^legend\d+Entries$/;

/**
 * Gets the names of the scales that list each legend's series.
 * @param spec - chart spec
 * @returns scale names
 */
export const getLegendEntryScales = (spec: Spec): string[] =>
  (spec.scales ?? []).map(({ name }) => name).filter((name) => LEGEND_ENTRIES_SCALE.test(name));

/**
 * Removes hidden series that no legend lists anymore.
 * @param view - vega view, after its dataflow has run
 * @param hiddenSeries - hidden series keys
 * @param legendEntryScales - legend entry scale names
 * @param hiddenEntries - series the legend omits on purpose, which are always kept
 * @returns the pruned keys, or the same array when nothing was removed
 */
export const pruneHiddenSeries = (
  view: View,
  hiddenSeries: string[],
  legendEntryScales: string[],
  hiddenEntries: string[] = []
): string[] => {
  if (!hiddenSeries.length || !legendEntryScales.length) {
    return hiddenSeries;
  }
  const entries = legendEntryScales.flatMap((name) => view.scale(name).domain());
  const series = new Set([...hiddenEntries, ...entries].map(String));
  const pruned = hiddenSeries.filter((key) => series.has(String(key)));
  return pruned.length === hiddenSeries.length ? hiddenSeries : pruned;
};

/**
 * Registers an open popover or action bar so a selection reset closes it.
 * @param isOpen - whether the dialog is open
 * @param close - closes the dialog and clears its selection
 */
export const useCloseOnInteractionReset = (isOpen: boolean, close: () => void): void => {
  const { openDialogClosers } = useChartContext();
  // layout effects re-register before the chart's update effect can reset
  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const closers = openDialogClosers.current;
    closers.add(close);
    return () => {
      closers.delete(close);
    };
  }, [close, isOpen, openDialogClosers]);
};

/**
 * Builds a stable callback that closes popovers, hides the tooltip and prunes hidden series when the view resets selection and hover.
 * @param spec - chart spec
 * @param legendProps - shared legend state
 * @param tooltip - chart tooltip handler
 * @returns onInteractionReset
 */
const useInteractionReset = (
  spec: Spec,
  { hiddenEntries, setLegendHiddenSeries }: UseLegendProps,
  tooltip: TooltipHandler
): ((view: View) => void) => {
  const { chartView, openDialogClosers, selectedData, selectedDataName } = useChartContext();
  const legendEntryScales = useMemo(() => getLegendEntryScales(spec), [spec]);
  const latestInputs = { hiddenEntries, legendEntryScales, setLegendHiddenSeries, tooltip };
  const latest = useRef(latestInputs);
  useEffect(() => {
    latest.current = latestInputs;
  });

  return useCallback(
    (view: View) => {
      for (const close of [...openDialogClosers.current]) {
        close();
      }
      selectedData.current = null;
      selectedDataName.current = '';
      latest.current.tooltip(view, undefined as unknown as MouseEvent, undefined as unknown as Item, null);
      void view.runAsync().then(() => {
        if (chartView.current !== view) {
          return;
        }
        const { hiddenEntries, legendEntryScales, setLegendHiddenSeries } = latest.current;
        setLegendHiddenSeries((hiddenSeries) =>
          pruneHiddenSeries(view, hiddenSeries, legendEntryScales, hiddenEntries)
        );
      });
    },
    [chartView, openDialogClosers, selectedData, selectedDataName]
  );
};

export default useInteractionReset;
