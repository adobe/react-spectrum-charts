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

//Test comment
import {
	DEFAULT_COLOR_SCHEME,
	DEFAULT_DIMENSION_SCALE_TYPE,
	DEFAULT_LINEAR_DIMENSION,
	DEFAULT_METRIC,
	FILTERED_TABLE,
} from '@constants';
import { addTimeTransform, getTableData } from '@specBuilder/data/dataUtils';
import { getColorProductionRule, getSymbolSizeProductionRule, getXProductionRule } from '@specBuilder/marks/markUtils';
import {
	addContinuousDimensionScale,
	addFieldToFacetScaleDomain,
	addMetricScale,
} from '@specBuilder/scale/scaleSpecBuilder';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { ColorScheme, ScatterProps, ScatterSpecProps } from 'types';
import { Data, GroupMark, Mark, Scale, Spec, SymbolMark } from 'vega';

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
			opacity = 1,
			size = { value: 'M' },
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

		spec.data = addData(spec.data ?? [], scatterProps);
		spec.scales = addScales(spec.scales ?? [], scatterProps);
		spec.marks = addScatterMarks(spec.marks ?? [], scatterProps);
	}
);

export const addData = produce<Data[], [ScatterSpecProps]>((data, { dimension, dimensionScaleType }) => {
	if (dimensionScaleType === 'time') {
		const tableData = getTableData(data);
		tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
	}
});

export const addScales = produce<Scale[], [ScatterSpecProps]>((scales, props) => {
	const { color, dimension, dimensionScaleType, metric } = props;
	// add dimension scale
	addContinuousDimensionScale(scales, { scaleType: dimensionScaleType, dimension });
	// add metric scale
	addMetricScale(scales, [metric]);
	// add color to the color domain
	addFieldToFacetScaleDomain(scales, 'color', color);
});

export const addScatterMarks = produce<Mark[], [ScatterSpecProps]>((marks, props) => {
	const { name } = props;

	const scatterGroup: GroupMark = {
		name: `${name}_group`,
		type: 'group',
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
		enter: {
			/**
			 * the blend mode makes it possible to tell when there are overlapping points
			 * in light mode, the points are darker when they overlap (multiply)
			 * in dark mode, the points are lighter when they overlap (screen)
			 */
			blend: { value: colorScheme === 'light' ? 'multiply' : 'screen' },
			fillOpacity: [{ value: opacity }],
			shape: { value: 'circle' },
		},
		update: {
			size: getSymbolSizeProductionRule(size),
			fill: getColorProductionRule(color, colorScheme),
			x: getXProductionRule(dimensionScaleType, dimension),
			y: { scale: 'yLinear', field: metric },
		},
	},
});
