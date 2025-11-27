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

export type PerformanceRanges = { bandEndPct: number; fill: string };

export interface GaugeOptions {
  /** Sets the name of the component. */
  name?: string;
  /** Key in the data that is used as the graph label */
  graphLabel?: string;
  /** Sets to show the label or not */
  showLabel?: boolean;
  /** Sets to show the current value as a percentage or not */
  showsAsPercent?: boolean;
  /** Key in the data that is used as the metric */
  metric?: string;
  /** Key in the data that is used as the color facet */
  color?: string;
  /** Minimum value for the scale. This value must be greater than zero, and less than maxArcValue */
  minArcValue?: number;
  /** Maximum value for the scale. This value must be greater than zero, and greater than minArcValue */
  maxArcValue?: number;
  /** Color of the background arc */
  backgroundFill?: string;
  /** Color of the background stroke */
  backgroundStroke?: string;
  /** Color of the filler color arc */
  fillerColorSignal?: string;
  /** Showing the needle mark */
  needle?: boolean;
  /** Key in the data that is used as the target */
  target?: string;
  /** Showing the target line */
  targetLine?: boolean;
  /** Performance ranges
   * 
   * Array of performance ranges to be rendered as filled bands on the gauge.
   * 
   */
  performanceRanges?: PerformanceRanges[];
  /** if true, show banded performance ranges instead of a colored filler arc */
  showPerformanceRanges?: boolean;
  
}

type GaugeOptionsWithDefaults =
  | 'name'
  | 'graphLabel'
  | 'showLabel'
  | 'showsAsPercent'
  | 'metric'
  | 'color'
  | 'minArcValue'
  | 'maxArcValue'
  | 'backgroundFill'
  | 'backgroundStroke'
  | 'fillerColorSignal'
  | 'needle'
  | 'target'
  | 'targetLine'
  | 'performanceRanges'

export interface GaugeSpecOptions extends PartiallyRequired<GaugeOptions, GaugeOptionsWithDefaults> {
  colorScheme: ColorScheme;
  idKey: string;
  index: number;
}
