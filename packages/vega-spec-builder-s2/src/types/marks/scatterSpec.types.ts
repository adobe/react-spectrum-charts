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
import { ScatterOptions } from '@spectrum-charts/core-s2/options';

import { ColorScheme, HighlightedItem } from '../chartSpec.types.js';
import { PartiallyRequired } from '../specUtil.types.js';

export type { ScatterOptions } from '@spectrum-charts/core-s2/options';

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
