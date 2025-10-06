/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ColorScheme, HighlightedItem } from './chartSpec.types';
import { ChartPopoverOptions } from './dialogs/chartPopoverSpec.types';
import {
  ColorFacet,
  FacetRef,
  LineTypeFacet,
  LineWidthFacet,
  OpacityFacet,
  PartiallyRequired,
  Position,
  SymbolShapeFacet,
} from './specUtil.types';

export type LegendDescription = { seriesName: string; description: string; title?: string };
export type LegendLabel = { seriesName: string | number; label: string; maxLength?: number };

export interface LegendOptions {
  /** color or key in the data that is used as the color facet for the symbols */
  color?: ColorFacet;
  /** series that should be hidden by default (uncontrolled) */
  defaultHiddenSeries?: string[];
  /** descriptions for each of the series */
  descriptions?: LegendDescription[];
  /** `true` if there is a onMouseOut of onMouseOver on the LegendProps. */
  hasMouseInteraction?: boolean;
  /** `true` if there is an onClick on the LegendProps */
  hasOnClick?: boolean;
  /** series names to hide from the legend */
  hiddenEntries?: string[];
  /** whether or not to include highlight interactions (controlled) */
  highlight?: boolean;
  /** allows the user to hide/show series by clicking on the legend entry (uncontrolled) */
  isToggleable?: boolean;
  /** keys from the data to generate the legend for. Defaults to all keys used to facet the data. */
  keys?: string[];
  /** labels for each of the series */
  legendLabels?: LegendLabel[];
  /** max width in pixels before truncating a legend label. Influences legend column layout by calculating how many legend items can fit horizontally based on the label width. */
  labelLimit?: number;
  /** line type or key in the data that is used as the line type facet for the symbols */
  lineType?: LineTypeFacet;
  /** line type or key in the data that is used as the line type facet for the symbols */
  lineWidth?: LineWidthFacet;
  /** Sets the name of the component. */
  name?: string;
  /** opacity or key in the data that is used as the opacity facet for the symbols */
  opacity?: OpacityFacet;
  /** where the legend should be displayed */
  position?: Position;
  /** customize the legend symbol shape */
  symbolShape?: SymbolShapeFacet;
  /** legend title */
  title?: string;
  /** The maximum allowed length in pixels of the legend title. */
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
