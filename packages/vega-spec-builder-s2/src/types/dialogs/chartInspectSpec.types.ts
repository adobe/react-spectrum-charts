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
import { PartiallyRequired } from '../specUtil.types.js';

export interface ChartInspectOptions {
  /** Data keys that turn off the inspect for rows with a truthy value in any of them. */
  excludeDataKeys?: string[];
  /** What stays highlighted while the inspect is visible: the item, its series, its dimension value, or rows matching a list of keys. Defaults to `'item'`. */
  highlightBy?: 'series' | 'dimension' | 'item' | string[];
  /** What shows the inspect on stacked or dodged bars: single bars (`'item'`) and/or whole columns (`'dimensionArea'`). Defaults to `['item']`. */
  targets?: ('dimensionArea' | 'item')[];
}

type ChartInspectOptionsWithDefaults = 'highlightBy' | 'targets';

export interface ChartInspectSpecOptions
  extends PartiallyRequired<ChartInspectOptions, ChartInspectOptionsWithDefaults> {
  markName: string;
}
