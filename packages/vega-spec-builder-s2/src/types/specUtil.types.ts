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
import { Config, Spec } from 'vega';

import { GROUP_DATA, MARK_ID, SERIES_ID, TRENDLINE_VALUE } from '@spectrum-charts/core-s2/constants';
import { Orientation } from '@spectrum-charts/core-s2/options';

export type {
  NumberFormat,
  Orientation,
  Position,
  ScaleType,
  ChartSymbolShape,
  LineType,
  LineWidth,
  PathWidth,
  SymbolSize,
  StaticValue,
  FacetRef,
  ColorFacet,
  LineTypeFacet,
  LineWidthFacet,
  OpacityFacet,
  PathWidthFacet,
  SymbolSizeFacet,
  SymbolShapeFacet,
} from '@spectrum-charts/core-s2/options';

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

export type InteractiveMark = {
  name: string;
  dimension?: string;
};

/** A single-series bar mark with `diverging: true`; lets axis building find its dimension/metric without parsing marks or data directly. */
export type DivergingBarMark = {
  name: string;
  dimension: string;
  metric: string;
};

export type UserMeta = {
  animatedMarks?: string[];
  interactiveMarks?: InteractiveMark[];
  divergingBarMarks?: DivergingBarMark[];
  chartOrientation?: Orientation;
  metricAxisCount?: number;
  patches?: Partial<Config>[];
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
