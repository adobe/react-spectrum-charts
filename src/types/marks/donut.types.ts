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
import { JSXElementConstructor, ReactElement } from 'react';

import { ChartPopoverElement, ChartPopoverOptions } from '../dialogs/chartPopover.types';
import { ChartTooltipElement, ChartTooltipOptions } from '../dialogs/chartTooltip.types';
import { Children } from '../util.types';
import { DonutSummaryElement, DonutSummaryOptions } from './supplemental/dountSummary.types';
import { SegmentLabelOptions } from './supplemental/segmentLabel.types';

export interface DonutOptions {
	markType: 'donut';

	/** Key in the data that is used as the color facet */
	color?: string;
	/** Ratio of the donut inner radius / donut outer radius. 0 is a pie chart. 0.85 is the default. */
	holeRatio?: number;
	/** Determines if the center metric should be displayed as a percent. if true, data should only be two data points, which sum to 1
	 * Also, if true, will display the first datapoint as a percent */
	isBoolean?: boolean;
	/** Key in the data that is used as the metric */
	metric?: string;
	/** Sets the name of the component. */
	name?: string;
	/** Start angle of the donut in radians (0 is top dead center, and default) */
	startAngle?: number;

	// children
	chartPopovers?: ChartPopoverOptions[];
	chartTooltips?: ChartTooltipOptions[];
	donutSummaries?: DonutSummaryOptions[];
	segmentLabels?: SegmentLabelOptions[];
}

export interface DonutProps
	extends Omit<DonutOptions, 'chartPopovers' | 'chartTooltips' | 'donutSummaries' | 'markType' | 'segmentLabels'> {
	children?: Children<ChartPopoverElement | ChartTooltipElement | DonutSummaryElement | SegmentLabelOptions>;
}

export type DonutElement = ReactElement<DonutProps, JSXElementConstructor<DonutProps>>;
