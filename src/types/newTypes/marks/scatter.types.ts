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
import { ColorFacet, LineTypeFacet, LineWidthFacet, OpacityFacet, ScaleType, SymbolSizeFacet } from '../util.types';
import { Children } from '../util.types';
import { ScatterPathElement, ScatterPathOptions } from './supplemental/scatterPath.types';
import { TrendlineElement, TrendlineOptions } from './supplemental/trendline.types';

export interface ScatterOptions {
	markType: 'scatter';

	/** Sets the name of the component. */
	name?: string;
	/** Key in the data that is used as the metric */
	metric?: string;
	/**
	 * point fill and stroke color
	 * uses a key in the data that will map to the color scale or a static color value
	 */
	color?: ColorFacet;
	/**
	 * type of color scale that should be used for the points
	 * use ordinal if the key used for `color` maps to string values ('UT', 'CA', 'NY', etc.)
	 * use linear if the key used for `color` maps to numeric values (0, 1, 2, etc.)
	 */
	colorScaleType?: 'linear' | 'ordinal';
	/** data key for the x-axis */
	dimension?: string;
	/** scale type of the x-axis
	 * see https://vega.github.io/vega/docs/scales/#types for more information
	 */
	dimensionScaleType?: ScaleType;
	/**
	 * line type of the point border
	 * uses a key in the data that will map to the line type scale or a static line type value
	 */
	lineType?: LineTypeFacet;
	/**
	 * line width of the point border
	 * uses a key in the data that will map to the line width scale or a static line width value
	 */
	lineWidth?: LineWidthFacet;
	/**
	 * point fill and stroke opacity
	 * uses a key in the data that will map to the opacity scale or a opacity value
	 */
	opacity?: OpacityFacet;
	/**
	 * point size
	 * uses a key in the data that will map to the size scale (linear) or a static size value
	 */
	size?: SymbolSizeFacet;

	//children
	chartPopovers?: ChartPopoverOptions[];
	chartTooltips?: ChartTooltipOptions[];
	scatterPaths?: ScatterPathOptions[];
	trendlines?: TrendlineOptions[];
}

export interface ScatterProps
	extends Omit<ScatterOptions, 'chartPopovers' | 'chartTooltips' | 'markType' | 'scatterPaths' | 'trendlines'> {
	children?: Children<ChartPopoverElement | ChartTooltipElement | ScatterPathElement | TrendlineElement>;
}

export type ScatterElement = ReactElement<ScatterProps, JSXElementConstructor<ScatterProps>>;
