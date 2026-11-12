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

export interface TrendlineAnnotationOptions {
  /** Adds a badge around the annotation */
  badge?: boolean;
  /** Where along the trendline to place the label: `start`, `end`, or a `dimension` value. */
  dimensionValue?: number | 'start' | 'end';
  /** d3 number format specifier. Only valid if labelFormat is linear or undefined.
   *
   * @see https://d3js.org/d3-format#locale_format
   */
  numberFormat?: string;
  /** Text shown before the trendline value. */
  prefix?: string;
}
