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
import { Orientation } from '../specUtil.types';
import { LineOptions } from './lineSpec.types';

export type BigNumberNumberType = 'linear' | 'percentage';
export type BigNumberMethod = 'sum' | 'avg' | 'last';

export interface BigNumberOptions {
  markType: 'bigNumber';

  orientation: Orientation;
  label: string;
  dataKey: string;
  numberFormat?: string;
  numberType?: BigNumberNumberType;
  method?: BigNumberMethod;

  //children
  lines?: LineOptions[];
}
