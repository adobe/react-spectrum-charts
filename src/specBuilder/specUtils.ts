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
import { useEffect, useRef } from 'react';

import { spectrumColors } from '@themes';
import { DATE_PATH, ROUNDED_SQUARE_PATH } from 'svgPaths';
import {
	ChartData,
	ChartSymbolShape,
	ColorFacet,
	ColorScheme,
	DualFacet,
	Icon,
	LineType,
	LineTypeFacet,
	LineWidth,
	NumberFormat,
	OpacityFacet,
	SpectrumColor,
	SymbolSize,
	SymbolSizeFacet,
} from 'types';
import { Data, Scale, ScaleType, Spec, ValuesData } from 'vega';

import {
	ANIMATION_FUNCTION,
	COLOR_SCALE,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	FILTERED_PREVIOUS_TABLE,
	FILTERED_TABLE,
	LINE_TYPE_SCALE,
	MARK_ID,
	OPACITY_SCALE,
	PREVIOUS_TABLE,
	TABLE,
} from '../constants';
import { SanitizedSpecProps } from '../types';
import { getIdentifierTransform } from './data/dataUtils';

/**
 * gets all the keys that are used to facet by
 * @param facetProps
 * @returns facets
 */
export const getFacetsFromProps = ({
	color,
	lineType,
	opacity,
	size,
}: {
	color?: ColorFacet | DualFacet;
	lineType?: LineTypeFacet | DualFacet;
	opacity?: OpacityFacet | DualFacet;
	size?: SymbolSizeFacet;
}): { facets: string[]; secondaryFacets: string[] } => {
	// get all the keys that we need to facet by
	// filter out the ones that use static values instead of fields
	let facets = [color, lineType, opacity, size]
		.map((facet) => (Array.isArray(facet) ? facet[0] : facet))
		.filter((facet) => typeof facet === 'string') as string[];
	// remove duplicates
	facets = [...new Set(facets)];

	let secondaryFacets = [color, lineType, opacity]
		.map((facet) => (Array.isArray(facet) ? facet[1] : undefined))
		.filter((facet) => typeof facet === 'string') as string[];
	// remove duplicates
	secondaryFacets = [...new Set(secondaryFacets)];

	return { facets, secondaryFacets };
};

/**
 * gets all the keys that have been used to facet the data into series from the scales
 * @param scales
 * @returns
 */
export const getFacetsFromScales = (scales: Scale[] = []): string[] => {
	const facets = [
		COLOR_SCALE,
		LINE_TYPE_SCALE,
		OPACITY_SCALE,
		'secondaryColor',
		'secondaryLineType',
		'secondaryOpacity',
	].reduce((acc, cur) => {
		const scale = scales.find((scale) => scale.name === cur);
		if (scale?.domain && 'fields' in scale.domain && scale.domain.fields.length) {
			return [...acc, scale.domain.fields[0].toString()];
		}
		return acc;
	}, [] as string[]);

	// only want the unique facets
	return [...new Set(facets)];
};

/**
 * gets the css color string from a spectrum color or a css color string
 * @param color
 * @param colorScheme
 * @returns css color string
 */
export const getColorValue = (color: SpectrumColor | string, colorScheme: ColorScheme): string => {
	return spectrumColors[colorScheme][color] || color;
};

/**
 * gets the strokeDash array from the lineType
 * @param lineType
 * @returns strokeDash array
 */
export const getStrokeDashFromLineType = (lineType: LineType): number[] => {
	if (Array.isArray(lineType)) {
		return lineType;
	}
	switch (lineType) {
		case 'dashed':
			return [7, 4];
		case 'dotted':
			return [2, 3];
		case 'dotDash':
			return [2, 3, 7, 4];
		case 'shortDash':
			return [3, 4];
		case 'longDash':
			return [11, 4];
		case 'twoDash':
			return [5, 2, 11, 2];
		case 'solid':
		default:
			return [];
	}
};

/**
 * gets the line width pixel value from the lineWidth
 * @param lineWidth
 * @returns line width pixel value
 */
export const getLineWidthPixelsFromLineWidth = (lineWidth: LineWidth): number => {
	if (typeof lineWidth === 'number') {
		return lineWidth;
	}

	switch (lineWidth) {
		case 'XS':
			return 1;
		case 'S':
			return 1.5;
		case 'L':
			return 3;
		case 'XL':
			return 4;
		case 'M':
		default:
			return 2;
	}
};

/**
 * get the SVG path for the symbol shape
 * @param symbolShape supported shape name or custom SVG path
 * @returns SVG path
 */
export const getPathFromSymbolShape = (symbolShape: ChartSymbolShape): string => {
	if (symbolShape === 'rounded-square') return ROUNDED_SQUARE_PATH;
	return symbolShape;
};

/**
 * gets the strokeDash array from the lineType
 * @param icon
 * @returns strokeDash array
 */
export const getPathFromIcon = (icon: Icon | string): string => {
	const supportedIcons: { [key in Icon]: string } = {
		date: DATE_PATH,
	};
	return supportedIcons[icon] || icon;
};

/**
 * Converts a symbolSize to the vega size
 * RSC uses the width of the symbol to determine the size
 * Vega uses the area of the symbol to determine the size
 * @param symbolSize
 * @returns size in square pixels
 */
export const getVegaSymbolSizeFromRscSymbolSize = (symbolSize: SymbolSize): number => {
	return Math.pow(getSymbolWidthFromRscSymbolSize(symbolSize), 2);
};

/**
 * Gets the width of the symbol or trail from the symbolSize
 * @param symbolSize
 * @returns width in pixels
 */
export const getSymbolWidthFromRscSymbolSize = (symbolSize: SymbolSize): number => {
	if (typeof symbolSize === 'number') {
		return symbolSize;
	}

	switch (symbolSize) {
		case 'XS':
			return 6;
		case 'S':
			return 8;
		case 'L':
			return 12;
		case 'XL':
			return 16;
		case 'M':
		default:
			return 10;
	}
};

/**
 * base data that gets initialized with every uncontrolled spec
 */
export const baseData: Data[] = [
	{ name: TABLE, values: [], transform: [getIdentifierTransform()] },
	{ name: FILTERED_TABLE, source: TABLE },
	{ name: PREVIOUS_TABLE, values: [], transform: [getIdentifierTransform()] },
	{ name: FILTERED_PREVIOUS_TABLE, source: PREVIOUS_TABLE },
];

/**
 * Merges an optionally supplied spec with Chart props and default values.
 *
 * @param spec - The spec to merge with the base spec. If none is supplied, the base spec is returned.
 * @param chartProps - A partial set of chart props to spread on to the spec.
 * @returns Spec with default values
 */
export const initializeSpec = (spec: Spec | null = {}, chartProps: Partial<SanitizedSpecProps> = {}): Spec => {
	const { backgroundColor, colorScheme = 'light', data, description, title } = chartProps;

	const baseSpec: Spec = {
		title: title || undefined,
		description,
		autosize: { type: 'fit', contains: 'padding', resize: true },
		data: isVegaData(data) ? data : baseData,
		background: backgroundColor ? getColorValue(backgroundColor, colorScheme) : undefined,
	};

	return { ...baseSpec, ...(spec || {}) };
};

/**
 * Check to see if an element in the data array is a Vega ValuesData object. Otherwise, treat it as
 * a normal array of values.
 * @param dataset An item in the data array we'll use to check if it's a Vega ValuesData object
 * @returns True if it's a Vega ValuesData object, false if it's a normal data object
 */
export const isVegaValuesDataset = (dataset): dataset is ValuesData => Array.isArray(dataset.values);

/**
 * Check to see if the data array is an array of Vega datasets instead of an array of values.
 * @param data The data array to check
 * @returns True if it's an array of Vega datasets, false if it's an array of values
 */
export const isVegaData = (data): data is Data[] => data?.length && isVegaValuesDataset(data[0]);

/**
 * The inverse of `mergeValuesIntoData`. Given an array of Vega datasets, extract the values from
 * each dataset and return an object of key/value pairs where the key is the dataset name and the
 * value is the array of values.
 * @param data An array of Vega datasets with values contained within
 * @returns An object of key/value pairs where the key is the dataset name and the value is the
 * array of values
 */
export const extractValues = (data) =>
	data.reduce((memo, dataset) => {
		if (isVegaValuesDataset(dataset)) {
			const { name, values } = dataset;
			memo[name] = values;
		}
		return memo;
	}, {});

/**
 * The inverse of `extractValues`. Given an array of Vega datasets and an object of key/value pairs
 * merge the values into the datasets.
 * @param data An array of Vega datasets
 * @param values An object of key/value pairs where the key is the dataset name and the value is
 * the array of values
 * @returns An array of Vega datasets with the values from the values object merged in
 */
export const mergeValuesIntoData = (data, values) => {
	return data.map((dataset) => {
		const datasetValues = values[dataset.name];
		if (datasetValues) {
			dataset.values = datasetValues;
		}
		return dataset;
	});
};

/**
 * returns the correct data field to use as the dimension
 * @param dimension
 * @param scaleType
 * @returns string
 */
export const getDimensionField = (dimension: string, scaleType?: ScaleType) => {
	return scaleType === 'time' ? DEFAULT_TRANSFORMED_TIME_DIMENSION : dimension;
};

/**
 * Gets the d3 format specifier for named number formats.
 * shortNumber and shortCurrency are not included since these require additional logic
 * @param numberFormat
 * @returns
 */
export const getD3FormatSpecifierFromNumberFormat = (numberFormat: NumberFormat | string): string => {
	switch (numberFormat) {
		case 'currency':
			return '$,.2f'; // currency format
		case 'standardNumber':
			return ','; // standard number format
		default:
			return numberFormat;
	}
};

export const usePreviousChartData = <T>(data: T) => {
	const ref = useRef<T>();
	useEffect(() => {
		ref.current = data;
	}, [data]);

	return ref.current;
};

export const getAnimationMarks = (
	dimension: string,
	metric: string,
	data?: ChartData[],
	previousData?: ChartData[],
	scale = 'yLinear'
) => {
	const easingFunction = ANIMATION_FUNCTION;

	let markUpdate = {
		scale,
		signal: `datum.${metric} * ${easingFunction}`,
	};

	if (data && previousData) {
		const hasSameDimensions =
			data !== previousData &&
			data.every((d) => previousData.some((pd) => d[dimension] === pd[dimension])) &&
			data.length == previousData.length;
		if (hasSameDimensions) {
			// If data isn't similar enough, keep the animation from zero as shown above
			const datumVal = `(datum.${MARK_ID} + length(data('${FILTERED_PREVIOUS_TABLE}')))`;
			markUpdate = {
				scale,
				signal: `(data('${FILTERED_PREVIOUS_TABLE}')[indexof(pluck(data('${FILTERED_PREVIOUS_TABLE}'), '${MARK_ID}'), ${datumVal})].${metric} * (1 - ${easingFunction})) + (datum.${metric} * ${easingFunction})`,
			};
		}
	}
	return markUpdate;
};
