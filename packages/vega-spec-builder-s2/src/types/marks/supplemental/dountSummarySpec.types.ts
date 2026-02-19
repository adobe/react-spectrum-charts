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
import { NumberFormat, PartiallyRequired } from '../../specUtil.types';
import { DonutSpecOptions } from '../donutSpec.types';

export interface DonutSummaryOptions {
  /** d3 number format specifier.
   * Sets the number format for the summary value.
   *
   * see {@link https://d3js.org/d3-format#locale_format}
   */
  numberFormat?: NumberFormat;
  /** Label for the metric summary */
  label?: string;
}

type DonutSummaryOptionsWithDefaults = 'numberFormat';

export interface DonutSummarySpecOptions
  extends PartiallyRequired<DonutSummaryOptions, DonutSummaryOptionsWithDefaults> {
  donutOptions: DonutSpecOptions;
}
