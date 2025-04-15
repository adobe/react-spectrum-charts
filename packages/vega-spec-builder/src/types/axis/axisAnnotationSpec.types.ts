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
import { ColorScheme } from '../chartSpec.types';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types';
import { ChartTooltipOptions } from '../dialogs/chartTooltipSpec.types';
import { PartiallyRequired } from '../specUtil.types';
import { SpectrumColor } from '../spectrumVizColor.types';

export type AxisAnnotationFormat = 'span' | 'summary';

export type Option = {
	/** The id of the annotation to apply these options to */
	id: string;
	/** The color of the icon and range lines  */
	color?: SpectrumColor | string;
};
export interface AxisAnnotationOptions {
	/** the color to use for the annotation icon and span lines if a color isn't specified in options or multiple annotations fall in the same icon */
	color?: SpectrumColor | string;
	/** data field where the annotation ids are listed for each data point */
	dataKey?: string;
	/** show annotations as a horizontal span of icons or a single summary icon */
	format?: AxisAnnotationFormat;
	/** unique name for this annotation */
	name?: string;
	/** how far from the bottom of the chart do the annotations display */
	offset?: number;
	/** options specific to each annotation in the data */
	options?: Option[];

	// children
	chartPopovers?: ChartPopoverOptions[];
	chartTooltips?: ChartTooltipOptions[];
}

type AxisAnnotationOptionsWithDefaults =
	| 'chartPopovers'
	| 'chartTooltips'
	| 'color'
	| 'dataKey'
	| 'format'
	| 'name'
	| 'offset'
	| 'options';

export interface AxisAnnotationSpecOptions
	extends PartiallyRequired<AxisAnnotationOptions, AxisAnnotationOptionsWithDefaults> {
	axisName: string;
	colorScheme: ColorScheme;
}
