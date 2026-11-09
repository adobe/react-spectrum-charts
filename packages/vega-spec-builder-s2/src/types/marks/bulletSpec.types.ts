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
import { ColorScheme } from '../chartSpec.types.js';
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types.js';
import { NumberFormat, PartiallyRequired } from '../specUtil.types.js';

export type ThresholdBackground = { thresholdMin?: number; thresholdMax?: number; fill?: string };

export interface BulletOptions {
  markType: 'bullet';

  /** Chart inspects for the bullet */
  chartInspects?: ChartInspectOptions[];

  /** Color of the metric bars, as a Spectrum color name or CSS color. Defaults to `blue-900`. */
  color?: string;
  /** Key in the data for each bullet's label. Defaults to `graphLabel`. */
  dimension?: string;
  /** Stacks bullets in a `column` or places them side by side in a `row`. Defaults to `column`. */
  direction?: 'row' | 'column';
  /** Shows each bullet's label and value above it (`top`) or on either side (`side`, column direction only). Defaults to `top`. */
  labelPosition?: 'side' | 'top';
  /** Scale maximum when `scaleType` is `fixed` or `flexible`; must be greater than zero. Defaults to `100`. */
  maxScaleValue?: number;
  /** Key in the data for the metric bar's value. Defaults to `currentAmount`. */
  metric?: string;
  /** Key in the data for preformatted text shown instead of the formatted metric value. */
  metricLabel?: string;
  /** Adds a value axis below the bullets in column direction; not shown with `showTargetValue`. Defaults to `false`. */
  metricAxis?: boolean;
  /** Names the bullet's marks and signals in the Vega spec. Defaults to `bullet0`, `bullet1`, and so on. */
  name?: string;
  /** Format for values, target values, and the metric axis: `standardNumber`, `shortNumber`, `currency`, `shortCurrency`, or a d3-format specifier. Defaults to `standardNumber`. */
  numberFormat?: NumberFormat;
  /** Sets the scale maximum from the data (`normal`), from `maxScaleValue` (`fixed`), or the larger of the two (`flexible`). Defaults to `normal`. */
  scaleType?: 'normal' | 'fixed' | 'flexible';
  /** Shows the target line. Defaults to `true`. */
  showTarget?: boolean;
  /** Shows the target value below the target line. Defaults to `false`. */
  showTargetValue?: boolean;
  /** Key in the data for the target value. Defaults to `target`. */
  target?: string;
  /** Key in the data for preformatted text shown instead of the formatted target value when `showTargetValue` is set. */
  targetLabel?: string;
  /** Colors each metric bar with the `fill` of the threshold band its value falls in. Defaults to `false`. */
  thresholdBarColor?: boolean;
  /** Background bands `{ thresholdMin?, thresholdMax?, fill }`; an omitted bound extends to the edge of the scale and `fill` is a CSS color. */
  thresholds?: ThresholdBackground[];
  /** Draws a gray track behind each metric bar; ignored when `thresholds` is set. Defaults to `false`. */
  track?: boolean;
}

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
