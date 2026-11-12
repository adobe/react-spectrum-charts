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
import { TrendlineAnnotationOptions } from '@spectrum-charts/core-s2/options';

import { ColorScheme } from '../../chartSpec.types.js';
import { ColorFacet, Orientation, PartiallyRequired, ScaleType } from '../../specUtil.types.js';
import { TrendlineSpecOptions } from './trendlineSpec.types.js';

export type { TrendlineAnnotationOptions } from '@spectrum-charts/core-s2/options';

type TrendlineAnnotationOptionsWithDefaults = 'badge' | 'dimensionValue' | 'numberFormat' | 'prefix';

export interface TrendlineAnnotationSpecOptions
  extends PartiallyRequired<TrendlineAnnotationOptions, TrendlineAnnotationOptionsWithDefaults> {
  colorScheme: ColorScheme;
  displayOnHover: boolean;
  markName: string;
  name: string;
  trendlineColor: ColorFacet;
  trendlineDimension: string;
  trendlineDimensionExtent: TrendlineSpecOptions['dimensionExtent'];
  trendlineDimensionScaleType: ScaleType;
  trendlineName: string;
  trendlineOrientation: Orientation;
  trendlineWidth: number;
}
