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
import {
	EncodeEntry,
	GuideEncodeEntry,
	Mark,
	NumericValueRef,
	ProductionRule,
	RuleMark,
	ScaleType,
	SignalRef,
	SymbolMark,
	TextEncodeEntry,
	TextMark,
} from 'vega';

import { DEFAULT_FONT_COLOR, DEFAULT_LABEL_FONT_WEIGHT } from '../../constants';
import { getColorValue, getPathFromIcon } from '../specUtils';
import { AxisSpecOptions, Position, ReferenceLineOptions, ReferenceLineSpecOptions } from '../types';
import { isVerticalAxis } from './axisUtils';

export const getReferenceLines = (axisOptions: AxisSpecOptions): ReferenceLineSpecOptions[] => {
	return axisOptions.referenceLines.map((referenceLine, index) =>
		applyReferenceLineOptionDefaults(referenceLine, axisOptions, index)
	);
};

const applyReferenceLineOptionDefaults = (
	options: ReferenceLineOptions,
	axisOptions: AxisSpecOptions,
	index: number
): ReferenceLineSpecOptions => ({
	...options,
	color: options.color || 'gray-800',
	colorScheme: axisOptions.colorScheme,
	iconColor: options.iconColor || DEFAULT_FONT_COLOR,
	labelColor: options.labelColor || DEFAULT_FONT_COLOR,
	labelFontWeight: options.labelFontWeight ?? DEFAULT_LABEL_FONT_WEIGHT,
	layer: options.layer ?? 'front',
	name: `${axisOptions.name}ReferenceLine${index}`,
});

export const scaleTypeSupportsReferenceLines = (scaleType: ScaleType | undefined): boolean => {
	const supportedScaleTypes: ScaleType[] = ['band', 'linear', 'point', 'time', 'utc'];
	return Boolean(scaleType && supportedScaleTypes.includes(scaleType));
};

export const getReferenceLineMarks = (
	axisOptions: AxisSpecOptions,
	scaleName: string
): { back: Mark[]; front: Mark[] } => {
	const referenceLineMarks: { back: Mark[]; front: Mark[] } = { back: [], front: [] };
	const referenceLines = getReferenceLines(axisOptions);

	for (const referenceLine of referenceLines) {
		const { layer } = referenceLine;
		const positionEncoding = getPositionEncoding(axisOptions, referenceLine, scaleName);
		referenceLineMarks[layer].push(
			...[
				getReferenceLineRuleMark(axisOptions, referenceLine, positionEncoding),
				...getReferenceLineSymbolMark(axisOptions, referenceLine, positionEncoding),
				...getReferenceLineTextMark(axisOptions, referenceLine, positionEncoding),
			]
		);
	}
	return referenceLineMarks;
};

export const getPositionEncoding = (
	{ scaleType }: AxisSpecOptions,
	{ value, position }: ReferenceLineSpecOptions,
	scaleName: string
): ProductionRule<NumericValueRef> | SignalRef => {
	const signalValue = typeof value === 'string' ? `'${value}'` : value;
	const halfInnerPaddingFormula = `paddingInner * bandwidth('${scaleName}') / (2 * (1 - paddingInner))`;
	const beforePositionSignal = `scale('${scaleName}', ${signalValue}) - ${halfInnerPaddingFormula}`;
	const centeredPositionSignal = `scale('${scaleName}', ${signalValue}) + bandwidth('${scaleName}') / 2`;
	const afterPositionSignal = `scale('${scaleName}', ${signalValue}) + bandwidth('${scaleName}') + ${halfInnerPaddingFormula}`;
	if (scaleType === 'band') {
		if (position === 'before') return { signal: beforePositionSignal };
		if (position === 'after') return { signal: afterPositionSignal };
		return { signal: centeredPositionSignal };
	}
	return { scale: scaleName, value };
};

export const getReferenceLineRuleMark = (
	{ position, ticks }: AxisSpecOptions,
	{ color, colorScheme, name }: ReferenceLineSpecOptions,
	positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): RuleMark => {
	const startOffset = ticks ? 9 : 0;

	const positionOptions: { [key in Position]: Partial<EncodeEntry> } = {
		top: {
			x: positionEncoding,
			y: { value: -startOffset },
			y2: { signal: 'height' },
		},
		bottom: {
			x: positionEncoding,
			y: { value: 0 },
			y2: { signal: `height + ${startOffset}` },
		},
		left: {
			x: { value: -startOffset },
			x2: { signal: 'width' },
			y: positionEncoding,
		},
		right: {
			x: { value: 0 },
			x2: { signal: `width + ${startOffset}` },
			y: positionEncoding,
		},
	};

	return {
		name,
		type: 'rule',
		interactive: false,
		encode: {
			enter: {
				stroke: { value: getColorValue(color, colorScheme) },
			},
			update: {
				...positionOptions[position],
			},
		},
	};
};

/**
 * Gets position values for additional marks for the reference line.
 * @param offset
 * @param positionEncoding
 * @param horizontalOffset
 * @returns SymbolMark
 */
const getAdditiveMarkPositionOptions = (
	offset: number,
	positionEncoding: ProductionRule<NumericValueRef> | SignalRef,
	horizontalOffset?: number
) => ({
	top: {
		x: positionEncoding,
		y: { value: -offset },
	},
	bottom: {
		x: positionEncoding,
		y: { signal: `height + ${offset}` },
	},
	left: {
		x: { value: -offset },
		y: { ...positionEncoding, offset: horizontalOffset },
	},
	right: {
		x: { signal: `width + ${offset}` },
		y: { ...positionEncoding, offset: horizontalOffset },
	},
});

/**
 * Gets the reference line symbol mark
 * @param AxisSpecOptions
 * @param ReferenceLineSpecOptions
 * @param referenceLineIndex
 * @param positionEncoding
 * @returns SymbolMark
 */
export const getReferenceLineSymbolMark = (
	{ colorScheme, position }: AxisSpecOptions,
	{ icon, iconColor, name }: ReferenceLineSpecOptions,
	positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): SymbolMark[] => {
	if (!icon) return [];

	// offset the icon from the edge of the chart area
	const OFFSET = 24;
	const positionOptions = getAdditiveMarkPositionOptions(OFFSET, positionEncoding);

	return [
		{
			name: `${name}_symbol`,
			type: 'symbol',
			encode: {
				enter: {
					shape: {
						value: getPathFromIcon(icon),
					},
					size: { value: 324 },
					fill: { value: getColorValue(iconColor, colorScheme) },
				},
				update: {
					...positionOptions[position],
				},
			},
		},
	];
};

/**
 * Gets the reference line text mark
 * @param AxisSpecOptions
 * @param ReferenceLineSpecOptions
 * @param referenceLineIndex
 * @param positionEncoding
 * @returns TextMark
 */
export const getReferenceLineTextMark = (
	axisOptions: AxisSpecOptions,
	referenceLineOptions: ReferenceLineSpecOptions,
	positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): TextMark[] => {
	const { label, name } = referenceLineOptions;
	if (!label) return [];

	return [
		{
			name: `${name}_label`,
			type: 'text',
			encode: {
				...getReferenceLineLabelsEncoding(axisOptions, { ...referenceLineOptions, label }, positionEncoding),
			},
		},
	];
};

/**
 * Gets the reference line label encoding
 * @param labelFontWeight
 * @param label
 * @param position
 * @param positionEncoding
 * @param icon
 * @returns updateEncoding
 */
export const getReferenceLineLabelsEncoding = (
	{ position }: AxisSpecOptions,
	{ colorScheme, icon, label, labelColor, labelFontWeight }: ReferenceLineSpecOptions & { label: string },
	positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): GuideEncodeEntry<TextEncodeEntry> => {
	const VERTICAL_OFFSET = icon ? 48 : 26; // Position label outside of icon.
	const HORIZONTAL_OFFSET = isVerticalAxis(position) && icon ? 24 : 12; // Position label outside of icon for horizontal orientation.
	const positionOptions = getAdditiveMarkPositionOptions(VERTICAL_OFFSET, positionEncoding, HORIZONTAL_OFFSET);

	return {
		update: {
			text: [
				{
					value: label,
				},
			],
			fontWeight: [
				// default to the primary label font weight
				{ value: labelFontWeight },
			],
			fill: { value: getColorValue(labelColor, colorScheme) },
			...getEncodedLabelBaselineAlign(position),
			...positionOptions[position],
		},
	};
};

/**
 * Will return the label align or baseline based on the position
 * These properties are used within the reference line label encoding
 * If this is a vertical axis, it will return the correct baseline property and value
 * Otherwise, it will return the correct align property and value
 * @param position
 * @returns align | baseline
 */
export const getEncodedLabelBaselineAlign = (position: Position): EncodeEntry => {
	switch (position) {
		case 'top':
		case 'bottom':
			return {
				align: { value: 'center' },
			};
		case 'left':
		case 'right':
			return {
				baseline: { value: 'center' },
			};
	}
};
