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
import { JSXElementConstructor, MutableRefObject, ReactElement, ReactNode } from 'react';

import { GROUP_DATA, INTERACTION_MODE, MARK_ID, SERIES_ID, TRENDLINE_VALUE } from '@constants';
import { Config, Data, FontWeight, Locale, NumberLocale, Padding, Spec, SymbolShape, TimeLocale, View } from 'vega';

import { Icon, IconProps } from '@adobe/react-spectrum';
import { IconPropsWithoutChildren } from '@react-spectrum/icon';
import { Theme } from '@react-types/provider';

import { Colors, SpectrumColor } from './SpectrumVizColors';
import { LocaleCode, NumberLocaleCode, TimeLocaleCode } from './locales';

export type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type AnnotationElement = ReactElement<AnnotationProps, JSXElementConstructor<AnnotationProps>>;
export type AreaElement = ReactElement<AreaProps, JSXElementConstructor<AreaProps>>;
export type AxisElement = ReactElement<AxisProps, JSXElementConstructor<AxisProps>>;
export type AxisAnnotationElement = ReactElement<AxisAnnotationProps, JSXElementConstructor<AxisAnnotationProps>>;
export type BarElement = ReactElement<BarProps, JSXElementConstructor<BarProps>>;
export type ChartElement = ReactElement<ChartProps, JSXElementConstructor<ChartProps>>;
export type ChartPopoverElement = ReactElement<ChartPopoverProps, JSXElementConstructor<ChartPopoverProps>>;
export type ChartTooltipElement = ReactElement<ChartTooltipProps, JSXElementConstructor<ChartTooltipProps>>;
export type DonutElement = ReactElement<DonutProps, JSXElementConstructor<DonutProps>>;
export type BulletElement = ReactElement<BulletProps, JSXElementConstructor<BulletProps>>;
export type DonutSummaryElement = ReactElement<DonutSummaryProps, JSXElementConstructor<DonutSummaryProps>>;
export type LegendElement = ReactElement<LegendProps, JSXElementConstructor<LegendProps>>;
export type LineElement = ReactElement<LineProps, JSXElementConstructor<LineProps>>;
export type BigNumberElement = ReactElement<BigNumberProps, JSXElementConstructor<BigNumberProps>>;
export type IconElement = ReactElement<
	IconProps | IconPropsWithoutChildren,
	JSXElementConstructor<IconProps | IconPropsWithoutChildren>
>;
export type ScatterPathElement = ReactElement<ScatterPathProps, JSXElementConstructor<ScatterPathProps>>;
export type SegmentLabelElement = ReactElement<SegmentLabelProps, JSXElementConstructor<SegmentLabelProps>>;
export type MetricRangeElement = ReactElement<MetricRangeProps, JSXElementConstructor<MetricRangeProps>>;
export type ReferenceLineElement = ReactElement<ReferenceLineProps, JSXElementConstructor<ReferenceLineProps>>;
export type ScatterElement = ReactElement<ScatterProps, JSXElementConstructor<ScatterProps>>;
export type TitleElement = ReactElement<TitleProps, JSXElementConstructor<TitleProps>>;
export type TrendlineAnnotationElement = ReactElement<
	TrendlineAnnotationProps,
	JSXElementConstructor<TrendlineAnnotationProps>
>;
export type TrendlineElement = ReactElement<TrendlineProps, JSXElementConstructor<TrendlineProps>>;
export type ComboElement = ReactElement<ComboProps, JSXElementConstructor<ComboProps>>;

export type SimpleData = Record<string, unknown>;
export type ChartData = SimpleData | Data;

export type HighlightedItem = string | number | (string | number)[];

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
	/** Data item id or ids that should be highlighted on the chart (controlled). Be sure to supply an `idKey` where each data point has a unique ID if you are using controlled highlighting of items. */
	highlightedItem?: HighlightedItem;
	/** Series name to highlight on the chart (controlled). */
	highlightedSeries?: string | number;
	/** Data key that contains a unique ID for each data point in the array. */
	idKey?: string;
}

type SpecPropsWithDefaults =
	| 'backgroundColor'
	| 'colors'
	| 'colorScheme'
	| 'hiddenSeries'
	| 'idKey'
	| 'lineTypes'
	| 'lineWidths'
	| 'symbolShapes'
	| 'symbolSizes';

export interface SanitizedSpecProps extends PartiallyRequired<SpecProps, SpecPropsWithDefaults> {
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
export type NumberFormat = 'currency' | 'shortCurrency' | 'shortNumber' | 'standardNumber' | string;
export type TooltipAnchor = 'cursor' | 'mark';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

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
	/** Sets what the tooltip should be anchored to. Defaults to `cursor`. */
	tooltipAnchor?: TooltipAnchor;
	/** The placement of the tooltip with respect to the mark. Only applicable if `tooltipAnchor = 'mark'`. */
	tooltipPlacement?: TooltipPlacement;
}

type ChartPropsWithDefaults =
	| 'backgroundColor'
	| 'colors'
	| 'colorScheme'
	| 'debug'
	| 'hiddenSeries'
	| 'idKey'
	| 'lineTypes'
	| 'lineWidths'
	| 'locale'
	| 'padding'
	| 'renderer'
	| 'tooltipAnchor'
	| 'tooltipPlacement';

export interface RscChartProps extends PartiallyRequired<SharedChartProps, ChartPropsWithDefaults> {
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

export type ThresholdBackground = { thresholdMin?: number; thresholdMax?: number; fill?: string };

export interface BulletProps extends MarkProps {
	/** Target line */
	target?: string;
	/** Flag to control whether the target is shown */
	showTarget?: boolean;
	/** Flag to control whether the target value is shown. */
	showTargetValue?: boolean;
	/** Data field that the metric is trended against (x-axis for horizontal orientation) */
	dimension?: string;
	/** Specifies the direction the bars should be ordered (row/column) */
	direction?: 'row' | 'column';
	/** d3 number format specifier.
	 * Sets the number format for the summary value.
	 *
	 * see {@link https://d3js.org/d3-format#locale_format}
	 */
	numberFormat?: NumberFormat;
	/** Array of threshold definitions to be rendered as background bands on the bullet chart.
	 *
	 *  Each threshold object supports:
	 * `thresholdMin` (optional): The lower bound of the threshold. If undefined, the threshold starts from the beginning of the x-scale.
	 *
	 * `thresholdMax` (optional): The upper bound of the threshold. If undefined, the threshold extends to the end of the x-scale.
	 *
	 * `fill` : The fill color to use for the threshold background.
	 */
	thresholds?: ThresholdBackground[];
	/**
	 * A simplified threshold configuration that allows for defining thresholds using an array of numbers and corresponding colors.
	 *
	 * For example:
	 * {
	 *   `thresholds`: [120, 235],
	 *   `colors`: ["rgb(234, 56, 41)", "rgb(249, 137, 23)", "rgb(21, 164, 110)"]
	 * }
	 *
	 * Note: When both `thresholds` and `thresholdConfig` are provided, the detailed `thresholds` take precedence.
	 */
	thresholdConfig?: BulletThresholdConfig;
}

export interface BulletThresholdConfig {
	/** Threshold boundaries, each number in the array represents a threshold value. */
	thresholds: number[];
	/** Threshold fill colors, each color corresponds to a threshold in the `thresholds` array. */
	colors: string[];
}

export interface DonutProps extends MarkProps {
	/** Start angle of the donut in radians (0 is top dead center, and default) */
	startAngle?: number;
	/** Ratio of the donut inner radius / donut outer radius. 0 is a pie chart. 0.85 is the default. */
	holeRatio?: number;
	/** Determines if the center metric should be displayed as a percent. if true, data should only be two data points, which sum to 1
	 * Also, if true, will display the first datapoint as a percent */
	isBoolean?: boolean;
}

export interface DonutSummaryProps {
	/** d3 number format specifier.
	 * Sets the number format for the summary value.
	 *
	 * see {@link https://d3js.org/d3-format#locale_format}
	 */
	numberFormat?: NumberFormat;
	/** Label for the metric summary */
	label?: string;
}

export interface SegmentLabelProps {
	/** Sets the key in the data that has the segment label. Defaults to the `color` key set on the `Donut` is undefined. */
	labelKey?: string;
	/** Shows the donut segment percentage */
	percent?: boolean;
	/** Shows the donut segment metric value */
	value?: boolean;
	/** d3 number format specifier.
	 * Sets the number format for the segment metric value.
	 *
	 * @default 'standardNumber'
	 *
	 * see {@link https://d3js.org/d3-format#locale_format}
	 */
	valueFormat?: string;
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
	numberFormat?: NumberFormat;
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
	title?: string | string[];
	/** If the text is wider than the bandwidth that is labels, it will be truncated so that it stays within that bandwidth. */
	truncateLabels?: boolean;
	/**
	 * Set the locale for currency formatting (affects symbol position and spacing).
	 *
	 * ⚠️ Limited Support:
	 * Support for and changes to this prop will be limited.
	 * Only use this if you need to override the currency locale formatting from the chart locale.
	 *
	 * **Important:** This prop requires 'currencyCode' prop to take effect.
	 *
	 * Example: 'en-US' ($100) vs 'de-DE' (100 $)
	 */
	currencyLocale?: string;
	/**
	 * Override the currency symbol from the chart locale with a specific currency code.
	 *
	 * ⚠️ Limited Support:
	 * Support for and changes to this prop will be limited.
	 * Only use this if you need to override the currency symbol from the chart locale.
	 *
	 * **Important:** This prop requires 'currencyLocale' prop to take effect.
	 */
	currencyCode?: string;
}

export interface BigNumberProps {
	orientation: Orientation;
	label: string;
	dataKey: string;
	children?: Children<LineElement>;
	numberFormat?: string;
	numberType?: BigNumberNumberType;
	method?: BigNumberMethod;
	icon?: IconElement;
}

export interface BigNumberInternalProps {
	orientation: Orientation;
	label: string;
	dataKey: string;
	children?: Children<LineElement>;
	rscChartProps: RscChartProps;
	numberFormat?: string;
	numberType?: BigNumberNumberType;
	method?: BigNumberMethod;
	icon?: IconElement;
}

export type BigNumberNumberType = 'linear' | 'percentage';
export type BigNumberMethod = 'sum' | 'avg' | 'last';

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
export type OnClickCallback = (datum: Datum) => void;

export type DualFacet = [string, string]; // two keys used for a secondary facet on Bar charts

export interface AnnotationProps extends MarkProps {
	textKey?: string;
	/** @deprecated */
	style?: AnnotationStyleProps;
}

export interface AnnotationStyleProps extends MarkProps {
	width?: number;
}

export interface ClickableChartProps {
	/** Callback that will be run when a point/section is clicked */
	onClick?: OnClickCallback;
}

export interface BarProps extends Omit<MarkProps & ClickableChartProps, 'color'> {
	/** Bar color or key in the data that is used as the color facet */
	color?: ColorFacet | DualFacet;
	/** Data field used for the bar categories (x-axis for a vertical bar) */
	dimension?: string;
	/** Data type field used for the bar categories (x-axis for a vertical bar) */
	dimensionDataType?: string;
	/** Sets the inner padding between bars in a group */
	groupedPadding?: number;
	/** Should the top-left and top-right corners of the bars be square? Round by default */
	hasSquareCorners?: boolean;
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
	/** Axis that the metric is trended against (y-axis for a vertical bar) */
	metricAxis?: string;
}

export type BarType = 'dodged' | 'stacked';

export interface LineProps extends Omit<MarkProps & ClickableChartProps, 'color'> {
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
	pointSize?: number;
	/** Line to be interpreted and rendered as a sparkline. For example, Changes the fill of static points. */
	isSparkline?: boolean;
	/** Sparkline's method is last - meaning that last element of data has the static point */
	isMethodLast?: boolean;
	/** Sets the type of scale that should be used for the trend */
	scaleType?: ScaleType;
	/** Key in the data that if it exists and the value resolves to true for each data object, a point will be drawn for that data point on the line. */
	staticPoint?: string;
	/** Sets the interaction mode for the line */
	interactionMode?: InteractionMode;
	/** Axis that the metric is trended against (y-axis) */
	metricAxis?: string;
}

export type InteractionMode = `${INTERACTION_MODE}`;

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

export type ScaleType = 'linear' | 'point' | 'time' | 'band';
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
	/** max width in pixels before truncating a legend label */
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
	/** Callback used to control the content rendered in the popover */
	children?: PopoverHandler;
	/** Width of the popover */
	width?: number | 'auto';
	/** Minimum width of the popover */
	minWidth?: number;
	/** Maximum width of the popover */
	maxWidth?: number;
	/** Height of the popover */
	height?: number | 'auto';
	/** Minimum height of the popover */
	minHeight?: number;
	/** Maximum height of the popover */
	maxHeight?: number;
	/** handler that is called when the popover's open state changes */
	onOpenChange?: (isOpen: boolean) => void;
	/** The placement padding that should be applied between the popover and its surrounding container */
	containerPadding?: number;
	/** Sets which marks should be highlighted when a popover is visible.  This feature is incomplete. */
	UNSAFE_highlightBy?: 'series' | 'dimension' | 'item' | string[];
}

export interface ReferenceLineProps {
	/** The color of the reference line. */
	color?: SpectrumColor | string;
	/** The value on the axis where the reference line should be drawn. */
	value: number | string;
	/** Adds an icon as the reference line label on the axis. */
	icon?: Icon | string;
	/** Color of the icon. */
	iconColor?: SpectrumColor | string;
	/** Position the line on the value, or between the previous/next value. Only supported in Bar visualizations. */
	position?: 'before' | 'after' | 'center';
	/** Axis text label. If not provided, the default label will be displayed. */
	label?: string;
	/** Specifies what layer the reference line should be drawn on. `front` will render the reference line infront of other marks. `back` will draw the refence line behind other marks. */
	layer?: 'back' | 'front';
	/** Color of the label. */
	labelColor?: SpectrumColor | string;
	/** Font weight of the label. */
	labelFontWeight?: FontWeight;
}

export type Icon = 'date' | 'sentimentNegative' | 'sentimentNeutral' | 'sentimentPositive';

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

export interface ComboProps extends BaseProps {
	children?: Children<ComboChildElement>;
	/** Data field that the metrics are trended against (x-axis for horizontal orientation) */
	dimension?: string;
}

export interface MarkBounds {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

const DatumPredefinedKey = {
	markId: MARK_ID,
	seriesId: SERIES_ID,
	trendlineValue: TRENDLINE_VALUE,
	groupData: GROUP_DATA,
} as const;

export type Datum = object & {
	[DatumPredefinedKey.markId]: number;
	[DatumPredefinedKey.seriesId]: string;
	[DatumPredefinedKey.trendlineValue]?: number;
	[DatumPredefinedKey.groupData]?: Datum[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export type ColorScheme = 'light' | 'dark';

export type TooltipHandler = (datum: Datum) => ReactNode;

export type PopoverHandler = (datum: Datum, close: () => void) => ReactNode;

export type AxisAnnotationClickHandler = (annotations) => ReactNode;

export type Position = 'left' | 'right' | 'top' | 'bottom';

export type ChildElement<T> = T | string | boolean | Iterable<ReactNode>;
export type Children<T> = ChildElement<T> | ChildElement<T>[];

export type AxisChildElement = ReferenceLineElement | AxisAnnotationElement;
export type AxisAnnotationChildElement = ChartTooltipElement | ChartPopoverElement;

export type TrendlineChildElement = ChartTooltipElement | TrendlineAnnotationElement;
export type ChartChildElement =
	| AreaElement
	| AxisElement
	| BarElement
	| BigNumberElement
	| LegendElement
	| LineElement
	| ScatterElement
	| TitleElement
	| ComboElement;
export type MarkChildElement =
	| AnnotationElement
	| ChartTooltipElement
	| ChartPopoverElement
	| ScatterPathElement
	| MetricRangeElement
	| DonutSummaryElement
	| SegmentLabelElement
	| TrendlineElement;
export type ComboChildElement = LineElement | BarElement;
export type RscElement = ChartChildElement | MarkChildElement;
