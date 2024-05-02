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
import { getD3FormatSpecifierFromNumberFormat } from '@specBuilder/specUtils';
import {
	Align,
	Baseline,
	EncodeEntry,
	FontWeight,
	GuideEncodeEntry,
	NumberValue,
	ProductionRule,
	TextEncodeEntry,
	TextValueRef,
	TickCount,
} from 'vega';

import { AxisSpecProps, Granularity, Label, LabelAlign, NumberFormat, Orientation, Position } from '../../types';
import { isVerticalAxis } from './axisUtils';

/**
 * Gets the display value of the label. If it's an object, it will return the value property, otherwise it will return the label.
 * @param label
 * @returns string | number
 */
export const getLabelValue = (label: Label | number | string): string | number => {
	if (typeof label === 'object') {
		return label.value;
	}
	return label;
};

/**
 * Gets the label format values based on the granularity
 * @param granularity
 * @returns [secondaryFormat, primaryFormat, tickCount]
 */
export const getTimeLabelFormats = (granularity: Granularity): [string, string, TickCount] => {
	switch (granularity) {
		case 'minute':
			return ['%-I:%M %p', '%b %-d', 'minute'];
		case 'hour':
			return ['%-I %p', '%b %-d', 'hour'];
		case 'day':
			return ['%-d', '%b', 'day'];
		case 'week':
			return ['%-d', '%b', 'week'];
		case 'month':
			return ['%b', '%Y', 'month'];
		case 'quarter':
			return ['Q%q', '%Y', { interval: 'month', step: 3 }];
		default:
			return ['%-d', '%b', 'day'];
	}
};

/**
 * label align can be set in a controlled manner using the `labels` and `subLabels` props
 * This function will return the correct align and baseline encodings based on the labelAlign and position
 * @param position
 * @param labelOrientaion
 * @param labelAlign
 * @returns align and baseline
 */
export const getControlledLabelAnchorValues = (
	position: Position,
	labelOrientaion: Orientation,
	labelAlign?: LabelAlign
): { align: Align | undefined; baseline: Baseline | undefined } => {
	// if there isn't a labelAlign, we don't want to set the align or baseline
	if (!labelAlign) return { align: undefined, baseline: undefined };
	return getLabelAnchor(position, labelOrientaion, labelAlign);
};

/**
 * gets the values for labelAlign and labelBaseline based on the `labelAlign`, `labelOrientation`, and `position` props
 * vegaLabelAlign and vegaLabelBaseline props can be used to override these values
 * @param position
 * @param labelOrientaion
 * @param labelAlign
 * @param vegaLabelAlign
 * @param vegaLabelBaseline
 * @returns labelAlign and labelBaseline
 */
export const getLabelAnchorValues = (
	position: Position,
	labelOrientaion: Orientation,
	labelAlign: LabelAlign,
	vegaLabelAlign?: Align,
	vegaLabelBaseline?: Baseline
): { labelAlign: Align; labelBaseline: Baseline } => {
	const { align, baseline } = getLabelAnchor(position, labelOrientaion, labelAlign);
	// if vegaLabelAlign or vegaLabelBaseline are set, we want to use those values instead of the calculated values
	return {
		labelAlign: vegaLabelAlign ?? align,
		labelBaseline: vegaLabelBaseline ?? baseline,
	};
};

/**
 * gets the label align and baseline values based on the `labelAlign`, `labelOrientation`, and `position` props
 * @param position
 * @param labelOrientaion
 * @param labelAlign
 * @returns align and baseline
 */
export const getLabelAnchor = (
	position: Position,
	labelOrientaion: Orientation,
	labelAlign: LabelAlign
): { align: Align; baseline: Baseline } => {
	let align: Align;
	let baseline: Baseline;
	if (labelIsParallelToAxis(position, labelOrientaion)) {
		// label direction is parallel to the axis
		// for these, the align depends on the labelAlign and the baseline depends on the position
		const labelAlignToAlign: { [key in LabelAlign]: Align } = {
			start: 'left',
			center: 'center',
			end: 'right',
		};
		align = labelAlignToAlign[labelAlign];
		if (['top', 'left'].includes(position)) {
			// baseline is bottom for top and left axes
			baseline = 'bottom';
		} else {
			// baseline is top for bottom and right axes
			baseline = 'top';
		}
	} else {
		// label direction is perpendicular to the axis
		// for these, baseline depends on the labelAlign and align depends on the position
		const labelAlignToBaseline: { [key in LabelAlign]: Baseline } = {
			start: 'top',
			center: 'middle',
			end: 'bottom',
		};
		baseline = labelAlignToBaseline[labelAlign];
		if (['bottom', 'left'].includes(position)) {
			// bottom and left will always have the anchor on the right side of the text
			align = 'right';
		} else {
			// top and right will always have the anchor on the left side of the text
			align = 'left';
		}
	}
	return { align, baseline };
};

/**
 * determines if the label orientation is parallel to the axis direction
 * @param position
 * @param labelOrientaion
 * @returns boolean
 */
export const labelIsParallelToAxis = (position: Position, labelOrientaion: Orientation): boolean => {
	const axisOrientation = ['top', 'bottom'].includes(position) ? 'horizontal' : 'vertical';
	return axisOrientation === labelOrientaion;
};

/**
 * gets the label angle based on the `labelOrientation` prop
 * @param labelOrientaion
 * @returns labelAngle: number
 */
export const getLabelAngle = (labelOrientaion: Orientation): number => {
	if (labelOrientaion === 'horizontal') {
		return 0;
	}
	// default vertical label should read from bottom to top
	return 270;
};

/**
 * gets the vega baseline value based on the labelAlign value
 * @param labelAlign
 * @returns
 */
export const getLabelBaseline = (
	labelAlign: LabelAlign | undefined,
	position: Position,
	vegaLabelBaseline?: Baseline
): Baseline | undefined => {
	if (vegaLabelBaseline) return vegaLabelBaseline;
	if (!labelAlign) return;
	if (isVerticalAxis(position)) {
		switch (labelAlign) {
			case 'start':
				return 'top';
			case 'end':
				return 'bottom';
			case 'center':
			default:
				return 'middle';
		}
	}
};

/**
 * calculates the label offset for a band scale based on the labelAlign
 * @param labelAlign
 * @param scaleName
 * @returns
 */
export const getLabelOffset = (
	labelAlign: LabelAlign,
	scaleName: string,
	vegaLabelOffset?: NumberValue
): NumberValue | undefined => {
	if (vegaLabelOffset !== undefined) return vegaLabelOffset;
	switch (labelAlign) {
		case 'start':
			return { signal: `bandwidth('${scaleName}') / -2` };
		case 'end':
			return { signal: `bandwidth('${scaleName}') / 2` };
		default:
			return undefined;
	}
};

/**
 * gets the vega label format based on the labelFormat
 * @param type
 * @returns
 */
export const getLabelFormat = (
	{ labelFormat, labelOrientation, numberFormat, position, truncateLabels }: AxisSpecProps,
	scaleName: string
): ProductionRule<TextValueRef> => {
	if (labelFormat === 'percentage') {
		return [{ test: 'isNumber(datum.value)', signal: "format(datum.value, '~%')" }, { signal: 'datum.value' }];
	}
	if (labelFormat === 'duration') {
		return { signal: 'formatTimeDurationLabels(datum)' };
	}

	return [
		...getLabelNumberFormat(numberFormat),
		...(truncateLabels && scaleName.includes('Band') && labelIsParallelToAxis(position, labelOrientation)
			? [{ signal: 'truncateText(datum.value, bandwidth("xBand")/(1- paddingInner), "normal", 14)' }]
			: [{ signal: 'datum.value' }]),
	];
};

/**
 * gets the number format tests and signals based on the numberFormat
 * @param numberFormat
 * @returns
 */
export const getLabelNumberFormat = (
	numberFormat: NumberFormat | string
): ({
	test?: string;
} & TextValueRef)[] => {
	const test = 'isNumber(datum.value)';
	if (numberFormat === 'shortNumber') {
		return [
			{
				test: `${test} && abs(datum.value) >= 1000`,
				signal: "upper(replace(format(datum.value, '.3~s'), /(\\d+)G/, '$1B'))",
			},
		];
	}
	if (numberFormat === 'shortCurrency') {
		return [
			{
				test: `${test} && abs(datum.value) >= 1000`,
				signal: "upper(replace(format(datum.value, '$.3~s'), /(\\d+)G/, '$1B'))",
			},
			{
				test,
				signal: "format(datum.value, '$')",
			},
		];
	}
	const d3FormatSpecifier = getD3FormatSpecifierFromNumberFormat(numberFormat);
	return [{ test, signal: `format(datum.value, '${d3FormatSpecifier}')` }];
};

/**
 * Gets the axis label encoding
 * @param labelAlign
 * @param labelFontWeight
 * @param labelKey
 * @param position
 * @param signalName
 * @returns updateEncoding
 */
export const getAxisLabelsEncoding = (
	labelAlign: LabelAlign,
	labelFontWeight: FontWeight,
	labelKey: 'label' | 'subLabel',
	labelOrientation: Orientation,
	position: Position,
	signalName: string
): GuideEncodeEntry<TextEncodeEntry> => ({
	update: {
		text: [
			{
				test: `indexof(pluck(${signalName}, 'value'), datum.value) !== -1`,
				signal: `${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)].${labelKey}`,
			},
			{ signal: 'datum.value' },
		],
		fontWeight: [
			{
				test: `indexof(pluck(${signalName}, 'value'), datum.value) !== -1 && ${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)].fontWeight`,
				signal: `${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)].fontWeight`,
			},
			// default to the primary label font weight
			{ value: labelFontWeight },
		],
		...getEncodedLabelAnchor(position, signalName, labelOrientation, labelAlign),
	},
});

/**
 * Will return the label align or baseline based on the position
 * These properties are used within the axis label encoding
 * If this is a vertical axis, it will return the correct baseline property and value
 * Otherwise, it will return the correct align property and value
 * @param position
 * @param signalName
 * @param defaultLabelAlign
 * @returns align | baseline
 */
export const getEncodedLabelAnchor = (
	position: Position,
	signalName: string,
	labelOrientation: Orientation,
	defaultLabelAlign: LabelAlign
): EncodeEntry => {
	const baseTestString = `indexof(pluck(${signalName}, 'value'), datum.value) !== -1 && ${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)]`;
	const baseSignalString = `${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)]`;
	const { align, baseline } = getLabelAnchor(position, labelOrientation, defaultLabelAlign);

	return {
		align: [{ test: `${baseTestString}.align`, signal: `${baseSignalString}.align` }, { value: align }],
		baseline: [{ test: `${baseTestString}.baseline`, signal: `${baseSignalString}.baseline` }, { value: baseline }],
	};
};
