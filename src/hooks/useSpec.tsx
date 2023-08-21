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
	children,
	colors,
	colorScheme,
	data,
	description,
	lineTypes,
	lineWidths,
	opacities,
	symbolShapes,
	title,
	UNSAFE_vegaSpec,
}: SanitizedSpecProps): Spec {
	return useMemo(() => {
		// They already supplied a spec, fill it in with defaults
		if (UNSAFE_vegaSpec) {
			const vegaSpecWithDefaults = initializeSpec(UNSAFE_vegaSpec, { data, description, title });

			// copy the spec so we don't mutate the original
			return JSON.parse(JSON.stringify(vegaSpecWithDefaults));
		}

		// or we need to build their spec
		return buildSpec({
			children,
			colors,
			colorScheme,
			description,
			lineTypes,
			lineWidths,
			opacities,
			symbolShapes,
			title,
		});
	}, [
		children,
		colors,
		colorScheme,
		data,
		description,
		lineTypes,
		lineWidths,
		opacities,
		symbolShapes,
		title,
		UNSAFE_vegaSpec,
	]);
}
