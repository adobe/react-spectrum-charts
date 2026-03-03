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
import { JSXElementConstructor, ReactElement } from 'react';

export type LineDirectLabelValue = 'last' | 'average' | 'series';
export type LineDirectLabelPosition = 'start' | 'end';

export interface LineDirectLabelProps {
  /**
   * Value to display.
   * - 'last': value at last data point
   * - 'average': average of all values in the line
   * - 'series': series key/name
   * @default 'last'
   */
  value?: LineDirectLabelValue;
  /**
   * Where to place the label along the line.
   * - 'end': right side of the chart, y-positioned at the last data point
   * - 'start': left side of the chart, y-positioned at the first data point
   * @default 'end'
   */
  position?: LineDirectLabelPosition;
  /** Number format string (matches axis formatting). */
  format?: string;
  /** Text prepended to the value. */
  prefix?: string;
  /** Series values to exclude from labeling. */
  excludeSeries?: string[];
}

export type LineDirectLabelElement = ReactElement<
  LineDirectLabelProps,
  JSXElementConstructor<LineDirectLabelProps>
>;
