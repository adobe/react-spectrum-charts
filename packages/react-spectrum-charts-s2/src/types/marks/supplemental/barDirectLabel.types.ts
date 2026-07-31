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

export type BarDirectLabelPosition = 'start' | 'middle' | 'end' | 'end-outside';

export interface BarDirectLabelProps {
  /**
   * Where to place the label relative to the bar.
   * - 'end-outside': outside the bar tip (default)
   * - 'end': inside the bar, 8px from the tip
   * - 'middle': centered within the bar
   * - 'start': inside the bar, 8px from the baseline edge
   * @default 'end-outside'
   */
  position?: BarDirectLabelPosition;
}

export type BarDirectLabelElement = ReactElement<
  BarDirectLabelProps,
  JSXElementConstructor<BarDirectLabelProps>
>;
