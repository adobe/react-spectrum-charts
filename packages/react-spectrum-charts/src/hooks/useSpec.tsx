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
import { useEffect, useMemo, useRef } from 'react';

import { Data, Spec, ValuesData } from 'vega';

import { getColorValue } from '@spectrum-charts/themes';
import { ChartData, ChartSpecOptions, baseData, buildSpec } from '@spectrum-charts/vega-spec-builder';

import { Venn } from '../alpha';
import { rscPropsToSpecBuilderOptions } from '../rscToSbAdapter';
import { SanitizedSpecProps } from '../types';
import { chartHasChild } from '../utils';

export default function useSpec({
	backgroundColor,
	chartHeight,
	chartWidth,
	children,
	colors,
	colorScheme,
	data,
	description,
	hiddenSeries,
	highlightedItem,
	highlightedSeries,
	idKey,
	lineTypes,
	lineWidths,
	opacities,
	symbolShapes,
	symbolSizes,
	title,
	UNSAFE_vegaSpec,
}: SanitizedSpecProps): Spec {
	const prevSpec = useRef<Spec | null>(null);
	const hasVenn = useMemo(() => chartHasChild({ children, displayName: Venn.displayName as string }), [children]);

  // invalidate cache if changes to props other than width, height change
	useEffect(() => {
    prevSpec.current = null
	}, [
		UNSAFE_vegaSpec,
		backgroundColor,
		children,
		colors,
		colorScheme,
		description,
		hiddenSeries,
		highlightedItem,
		highlightedSeries,
		idKey,
		lineTypes,
		lineWidths,
		opacities,
		symbolShapes,
		symbolSizes,
		title,
		data,
	]);

	return useMemo(() => {
		// returned cached spec if there is a cached spec and if venn is not a child element
		if (!hasVenn && prevSpec.current !== null) {
			return prevSpec.current;
		}

		// They already supplied a spec, fill it in with defaults
		if (UNSAFE_vegaSpec) {
			const vegaSpecWithDefaults = initializeSpec(UNSAFE_vegaSpec, {
				backgroundColor,
				colorScheme,
				data,
				description,
				title,
			});

			// copy the spec so we don't mutate the original
			const spec = JSON.parse(JSON.stringify(vegaSpecWithDefaults));
			prevSpec.current = spec;
			return spec;
		}

		// or we need to build their spec
		const chartOptions = rscPropsToSpecBuilderOptions({
			backgroundColor,
			chartHeight,
			chartWidth,
			children,
			colorScheme,
			colors,
			data,
			description,
			hiddenSeries,
			highlightedItem,
			highlightedSeries,
			idKey,
			lineTypes,
			lineWidths,
			opacities,
			symbolShapes,
			symbolSizes,
			title,
		});

		// stringify-parse so that all immer stuff gets cleared out
		const spec = JSON.parse(JSON.stringify(buildSpec(chartOptions)));
		prevSpec.current = spec;

		return spec;
	}, [
		UNSAFE_vegaSpec,
		backgroundColor,
		children,
		colors,
		colorScheme,
		description,
		hiddenSeries,
		highlightedItem,
		highlightedSeries,
		idKey,
		lineTypes,
		lineWidths,
		opacities,
		symbolShapes,
		symbolSizes,
		title,
		data,
		chartHeight,
		chartWidth,
		hasVenn,
	]);
}

const initializeSpec = (
	spec: Spec | null = {},
	chartOptions: Partial<ChartSpecOptions & { data: ChartData[] }> = {}
): Spec => {
	const { backgroundColor, colorScheme = 'light', data, description, title } = chartOptions;

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
const isVegaValuesDataset = (dataset): dataset is ValuesData => Array.isArray(dataset.values);

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
