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
import { Data, Scale, ScaleType, Spec } from 'vega';

import {
	COLOR_SCALE,
	DATE_PATH,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	FILTERED_TABLE,
	LINE_TYPE_SCALE,
	MARK_ID,
	OPACITY_SCALE,
	ROUNDED_SQUARE_PATH,
	SENTIMENT_NEGATIVE_PATH,
	SENTIMENT_NEUTRAL_PATH,
	SENTIMENT_POSITIVE_PATH,
	TABLE,
} from '@spectrum-charts/constants';
import { getColorValue } from '@spectrum-charts/themes';

import {
	ChartSpecOptions,
	ChartSymbolShape,
	ColorFacet,
	DualFacet,
	Icon,
	LineType,
	LineTypeFacet,
	LineWidth,
	NumberFormat,
	OpacityFacet,
	ScSpec,
	SymbolSize,
	SymbolSizeFacet,
} from './types';

/**
 * gets all the keys that are used to facet by
 * @param facetOptions
 * @returns facets
 */
export const getFacetsFromOptions = ({
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
		.filter((facet): facet is string => typeof facet === 'string');
	// remove duplicates
	facets = [...new Set(facets)];

	let secondaryFacets = [color, lineType, opacity]
		.map((facet) => (Array.isArray(facet) ? facet[1] : undefined))
		.filter((facet): facet is string => typeof facet === 'string');
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
		sentimentNegative: SENTIMENT_NEGATIVE_PATH,
		sentimentNeutral: SENTIMENT_NEUTRAL_PATH,
		sentimentPositive: SENTIMENT_POSITIVE_PATH,
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
	{ name: TABLE, values: [], transform: [{ type: 'identifier', as: MARK_ID }] },
	{ name: FILTERED_TABLE, source: TABLE },
];

/**
 * Merges an optionally supplied spec with Chart options and default values.
 *
 * @param spec - The spec to merge with the base spec. If none is supplied, the base spec is returned.
 * @param chartOptions - A partial set of chart options to spread on to the spec.
 * @returns Spec with default values
 */
export const initializeSpec = (spec: Spec | null = {}, chartOptions: Partial<ChartSpecOptions> = {}): ScSpec => {
	const { backgroundColor, colorScheme = 'light', description, title } = chartOptions;

	const baseSpec: ScSpec = {
		usermeta: {},
		title: title || undefined,
		description,
		autosize: { type: 'fit', contains: 'padding', resize: true },
		data: baseData,
		background: backgroundColor ? getColorValue(backgroundColor, colorScheme) : undefined,
	};

	return { ...baseSpec, ...(spec || {}) };
};

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
