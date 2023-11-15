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
import { JSXElementConstructor, ReactElement, ReactFragment, ReactNode } from 'react';

import { MARK_ID, SERIES_ID, TRENDLINE_VALUE } from '@constants';
import { Config, Data, FontWeight, Padding, Spec, SymbolShape } from 'vega';

import { Theme } from '@react-types/provider';

import { Colors, SpectrumColor } from './SpectrumVizColors';

export type ChartElement = ReactElement<ChartProps, JSXElementConstructor<ChartProps>>;
export type AreaElement = ReactElement<AreaProps, JSXElementConstructor<AreaProps>>;
export type AxisElement = ReactElement<AxisProps, JSXElementConstructor<AxisProps>>;
export type AxisAnnotationElement = ReactElement<AxisAnnotationProps, JSXElementConstructor<AxisAnnotationProps>>;
export type BarElement = ReactElement<BarProps, JSXElementConstructor<BarProps>>;
export type AnnotationElement = ReactElement<AnnotationProps, JSXElementConstructor<AnnotationProps>>;
export type LegendElement = ReactElement<LegendProps, JSXElementConstructor<LegendProps>>;
export type LineElement = ReactElement<LineProps, JSXElementConstructor<LineProps>>;
export type TitleElement = ReactElement<TitleProps, JSXElementConstructor<TitleProps>>;
export type ChartTooltipElement = ReactElement<ChartTooltipProps, JSXElementConstructor<ChartTooltipProps>>;
export type ChartPopoverElement = ReactElement<ChartPopoverProps, JSXElementConstructor<ChartPopoverProps>>;
export type ReferenceLineElement = ReactElement<ReferenceLineProps, JSXElementConstructor<ReferenceLineProps>>;
export type TrendlineElement = ReactElement<TrendlineProps, JSXElementConstructor<TrendlineProps>>;
export type MetricRangeElement = ReactElement<MetricRangeProps, JSXElementConstructor<MetricRangeProps>>;

export type SimpleData = { [key: string]: unknown };
export type ChartData = SimpleData | Data;

export interface SpecProps {
	// children is optional because it is a pain to make this required with how children get defined in stories
	// we have a check at the beginning of Chart to make sure this isn't undefined
	// if it is undefined, we log an error and render a fragment
	children?: Children<RscElement>;
	colors?: ChartColors;
	colorScheme?: ColorScheme; // spectrum color scheme
	description?: string; // chart description
	symbolShapes?: SymbolShapes;
	lineTypes?: LineTypes; // line types available for the chart
	lineWidths?: LineWidth[]; // line widths available for the chart
	opacities?: Opacities; // opacities available for the chart
	title?: string; // chart title
	UNSAFE_vegaSpec?: Spec; // vega spec to be used instead of the one generated the component API
	hiddenSeries?: string[]; // series names to hide from the chart
	highlightedSeries?: string; // series name to highlight
}

export interface SanitizedSpecProps extends SpecProps {
	children: ChartChildElement[];
	data?: ChartData[];
}

export type Orientation = 'vertical' | 'horizontal';
export type ChartColors = Colors | Colors[];
export type LineTypes = LineType[] | LineType[][];
export type Opacities = number[] | number[][];
export type SymbolShapes = ChartSymbolShape[] | ChartSymbolShape[][];
export type ChartSymbolShape = 'rounded-square' | SymbolShape;

export interface ChartProps extends SpecProps {
	backgroundColor?: string;
	config?: Config;
	data: ChartData[];
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

export interface BaseProps {
	name?: string;
}

export type Width = number | string | 'auto';

export interface ChartHandle {
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

export interface AxisProps extends BaseProps {
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

export interface MarkProps extends BaseProps {
	children?: Children<MarkChildElement>;
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
export type SymbolShapeFacet = FacetRef<ChartSymbolShape>;

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
	/** Padding between trellis groups; ratio between 0 and 1 (https://vega.github.io/vega/docs/scales/#band). Only applicable if `trellis` is also defined. Defaults to 0.2. */
	trellisPadding?: number;
	type?: BarType;
}

export type BarType = 'dodged' | 'stacked';

export interface LineProps extends Omit<MarkProps, 'color'> {
	color?: ColorFacet; // line color or key in the data that is used as the color facet
	dimension?: string; // data field that the value is trended against (x-axis)
	lineType?: LineTypeFacet; // line type or key in the data that is used as the line type facet
	opacity?: OpacityFacet; // opacity or key in the data that is used as the opacity facet
	/** sets the chart area padding, this is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear) */
	padding?: number;
	scaleType?: ScaleType; // sets the type of scale that should be used for the trend
	staticPoint?: string; // key in the data that if it exists and the value resolves to true for each data object, a point will be drawn for that data point on the line.
}

export type TitlePosition = 'start' | 'middle' | 'end';
export type TitleOrient = 'top' | 'bottom' | 'left' | 'right';

export interface TitleProps extends MarkProps {
	/** The title text */
	text: string;
	/** The title position */
	position?: TitlePosition;
	/** The title font weight */
	fontWeight?: FontWeight;
	/** The location of the title relative to the chart */
	orient?: TitleOrient;
}

export type LineType = 'solid' | 'dashed' | 'dotted' | 'dotDash' | 'shortDash' | 'longDash' | 'twoDash' | number[];

export type LineWidth = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

export type ScaleType = 'linear' | 'time' | 'point';
export type LegendDescription = { seriesName: string; description: string; title?: string };

export type LegendLabel = { seriesName: string | number; label: string; maxLength?: number };

export interface LegendProps extends BaseProps {
	/** color or key in the data that is used as the color facet for the symbols */
	color?: ColorFacet;
	/** series that should be hidden by default (uncontrolled) */
	defaultHiddenSeries?: string[];
	/** descriptions for each of the series */
	descriptions?: LegendDescription[];
	/** series names to hide from the legend */
	hiddenEntries?: string[];
	/** whether or not to include highlight interactions (controlled) */
	highlight?: boolean;
	/** allows the user to hide/show series by clicking on the legend entry (uncontrolled) */
	isToggleable?: boolean;
	/** labels for each of the series */
	legendLabels?: LegendLabel[];
	/** max characters before truncating a legend label */
	labelLimit?: number;
	/** line type or key in the data that is used as the line type facet for the symbols */
	lineType?: LineTypeFacet;
	/** line type or key in the data that is used as the line type facet for the symbols */
	lineWidth?: LineWidthFacet;
	/** callback that will be run when a legend item is selected */
	onClick?: (seriesName: string) => void;
	/** callback that will be run when mousing out of a legend item */
	onMouseOut?: (seriesName: string) => void;
	/** callback that will be run when mousing over a legend item */
	onMouseOver?: (seriesName: string) => void;
	/** opacity or key in the data that is used as the opacity facet for the symbols */
	opacity?: OpacityFacet;
	/** where the legend should be displayed */
	position?: Position;
	/** customize the legend symbol shape */
	symbolShape?: SymbolShapeFacet;
	/** legend title */
	title?: string;
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
	value: number | string;
	icon?: Icon | string;
	/** Position the line on the value, or between the previous/next value. Only supported in Bar visualizations. */
	position?: 'before' | 'after' | 'center';
	label?: string;
	labelFontWeight?: FontWeight;
}

export type Icon = 'date';

export interface MetricRangeProps {
	children?: Children<ChartTooltipElement>;
	/** The color of the metric line and range. If undefined, will default to the color of the series that it represents. */
	color?: SpectrumColor | string;
	/** The line type of the metric line. (dashed, solid, etc..) */
	lineType?: LineType;
	/** The line width of the metric line. */
	lineWidth?: LineWidth;
	/** The opacity of the area around the metric */
	rangeOpacity?: number;
	/** The key for the upper range in the data */
	metricEnd: string;
	/** The key for the lower range in the data */
	metricStart: string;
	/** The key for the metric value in the data */
	metric?: string;
	/** Whether the metric range should only be visible when hovering over the parent line */
	displayOnHover?: boolean;
	/** Boolean indicating whether or not the y-axis should expand to include the entire metric range (if necessary). */
	scaleAxisToFit?: boolean;
}

export interface TrendlineProps {
	children?: Children<ChartTooltipElement>;
	/** The line color of the trendline. If undefined, will default to the color of the series that it represents. */
	color?: SpectrumColor | string;
	/** The dimension range that the statistical transform should be calculated and drawn for. If the start or end values are null, then the dimension range will not be bounded. */
	dimensionRange?: [number | null, number | null];
	/** Whether the trendline should only be visible when hovering over the parent line */
	displayOnHover?: boolean;
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
}

export type TrendlineMethod =
	| 'average'
	| 'exponential'
	| 'linear'
	| 'logarithmic'
	| `movingAverage-${number}`
	| `polynomial-${number}`
	| 'power'
	| 'quadratic';

export type AxisAnnotationFormat = 'span' | 'summary';

export interface AxisAnnotationProps {
	children?: Children<AxisAnnotationChildElement>;
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
	options?: AxisAnnotationOptions[];
}

export type AxisAnnotationOptions = {
	/** The id of the annotation to apply these options to */
	id: string;
	/** The color of the icon and range lines  */
	color?: SpectrumColor | string;
};

export interface MarkBounds {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

export interface Datum {
	[MARK_ID]: number;
	[SERIES_ID]: string;
	[TRENDLINE_VALUE]?: number;
	[key: string]: unknown;
}

export type ColorScheme = 'light' | 'dark';

export type TooltipHandler = (datum: Datum) => ReactNode;

export type PopoverHandler = (datum: Datum, close: () => void) => ReactNode;

export type AxisAnnotationClickHandler = (annotations) => ReactNode;

export type Position = 'left' | 'right' | 'top' | 'bottom';

export type ChildElement<T> = T | string | boolean | ReactFragment;
export type Children<T> = ChildElement<T> | ChildElement<T>[];

export type AxisChildElement = ReferenceLineElement | AxisAnnotationElement;
export type AxisAnnotationChildElement = ChartTooltipElement | ChartPopoverElement;
export type ChartChildElement = AreaElement | AxisElement | BarElement | LegendElement | LineElement | TitleElement;
export type MarkChildElement =
	| AnnotationElement
	| ChartTooltipElement
	| ChartPopoverElement
	| MetricRangeElement
	| TrendlineElement;
export type RscElement = ChartChildElement | MarkChildElement;
