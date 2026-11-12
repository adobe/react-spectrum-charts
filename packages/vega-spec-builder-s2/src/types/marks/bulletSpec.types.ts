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
import { BulletOptions } from '@spectrum-charts/core-s2/options';

import { ColorScheme } from '../chartSpec.types.js';
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types.js';
import { PartiallyRequired } from '../specUtil.types.js';

export type { BulletOptions, ThresholdBackground } from '@spectrum-charts/core-s2/options';

type BulletOptionsWithDefaults =
  | 'name'
  | 'metric'
  | 'dimension'
  | 'target'
  | 'color'
  | 'direction'
  | 'showTarget'
  | 'showTargetValue'
  | 'labelPosition'
  | 'scaleType'
  | 'maxScaleValue'
  | 'track'
  | 'metricAxis'
  | 'thresholdBarColor';

export interface BulletSpecOptions extends PartiallyRequired<BulletOptions, BulletOptionsWithDefaults> {
  chartInspects: ChartInspectOptions[];
  colorScheme: ColorScheme;
  idKey: string;
  index: number;
  interactiveMarkName: string | undefined;
}
