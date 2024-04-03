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
import { useMemo } from 'react';

import { SanitizedSpecProps } from 'types';
import { Spec } from 'vega';

import { buildSpec } from '../specBuilder';
import { initializeSpec } from '../specBuilder/specUtils';

export default function useSpec({
	backgroundColor,
	children,
	colors,
	colorScheme,
	data,
	previousData,
	animations,
	animateFromZero,
	description,
	hiddenSeries,
	highlightedSeries,
	lineTypes,
	lineWidths,
	opacities,
	symbolShapes,
	symbolSizes,
	title,
	UNSAFE_vegaSpec,
}: SanitizedSpecProps): Spec {
	return useMemo(() => {
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
			return JSON.parse(JSON.stringify(vegaSpecWithDefaults));
		}

		// or we need to build their spec
		// stringify-parse so that all immer stuff gets cleared out
		return JSON.parse(
			JSON.stringify(
				buildSpec({
					backgroundColor,
					children,
					colors,
					data,
					previousData,
					animations,
					animateFromZero,
					colorScheme,
					description,
					hiddenSeries,
					highlightedSeries,
					lineTypes,
					lineWidths,
					opacities,
					symbolShapes,
					symbolSizes,
					title,
				})
			)
		);
	}, [
		backgroundColor,
		children,
		colors,
		colorScheme,
		data,
		previousData,
		animations,
		animateFromZero,
		description,
		hiddenSeries,
		highlightedSeries,
		lineTypes,
		lineWidths,
		opacities,
		symbolShapes,
		symbolSizes,
		title,
		UNSAFE_vegaSpec,
	]);
}
