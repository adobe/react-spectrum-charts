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

export type TitlePosition = 'start' | 'middle' | 'end';
export type TitleOrient = 'top' | 'bottom' | 'left' | 'right';

export interface TitleOptions {
  /** The title text */
  text: string;
  /** The title position */
  position?: TitlePosition;
  /** The title font weight */
  fontWeight?: FontWeight;
  /** The title font size */
  fontSize?: number;
  /** The location of the title relative to the chart */
  orient?: TitleOrient;
}
