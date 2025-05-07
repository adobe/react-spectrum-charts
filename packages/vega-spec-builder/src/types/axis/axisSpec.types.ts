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
import { Align, Baseline, FontWeight, NumberValue, ScaleType } from 'vega';

import { ColorScheme } from '../chartSpec.types';
import { NumberFormat, Orientation, PartiallyRequired, Position } from '../specUtil.types';
import { AxisAnnotationOptions } from './axisAnnotationSpec.types';
import { ReferenceLineOptions } from './referenceLineSpec.types';

export type Granularity = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
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

export interface AxisOptions {
	/** Sets the name of the component. */
	name?: string;
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

	// children
	axisAnnotations?: AxisAnnotationOptions[];
	referenceLines?: ReferenceLineOptions[];
}

type AxisOptionsWithDefaults =
	| 'axisAnnotations'
	| 'baseline'
	| 'baselineOffset'
	| 'granularity'
	| 'grid'
	| 'hideDefaultLabels'
	| 'labelAlign'
	| 'labelFontWeight'
	| 'labelOrientation'
	| 'labels'
	| 'numberFormat'
	| 'referenceLines'
	| 'subLabels'
	| 'ticks';

export interface AxisSpecOptions extends PartiallyRequired<AxisOptions, AxisOptionsWithDefaults> {
	name: string;
	colorScheme: ColorScheme;
	index: number;
	scaleType: ScaleType;
	vegaLabelAlign?: Align;
	vegaLabelBaseline?: Baseline;
	vegaLabelOffset?: NumberValue;
	vegaLabelPadding?: number;
}
