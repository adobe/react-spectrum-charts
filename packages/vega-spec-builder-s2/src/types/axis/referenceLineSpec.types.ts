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
import { FontWeight } from 'vega';

import { ColorScheme } from '../chartSpec.types';
import { LineType, PartiallyRequired } from '../specUtil.types';
import { SpectrumColor } from '../spectrumVizColor.types';

export type Icon = 'date' | 'sentimentNegative' | 'sentimentNeutral' | 'sentimentPositive';

export interface ReferenceLineOptions {
  /** The color of the reference line. */
  color?: SpectrumColor | string;
  /** The value on the axis where the reference line should be drawn. */
  value: number | string;
  /** Adds an icon as the reference line label on the axis. */
  icon?: Icon | string;
  /** Color of the icon. */
  iconColor?: SpectrumColor | string;
  /** Position the line on the value, or between the previous/next value. Only supported in Bar visualizations. */
  position?: 'before' | 'after' | 'center';
  /** Axis text label. If not provided, the default label will be displayed. */
  label?: string;
  /** Specifies what layer the reference line should be drawn on. `front` will render the reference line infront of other marks. `back` will draw the refence line behind other marks. */
  layer?: 'back' | 'front';
  /** Color of the label. */
  labelColor?: SpectrumColor | string;
  /** Font weight of the label. */
  labelFontWeight?: FontWeight;
  /** Line type of the reference line. */
  lineType?: LineType;
}

type ReferenceLineOptionsWithDefaults = 'color' | 'iconColor' | 'labelColor' | 'layer' | 'labelFontWeight' | 'lineType';

export interface ReferenceLineSpecOptions
  extends PartiallyRequired<ReferenceLineOptions, ReferenceLineOptionsWithDefaults> {
  colorScheme: ColorScheme;
  name: string;
}
