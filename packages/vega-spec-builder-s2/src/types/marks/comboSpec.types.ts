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
import { BarOptions } from './barSpec.types.js';
import { LineOptions } from './lineSpec.types.js';

export interface ComboOptions {
  markType: 'combo';

  /** Data field for the x-axis, used by child marks that don't set their own `dimension`. Defaults to `datetime`. */
  dimension?: string;
  /** Prefix for child mark names, like `combo0Bar0`. Defaults to `combo0`. */
  name?: string;

  // children
  marks?: (BarOptions | LineOptions)[];
}
