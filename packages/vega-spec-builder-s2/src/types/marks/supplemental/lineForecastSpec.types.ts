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

import { ColorScheme } from '../../chartSpec.types';
import { ColorFacet, ScaleType } from '../../specUtil.types';

export interface LineForecastOptions {
  /** Data field containing the forecasted metric values */
  metric: string;
  /** Dimension value (timestamp for time scale, number for linear) where the forecast begins */
  start: number;
  /** Label text shown at the forecast boundary. Defaults to 'Forecast'. */
  label?: string;
}

export interface LineForecastSpecOptions {
  color: ColorFacet;
  colorScheme: ColorScheme;
  dimension: string;
  index: number;
  label: string;
  lineName: string;
  metric: string;
  metricAxis: string | undefined;
  scaleType: ScaleType;
  start: number;
}
