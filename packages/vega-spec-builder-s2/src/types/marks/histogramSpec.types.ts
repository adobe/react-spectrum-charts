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
import { ColorScheme, HighlightedItem } from '../chartSpec.types.js';
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types.js';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types.js';
import { ColorFacet, Orientation, PartiallyRequired } from '../specUtil.types.js';

/** What a histogram bar's height shows. */
export type HistogramYValue = 'count' | 'percent' | 'density';

/** How bars enter when the chart draws in. */
export type HistogramDrawInEffect = 'grow' | 'sweep' | 'fade';

/** How series split by a `color` key share a bin. */
export type HistogramLayout = 'stacked' | 'overlaid' | 'dodged';

/** Sequential color schemes for 2D histogram cells. */
export type HistogramCellColors =
  | 'sequentialCerulean5'
  | 'sequentialCerulean9'
  | 'sequentialCerulean16'
  | 'sequentialForest5'
  | 'sequentialForest9'
  | 'sequentialForest16'
  | 'sequentialMagma5'
  | 'sequentialMagma9'
  | 'sequentialMagma16'
  | 'sequentialRose5'
  | 'sequentialRose9'
  | 'sequentialRose16'
  | 'sequentialViridis5'
  | 'sequentialViridis9'
  | 'sequentialViridis16';

export interface HistogramOptions {
  markType: 'histogram';

  /** Sets the name of the component. */
  name?: string;
  /** Numeric data key to bin. Rows where it isn't a finite number are ignored. Defaults to `value`. */
  metric?: string;
  /** Maximum number of bins; the bin width is rounded to a nice number. Defaults to a count based on the number of rows (the Rice rule, 5 to 50). */
  binCount?: number;
  /** Fixed bin width. Overrides `binCount`. */
  binSize?: number;
  /** Ascending bin edges for uneven bins, e.g. `[0, 18, 25, 35, 50, 65, 100]`. Overrides `binCount`, `binSize` and `extent`. */
  binEdges?: number[];
  /** `[min, max]` range to bin over. Values outside it are ignored. Defaults to the data's range. */
  extent?: [number, number];
  /** Value a bin edge lines up with, e.g. `0` for bins on whole steps from zero. Ignored with `binEdges`. */
  binAnchor?: number;
  /** Numeric data key whose values are summed per bin instead of counting rows. */
  weight?: string;
  /** Direction the bars grow: `vertical` bins along the x axis, `horizontal` bins along the y axis. Ignored for 2D histograms. Defaults to `vertical`. */
  orientation?: Orientation;
  /** Draws a smoothed density curve (kernel density estimate) over the bars, scaled to the bar heights. Not drawn for 2D histograms, with `weight`, or with `binEdges` unless `yValue` is `density` or `cumulative` is set. Defaults to `false`. */
  densityCurve?: boolean;
  /** Bar color: a data key that splits the histogram into one series per value, or a static color. Defaults to `{ value: 'categorical-100' }`. */
  color?: ColorFacet;
  /** How series from a `color` key share a bin: `stacked` on top of each other, `overlaid` and semi-transparent, or `dodged` side by side. Defaults to `stacked`. */
  layout?: HistogramLayout;
  /** Bar height: rows per bin (`count`), share of the series' rows from 0 to 1 (`percent`), or share divided by bin width (`density`). Defaults to `count`. */
  yValue?: HistogramYValue;
  /** Accumulates bar heights from left to right. With `yValue="density"` the bars show the cumulative share. Defaults to `false`. */
  cumulative?: boolean;
  /** Numeric data key binned on the y axis. Makes a 2D histogram: a grid of cells colored by count, or by sum with `weight`. */
  yMetric?: string;
  /** Maximum number of y bins in a 2D histogram. Defaults to the same rule as `binCount`. */
  yBinCount?: number;
  /** Fixed y bin width in a 2D histogram. Overrides `yBinCount`. */
  yBinSize?: number;
  /** `[min, max]` y range to bin over in a 2D histogram. Defaults to the data's range. */
  yExtent?: [number, number];
  /** Sequential color scheme for 2D histogram cells. Defaults to `sequentialCerulean9`. */
  cellColors?: HistogramCellColors;
  /** Shows a color legend for 2D histogram cells. Defaults to `true`. */
  cellLegend?: boolean;
  /** Title of the 2D cell color legend. In React it defaults to a localized title such as "Count". */
  cellLegendTitle?: string;
  /** Draw-in animation: bars `grow` from the baseline together, `sweep` in one after another from the lowest bin, or `fade` in. 2D cells grow from their centers, or fade in for `sweep` and `fade`. Defaults to `grow`. */
  drawInEffect?: HistogramDrawInEffect;
  /** `true` if HistogramProps has an onClick callback. */
  hasOnClick?: boolean;

  // children
  chartInspects?: ChartInspectOptions[];
  chartPopovers?: ChartPopoverOptions[];
}

type HistogramOptionsWithDefaults =
  | 'chartInspects'
  | 'chartPopovers'
  | 'color'
  | 'cellColors'
  | 'cellLegend'
  | 'cumulative'
  | 'densityCurve'
  | 'drawInEffect'
  | 'layout'
  | 'metric'
  | 'name'
  | 'orientation'
  | 'yValue';

export interface HistogramSpecOptions extends PartiallyRequired<HistogramOptions, HistogramOptionsWithDefaults> {
  colorScheme: ColorScheme;
  highlightedItem?: HighlightedItem;
  idKey: string;
  index: number;
  interactiveMarkName: string | undefined;
  isDrawInAnimate?: boolean;
}
