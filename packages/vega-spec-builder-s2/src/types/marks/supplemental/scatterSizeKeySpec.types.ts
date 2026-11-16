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
import { Position } from '../../specUtil.types.js';

export interface ScatterSizeKeyOptions {
  /** Heading shown above the size key, usually the name of the size field. */
  title?: string;
  /** Side of the plot the key is placed on. Defaults to `right`. */
  position?: Position;
  /** Lays the circles out in a row or a column. Defaults to `vertical` on the left or right, `horizontal` on the top or bottom. */
  direction?: 'horizontal' | 'vertical';
}
