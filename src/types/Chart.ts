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
import { JSXElementConstructor, MutableRefObject, ReactElement, ReactFragment, ReactNode } from 'react';

import { MARK_ID, SERIES_ID, TRENDLINE_VALUE } from '@constants';
import { Config, Data, FontWeight, Locale, NumberLocale, Padding, Spec, SymbolShape, TimeLocale, View } from 'vega';

import { Theme } from '@react-types/provider';

import { Colors, SpectrumColor } from './SpectrumVizColors';
import { LocaleCode, NumberLocaleCode, TimeLocaleCode } from './locales';

export type AnnotationElement = ReactElement<AnnotationProps, JSXElementConstructor<AnnotationProps>>;
export type AreaElement = ReactElement<AreaProps, JSXElementConstructor<AreaProps>>;
export type AxisElement = ReactElement<AxisProps, JSXElementConstructor<AxisProps>>;
export type AxisAnnotationElement = ReactElement<AxisAnnotationProps, JSXElementConstructor<AxisAnnotationProps>>;
export type BarElement = ReactElement<BarProps, JSXElementConstructor<BarProps>>;
export type ChartElement = ReactElement<ChartProps, JSXElementConstructor<ChartProps>>;
export type ChartPopoverElement = ReactElement<ChartPopoverProps, JSXElementConstructor<ChartPopoverProps>>;
export type ChartTooltipElement = ReactElement<ChartTooltipProps, JSXElementConstructor<ChartTooltipProps>>;
export type DonutElement = ReactElement<DonutProps, JSXElementConstructor<DonutProps>>;
export type LegendElement = ReactElement<LegendProps, JSXElementConstructor<LegendProps>>;
export type LineElement = ReactElement<LineProps, JSXElementConstructor<LineProps>>;
export type ScatterPathElement = ReactElement<ScatterPathProps, JSXElementConstructor<ScatterPathProps>>;
export type MetricRangeElement = ReactElement<MetricRangeProps, JSXElementConstructor<MetricRangeProps>>;
export type ReferenceLineElement = ReactElement<ReferenceLineProps, JSXElementConstructor<ReferenceLineProps>>;
export type ScatterElement = ReactElement<ScatterProps, JSXElementConstructor<ScatterProps>>;
export type TitleElement = ReactElement<TitleProps, JSXElementConstructor<TitleProps>>;
export type TrendlineAnnotationElement = ReactElement<
	TrendlineAnnotationProps,
	JSXElementConstructor<TrendlineAnnotationProps>
>;
export type TrendlineElement = ReactElement<TrendlineProps, JSXElementConstructor<TrendlineProps>>;

export type SimpleData = { [key: string]: unknown };
export type ChartData = SimpleData | Data;

export interface SpecProps {
	/** Background color of the chart. */
	backgroundColor?: string;
	// children is optional because it is a pain to make this required with how children get defined in stories
	// we have a check at the beginning of Chart to make sure this isn't undefined
	// if it is undefined, we log an error and render a fragment
	children?: Children<RscElement>;
	/** Color scale. Defaults to the `categorical16' color scale. */
	colors?: ChartColors;
	/** react-spectrum color scheme. @see https://react-spectrum.adobe.com/react-spectrum/Provider.html#props */
	colorScheme?: ColorScheme;
	/** Chart description. Sets the aria-label attribute for the chart container. @see https://vega.github.io/vega/docs/specification/ */
	description?: string;
	/** Symbol shape scale. */
	symbolShapes?: SymbolShapes;
	/** Symbol size scale. Values define the min and max size in that order. */
	symbolSizes?: [SymbolSize, SymbolSize];
	/** Line type scale. */
	lineTypes?: LineTypes;
	/** Line width scale. */
	lineWidths?: LineWidth[];
	/** Opacity scale*/
	opacities?: Opacities;
	/** Chart title. If the `Title` component is provided as a child, the component will override this prop. */
	title?: string;
	/** Vega spec to be used instead of generating one using the component API. */
	UNSAFE_vegaSpec?: Spec;
	/** Series names to hide from the chart (controlled). */
	hiddenSeries?: string[];
	/** Series name to highlight on the chart (controlled). */
	highlightedSeries?: string;
}

export interface SanitizedSpecProps extends SpecProps {
	/** Children with all non-RSC components removed */
	children: ChartChildElement[];
	data?: ChartData[];
}

export type Orientation = 'vertical' | 'horizontal';
export type ChartColors = Colors | Colors[];
export type LineTypes = LineType[] | LineType[][];
export type Opacities = number[] | number[][];
export type SymbolShapes = ChartSymbolShape[] | ChartSymbolShape[][];
export type ChartSymbolShape = 'rounded-square' | SymbolShape;
export type NumberFormat = 'currency' | 'shortCurrency' | 'shortNumber' | 'standardNumber';

export interface SharedChartProps extends SpecProps {
	/** Vega config that can be used to tweak the style of the chart. @see https://vega.github.io/vega/docs/config/ */
	config?: Config;
	/** Chart data array. */
	data: ChartData[];
	/** Enables debug mode which will console log things like the generated vega spec and the datums for tooltips. */
	debug?: boolean;
	/** Number and time locales to use */
	locale?: Locale | LocaleCode | { number?: NumberLocaleCode | NumberLocale; time?: TimeLocaleCode | TimeLocale };
	/** Chart padding */
	padding?: Padding;
	/** Method to use for rendering the chart. 'canvas' is ideal for large data sets. */
	renderer?: 'svg' | 'canvas';
}

export interface RscChartProps extends SharedChartProps {
	chartId: MutableRefObject<string>;
	chartView: MutableRefObject<View | undefined>;
	chartWidth: number;
	chartHeight: number;
	popoverIsOpen?: boolean;
}

export interface ChartProps extends SharedChartProps {
	/** Test id */
	dataTestId?: string;
	/** Optional text to display when the data set is empty and loading is complete. */
	emptyStateText?: string;
	/** Loading state. If true, a spinner will render in place of the chart. */
	loading?: boolean;
	/** Maximum chart width */
	maxWidth?: number;
	/** Minimum chart width. */
	minWidth?: number;
	/** Chart height */
	height?: Height;
	/** Maximum height of the chart */
	maxHeight?: number;
	/** Minimum height of the chart */
	minHeight?: number;
	/** react-spectrum theme. This sets the react-spectrum theming on tooltips and popovers. */
	theme?: Theme;
	/** Chart width */
	width?: Width;
}

export interface BaseProps {
	/** Sets the name of the component. */
	name?: string;
}

export type Width = number | string | 'auto';
export type Height = number | `${number}%`;

export interface ChartHandle {
	copy: () => Promise<string>;
	download: (customFileName?: string) => Promise<string>;
	getBase64Png: () => Promise<string>;
	getSvg: () => Promise<string>;
}

export interface AreaProps extends MarkProps {
	/** Data field that the metric is trended against (x-axis for horizontal orientation) */
	dimension?: string;
	/** Optional field used to set the stack order of the area (higher order = stacked on top/right) */
	order?: string;
	/** Optional field used to set the area opacity */
	opacity?: number;
	/** Sets the horizontal padding, this is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear) */
	padding?: number;
	/** Sets the type of scale that should be used for the trend */
	scaleType?: ScaleType;

	// define area using start/end
	/** Data field for the start of the area */
	metricStart?: string;
	/** Data field for the end of the area */
	metricEnd?: string;
}

export interface DonutProps extends MarkProps {
	/** Text label for the metric total */
	metricLabel?: string;
	/** The datum property for segments of the data */
	segment?: string;
	/** Start angle of the donut in radians (0 is top dead center, and default) */
	startAngle?: number;
	/** Ratio of the donut inner radius / donut outer radius. 0 is a pie chart. 0.85 is the default. */
	holeRatio?: number;
	/** Determines if it should display direct labels. If true, must also supply 'segment' prop. Default is false */
	hasDirectLabels?: boolean;
	/** Determines if the center metric should be displayed as a percent. if true, data should only be two data points, which sum to 1
	 * Also, if true, will display the first datapoint as a percent */
	isBoolean?: boolean;
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
	/** Sets the orientation of the label. Defaults to horizontal. */
	labelOrientation?: Orientation;
	/** Explicityly sets the axis labels (controlled). Providing a Label object allows for more control over the label display. */
	labels?: (Label | string | number)[];
	/** d3 number format specifier. Only valid if labelFormat is linear or undefined.
	 *
	 * see {@link https://d3js.org/d3-format#locale_format}
	 */
	numberFormat?: NumberFormat | string;
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
	/** If the text is wider than the bandwidth that is labels, it will be truncated so that it stays within that bandwidth. */
	truncateLabels?: boolean;
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
export type LabelFormat = 'duration' | 'linear' | 'percentage' | 'time';
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
	/** Key in the data that is used as the color facet */
	color?: string;
	/** Key in the data that is used as the metric */
	metric?: string;
}

export type StaticValue<T> = { value: T };

export type FacetType =
	| 'color'
	| 'linearColor'
	| 'lineType'
	| 'lineWidth'
	| 'opacity'
	| 'symbolShape'
	| 'symbolSize'
	| 'symbolPathWidth';

export type SecondaryFacetType =
	| 'secondaryColor'
	| 'secondaryLineType'
	| 'secondaryLineWidth'
	| 'secondaryOpacity'
	| 'secondarySymbolShape'
	| 'secondarySymbolSize'
	| 'secondarySymbolPathWidth';

export type FacetRef<T> = string | StaticValue<T>;

export type ColorFacet = FacetRef<string | SpectrumColor>;
export type LineTypeFacet = FacetRef<LineType>;
export type LineWidthFacet = FacetRef<LineWidth>;
export type OpacityFacet = FacetRef<number>;
export type PathWidthFacet = FacetRef<PathWidth>;
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
	/** Bar color or key in the data that is used as the color facet */
	color?: ColorFacet | DualFacet;
	/** Data field used for the bar categories (x-axis for a vertical bar) */
	dimension?: string;
	/** Sets the inner padding between bars in a group */
	groupedPadding?: number;
	/** Line type or key in the data that is used as the line type facet */
	lineType?: LineTypeFacet | DualFacet;
	/** Border width of the bar */
	lineWidth?: LineWidth;
	/** Optional field used to set the stack order of the bar (higher order = higher on bar) */
	order?: string;
	/** The direction of the bars. Defaults to "vertical". */
	orientation?: Orientation;
	/** Opacity or key in the data that is used as the opacity facet */
	opacity?: OpacityFacet | DualFacet;
	/** Sets inner padding (https://vega.github.io/vega/docs/scales/#band) */
	paddingRatio?: number;
	/** Sets the chart area padding, this is a ratio between 0 and 1 (https://vega.github.io/vega/docs/scales/#band) */
	paddingOuter?: number;
	/** The data field used for the trellis categories */
	trellis?: string;
	/** Orientation of the trellis. Only applicable if `trellis` is also defined. Defaults to "horizontal". */
	trellisOrientation?: Orientation;
	/** Padding between trellis groups; ratio between 0 and 1 (https://vega.github.io/vega/docs/scales/#band). Only applicable if `trellis` is also defined. Defaults to 0.2. */
	trellisPadding?: number;
	/** Bar type. */
	type?: BarType;
}

export type BarType = 'dodged' | 'stacked';

export interface LineProps extends Omit<MarkProps, 'color'> {
	/** Line color or key in the data that is used as the color facet */
	color?: ColorFacet;
	/** Data field that the value is trended against (x-axis) */
	dimension?: string;
	/** Line type or key in the data that is used as the line type facet */
	lineType?: LineTypeFacet;
	/** Opacity or key in the data that is used as the opacity facet */
	opacity?: OpacityFacet;
	/** Sets the chart area padding, this is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear) */
	padding?: number;
	/** Sets the type of scale that should be used for the trend */
	scaleType?: ScaleType;
	/** Key in the data that if it exists and the value resolves to true for each data object, a point will be drawn for that data point on the line. */
	staticPoint?: string;
}

export interface ScatterProps extends Omit<MarkProps, 'color'> {
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
}

export interface ScatterPathProps {
	/** The color of the links.*/
	color?: SpectrumColor | string;
	/** The width on the links. Link width can vary by point. */
	pathWidth?: PathWidthFacet;
	/** Data keys that should be used to create the groups that get connected by links. */
	groupBy?: string[];
	/** The opacity of the links. */
	opacity?: number;
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

/**
 * Stroke dasharray for the line.
 *
 * solid: null,
 * dashed: 7 4,
 * dotted: 2 3,
 * dotDash: 2 3 7 4,
 * shortDash: 3 4,
 * longDash: 11 4,
 * twoDash: 5 2 11 2
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray
 */
export type LineType = 'solid' | 'dashed' | 'dotted' | 'dotDash' | 'shortDash' | 'longDash' | 'twoDash' | number[];

/**
 * Width of line in pixels
 *
 * XS: 1px,
 * S: 1.5px,
 * M: 2px,
 * L: 3px,
 * XL: 4px
 * */
export type LineWidth = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

/**
 * Width of the trail in pixels
 *
 * XS: 6px,
 * S: 8px,
 * M: 10px,
 * L: 12px,
 * XL: 16px
 * */
export type PathWidth = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

/**
 * Width of the symbol in pixels
 *
 * XS: 6px,
 * S: 8px,
 * M: 10px,
 * L: 12px,
 * XL: 16px
 * */
export type SymbolSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

export type SymbolSizeFacet = FacetRef<SymbolSize>;

export type ScaleType = 'linear' | 'point' | 'time';
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
	/** keys from the data to generate the legend for. Defaults to all keys used to facet the data. */
	keys?: string[];
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
	/** The keys in the data that will disable the tooltip if they have truthy values */
	excludeDataKeys?: string[];
	/** Sets which marks should be highlighted when a tooltip is visible */
	highlightBy?: 'series' | 'dimension' | 'item' | string[];
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
	children?: Children<TrendlineChildElement>;
	/** The line color of the trendline. If undefined, will default to the color of the series that it represents. */
	color?: SpectrumColor | string;
	/**
	 * The dimenstion range to draw the trendline for. If undefined, the value will default to the value of dimensionRange.
	 *
	 * If 'domain' is used as a start or end value, this will extrapolate the trendline out to the beginning and end of the chart domain respectively.
	 *
	 * If null is used as a start or end value, the trendline will be be drawn from the first data point to the last data point respectively.
	 */
	dimensionExtent?: [number | 'domain' | null, number | 'domain' | null];
	/**
	 * The dimension range that the statistical transform should be calculated for. If undefined, the value will default to [null, null]
	 *
	 * If the start or end values are null, then the dimension range will not be bounded for the start or end respectively.
	 */
	dimensionRange?: [number | null, number | null];
	/** Whether the trendline should only be visible when hovering over the parent line */
	displayOnHover?: boolean;
	/** Data points where these keys have truthy values will not be included in the trendline calculation */
	excludeDataKeys?: string[];
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
	/** Orientation of the trendline. Only supported on scatter plots. */
	orientation?: Orientation;
}

export interface TrendlineAnnotationProps {
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

/** trendline methods that use a joinaggregate transform */
export type AggregateMethod = 'average' | 'median';
/** trendline methods that use a regression transform */
export type RegressionMethod =
	| 'exponential'
	| 'linear'
	| 'logarithmic'
	| `polynomial-${number}`
	| 'power'
	| 'quadratic';
/** trendline methods that use a window transform */
export type WindowMethod = `movingAverage-${number}`;

/** avaliable methods for generating a trendline */
export type TrendlineMethod = AggregateMethod | RegressionMethod | WindowMethod;

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
export type TrendlineChildElement = ChartTooltipElement | TrendlineAnnotationElement;
export type ChartChildElement =
	| AreaElement
	| AxisElement
	| BarElement
	| LegendElement
	| LineElement
	| ScatterElement
	| TitleElement;
export type MarkChildElement =
	| AnnotationElement
	| ChartTooltipElement
	| ChartPopoverElement
	| ScatterPathElement
	| MetricRangeElement
	| TrendlineElement;
export type RscElement = ChartChildElement | MarkChildElement;
