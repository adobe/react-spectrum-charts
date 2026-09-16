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
import { NumberFormat, PartiallyRequired } from '../specUtil.types';
import { SpectrumVizColor } from '../spectrumVizColor.types';

export interface GaugeOptions {
  markType: 'gauge';

  /** Sets the name of the component. */
  name?: string;
  /** Metric name displayed below the value in the center of the gauge. Always shown. */
  label: string;
  /** Key in the data that is used as the metric */
  metric?: string;
  /** Minimum value for the scale range. */
  minScaleValue?: number;
  /** Maximum value for the scale range. */
  maxScaleValue?: number;
  /** How to aggregate the metric when the data has multiple rows. */
  method?: 'last' | 'avg' | 'sum';
  /** d3 number format specifier for the displayed value. see {@link https://d3js.org/d3-format#locale_format} */
  numberFormat?: NumberFormat;
  /** When true, a needle indicates the value on a fixed-color track. When false, the track fills to the value position. */
  showNeedle?: boolean;
  /** Spectrum color token used for the fill (showNeedle: false) or needle (showNeedle: true). */
  color?: SpectrumVizColor | string;
  /** Fraction of a full circle the arc spans. Clamped to 0.2-0.85. Chart-author-only: omitted from GaugeProps. */
  arcSize?: number;
  /** Inner radius as a fraction of the outer radius, controlling track thickness. Clamped to 0.4-0.9. Chart-author-only: omitted from GaugeProps. */
  holeRatio?: number;
}

type GaugeOptionsWithDefaults =
  | 'arcSize'
  | 'color'
  | 'holeRatio'
  | 'maxScaleValue'
  | 'method'
  | 'metric'
  | 'minScaleValue'
  | 'name'
  | 'numberFormat'
  | 'showNeedle';

export interface GaugeSpecOptions extends PartiallyRequired<GaugeOptions, GaugeOptionsWithDefaults> {
  colorScheme: ColorScheme;
  index: number;
  markType: 'gauge';
}
