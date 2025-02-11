/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { PartiallyRequired } from '../../specUtil.types';
import { DonutSpecOptions } from '../donutSpec.types';

export interface SegmentLabelOptions {
	/** Sets the key in the data that has the segment label. Defaults to the `color` key set on the `Donut` is undefined. */
	labelKey?: string;
	/** Shows the donut segment percentage */
	percent?: boolean;
	/** Shows the donut segment metric value */
	value?: boolean;
	/** d3 number format specifier.
	 * Sets the number format for the segment metric value.
	 *
	 * @default 'standardNumber'
	 *
	 * see {@link https://d3js.org/d3-format#locale_format}
	 */
	valueFormat?: string;
}

type SegmentLabelOptionsWithDefaults = 'percent' | 'value' | 'valueFormat';

export interface SegmentLabelSpecOptions
	extends PartiallyRequired<SegmentLabelOptions, SegmentLabelOptionsWithDefaults> {
	donutOptions: DonutSpecOptions;
}
