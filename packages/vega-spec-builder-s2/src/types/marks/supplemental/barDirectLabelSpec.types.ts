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
import { ColorFacet, Orientation } from '../../specUtil.types';
import { DualFacet } from '../barSpec.types';

export interface BarDirectLabelOptions {
  // intentionally minimal for v1 — additional options (format, prefix, etc.) will be added later
}

export interface BarDirectLabelSpecOptions extends BarDirectLabelOptions {
  barName: string;
  color: ColorFacet | DualFacet;
  colorOverride?: string;
  colorScheme: ColorScheme;
  dimension: string;
  index: number;
  metric: string;
  metricAxis?: string;
  orientation: Orientation;
}
