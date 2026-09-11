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
import { RefObject, useEffect } from 'react';

import { View } from 'vega';

import { Datum, MarkBounds, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { NavigableChartType } from './buildChartStructure';
import { attachDataNavigator } from './dataNavigatorAdapter';

export interface NavigatorProps {
  /** The chart type to build navigation for. */
  chartType: NavigableChartType;
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** Primary categorical / x-axis field. */
  dimension?: string;
  /** Series / color field (set for stacked bars). */
  color?: string;
  /** Primary metric / y-axis field. */
  metric?: string;
  /** The mark's own name (e.g. `bar0`) — drives its real hover signals and focus ring, so keyboard focus matches mouse hover exactly. */
  markName?: string;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** Ref to the positioned container that wraps the chart. */
  containerRef: RefObject<HTMLElement | null>;
  /** Stable id used to namespace the rendered nav elements. */
  chartId: string;
  /** Accessor for the live Vega view. */
  getView: () => View | undefined;
  /** Same context refs `handleMarkClick` uses — Space opens a focused bar/segment's popover through the exact same trigger. */
  selectedData?: RefObject<Datum | null>;
  selectedDataBounds?: RefObject<MarkBounds>;
  selectedDataName?: RefObject<string>;
  /** Lets the popover's own close handler know it doesn't need to clear hover-parity signals — keyboard focus still owns them. */
  keyboardPopoverComponentName?: RefObject<string | null>;
}

export const Navigator = ({
  chartType,
  data,
  dimension,
  color,
  metric,
  markName,
  title,
  containerRef,
  chartId,
  getView,
  selectedData,
  selectedDataBounds,
  selectedDataName,
  keyboardPopoverComponentName,
}: NavigatorProps): null => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) {
      return;
    }
    const attach = () =>
      attachDataNavigator({
        container,
        chartType,
        data,
        dimension,
        color,
        metric,
        markName,
        title,
        chartId,
        getView,
        selectedData,
        selectedDataBounds,
        selectedDataName,
        keyboardPopoverComponentName,
      });
    attach();
    // Re-attach on the next frame so a fresh render reads a laid-out scenegraph (the first effect
    // tick can run before Vega's async layout settles). attachDataNavigator rebuilds cleanly.
    const raf = requestAnimationFrame(attach);
    return () => cancelAnimationFrame(raf);
  }, [
    chartType,
    data,
    dimension,
    color,
    metric,
    markName,
    title,
    chartId,
    containerRef,
    getView,
    selectedData,
    selectedDataBounds,
    selectedDataName,
    keyboardPopoverComponentName,
  ]);

  return null;
};
Navigator.displayName = 'Navigator';
