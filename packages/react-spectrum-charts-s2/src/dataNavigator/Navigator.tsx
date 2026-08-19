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
  /** Optional chart title for the accessible description. */
  title?: string;
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
  containerRef,
  chartId,
  getView,
}: NavigatorProps): null => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) {
      return;
    }
    attachDataNavigator({ container, chartType, data, dimension, color, metric, title, chartId, getView });
  }, [chartType, data, dimension, color, metric, title, chartId, containerRef, getView]);

  return null;
};
Navigator.displayName = 'Navigator';
