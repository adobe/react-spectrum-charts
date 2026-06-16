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
import { CSSProperties, RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { View } from 'vega';

export type LegendIconPosition = {
  name: string;
  style: CSSProperties;
};

export function useLegendIconPositions(
  chartView: RefObject<View | undefined>,
  legendHiddenSeries: string[]
): { positions: LegendIconPosition[]; onViewReady: () => void } {
  const [activeView, setActiveView] = useState<View | undefined>(undefined);
  const [positions, setPositions] = useState<LegendIconPosition[]>([]);

  const computePositions = useCallback((): LegendIconPosition[] => {
    const view = chartView.current;
    if (!view || !legendHiddenSeries.length) return [];

    const vegaEl = view.container();
    if (!vegaEl) return [];

    const positioningParent = vegaEl.closest('.rsc-container') as HTMLElement | null;
    if (!positioningParent) return [];

    const parentRect = positioningParent.getBoundingClientRect();
    const found: LegendIconPosition[] = [];

    // Walk each legend symbol group and find its matching label as a sibling within
    // the same entry scope. This is robust to multiple legends on the same chart —
    // unlike index-based pairing which would misalign once a second legend is added.
    const symbolGroups = Array.from(vegaEl.querySelectorAll('[class*="role-legend-symbol"]'));
    for (const symbolEl of symbolGroups) {
      const entryScope = symbolEl.parentElement;
      if (!entryScope) continue;

      const labelText = entryScope.querySelector('[class*="role-legend-label"] text');
      if (!labelText) continue;

      const seriesName = labelText.textContent?.trim();
      if (!seriesName || !legendHiddenSeries.includes(seriesName)) continue;

      const rect = symbolEl.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      found.push({
        name: seriesName,
        style: {
          position: 'absolute',
          left: rect.left - parentRect.left,
          top: rect.top - parentRect.top,
          width: rect.width,
          height: rect.height,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
    }

    return found;
  }, [chartView, legendHiddenSeries]);

  // Always-current ref so the activeView effect never needs computePositions in its deps
  // (which would cause onViewReady → handleNewView → embed to re-run on every click).
  const computePositionsRef = useRef(computePositions);
  computePositionsRef.current = computePositions;

  const onViewReady = useCallback(() => {
    setActiveView(chartView.current);
  }, [chartView]);

  // Fires when a new Vega view is embedded. Computes initial positions and registers
  // a resize listener so icons stay anchored after the chart is resized.
  useEffect(() => {
    const view = activeView;
    if (!view) return;

    let active = true;

    // view.runAsync() resolves after the SVG is fully drawn — safe to query the DOM then.
    void view.runAsync().then(
      () => { if (active) setPositions(computePositionsRef.current()); },
      () => { /* view finalized before render completed */ }
    );

    const recompute = () => {
      if (active) setPositions(computePositionsRef.current());
    };
    view.addResizeListener(recompute);

    return () => {
      active = false;
      view.removeResizeListener(recompute);
    };
  }, [activeView]);

  // Fires when the hidden series list changes — independent of a full view re-embed.
  // This makes the hook robust to future VegaChart optimisations that update signals
  // without rebuilding the view (e.g. view.signal('hiddenSeries', val).run()).
  useEffect(() => {
    if (!legendHiddenSeries.length) {
      setPositions([]);
      return;
    }
    const view = chartView.current;
    if (!view) return;
    let active = true;
    void view.runAsync().then(
      () => { if (active) setPositions(computePositionsRef.current()); },
      () => { /* view finalized before render completed */ }
    );
    return () => { active = false; };
  }, [legendHiddenSeries, chartView]);

  return { positions, onViewReady };
}
