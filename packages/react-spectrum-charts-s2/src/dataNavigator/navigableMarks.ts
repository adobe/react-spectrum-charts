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

import {
  DEFAULT_BAR_ORIENTATION,
  DEFAULT_BAR_TYPE,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_LINE_SCALE_TYPE,
  DEFAULT_METRIC,
  DEFAULT_TIME_DIMENSION,
} from '@spectrum-charts/constants';
import { BarType, Orientation } from '@spectrum-charts/vega-spec-builder-s2';

import { Bar } from '../components/Bar';
import { Line } from '../components/Line';
import { NavigableChartType } from './buildChartStructure';
import { FocusedItemFields } from './focusedItemGeometry';

/** The subset of a navigable mark's own props read to name it and resolve its focus geometry. */
export interface NavMarkFields {
  name?: string;
  dimension?: string;
  metric?: string;
  color?: unknown;
  scaleType?: string;
  metricAxis?: string;
  orientation?: Orientation;
  type?: BarType;
}

export const getNavigableChartType = (displayName: unknown): NavigableChartType | undefined => {
  if (displayName === Bar.displayName) return 'bar';
  if (displayName === Line.displayName) return 'line';
  return undefined;
};

/** Reapplies each navigable mark type's own prop defaults, which never run because the mark is a render-null component React never mounts. */
export const resolveNavGeometryFields = (
  navChartType: NavigableChartType | undefined,
  navFields: NavMarkFields | undefined,
  navColor: string | undefined
): FocusedItemFields => {
  const isBar = navChartType === 'bar';
  return {
    dimension: navFields?.dimension ?? (isBar ? DEFAULT_CATEGORICAL_DIMENSION : DEFAULT_TIME_DIMENSION),
    metric: navFields?.metric ?? DEFAULT_METRIC,
    scaleType: navChartType === 'line' ? navFields?.scaleType ?? DEFAULT_LINE_SCALE_TYPE : undefined,
    metricAxis: navFields?.metricAxis,
    orientation: isBar ? navFields?.orientation ?? DEFAULT_BAR_ORIENTATION : undefined,
    type: isBar ? navFields?.type ?? DEFAULT_BAR_TYPE : undefined,
    color: isBar ? navColor : undefined,
  };
};
