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

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { AxisRegionOptions, LegendRegionOptions, NavigableChartType } from './buildChartStructure';
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
  /** Optional chart title for the accessible description. */
  title?: string;
  /** When provided, adds a top-level, sibling-navigable x-axis region alongside chart content. */
  xAxis?: AxisRegionOptions;
  /** When provided, adds a top-level, sibling-navigable y-axis region alongside chart content. */
  yAxis?: AxisRegionOptions;
  /** When provided, adds a top-level, sibling-navigable legend region alongside chart content. */
  legend?: LegendRegionOptions;
  /** When false, the chart-content (bar) region is omitted so only auxiliary regions are navigable. Defaults to true. */
  content?: boolean;
  /** Ref to the positioned container that wraps the chart. */
  containerRef: RefObject<HTMLElement | null>;
  /** Stable id used to namespace the rendered nav elements. */
  chartId: string;
  /** Accessor for the live Vega view. */
  getView: () => View | undefined;
}

export const Navigator = ({
  chartType,
  data,
  dimension,
  color,
  metric,
  title,
  xAxis,
  yAxis,
  legend,
  content,
  containerRef,
  chartId,
  getView,
}: NavigatorProps): null => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) {
      return;
    }
    const attach = () =>
      attachDataNavigator({ container, chartType, data, dimension, color, metric, title, xAxis, yAxis, legend, content, chartId, getView });
    attach();
    // Re-attach on the next frame so the axis visible-label filter reads a laid-out scenegraph (the
    // first effect tick can run before Vega's async layout settles). attachDataNavigator rebuilds cleanly.
    const raf = requestAnimationFrame(attach);
    return () => cancelAnimationFrame(raf);
  }, [chartType, data, dimension, color, metric, title, xAxis, yAxis, legend, content, chartId, containerRef, getView]);

  return null;
};
Navigator.displayName = 'Navigator';
