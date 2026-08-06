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
import { ReferenceLineSize } from '@spectrum-charts/constants';

import { ColorScheme } from '../chartSpec.types';

export type Icon = 'date' | 'sentimentNegative' | 'sentimentNeutral' | 'sentimentPositive';

export interface ReferenceLineOptions {
  /** The value on the axis where the reference line should be drawn. */
  value: number | string;
  /** Position the line on the value, or between the previous/next value. Only supported in Bar visualizations. */
  position?: 'before' | 'after' | 'center';
  /** Axis text label. */
  label?: string;
  /** Size variant controlling stroke weight and caret triangle dimensions. When omitted, stroke width reacts to chart size automatically. */
  size?: ReferenceLineSize;
  /** When true, renders a lighter secondary style: no caret caps, and a lighter stroke color for XS size. */
  secondary?: boolean;
}

export interface ReferenceLineSpecOptions extends ReferenceLineOptions {
  colorScheme: ColorScheme;
  name: string;
}
