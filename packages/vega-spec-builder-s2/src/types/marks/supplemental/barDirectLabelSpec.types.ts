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
import { NumberFormat, Orientation } from '../../specUtil.types.js';

export type BarDirectLabelPositionType = 'start' | 'middle' | 'end' | 'end-outside';

/** What to do with a label that doesn't fit inside its bar. */
export type BarDirectLabelOverflow = 'hide' | 'spill';

export interface BarDirectLabelOptions {
  position?: BarDirectLabelPositionType;
  /** Number format for the label value — a named preset or custom d3-format specifier. @default ',.2~f' */
  format?: NumberFormat;
  /**
   * Data key that selects which bars get a label; only rows where this field is truthy are labeled.
   */
  dataKey?: string;
  /**
   * Inside positions: `hide` hides labels that don't fit inside the bar, `spill` moves them outside the bar tip.
   * Outside labels are hidden if they would overlap a bar or another label.
   * @default 'spill' for `start`, otherwise 'hide'
   */
  overflow?: BarDirectLabelOverflow;
}

export interface BarDirectLabelSpecOptions extends BarDirectLabelOptions {
  barName: string;
  format: NumberFormat;
  index: number;
  metric: string;
  orientation: Orientation;
  overflow: BarDirectLabelOverflow;
  position: BarDirectLabelPositionType;
}
