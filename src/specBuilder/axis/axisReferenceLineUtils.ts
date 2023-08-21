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
import { getColorValue, getPathFromIcon } from '@specBuilder/specUtils';
import { toArray } from '@utils';
import { AxisChildElement, AxisSpecProps, Children, Position, ReferenceLineElement, ReferenceLineProps } from 'types';
import { EncodeEntry, Mark, RuleMark, ScaleType, SymbolMark } from 'vega';

export const getReferenceLinesFromChildren = (
	children: Children<AxisChildElement> | undefined
): ReferenceLineProps[] => {
	const childrenArray = toArray(children);
	const referenceLines = childrenArray.filter(
		(child) => typeof child === 'object' && 'type' in child && child.type === ReferenceLine
	) as ReferenceLineElement[];
	return referenceLines.map((referenceLineElement) => referenceLineElement.props);
};

export const scaleTypeSupportsRefenceLines = (scaleType: ScaleType | undefined): boolean => {
	const supportedScaleTypes: ScaleType[] = ['linear', 'point', 'time', 'utc'];
	return Boolean(scaleType && supportedScaleTypes.includes(scaleType));
};

export const getReferenceLineMarks = (
	axisProps: AxisSpecProps,
	referenceLineProps: ReferenceLineProps,
	referenceLineIndex: number,
	scaleName: string
): Mark[] => {
	return [
		getReferenceLineRuleMark(axisProps, referenceLineProps, referenceLineIndex, scaleName),
		...getReferenceLineSymbolMark(axisProps, referenceLineProps, referenceLineIndex, scaleName),
	];
};

export const getReferenceLineRuleMark = (
	{ name, position, ticks }: AxisSpecProps,
	{ value }: ReferenceLineProps,
	referenceLineIndex: number,
	scaleName: string
): RuleMark => {
	const orientation = ['left', 'right'].includes(position) ? 'Y' : 'X';

	const startOffset = ticks ? 9 : 0;

	const positionProps: { [key in Position]: Partial<EncodeEntry> } = {
		top: {
			x: { scale: scaleName, value },
			y: { value: -startOffset },
			y2: { signal: 'height' },
		},
		bottom: {
			x: { scale: scaleName, value },
			y: { value: 0 },
			y2: { signal: `height + ${startOffset}` },
		},
		left: {
			x: { value: -startOffset },
			x2: { signal: 'width' },
			y: { scale: scaleName, value },
		},
		right: {
			x: { value: 0 },
			x2: { signal: `width + ${startOffset}` },
			y: { scale: scaleName, value },
		},
	};

	return {
		name: `${name}${orientation}ReferenceLineRule${referenceLineIndex}`,
		type: 'rule',
		interactive: false,
		encode: {
			update: {
				...positionProps[position],
			},
		},
	};
};

export const getReferenceLineSymbolMark = (
	{ colorScheme, name, position }: AxisSpecProps,
	{ icon, value }: ReferenceLineProps,
	referenceLineIndex: number,
	scaleName: string
): SymbolMark[] => {
	if (!icon) return [];
	const orientation = ['left', 'right'].includes(position) ? 'Y' : 'X';

	// offset the icon from the edge of the chart area
	const OFFSET = 24;
	const positionProps: { [key in Position]: Partial<EncodeEntry> } = {
		top: {
			x: { scale: scaleName, value },
			y: { value: -OFFSET },
		},
		bottom: {
			x: { scale: scaleName, value },
			y: { signal: `height + ${OFFSET}` },
		},
		left: {
			x: { value: -OFFSET },
			y: { scale: scaleName, value },
		},
		right: {
			x: { signal: `width + ${OFFSET}` },
			y: { scale: scaleName, value },
		},
	};

	return [
		{
			name: `${name}${orientation}ReferenceLineSymbol${referenceLineIndex}`,
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
