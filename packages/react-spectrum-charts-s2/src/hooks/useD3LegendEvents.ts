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
import { useCallback, useRef } from 'react';

import { D3Chart } from '@spectrum-charts/chart-d3';

import { UseLegendProps } from './useLegend.js';

/**
 * Subscribes a D3 chart's legend hover events to the legend's mouse callbacks; clicks go through the shared view click handling.
 * @param legendProps
 * @returns callback that wires a chart's legend events
 */
export const useD3LegendEvents = (legendProps: UseLegendProps): ((chart: D3Chart) => void) => {
  const latest = useRef(legendProps);
  latest.current = legendProps;
  const hovered = useRef<string | undefined>(undefined);

  return useCallback((chart: D3Chart) => {
    chart.on('legendHover', (series) => {
      // Vega's mouseout reports the entry being left, so remember the last hovered series
      if (series !== null) {
        hovered.current = series;
        latest.current.onMouseOver?.(series);
      } else if (hovered.current !== undefined) {
        latest.current.onMouseOut?.(hovered.current);
        hovered.current = undefined;
      }
    });
  }, []);
};
