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
import { ColorScheme } from '../chartSpec.types';
import { ChartTooltipOptions } from '../dialogs/chartTooltipSpec.types';
import { NumberFormat, PartiallyRequired } from '../specUtil.types';

export interface GaugeThreshold {
  /** Value at which this zone ends. The zone begins at the previous threshold's value (or minScaleValue). */
  value: number;
  /** Spectrum color token for this zone (e.g. 'red-600', 'blue-500'). */
  color: string;
  /** Optional label displayed at this breakpoint on the arc. */
  label?: string;
}

export interface GaugeOptions {
  markType: 'gauge';

  /** Component identifier. Follows standard RSC mark convention. */
  name?: string;
  /** Metric name displayed below the value in the center of the gauge. Always shown. */
  label: string;
  /** Data key for the current value. */
  metric?: string;
  /** Minimum value for the scale range. */
  minScaleValue?: number;
  /** Maximum value for the scale range. */
  maxScaleValue?: number;
  /** How to aggregate the metric when the dataset has multiple rows. */
  method?: 'last' | 'avg' | 'sum';
  /** d3 number format specifier for the displayed value. */
  numberFormat?: NumberFormat;
  /** When true, a needle pointer indicates the value. When false, the arc fills to the value position. */
  showNeedle?: boolean;
  /** Spectrum color token for the fill or needle. Ignored when thresholds is set. */
  color?: string;
  /** Fraction of a full circle the arc spans. Clamped to 0.2–0.85. Default 0.667. */
  arcSize?: number;
  /** Inner radius as a fraction of outer radius (controls track thickness). Clamped to 0.4–0.9. */
  holeRatio?: number;
  /** Sequential performance zone breakpoints. */
  thresholds?: GaugeThreshold[];
  /** Data key for the target/goal value shown as a tick on the arc. */
  target?: string;
  /** Data key for a custom label displayed alongside the target marker. */
  targetLabel?: string;
  /** Decorative tick marks rendered inside the arc. */
  ticks?: 'minimal' | 'normal' | 'dense';
  /** Show minScaleValue and maxScaleValue labels at the arc endpoints. */
  showRangeLabels?: boolean;
  /** Overall size of the gauge. Named: XL=350px, L=225px, M=150px, S=110px. */
  size?: 'XL' | 'L' | 'M' | 'S' | number;

  // children
  chartTooltips?: ChartTooltipOptions[];
}

type GaugeOptionsWithDefaults =
  | 'arcSize'
  | 'chartTooltips'
  | 'color'
  | 'holeRatio'
  | 'maxScaleValue'
  | 'method'
  | 'metric'
  | 'minScaleValue'
  | 'name'
  | 'numberFormat'
  | 'showNeedle'
  | 'showRangeLabels'
  | 'size';

export interface GaugeSpecOptions extends PartiallyRequired<GaugeOptions, GaugeOptionsWithDefaults> {
  colorScheme: ColorScheme;
  index: number;
  markType: 'gauge';
}
