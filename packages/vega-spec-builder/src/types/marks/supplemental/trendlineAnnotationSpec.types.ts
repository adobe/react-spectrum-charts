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
import { ColorScheme } from '../../chartSpec.types';
import { ColorFacet, Orientation, PartiallyRequired, ScaleType } from '../../specUtil.types';
import { TrendlineSpecOptions } from './trendlineSpec.types';

export interface TrendlineAnnotationOptions {
	/** Adds a badge around the annotation */
	badge?: boolean;
	/** where along the dimension scale to label the trendline value */
	dimensionValue?: number | 'start' | 'end';
	/** d3 number format specifier. Only valid if labelFormat is linear or undefined.
	 *
	 * @see https://d3js.org/d3-format#locale_format
	 */
	numberFormat?: string;
	/** text that will be prepended to the trendline value */
	prefix?: string;
}

type TrendlineAnnotationOptionsWithDefaults = 'badge' | 'dimensionValue' | 'numberFormat' | 'prefix';

export interface TrendlineAnnotationSpecOptions
	extends PartiallyRequired<TrendlineAnnotationOptions, TrendlineAnnotationOptionsWithDefaults> {
	colorScheme: ColorScheme;
	displayOnHover: boolean;
	markName: string;
	name: string;
	trendlineColor: ColorFacet;
	trendlineDimension: string;
	trendlineDimensionExtent: TrendlineSpecOptions['dimensionExtent'];
	trendlineDimensionScaleType: ScaleType;
	trendlineName: string;
	trendlineOrientation: Orientation;
	trendlineWidth: number;
}
