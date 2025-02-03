/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ReactNode } from 'react';

import { Trendline } from '@components/Trendline';
import { hasPopover_DEPRECATED, isInteractive } from '@specBuilder/marks/markUtils';
import { sanitizeMarkChildren } from '@utils';

import {
	BarAnnotationOptions,
	ChartPopoverOptions,
	ChartTooltipOptions,
	ClickableChartProps,
	ColorFacet,
	ColorScheme,
	DonutSummaryOptions,
	HighlightedItem,
	InteractionMode,
	LineTypeFacet,
	LineWidthFacet,
	MarkChildElement,
	MetricRangeOptions,
	OnClickCallback,
	OpacityFacet,
	ScaleType,
	ScatterPathOptions,
	SegmentLabelOptions,
	TrendlineOptions,
} from '../../types';

export const getInteractiveMarkName = (
	children: MarkChildElement[],
	name: string,
	highlightedItem?: HighlightedItem,
	props?: ClickableChartProps
): string | undefined => {
	// if the line has an interactive component, this line is the target for the interactive component
	if (isInteractive(children, props) || highlightedItem !== undefined) {
		return name;
	}
	// if there is a trendline with an interactive component on the line, then the trendline is the target for the interactive component
	if (
		children.some(
			(child) =>
				child.type === Trendline &&
				'children' in child.props &&
				isInteractive(sanitizeMarkChildren(child.props.children as ReactNode), props)
		)
	) {
		return `${name}Trendline`;
	}
};

export const getPopoverMarkName = (children: MarkChildElement[], name: string): string | undefined => {
	// if the line has a popover, this line is the target for the popover
	if (hasPopover_DEPRECATED(children)) {
		return name;
	}
	// if there is a trendline with a popover on this line, then the trendline is the target for the popover
	if (
		children.some(
			(child) =>
				child.type === Trendline &&
				'children' in child.props &&
				hasPopover_DEPRECATED(sanitizeMarkChildren(child.props.children as ReactNode))
		)
	) {
		return `${name}Trendline`;
	}
};

export interface LineMarkProps {
	children: MarkChildElement[];
	color: ColorFacet;
	colorScheme: ColorScheme;
	dimension: string;
	displayOnHover?: boolean;
	highlightedItem?: HighlightedItem;
	idKey: string;
	interactiveMarkName?: string; // optional name of the mark that is used for hover and click interactions
	isHighlightedByDimension?: boolean;
	isHighlightedByGroup?: boolean;
	lineType: LineTypeFacet;
	lineWidth?: LineWidthFacet;
	metric: string;
	metricAxis?: string;
	name: string;
	opacity: OpacityFacet;
	popoverMarkName?: string;
	scaleType: ScaleType;
	staticPoint?: string;
	interactionMode?: InteractionMode;
	onClick?: OnClickCallback;
}

export interface LineMarkOptions {
	barAnnotations?: BarAnnotationOptions[];
	chartPopovers?: ChartPopoverOptions[];
	chartTooltips?: ChartTooltipOptions[];
	color: ColorFacet;
	colorScheme: ColorScheme;
	dimension: string;
	displayOnHover?: boolean;
	donutSummaries?: DonutSummaryOptions[];
	hasOnClick?: boolean;
	highlightedItem?: HighlightedItem;
	idKey: string;
	interactiveMarkName?: string; // optional name of the mark that is used for hover and click interactions
	interactionMode?: InteractionMode;
	isHighlightedByDimension?: boolean;
	isHighlightedByGroup?: boolean;
	lineType: LineTypeFacet;
	lineWidth?: LineWidthFacet;
	metric: string;
	metricAxis?: string;
	metricRanges?: MetricRangeOptions[];
	name: string;
	opacity: OpacityFacet;
	popoverMarkName?: string;
	scaleType: ScaleType;
	scatterPaths?: ScatterPathOptions[];
	segmentLabels?: SegmentLabelOptions[];
	staticPoint?: string;
	trendlines?: TrendlineOptions[];
}
