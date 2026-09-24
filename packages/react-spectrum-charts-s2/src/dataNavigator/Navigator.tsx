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

import { Datum, MarkBounds, Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { AxisRegionOptions, NavigableChartType } from './buildChartStructure';
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
  /** Bar layout type. */
  type?: 'dodged' | 'stacked';
  /** Per-datum color override field used in accessible bar labels. */
  colorOverride?: string;
  /** Locale used for accessible color names. */
  locale?: string;
  /** Primary metric / y-axis field. */
  metric?: string;
  /** The stack sort field. When set on a stacked bar, determines which segment is reached first, mirroring Vega's own stack sort. */
  order?: string;
  /** Chart orientation. Swaps which arrow keys move between stacks vs. within a stack. Defaults to vertical. */
  orientation?: Orientation;
  /** Maps a data field to its axis/legend title — drives the focused leaf's accessible name and a clean focus tooltip for bars without a ChartInspect. */
  fieldLabels?: Record<string, string>;
  /** Per-series metric-axis titles for dual-metric-axis bars. */
  metricTitleBySeries?: Record<string, string>;
  /** Whether the mark has a ChartInspect (keeps the full-datum tooltip); otherwise the focus tooltip lists only the `fieldLabels` fields. */
  hasChartInspect?: boolean;
  /** The mark's own name (e.g. `bar0`) — drives its real hover signals and focus ring, so keyboard focus matches mouse hover exactly. */
  markName?: string;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** When provided, adds a sibling-navigable x-axis region alongside chart content (Left/Right moves between them). */
  xAxis?: AxisRegionOptions;
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
  /** Fires the focused mark's `onClick` on Enter/Space, mirroring a real click. */
  onNodeClick?: (datum: Datum) => void;
  /** Whether the mark has a ChartPopover — so a click that focuses a node retains focus through the popover it opens. */
  hasChartPopover?: boolean;
}

export const Navigator = ({
  chartType,
  data,
  dimension,
  color,
  type,
  colorOverride,
  locale,
  metric,
  order,
  orientation,
  fieldLabels,
  metricTitleBySeries,
  hasChartInspect,
  markName,
  title,
  xAxis,
  containerRef,
  chartId,
  getView,
  selectedData,
  selectedDataBounds,
  selectedDataName,
  keyboardPopoverComponentName,
  onNodeClick,
  hasChartPopover,
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
        type,
        colorOverride,
        locale,
        metric,
        order,
        orientation,
        fieldLabels,
        metricTitleBySeries,
        hasChartInspect,
        markName,
        title,
        xAxis,
        chartId,
        getView,
        selectedData,
        selectedDataBounds,
        selectedDataName,
        keyboardPopoverComponentName,
        onNodeClick,
        hasChartPopover,
      });
    let raf: number | undefined;
    let retryCount = 0;
    const attachAndRetry = () => {
      attach();
      if (!getView() && retryCount < 3) {
        retryCount += 1;
        raf = requestAnimationFrame(attachAndRetry);
      }
    };
    // Attach promptly so the entry control is available while Vega finishes exposing its view.
    raf = requestAnimationFrame(attachAndRetry);
    return () => {
      if (raf !== undefined) cancelAnimationFrame(raf);
    };
  }, [
    chartType,
    data,
    dimension,
    color,
    type,
    colorOverride,
    locale,
    metric,
    order,
    orientation,
    fieldLabels,
    metricTitleBySeries,
    hasChartInspect,
    markName,
    title,
    xAxis,
    chartId,
    containerRef,
    getView,
    selectedData,
    selectedDataBounds,
    selectedDataName,
    keyboardPopoverComponentName,
    onNodeClick,
    hasChartPopover,
  ]);

  return null;
};
Navigator.displayName = 'Navigator';
