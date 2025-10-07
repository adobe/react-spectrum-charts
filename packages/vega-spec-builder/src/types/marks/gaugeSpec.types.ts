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
  /** Data field that the metric is trended against (x-axis for horizontal orientation) */
  dimension?: string;
  /** Specifies the direction the bars should be ordered (row/column) */
  direction?: 'row' | 'column';
  /** Specifies if the labels should be in top of the bullet chart or to the side. Side labels are not supported in row mode. */
  labelPosition?: 'side' | 'top';
  /** Maximum value for the scale. This value must be greater than zero. */
  maxScaleValue?: number;
  /** Key in the data that is used as the metric */
  metric?: string;
  /** Adds an axis that follows the max target in basic mode */
  metricAxis?: boolean;
  /** Sets the name of the component. */
  name?: string;
  /** d3 number format specifier.
   * Sets the number format for the summary value.
   *
   * see {@link https://d3js.org/d3-format#locale_format}
   */
  numberFormat?: NumberFormat;
  /** Specifies if the scale should be normal, fixed, or flexible.
   *
   * In normal mode the maximum scale value will be calculated using the maximum value of the metric and target data fields.
   *
   * In fixed mode the maximum scale value will be set as the maxScaleValue prop.
   *
   * In flexible mode the maximum scale value will be calculated using the maximum value of either the maxScaleValue prop or maximum value of the metric and target data fields.
   * This means that the scale max will be set to be the maxScaleValue prop until the data values overtake it.
   */
  scaleType?: 'normal' | 'fixed' | 'flexible';
  /** Flag to control whether the target is shown */
  showTarget?: boolean;
  /** Flag to control whether the target value is shown. */
  showTargetValue?: boolean;
  /** Target line */
  target?: string;
  /** changes color based on threshold */
  /** If true, the metric bar will be colored according to the thresholds. */
  thresholdBarColor?: boolean;
  /** Array of threshold definitions to be rendered as background bands on the bullet chart.
   *
   *  Each threshold object supports:
   * `thresholdMin` (optional): The lower bound of the threshold. If undefined, the threshold starts from the beginning of the x-scale.
   *
   * `thresholdMax` (optional): The upper bound of the threshold. If undefined, the threshold extends to the end of the x-scale.
   *
   * `fill` : The fill color to use for the threshold background.
   */
  thresholds?: ThresholdBackground[];
  /** Color regions that sit behind the bullet bar */
  track?: boolean;
}

type GaugeOptionsWithDefaults =
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

export interface GaugeSpecOptions extends PartiallyRequired<GaugeOptions, GaugeOptionsWithDefaults> {
  colorScheme: ColorScheme;
  idKey: string;
  index: number;
}
