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
import { TrendlineOptions } from '@spectrum-charts/core-s2/options';

import { ColorScheme } from '../../chartSpec.types.js';
import { ColorFacet, PartiallyRequired, ScaleType } from '../../specUtil.types.js';

export type {
  AggregateMethod,
  RegressionMethod,
  TrendlineMethod,
  TrendlineOptions,
  WindowMethod,
} from '@spectrum-charts/core-s2/options';

type TrendlineOptionsWithDefaults =
  | 'chartInspects'
  | 'dimensionExtent'
  | 'dimensionRange'
  | 'displayOnHover'
  | 'hidePartialWindows'
  | 'highlightRawPoint'
  | 'lineType'
  | 'lineWidth'
  | 'method'
  | 'opacity'
  | 'orientation'
  | 'trendlineAnnotations';

export interface TrendlineSpecOptions extends PartiallyRequired<TrendlineOptions, TrendlineOptionsWithDefaults> {
  colorScheme: ColorScheme;
  dimensionScaleType: ScaleType;
  isDimensionNormalized: boolean;
  metric: string;
  name: string;
  trendlineColor: ColorFacet;
  trendlineDimension: string;
  trendlineMetric: string;
}
