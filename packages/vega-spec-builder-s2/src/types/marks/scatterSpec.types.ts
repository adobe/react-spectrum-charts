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
import { Blend } from 'vega';

import { ColorScheme, HighlightedItem } from '../chartSpec.types.js';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types.js';
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types.js';
import {
  ColorFacet,
  LineTypeFacet,
  LineWidthFacet,
  OpacityFacet,
  PartiallyRequired,
  ScaleType,
  SymbolSizeFacet,
} from '../specUtil.types.js';
import { ScatterAnnotationOptions } from './supplemental/index.js';
import { ScatterPathOptions } from './supplemental/scatterPathSpec.types.js';
import { TrendlineOptions } from './supplemental/trendlineSpec.types.js';

export interface ScatterOptions {
  markType: 'scatter';

  /** Sets the name of the component. */
  name?: string;
  /** Key in the data that is used as the metric */
  metric?: string;
  /** Restricts scatter plot contents to the plot boundaries.*/
  clip?: boolean;
  /** Point fill color: a data key mapped to the color scale, or a static color. Defaults to `{ value: 'categorical-100' }`. */
  color?: ColorFacet;
  /** Color scale type: `ordinal` for category keys, `linear` for numeric keys. Defaults to `ordinal`. */
  colorScaleType?: 'linear' | 'ordinal';
  /** Data key for the x position. Defaults to `x`. */
  dimension?: string;
  /** Scale type for the x position; use `time` for timestamps. Defaults to `linear`. */
  dimensionScaleType?: ScaleType;
  /** Outline dash pattern: a data key mapped to the chart's `lineTypes`, or a static line type. Defaults to `{ value: 'solid' }`. */
  lineType?: LineTypeFacet;
  /** Outline width: a data key mapped to the chart's `lineWidths`, or a static width. Defaults to `{ value: 0 }`. */
  lineWidth?: LineWidthFacet;
  /** Point opacity: a data key mapped to the chart's `opacities`, or a static value. Defaults to `{ value: 1 }`. */
  opacity?: OpacityFacet;
  /** Point width: a numeric data key scaled between the chart's `symbolSizes`, or a static size. Defaults to `{ value: 'M' }`. */
  size?: SymbolSizeFacet;

  //children
  chartPopovers?: ChartPopoverOptions[];
  chartInspects?: ChartInspectOptions[];
  scatterAnnotations?: ScatterAnnotationOptions[];
  scatterPaths?: ScatterPathOptions[];
  trendlines?: TrendlineOptions[];
  /** Outline color: a data key mapped to the color scale, or a static color. Defaults to `color`. */
  stroke?: ColorFacet;
  /** CSS blend mode where points overlap. `normal` turns blending off. Defaults to `multiply` in light mode and `screen` in dark mode. */
  blend?: 'normal' | Blend;
}

type ScatterOptionsWithDefaults =
  | 'chartPopovers'
  | 'chartInspects'
  | 'color'
  | 'colorScaleType'
  | 'dimension'
  | 'dimensionScaleType'
  | 'lineType'
  | 'lineWidth'
  | 'metric'
  | 'name'
  | 'opacity'
  | 'size'
  | 'scatterAnnotations'
  | 'scatterPaths'
  | 'trendlines';

export interface ScatterSpecOptions extends PartiallyRequired<ScatterOptions, ScatterOptionsWithDefaults> {
  colorScheme: ColorScheme;
  highlightedItem?: HighlightedItem;
  idKey: string;
  index: number;
  interactiveMarkName: string | undefined;
}