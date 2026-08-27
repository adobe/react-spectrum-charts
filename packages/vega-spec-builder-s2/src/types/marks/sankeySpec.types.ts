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
  ChartData,
  ChartPopoverOptions,
  ChartInspectOptions,
  ColorScheme,
  HighlightedItem,
  PartiallyRequired,
} from '../../types';

export interface SankeyOptions {
  markType: 'sankey';
  /** Key in the data for the source node of a flow edge */
  source?: string;
  /** Key in the data for the target node of a flow edge */
  target?: string;
  /** Key in the data for the value (thickness) of a flow edge */
  value?: string;
  /** Key used to color nodes (and, by extension, the ribbons flowing out of them). Refers to the derived node id. */
  color?: string;
  /** Sets the name of the component. */
  name?: string;
  /**
   * Override the node name label's font size in pixels (the value label below it renders 1px
   * smaller). When omitted, font size scales automatically with chart size, same as Line's direct
   * labels (see `getDirectLabelFontSizeProductionRule`).
   */
  fontSize?: number;

  // children
  chartPopovers?: ChartPopoverOptions[];
  chartInspects?: ChartInspectOptions[];
}

type SankeyOptionsWithDefaults = 'chartPopovers' | 'chartInspects' | 'color' | 'name' | 'source' | 'target' | 'value';

export interface SankeySpecOptions extends PartiallyRequired<SankeyOptions, SankeyOptionsWithDefaults> {
  backgroundColor?: string;
  chartHeight: number;
  chartWidth: number;
  colorScheme: ColorScheme;
  data: ChartData[];
  highlightedItem?: HighlightedItem;
  idKey: string;
  index: number;
  markType: 'sankey';
}
