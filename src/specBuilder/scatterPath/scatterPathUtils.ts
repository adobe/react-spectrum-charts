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
import { ScatterPath } from '@components/ScatterPath';
import {
	DEFAULT_OPACITY_RULE,
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	HIGHLIGHT_CONTRAST_RATIO,
	SELECTED_ITEM,
	SELECTED_SERIES,
	SYMBOL_PATH_WIDTH_SCALE,
} from '@constants';
import { getXProductionRule } from '@specBuilder/marks/markUtils';
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import { getColorValue, getFacetsFromProps, getLineWidthPixelsFromLineWidth } from '@specBuilder/specUtils';
import { GroupMark, NumericValueRef, Scale, TrailMark } from 'vega';

import {
	LineWidthFacet,
	ScatterPathElement,
	ScatterPathProps,
	ScatterPathSpecProps,
	ScatterSpecProps,
} from '../../types';

/**
 * Gets the path spec props, applying defaults.
 * @param scatterPathProps
 * @param index
 * @param markName
 * @param colorScheme
 * @returns ScatterPathSpecProps
 */
export const getScatterPathSpecProps = (
	{ color = 'gray-500', groupBy, pathWidth = { value: 'M' }, opacity = 0.5, ...scatterPathProps }: ScatterPathProps,
	index: number,
	{
		color: scatterColor,
		colorScheme,
		dimension,
		dimensionScaleType,
		lineType,
		metric,
		name: scatterName,
		opacity: scatterOpacity,
		size,
	}: ScatterSpecProps
): ScatterPathSpecProps => {
	const { facets } = getFacetsFromProps({ color: scatterColor, lineType, size, opacity: scatterOpacity });
	return {
		color,
		colorScheme,
		dimension,
		dimensionScaleType,
		groupBy: groupBy ?? facets,
		metric,
		index,
		pathWidth,
		name: `${scatterName}Path${index}`,
		opacity,
		...scatterPathProps,
	};
};

/**
 * Gets all the paths on a scatter
 * @param scatterProps
 * @returns ScatterPathSpecProps[]
 */
export const getScatterPaths = (scatterProps: ScatterSpecProps): ScatterPathSpecProps[] => {
	const pathElements = scatterProps.children.filter((child) => child.type === ScatterPath) as ScatterPathElement[];
	return pathElements.map((path, index) => getScatterPathSpecProps(path.props, index, scatterProps));
};

/**
 * Sets the scales up for the scatter path marks
 * Note: This mutates the scales array so it should only be called from an immer produce function
 * @param scales
 * @param scatterProps
 */
export const setScatterPathScales = (scales: Scale[], scatterProps: ScatterSpecProps) => {
	const paths = getScatterPaths(scatterProps);

	paths.forEach((path) => {
		addFieldToFacetScaleDomain(scales, SYMBOL_PATH_WIDTH_SCALE, path.pathWidth);
	});
};

export const getScatterPathMarks = (scatterProps: ScatterSpecProps): GroupMark[] => {
	const marks: GroupMark[] = [];
	const paths = getScatterPaths(scatterProps);

	paths.forEach((path) => {
		const { groupBy, name } = path;
		marks.push({
			name: `${name}_group`,
			type: 'group',
			from: {
				facet: {
					name: `${name}_facet`,
					data: FILTERED_TABLE,
					groupby: groupBy,
				},
			},
			marks: [getScatterPathTrailMark(path)],
		});
	});

	return marks;
};

export const getScatterPathTrailMark = ({
	color,
	colorScheme,
	dimension,
	dimensionScaleType,
	pathWidth,
	metric,
	name,
	opacity,
}: ScatterPathSpecProps): TrailMark => {
	return {
		name,
		type: 'trail',
		from: { data: `${name}_facet` },
		encode: {
			enter: {
				fill: {
					value: getColorValue(color, colorScheme),
				},
				fillOpacity: { value: opacity },
				size: getPathWidth(pathWidth),
			},
			update: {
				opacity: getOpacity(),
				x: getXProductionRule(dimensionScaleType, dimension),
				y: { scale: 'yLinear', field: metric },
			},
		},
	};
};

/**
 * Gets the opacity production rule for the scatterPath trail marks.
 * This is used for highlighting trails on hover and selection.
 * @param scatterProps ScatterSpecProps
 * @returns opacity production rule
 */
export const getOpacity = (): ({ test?: string } & NumericValueRef)[] => {
	// if a point is hovered or selected, all other points should be reduced opacity
	const fadedValue = 1 / HIGHLIGHT_CONTRAST_RATIO;

	return [
		{
			test: `${HIGHLIGHTED_SERIES} || ${HIGHLIGHTED_ITEM} || ${SELECTED_SERIES} || ${SELECTED_ITEM}`,
			value: fadedValue,
		},
		DEFAULT_OPACITY_RULE,
	];
};

export const getPathWidth = (pathWidth: LineWidthFacet): NumericValueRef => {
	if (typeof pathWidth === 'string') {
		return { scale: SYMBOL_PATH_WIDTH_SCALE, field: pathWidth };
	}
	return { value: getLineWidthPixelsFromLineWidth(pathWidth.value) };
};
