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
import { NumberFormat, PartiallyRequired } from '../../specUtil.types.js';
import { DonutSpecOptions } from '../donutSpec.types.js';

export interface DonutSummaryOptions {
  /** d3 number format specifier.
   * Sets the number format for the summary value.
   *
   * see {@link https://d3js.org/d3-format#locale_format}
   */
  numberFormat?: NumberFormat;
  /** Externally formatted center value, independent of hidden segments; shrinks to 12px before truncating. Overrides numeric formatting unless hideValue is true. Omit to format the metric as usual. */
  valueText?: string;
  /** Label for the metric summary */
  label?: string;
  /** Hides the value portion of the donut summary, only showing the label */
  hideValue?: boolean;
  /** Hides the label without changing the reported fit of the complete summary. Defaults to false. */
  hideLabel?: boolean;
  /** Extra space in pixels between the value and label. Defaults to 0. */
  labelGap?: number;
  /** Sentiment-colored delta (e.g. 0.025 renders as "+2.5%") shown below the label; hidden at XS/S for semicircles. */
  delta?: number;
}

type DonutSummaryOptionsWithDefaults = 'numberFormat' | 'hideValue';

export interface DonutSummarySpecOptions
  extends PartiallyRequired<DonutSummaryOptions, DonutSummaryOptionsWithDefaults> {
  donutOptions: DonutSpecOptions;
}
