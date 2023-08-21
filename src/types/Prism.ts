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

import { Theme } from '@react-types/provider';
import { JSXElementConstructor, ReactElement, ReactFragment, ReactNode } from 'react';
import { Config, Data, FontWeight, Padding, Spec, SymbolShape } from 'vega';

import { Colors, SpectrumColor } from './SpectrumVizColors';

export type PrismElement = ReactElement<PrismProps, JSXElementConstructor<PrismProps>>;
export type AreaElement = ReactElement<AreaProps, JSXElementConstructor<AreaProps>>;
export type AxisElement = ReactElement<AxisProps, JSXElementConstructor<AxisProps>>;
export type BarElement = ReactElement<BarProps, JSXElementConstructor<BarProps>>;
export type AnnotationElement = ReactElement<AnnotationProps, JSXElementConstructor<AnnotationProps>>;
export type LegendElement = ReactElement<LegendProps, JSXElementConstructor<LegendProps>>;
export type LineElement = ReactElement<LineProps, JSXElementConstructor<LineProps>>;
export type ChartTooltipElement = ReactElement<ChartTooltipProps, JSXElementConstructor<ChartTooltipProps>>;
export type ChartPopoverElement = ReactElement<ChartPopoverProps, JSXElementConstructor<ChartPopoverProps>>;
export type ReferenceLineElement = ReactElement<ReferenceLineProps, JSXElementConstructor<ReferenceLineProps>>;
export type TrendlineElement = ReactElement<TrendlineProps, JSXElementConstructor<TrendlineProps>>;

export type SimpleData = { [key: string]: unknown };
export type PrismData = SimpleData | Data;

export interface SpecProps {
	// children is optional because it is a pain to make this required with how children get defined in stories
	// we have a check at the beginning of Prism to make sure this isn't undefined
	// if it is undefined, we log an error and render a fragment
	children?: Children<PrismChildElement>;
	colors?: PrismColors;
	colorScheme?: ColorScheme; // spectrum color scheme
	description?: string; // chart description
	symbolShapes?: SymbolShapes;
	lineTypes?: LineTypes; // line types available for the chart
	lineWidths?: LineWidth[]; // line widths available for the chart
	opacities?: Opacities; // opacities available for the chart
	title?: string; // chart title
	UNSAFE_vegaSpec?: Spec; // vega spec to be used instead of the one generated the component API
}

export interface SanitizedSpecProps extends SpecProps {
	children: ChartChildElement[];
	data?: PrismData[];
}

export type Orientation = 'vertical' | 'horizontal';
export type PrismColors = Colors | Colors[];
export type LineTypes = LineType[] | LineType[][];
export type Opacities = number[] | number[][];
export type SymbolShapes = PrismSymbolShape[] | PrismSymbolShape[][];
export type PrismSymbolShape = 'rounded-square' | SymbolShape;

export interface PrismProps extends SpecProps {
	backgroundColor?: string;
	config?: Config;
	data: PrismData[];
	debug?: boolean;
	height?: number;
	maxWidth?: number;
	minWidth?: number;
	padding?: Padding;
	renderer?: 'svg' | 'canvas';
	theme?: Theme;
	width?: Width; // strings must be in a valid percent format ex. '50%'
	dataTestId?: string;
	loading?: boolean;
}

export type Width = number | string | 'auto';

export interface PrismHandle {
	copy: () => Promise<string>;
	download: (customFileName?: string) => Promise<string>;
}

export interface AreaProps extends MarkProps {
	dimension?: string; // data field that the metric is trended against (x-axis for horizontal orientation)
	order?: string; // optional field used to set the stack order of the area (higher order = stacked on top/right)
	opacity?: number; // optional field used to set the area opacity
	/** sets the chart area padding, this is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear) */
	padding?: number;
	scaleType?: ScaleType; // sets the type of scale that should be used for the trend

	// define area using start/end
	metricStart?: string; // data field for the start of the area
	metricEnd?: string; // data field for the end of the area
}

export interface AxisProps {
	/** Sets the where the axis is placed on the chart */
	position: Position;
	/** Adds a baseline rule for this axis */
	baseline?: boolean;
	/**
	 * Adds an offset to the baseline.
	 * If basline is false then this prop is ignored.
	 * If baseline is drawn relative to a categorical axis, this prop is ignored
	 */
	baselineOffset?: number;
	/** Child components that add supplemental content to the axis */
	children?: Children<AxisChildElement>;
	/** Sets the granularity of the primary axis labels for time axis. If this axis is not for a time axis, this prop is ignored. */
	granularity?: Granularity;
	/** Displays gridlines at each tick location */
	grid?: boolean;
	/** Hides the axis labels. If labels have been explicitly added using the `labels` prop, these will still be visible */
	hideDefaultLabels?: boolean;
	/** Sets the alignment of axis labels */
	labelAlign?: LabelAlign;
	/** Sets the font weight of axis labels */
	labelFontWeight?: FontWeight;
	/** Sets the format of the axis labels */
	labelFormat?: LabelFormat;
	/** Explicityly sets the axis labels (controlled). Providing a Label object allows for more control over the label display. */
	labels?: (Label | string | number)[];
	/** The minimum and maximum values for the axis, for example: `[-10, 10]`.
	 *
	 * Note: This prop is only supported for axes with `linear` or `time` scale types.
	 */
	range?: [number, number];
	/** Adds sublabels below the axis lables */
	subLabels?: SubLabel[];
	/** Displays ticks at each label location */
	ticks?: boolean;
	/**
	 * The minimum desired step between axis ticks, in terms of scale domain values.
	 * For example, a value of 1 indicates that ticks should not be less than 1 unit apart.
	 * https://vega.github.io/vega/docs/axes/
	 *
	 * Note: This prop is only supported for linear axes.
	 */
	tickMinStep?: number;
	/** Sets the axis title */
	title?: string;
}

export type Granularity = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter';
/**
 * `center` will set the align to `center` for horizontal axes and the baseline to `middle` for vertical axes.
 *
 * `start` will set the align to `left` for horizontal axes and the baseline to `top` for vertical axes.
 *
 * `end` will set the align to `right` for horizontal axes and the baseline to `bottom` for vertical axes.
 */
export type LabelAlign = 'center' | 'start' | 'end';
export type LabelFormat = 'linear' | 'percentage' | 'time';
export type Label = {
	/** The axis value that this label is anchored to */
	value: string | number;
	/** Sets the display value of the label, if undefined, the value will be the label */
	label?: string;
	/** Alignment of the label, defaults to center */
	align?: LabelAlign;
	/** Font weight of the label, defaults to normal */
	fontWeight?: FontWeight;
};
export type SubLabel = {
	/** The axis value that this sublabel is anchored to */
	value: string | number;
	/** The display value of the sublabel */
	subLabel: string;
	/** Alignment of the label, defaults to center */
	align?: LabelAlign;
	/** Font weight of the label, defaults to normal */
	fontWeight?: FontWeight;
};

export interface MarkProps {
	children?: Children<MarkChildElement>;
	name?: string;
	color?: string;
	metric?: string;
}

export type StaticValue<T> = { value: T };

export type FacetType = 'color' | 'lineType' | 'lineWidth' | 'opacity' | 'symbolShape' | 'symbolSize';

export type SecondaryFacetType =
	| 'secondaryColor'
	| 'secondaryLineType'
	| 'secondaryLineWidth'
	| 'secondaryOpacity'
	| 'secondarySymbolShape'
	| 'secondarySymbolSize';

export type FacetRef<T> = string | StaticValue<T>;

export type ColorFacet = FacetRef<string | SpectrumColor>;
export type LineTypeFacet = FacetRef<LineType>;
export type LineWidthFacet = FacetRef<LineWidth>;
export type OpacityFacet = FacetRef<number>;
export type SymbolShapeFacet = FacetRef<PrismSymbolShape>;

export type DualFacet = [string, string]; // two keys used for a secondary facet on Bar charts

export interface AnnotationProps extends MarkProps {
	textKey?: string;
	style?: AnnotationStyleProps;
}

export interface AnnotationStyleProps extends MarkProps {
	width?: number;
}

export interface BarProps extends Omit<MarkProps, 'color'> {
	color?: ColorFacet | DualFacet; // bar color or key in the data that is used as the color facet
	dimension?: string; // data field used for the bar categories (x-axis for a vertical bar)
	groupedPadding?: number; // sets the inner padding between bars in a group
	lineType?: LineTypeFacet | DualFacet; // line type or key in the data that is used as the line type facet
	lineWidth?: LineWidth; // border width of the bar
	order?: string; // optional field used to set the stack order of the bar (higher order = higher on bar)
	/** The direction of the bars. Defaults to "vertical". */
	orientation?: Orientation;
	opacity?: OpacityFacet | DualFacet; // opacity or key in the data that is used as the opacity facet
	paddingRatio?: number; // sets inner padding (https://vega.github.io/vega/docs/scales/#band)
	/** sets the chart area padding, this is a ratio between 0 and 1 (https://vega.github.io/vega/docs/scales/#band) */
	paddingOuter?: number;
	/** The data field used for the trellis categories */
	trellis?: string; 
	/** Orientation of the trellis. Only applicable if `trellis` is also defined. Defaults to "horizontal". */
	trellisOrientation?: Orientation;
	type?: BarType;
}

export type BarType = 'dodged' | 'stacked';

export interface LineProps extends Omit<MarkProps, 'color'> {
	color?: ColorFacet; // line color or key in the data that is used as the color facet
	dimension?: string; // data field that the value is trended against (x-axis)
	highlightPoints?: string; // key the the data that if it exists and the value resolves to true, that point will be displayed as a circle
	lineType?: LineTypeFacet; // line type or key in the data that is used as the line type facet
	opacity?: OpacityFacet; // opacity or key in the data that is used as the opacity facet
	/** sets the chart area padding, this is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear) */
	padding?: number;
	scaleType?: ScaleType; // sets the type of scale that should be used for the trend
}

export type LineType = 'solid' | 'dashed' | 'dotted' | 'dotDash' | 'shortDash' | 'longDash' | 'twoDash' | number[];

export type LineWidth = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

export type ScaleType = 'linear' | 'time' | 'point';
export type LegendDescription = { seriesName: string; description: string };

export type LegendLabel = { seriesName: string | number; label: string };

export interface LegendProps {
	color?: ColorFacet; // color or key in the data that is used as the color facet for the symbols
	descriptions?: LegendDescription[]; // descriptions for each of the series
	highlight?: boolean; // whether or not to include highlight interactions
	hiddenEntries?: string[]; // series names to hide from the legend
	legendLabels?: LegendLabel[]; // labels for each of the series
	lineType?: LineTypeFacet; // line type or key in the data that is used as the line type facet for the symbols
	lineWidth?: LineWidthFacet; // line type or key in the data that is used as the line type facet for the symbols
	opacity?: OpacityFacet; // opacity or key in the data that is used as the opacity facet for the symbols
	position?: Position; // where the legend should be displayed
	symbolShape?: string | StaticValue<PrismSymbolShape>;
	title?: string; // legend title
}

export type DialogProps = ChartTooltipProps | ChartPopoverProps;

export interface ChartTooltipProps {
	children?: TooltipHandler;
}
export interface ChartPopoverProps {
	children?: PopoverHandler;
	width?: number;
}

export interface ReferenceLineProps {
	value: number;
	icon?: Icon | string;
}

export type Icon = 'date';

export interface TrendlineProps {
	children?: Children<ChartTooltipElement>;
	/** The line color of the trendline. If undefined, will default to the color of the series that it represents. */
	color?: SpectrumColor | string;
	/** The dimension range that the statistical transform should be calculated and drawn for. If the start or end values are null, then the dimension range will not be bounded. */
	dimensionRange?: [number | null, number | null];
	/** If there is a tooltip on this trendline, then this will highlight the raw point in addition to the hovered trendline point. */
	highlightRawPoint?: boolean;
	/** The line type of the trend line. */
	lineType?: LineType;
	/** The line width of the trend line. */
	lineWidth?: LineWidth;
	/** The type of statistical transform that will be calculated. */
	method?: TrendlineMethod;
	/** The opacity of the trendlines */
	opacity?: number;
	/** If the method is set to moving average, rollingWindow sets the width of the moving window used. */
	rollingWindow?: number;
}

export type TrendlineMethod = 'average' | 'linear' | 'movingAverage';

export interface MarkBounds {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

export interface Datum {
	prismMarkId: number;
	prismSeriesId: string;
	prismTrendlineValue?: number;
	[key: string]: unknown;
}

export type ColorScheme = 'light' | 'dark';

export type TooltipHandler = (datum: Datum) => ReactNode;

export type PopoverHandler = (datum: Datum, close: () => void) => ReactNode;

export type Position = 'left' | 'right' | 'top' | 'bottom';

export type ChildElement<T> = T | string | boolean | ReactFragment;
export type Children<T> = ChildElement<T> | ChildElement<T>[];

export type AxisChildElement = ReferenceLineElement;
export type ChartChildElement = AxisElement | BarElement | LegendElement | LineElement;
export type MarkChildElement = AnnotationElement | ChartTooltipElement | ChartPopoverElement | TrendlineElement;
export type PrismChildElement = ChartChildElement | MarkChildElement;
