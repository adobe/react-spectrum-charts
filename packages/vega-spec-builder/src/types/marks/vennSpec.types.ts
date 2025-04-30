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
import { ChartData, ColorScheme, HighlightedItem } from 'types/chartSpec.types';
import { ChartPopoverOptions, ChartTooltipOptions } from 'types/dialogs';
import { SpectrumColor } from 'types/spectrumVizColor.types';
import { PartiallyRequired } from 'types/specUtil.types';

export interface VennOptions {
	markType: 'venn';
	/** Key in the data that is used as the color facet */
	color?: string;
	/** Key in the data that is used as the metric */
	metric?: string;
	/** orientation of the diagram in degrees */
	orientation?: VennDegreeOptions;
	/** key in data that is used for labels inside the sets and intersections*/
	label?: string;
	/** Sets the name of the component. */
	name?: string;

	style?: {
		/** font size of labels inside sets and intersections */
		fontSize?: number;
		/** color of the text inside the sets */
		color?: string;
		/** color of intersection when hovering over it */
		intersectionFill?: SpectrumColor | string;
		fontWeight?: 'lighter' | 'normal' | 'bolder' | 'bolder';
		/** padding around the venn diagram */
		padding?: number;
	};

  // children
	chartPopovers?: ChartPopoverOptions[];
	chartTooltips?: ChartTooltipOptions[];
}

type VennOptionsWithDefaults =
	| 'chartPopovers'
	| 'chartTooltips'
	| 'color'
	| 'label'
	| 'metric'
	| 'name'
	| 'orientation';

export interface VennSpecOptions extends PartiallyRequired<VennOptions, VennOptionsWithDefaults> {
	chartHeight: number;
	chartWidth: number;
	colorScheme: ColorScheme;
	data: ChartData[];
	highlightedItem?: HighlightedItem;
	idKey: string;
	index: number;
	markType: 'venn';
}

export type VennDegreeOptions = '0deg' | '90deg' | '180deg' | '270deg';
