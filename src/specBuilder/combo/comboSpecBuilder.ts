/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { DEFAULT_COLOR_SCHEME, DEFAULT_TIME_DIMENSION } from '@constants';
import { Bar, Line } from '@rsc';
import { addBar } from '@specBuilder/bar/barSpecBuilder';
import { addLine } from '@specBuilder/line/lineSpecBuilder';
import { combineElementNames, sanitizeRscChartChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Spec } from 'vega';

import {
	BarElement,
	ChartChildElement,
	ColorScheme,
	ComboChildElement,
	ComboProps,
	HighlightedItem,
	LineElement,
} from '../../types';

export const addCombo = produce<
	Spec,
	[ComboProps & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>(
	(
		spec,
		{
			children = [],
			colorScheme = DEFAULT_COLOR_SCHEME,
			highlightedItem,
			idKey,
			index = 0,
			name,
			dimension = DEFAULT_TIME_DIMENSION,
		}
	) => {
		const buildOrder = new Map();
		buildOrder.set(Bar, 0);
		buildOrder.set(Line, 0);

		let { barCount, lineCount } = initializeComponentCounts();
		const sanitizedChildren = sanitizeRscChartChildren(children);
		const comboName = toCamelCase(name || `combo${index}`);

		spec = [...sanitizedChildren]
			.sort((a, b) => buildOrder.get(a.type) - buildOrder.get(b.type))
			.reduce((acc: Spec, cur) => {
				const displayName = getDisplayName(cur);
				const barElement = cur as BarElement;
				const lineElement = cur as LineElement;
				switch (displayName) {
					case Bar.displayName:
						barCount++;
						return addBar(acc, {
							...barElement.props,
							colorScheme,
							highlightedItem,
							idKey,
							index: barCount,
							name: getComboChildName(barElement, comboName, barCount),
							dimension: getDimension(barElement, dimension),
						});
					case Line.displayName:
						lineCount++;
						return addLine(acc, {
							...lineElement.props,
							colorScheme,
							highlightedItem,
							idKey,
							index: lineCount,
							name: getComboChildName(lineElement, comboName, lineCount),
							dimension: getDimension(lineElement, dimension),
						});
					default:
						console.error(`Invalid component type: ${displayName} is not a supported <Combo> child`);
						return acc;
				}
			}, spec);

		return spec;
	}
);

const initializeComponentCounts = () => {
	return { barCount: -1, lineCount: -1 };
};

export const getComboChildName = (cur: ComboChildElement, comboName: string, index: number) => {
	if (cur.props.name) {
		return cur.props.name;
	}
	const displayName = getDisplayName(cur);
	const combinedElementName = combineElementNames(comboName, `${displayName}${index}`);
	console.log(combinedElementName)
	return combinedElementName
};``

const getDisplayName = (cur: ChartChildElement) => (cur.type as React.ComponentType).displayName;

const getDimension = (cur: ComboChildElement, dimension?: string) => cur.props.dimension ?? dimension;
