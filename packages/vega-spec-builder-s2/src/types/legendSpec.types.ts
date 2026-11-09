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
import { ColorScheme, HighlightedItem } from './chartSpec.types.js';
import { ChartPopoverOptions } from './dialogs/chartPopoverSpec.types.js';
import {
  ColorFacet,
  FacetRef,
  LineTypeFacet,
  LineWidthFacet,
  OpacityFacet,
  PartiallyRequired,
  Position,
  SymbolShapeFacet,
} from './specUtil.types.js';

export type LegendDescription = { seriesName: string; description: string; title?: string };
export type LegendLabel = { seriesName: string | number; label: string; maxLength?: number };

export interface LegendOptions {
  /** Alignment along the legend's edge: left to right for bottom/top legends, top to bottom for left/right legends. Defaults to `'start'` for bottom/top and `'middle'` for left/right. */
  align?: 'start' | 'middle' | 'end';
  /** Symbol color: a data field to facet by, or a static value like `{ value: 'gray-700' }`. Defaults to the marks' color. */
  color?: ColorFacet;
  /** Series hidden when the chart first renders, for a toggleable legend (uncontrolled). */
  defaultHiddenSeries?: string[];
  /** Tooltip text for each entry, matched by `seriesName`; `title` replaces the series name as the heading. */
  descriptions?: LegendDescription[];
  /** `true` if there is a onMouseOut of onMouseOver on the LegendProps. */
  hasMouseInteraction?: boolean;
  /** `true` if there is an onClick on the LegendProps */
  hasOnClick?: boolean;
  /** Series names to leave out of the legend. Their marks still render. */
  hiddenEntries?: string[];
  /** Fades the other series while an entry is hovered. */
  highlight?: boolean;
  /** Lets users click an entry to hide or show its series (uncontrolled). */
  isToggleable?: boolean;
  /** Data fields to generate entries from. Defaults to every field the marks facet by. */
  keys?: string[];
  /** Display labels for entries, matched by `seriesName`. */
  legendLabels?: LegendLabel[];
  /** Max label width in pixels before truncating; also sets the column width of bottom/top legends. Defaults to `184`. */
  labelLimit?: number;
  /** Symbol outline line type: a data field to facet by, or a static value like `{ value: 'dashed' }`. */
  lineType?: LineTypeFacet;
  /** Symbol outline width: a data field to facet by, or a static value like `{ value: 'L' }`. */
  lineWidth?: LineWidthFacet;
  /** Sets the name of the component. */
  name?: string;
  /** Symbol fill opacity: a data field to facet by, or a static value like `{ value: 0.5 }`. */
  opacity?: OpacityFacet;
  /** Side of the plot the legend is placed on. */
  position?: Position;
  /** Symbol shape: a data field that picks from the chart's `symbolShapes`, or a static value like `{ value: 'circle' }`. Defaults to a rounded square. */
  symbolShape?: SymbolShapeFacet;
  /** Heading shown above the entries. */
  title?: string;
  /** Max title width in pixels before truncating. */
  titleLimit?: number;

  // children
  chartPopovers?: ChartPopoverOptions[];
}

type LegendOptionsWithDefaults =
  | 'hasMouseInteraction'
  | 'hasOnClick'
  | 'hiddenEntries'
  | 'highlight'
  | 'isToggleable'
  | 'position'
  | 'name';

export interface LegendSpecOptions extends PartiallyRequired<LegendOptions, LegendOptionsWithDefaults> {
  color?: FacetRef<string>;
  colorScheme: ColorScheme;
  hiddenSeries: string[];
  highlightedItem?: HighlightedItem;
  highlightedSeries?: string | number;
  index: number;
  lineType?: FacetRef<number[]>;
  lineWidth?: FacetRef<number>;
  symbolShape?: FacetRef<string>;
}
