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
import type { ChartInspectOptions, ChartOptions, LineOptions } from '@spectrum-charts/core-s2/options';

export type {
  AxisOptions,
  ChartInspectOptions,
  ChartPopoverOptions,
  ColorScheme,
  FacetRef,
  FontWeight,
  Granularity,
  InterpolationType,
  Label,
  LabelAlign,
  LabelAnchor,
  LegendOptions,
  LineOptions,
  LineType,
  LineWidth,
  MarkOptions,
  Position,
  SubLabel,
  TitleOptions,
} from '@spectrum-charts/core-s2/options';

export type Datum = Record<string, unknown>;

export type HighlightBy = NonNullable<ChartInspectOptions['highlightBy']>;

/** The shared S2 chart contract plus the runtime inputs the D3 engine takes alongside it. */
export interface D3ChartOptions extends ChartOptions<Datum> {
  data: Datum[];
  locale?: string;
}

/** Mark types the D3 engine renders; add a mark here when its chart type is registered. */
export type SupportedMarkOptions = LineOptions;

/** Chart options after unsupported marks are removed; everything inside the engine works on this. */
export interface ResolvedChartOptions extends Omit<D3ChartOptions, 'marks'> {
  marks: SupportedMarkOptions[];
}

export type Renderer = 'svg' | 'canvas';

/** Runtime interaction state the engine keeps outside of options so state changes never rebuild the chart. */
export interface ChartState {
  hoveredItem?: Datum | null;
  hoveredSeries?: string | null;
  /** Index of the legend whose entry is hovered. */
  hoveredLegend?: number | null;
  selectedItem?: Datum | null;
  /** idKey value of the selected item. */
  selectedId?: unknown;
  /** Series of the selected item. */
  selectedSeries?: unknown;
  /** Selection group id. */
  selectedGroup?: unknown;
  focusedItem?: Datum | null;
  /** Series focused by keyboard navigation, drawn with a focus ring around the whole series. */
  focusedSeries?: string | null;
  /** Region focused by keyboard navigation; 'chart' rings the whole plot. */
  focusedRegion?: 'chart' | null;
}

/** Bounds of a scene item. */
export interface ItemBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The interactive item under the pointer, with item bounds relative to the plot origin. */
export interface HitTarget {
  datum: Datum;
  /** Name of the interactive mark that was hit.g. `line0_voronoi`, `line0_hover0`). */
  mark: string;
  bounds: ItemBounds;
  /** The data point a voronoi cell belongs to. */
  point?: { mark: string; bounds: ItemBounds };
  cursor?: string;
  /** Inspect tooltip value; undefined when the mark has no inspect, null when excluded. */
  tooltip?: Datum | string | number | null;
  /** Mark role, set on non-data targets such as `axis-label`. */
  role?: string;
  /** Number of items in the hit mark, so fractional axis tick indexes can be recovered. */
  itemCount?: number;
}
