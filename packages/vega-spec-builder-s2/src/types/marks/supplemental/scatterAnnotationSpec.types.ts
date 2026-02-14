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
import { LabelAnchor } from 'vega';

import { PartiallyRequired } from '../../specUtil.types';
import { ScatterSpecOptions } from '../scatterSpec.types';

export interface ScatterAnnotationOptions {
  /** Specifies where to position the annotation relative to the data point. When an array is provided, each position is tried in order until one fits within the chart bounds and doesn't overlap with other annotations or points. If no position fits, the annotation is not displayed. */
  anchor?: LabelAnchor | LabelAnchor[];
  /** The key in the data that has the text to display */
  textKey?: string;
}

type ScatterAnnotationOptionsWithDefaults = 'anchor' | 'textKey';

export interface ScatterAnnotationSpecOptions
  extends PartiallyRequired<ScatterAnnotationOptions, ScatterAnnotationOptionsWithDefaults> {
  index: number;
  name: string;
  scatterOptions: ScatterSpecOptions;
}
