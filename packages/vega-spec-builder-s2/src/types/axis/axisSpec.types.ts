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
import { Align, Baseline, NumberValue, ScaleType } from 'vega';

import { AxisOptions } from '@spectrum-charts/core-s2/options';

import { ColorScheme } from '../chartSpec.types.js';
import { PartiallyRequired } from '../specUtil.types.js';

export type {
  AxisOptions,
  AxisTooltip,
  Granularity,
  Label,
  LabelAlign,
  LabelFormat,
  SubLabel,
} from '@spectrum-charts/core-s2/options';

type AxisOptionsWithDefaults =
  | 'axisAnnotations'
  | 'baseline'
  | 'baselineOffset'
  | 'granularity'
  | 'grid'
  | 'hasOnClick'
  | 'hideDefaultLabels'
  | 'labelAlign'
  | 'labelFontWeight'
  | 'labelOrientation'
  | 'labels'
  | 'numberFormat'
  | 'referenceLines'
  | 'axisThumbnails'
  | 'subLabels'
  | 'ticks';

export interface AxisSpecOptions extends PartiallyRequired<AxisOptions, AxisOptionsWithDefaults> {
  name: string;
  colorScheme: ColorScheme;
  index: number;
  scaleType: ScaleType;
  vegaLabelAlign?: Align;
  vegaLabelBaseline?: Baseline;
  vegaLabelOffset?: NumberValue;
  vegaLabelPadding?: number;
}
