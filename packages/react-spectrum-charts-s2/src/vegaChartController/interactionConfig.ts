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

import { Datum, MarkBounds } from '@spectrum-charts/vega-spec-builder-s2';

import { ContextMenuMode } from '../types/marks/line.types';
import { AxisLabelClickCallback, ContextMenuCallback, MarkCallback } from '../types/util.types';

// Structurally identical to React's RefObject<T>, without importing React — keeps this module (and
// interactionHandlers.ts, which consumes it) usable from the non-React controller layer.
export type MutableRef<T> = { current: T };

export type MarkOnClickDetail = {
  markName?: string;
  onClick?: MarkCallback;
  onContextMenu?: ContextMenuCallback;
  contextMenuMode?: ContextMenuMode;
};

export type MarkMouseInputDetail = {
  markName?: string;
  onMouseOver?: (datum: Datum) => void;
  onMouseOut?: (datum: Datum) => void;
};

export type AxisLabelOnClickDetail = {
  markName?: string;
  onClick?: AxisLabelClickCallback;
};

export interface PopoverDispatchDetail {
  name: string;
  attachedToLegend: boolean;
  rightClick: boolean;
}

export interface LegendInteractionConfig {
  isToggleable?: boolean;
  defaultHiddenSeries?: string[];
  onClick?: (seriesName: string) => void;
  onMouseOver?: (seriesName: string) => void;
  onMouseOut?: (seriesName: string) => void;
}

export interface VegaChartInteractionRefs {
  chartView: MutableRef<View | undefined>;
  selectedData: MutableRef<Datum | null>;
  selectedDataName: MutableRef<string>;
  selectedDataBounds: MutableRef<MarkBounds>;
}

export interface VegaChartInteractionConfig {
  chartId: string;
  idKey: string;
  markClickDetails: MarkOnClickDetail[];
  markMouseInputDetails: MarkMouseInputDetail[];
  axisLabelOnClickDetails: AxisLabelOnClickDetail[];
  legend: LegendInteractionConfig;
  popovers: PopoverDispatchDetail[];
  refs: VegaChartInteractionRefs;
}
