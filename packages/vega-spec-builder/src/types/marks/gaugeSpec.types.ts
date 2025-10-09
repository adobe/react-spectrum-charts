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
import { ColorScheme } from '../chartSpec.types';
import { NumberFormat, PartiallyRequired } from '../specUtil.types';

export type ThresholdBackground = { thresholdMin?: number; thresholdMax?: number; fill?: string };

export interface GaugeOptions {
  markType: 'gauge';

  /** Key in the data that is used as the color facet */
  color?: string;
  /** Minimum value for the scale. This value must be greater than zero. */
  minArcValue?: number;
  /** Maximum value for the scale. This value must be greater than zero. */
  maxArcValue?: number;
  /** Key in the data that is used as the metric */
  metric?: string | number;
  /** Sets the name of the component. */
  name?: string;
  /** d3 number format specifier.
   * Sets the number format for the summary value.
   *
   * see {@link https://d3js.org/d3-format#locale_format}
   */
  numberFormat?: NumberFormat;
  /** Flag to control whether the target is shown */
  target?: string;
  /** Color regions that fill the gauge bar to the metric value */
  //track?: boolean;
  /** Color of the background fill */
  backgroundFill?: string;
  /** Color of the background stroke */
  backgroundStroke?: string;
  /** Color of the filler color signal */
  fillerColorSignal?: string;
  /** Color of the label text */
  labelColor?: string;
  /** Size of the label text */
  labelSize?: number;
}

type GaugeOptionsWithDefaults =
  | 'name'
  | 'metric'
  | 'target'
  | 'color'
  | 'minArcValue'
  | 'maxArcValue'
  | 'backgroundFill'
  | 'backgroundStroke'
  | 'fillerColorSignal';

export interface GaugeSpecOptions extends PartiallyRequired<GaugeOptions, GaugeOptionsWithDefaults> {
  colorScheme: ColorScheme;
  idKey: string;
  index: number;
}
