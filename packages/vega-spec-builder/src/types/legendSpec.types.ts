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
  /**
   * Alignment of the legend along its main axis.
   * For horizontal legends (bottom/top): start=left, middle=center, end=right.
   * For vertical legends (left/right): start=top, middle=center, end=bottom.
   * @default 'middle'
   */
  align?: 'start' | 'middle' | 'end';
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
  /**
   * Maximum number of lines a legend label can wrap onto before truncating.
   * Each line wraps by word up to `labelLimit` pixels wide. If the label still doesn't fit after wrapping to this
   * many lines, the final line is truncated with an ellipsis.
   *
   * NOTE: The leading underscore marks this as a targeted, internal-use property. It exists to support
   * a specific horizontal-legend layout requirement and is not a generally supported prop — its
   * behavior outside that use case (e.g. vertical legends, or combinations beyond `_preferredColumns`)
   * is not guaranteed. Use at your own risk.
   */
  _labelWrap?: number;
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
  /**
   * Ordered list of candidate column counts for horizontal (top/bottom) legends, e.g. `[5, 3]`.
   * The largest listed count whose labels fit the available width without truncation is used.
   * If none fit, the last (smallest) count is forced and labels are truncated to their fair share
   * of the width. When set, this fully overrides `labelLimit`. Ignored for left/right legends.
   *
   * NOTE: The leading underscore marks this as a targeted, internal-use property. It exists to support
   * a specific horizontal-legend layout requirement and is not a generally supported prop — its
   * behavior outside that use case is not guaranteed. Use at your own risk.
   */
  _preferredColumns?: number[];
  /**
   * Maximum rows of legend entries the legend will render, and the row budget used to compute the
   * `${name}_pages` signal for pagination UIs built outside RSC. Requires `_preferredColumns` to
   * also be set. The legend itself is capped at `columns * _maxRows` entries. Entries
   * beyond the cap are dropped from rendering, not just hidden by `hiddenEntries` semantics.
   *
   * NOTE: The leading underscore marks this as a targeted, internal-use property. It exists to support
   * a specific horizontal-legend layout requirement and is not a generally supported prop — its
   * behavior outside that use case is not guaranteed. Use at your own risk.
   */
  _maxRows?: number;
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
