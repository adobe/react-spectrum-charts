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
import { PartiallyRequired } from '../specUtil.types';

export interface ChartTooltipOptions {
	/** The keys in the data that will disable the tooltip if they have truthy values */
	excludeDataKeys?: string[];
	/** Sets which marks should be highlighted when a tooltip is visible */
	highlightBy?: 'series' | 'dimension' | 'item' | string[];
}

type ChartTooltipOptionsWithDefaults = 'highlightBy';

export interface ChartTooltipSpecOptions
	extends PartiallyRequired<ChartTooltipOptions, ChartTooltipOptionsWithDefaults> {
	markName: string;
}
