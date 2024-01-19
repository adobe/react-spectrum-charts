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
import {
	DEFAULT_COLOR_SCHEME,
	DEFAULT_DIMENSION_SCALE_TYPE,
	DEFAULT_LINEAR_DIMENSION,
	DEFAULT_METRIC,
	DEFAULT_SYMBOL_SIZE,
	FILTERED_TABLE,
} from '@constants';
import { getColorProductionRule, getSymbolSizeProductionRule, getXProductionRule } from '@specBuilder/marks/markUtils';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { ColorScheme, ScatterProps, ScatterSpecProps } from 'types';
import { GroupMark, Mark, Spec, SymbolMark } from 'vega';

export const addScatter = produce<Spec, [ScatterProps & { colorScheme?: ColorScheme; index?: number }]>(
	(
		spec,
		{
			children,
			color = { value: 'categorical-100' },
			colorScaleType = 'ordinal',
			colorScheme = DEFAULT_COLOR_SCHEME,
			dimension = DEFAULT_LINEAR_DIMENSION,
			dimensionScaleType = DEFAULT_DIMENSION_SCALE_TYPE,
			index = 0,
			metric = DEFAULT_METRIC,
			name,
			opacity = 0.8,
			size = { value: DEFAULT_SYMBOL_SIZE },
			...props
		}
	) => {
		const sanitizedChildren = sanitizeMarkChildren(children);
		const scatterName = toCamelCase(name || `scatter${index}`);
		// put props back together now that all the defaults have been set
		const scatterProps: ScatterSpecProps = {
			children: sanitizedChildren,
			color,
			colorScaleType,
			colorScheme,
			dimension,
			dimensionScaleType,
			index,
			metric,
			name: scatterName,
			opacity,
			size,
			...props,
		};

		spec.marks = addScatterMarks(spec.marks ?? [], scatterProps);
	}
);

export const addScatterMarks = produce<Mark[], [ScatterSpecProps]>((marks, props) => {
	const { color, name, size } = props;

	const { facets } = getFacetsFromProps({ color, size });

	const scatterGroup: GroupMark = {
		name: `${name}_group`,
		type: 'group',
		from: {
			facet: {
				name: `${name}_facet`,
				data: FILTERED_TABLE,
				groupby: facets,
			},
		},
		marks: [getScatterMark(props)],
	};

	marks.push(scatterGroup);
});

export const getScatterMark = ({
	color,
	colorScheme,
	dimension,
	dimensionScaleType,
	metric,
	name,
	opacity,
	size,
}: ScatterSpecProps): SymbolMark => ({
	name,
	type: 'symbol',
	from: {
		data: FILTERED_TABLE,
	},
	encode: {
		update: {
			size: getSymbolSizeProductionRule(size),
			opacity: [{ value: opacity }],
			shape: { value: 'circle' },
			fill: getColorProductionRule(color, colorScheme),
			x: getXProductionRule(dimensionScaleType, dimension),
			y: { scale: 'yLinear', field: metric },
		},
	},
});
