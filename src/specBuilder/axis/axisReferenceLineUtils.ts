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
import { ReferenceLine } from '@components/ReferenceLine';
import { DEFAULT_LABEL_FONT_WEIGHT } from '@constants';
import { getColorValue, getPathFromIcon } from '@specBuilder/specUtils';
import { toArray } from '@utils';
import { AxisChildElement, AxisSpecProps, Children, Position, ReferenceLineElement, ReferenceLineProps } from 'types';
import {
	EncodeEntry,
	FontWeight,
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

import { isVerticalAxis } from './axisUtils';

export const getReferenceLinesFromChildren = (
	children: Children<AxisChildElement> | undefined
): ReferenceLineProps[] => {
	const childrenArray = toArray(children);
	const referenceLines = childrenArray.filter(
		(child) => typeof child === 'object' && 'type' in child && child.type === ReferenceLine
	) as ReferenceLineElement[];
	return referenceLines.map((referenceLineElement) => referenceLineElement.props);
};

export const scaleTypeSupportsReferenceLines = (scaleType: ScaleType | undefined): boolean => {
	const supportedScaleTypes: ScaleType[] = ['band', 'linear', 'point', 'time', 'utc'];
	return Boolean(scaleType && supportedScaleTypes.includes(scaleType));
};

export const getReferenceLineMarks = (
	axisProps: AxisSpecProps,
	referenceLineProps: ReferenceLineProps,
	referenceLineIndex: number,
	scaleName: string
): Mark[] => {
	const positionRule = getPositionRule(axisProps, referenceLineProps, scaleName);
	return [
		getReferenceLineRuleMark(axisProps, referenceLineIndex, positionRule),
		...getReferenceLineSymbolMark(axisProps, referenceLineProps, referenceLineIndex, positionRule),
		...getReferenceLineTextMark(axisProps, referenceLineProps, referenceLineIndex, positionRule),
	];
};

export const getPositionRule = (
	{ scaleType }: AxisSpecProps,
	{ value, position }: ReferenceLineProps,
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

const getOrientation = (position: Position): 'y' | 'x' => {
	return isVerticalAxis(position) ? 'y' : 'x';
};

export const getReferenceLineRuleMark = (
	{ name, position, ticks }: AxisSpecProps,
	referenceLineIndex: number,
	positionRule: ProductionRule<NumericValueRef> | SignalRef
): RuleMark => {
	const orientation = getOrientation(position);

	const startOffset = ticks ? 9 : 0;

	const positionProps: { [key in Position]: Partial<EncodeEntry> } = {
		top: {
			x: positionRule,
			y: { value: -startOffset },
			y2: { signal: 'height' },
		},
		bottom: {
			x: positionRule,
			y: { value: 0 },
			y2: { signal: `height + ${startOffset}` },
		},
		left: {
			x: { value: -startOffset },
			x2: { signal: 'width' },
			y: positionRule,
		},
		right: {
			x: { value: 0 },
			x2: { signal: `width + ${startOffset}` },
			y: positionRule,
		},
	};

	return {
		name: `${name}_${orientation}ReferenceLineRule${referenceLineIndex}`,
		type: 'rule',
		interactive: false,
		encode: {
			update: {
				...positionProps[position],
			},
		},
	};
};

/**
 * Gets position values for additional marks for the reference line.
 * @param offset
 * @param positionRule
 * @param horizontalOffset
 * @returns SymbolMark
 */
const getAdditiveMarkPositionProps = (
	offset: number,
	positionRule: ProductionRule<NumericValueRef> | SignalRef,
	horizontalOffset?: number
) => ({
	top: {
		x: positionRule,
		y: { value: -offset },
	},
	bottom: {
		x: positionRule,
		y: { signal: `height + ${offset}` },
	},
	left: {
		x: { value: -offset },
		y: { ...positionRule, offset: horizontalOffset },
	},
	right: {
		x: { signal: `width + ${offset}` },
		y: { ...positionRule, offset: horizontalOffset },
	},
});

/**
 * Gets the reference line symbol mark
 * @param AxisSpecProps
 * @param ReferenceLineProps
 * @param referenceLineIndex
 * @param positionRule
 * @returns SymbolMark
 */
export const getReferenceLineSymbolMark = (
	{ colorScheme, name, position }: AxisSpecProps,
	{ icon }: ReferenceLineProps,
	referenceLineIndex: number,
	positionRule: ProductionRule<NumericValueRef> | SignalRef
): SymbolMark[] => {
	if (!icon) return [];
	const orientation = getOrientation(position);

	// offset the icon from the edge of the chart area
	const OFFSET = 24;
	const positionProps = getAdditiveMarkPositionProps(OFFSET, positionRule);

	return [
		{
			name: `${name}_${orientation}ReferenceLineSymbol${referenceLineIndex}`,
			type: 'symbol',
			encode: {
				enter: {
					shape: {
						value: getPathFromIcon(icon),
					},
					size: { value: 324 },
					fill: { value: getColorValue('gray-900', colorScheme) },
				},
				update: {
					...positionProps[position],
				},
			},
		},
	];
};

/**
 * Gets the reference line text mark
 * @param AxisSpecProps
 * @param ReferenceLineProps
 * @param referenceLineIndex
 * @param positionRule
 * @returns TextMark
 */
export const getReferenceLineTextMark = (
	{ name, position }: AxisSpecProps,
	{ label, icon, labelFontWeight }: ReferenceLineProps,
	referenceLineIndex: number,
	positionRule: ProductionRule<NumericValueRef> | SignalRef
): TextMark[] => {
	if (!label) return [];
	const orientation = getOrientation(position);

	return [
		{
			name: `${name}_${orientation}ReferenceLineLabel${referenceLineIndex}`,
			type: 'text',
			encode: { ...getReferenceLineLabelsEncoding(labelFontWeight, label, position, positionRule, icon) },
		},
	];
};

/**
 * Gets the reference line label encoding
 * @param labelFontWeight
 * @param label
 * @param position
 * @param positionRule
 * @param icon
 * @returns updateEncoding
 */
export const getReferenceLineLabelsEncoding = (
	labelFontWeight: FontWeight | undefined,
	label: string,
	position: Position,
	positionRule: ProductionRule<NumericValueRef> | SignalRef,
	icon: string | undefined
): GuideEncodeEntry<TextEncodeEntry> => {
	const VERTICAL_OFFSET = icon ? 48 : 26; // Position label outside of icon.
	const HORIZONTAL_OFFSET = isVerticalAxis(position) && icon ? 24 : 12; // Position label outside of icon for horizontal orientation.
	const positionProps = getAdditiveMarkPositionProps(VERTICAL_OFFSET, positionRule, HORIZONTAL_OFFSET);

	return {
		update: {
			text: [
				{
					value: label,
				},
			],
			fontWeight: [
				// default to the primary label font weight
				{ value: labelFontWeight || DEFAULT_LABEL_FONT_WEIGHT },
			],
			...getEncodedLabelBaselineAlign(position),
			...positionProps[position],
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
