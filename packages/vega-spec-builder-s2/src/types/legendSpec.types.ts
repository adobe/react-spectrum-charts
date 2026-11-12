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
import { LegendOptions } from '@spectrum-charts/core-s2/options';

import { ColorScheme, HighlightedItem } from './chartSpec.types.js';
import { FacetRef, PartiallyRequired } from './specUtil.types.js';

export type { LegendDescription, LegendLabel, LegendOptions } from '@spectrum-charts/core-s2/options';

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
