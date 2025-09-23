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
import { Spec, SymbolShape } from 'vega';

import { GROUP_DATA, MARK_ID, SERIES_ID, TRENDLINE_VALUE } from '@spectrum-charts/constants';

import { SpectrumVizColor } from './spectrumVizColor.types';

export type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// For overloading Spec typing when more strict typing is needed.
export interface ScSpec extends Spec {
  /*
   * Strict typing for usermeta makes it clear what meta information can be accessed during spec creation.
   *
   * Usage:
   * Add properties to usermeta when it's necessary to provide information from one builder
   * to another during spec creation.
   * This should only be used when sibling components have tight coupling and there isn't a
   * reasonable alternative approach using the spec options.
   *
   * Example:
   * A chart element like bar needs to communicate information about its orientation to the axes elements.
   * However, axis elements are built within their own axisSpecBuilder, which is independant from the barSpecBuilder.
   * Parsing the spec for information about the bar is brittle, since implementation details may change.
   * A preferred approach would be to add the needed information to usermeta { orientation: 'vertical' }.
   */
  usermeta: UserMeta;
}

export type UserMeta = {
  interactiveMarks?: string[];
  chartOrientation?: Orientation;
  metricAxisCount?: number;
};

export interface MarkBounds {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

const DatumPredefinedKey = {
  markId: MARK_ID,
  seriesId: SERIES_ID,
  trendlineValue: TRENDLINE_VALUE,
  groupData: GROUP_DATA,
} as const;

export type Datum = object & {
  [DatumPredefinedKey.markId]: number;
  [DatumPredefinedKey.seriesId]: string;
  [DatumPredefinedKey.trendlineValue]?: number;
  [DatumPredefinedKey.groupData]?: Datum[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type NumberFormat = 'currency' | 'shortCurrency' | 'shortNumber' | 'standardNumber' | string;
export type Orientation = 'vertical' | 'horizontal';
export type Position = 'left' | 'right' | 'top' | 'bottom';
export type ScaleType = 'linear' | 'point' | 'time' | 'band';
export type ChartSymbolShape = 'rounded-square' | SymbolShape | string;

/**
 * Stroke dasharray for the line.
 *
 * solid: null,
 * dashed: 7 4,
 * dotted: 2 3,
 * dotDash: 2 3 7 4,
 * shortDash: 3 4,
 * longDash: 11 4,
 * twoDash: 5 2 11 2
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray
 */
export type LineType = 'solid' | 'dashed' | 'dotted' | 'dotDash' | 'shortDash' | 'longDash' | 'twoDash' | number[];

/**
 * Width of line in pixels
 *
 * XS: 1px,
 * S: 1.5px,
 * M: 2px,
 * L: 3px,
 * XL: 4px
 * */
export type LineWidth = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

/**
 * Width of the trail in pixels
 *
 * XS: 6px,
 * S: 8px,
 * M: 10px,
 * L: 12px,
 * XL: 16px
 * */
export type PathWidth = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

/**
 * Width of the symbol in pixels
 *
 * XS: 6px,
 * S: 8px,
 * M: 10px,
 * L: 12px,
 * XL: 16px
 * */
export type SymbolSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

export type StaticValue<T> = { value: T };
export type FacetRef<T> = string | StaticValue<T>;

export type ColorFacet = FacetRef<SpectrumVizColor | string>;
export type LineTypeFacet = FacetRef<LineType>;
export type LineWidthFacet = FacetRef<LineWidth>;
export type OpacityFacet = FacetRef<number>;
export type PathWidthFacet = FacetRef<PathWidth>;
export type SymbolSizeFacet = FacetRef<SymbolSize>;
export type SymbolShapeFacet = FacetRef<ChartSymbolShape>;

export type FacetType =
  | 'color'
  | 'linearColor'
  | 'lineType'
  | 'lineWidth'
  | 'opacity'
  | 'symbolShape'
  | 'symbolSize'
  | 'symbolPathWidth';

export type SecondaryFacetType =
  | 'secondaryColor'
  | 'secondaryLineType'
  | 'secondaryLineWidth'
  | 'secondaryOpacity'
  | 'secondarySymbolShape'
  | 'secondarySymbolSize'
  | 'secondarySymbolPathWidth';

// vega production rule type
export type ProductionRuleTests<T> = ({
  test?: string;
} & T)[];
