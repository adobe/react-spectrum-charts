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
import { useEffect } from 'react';

import { Config, Spec } from 'vega';

import { mergeValuesIntoData } from '../specBuilder/specUtils';
import { debugLog } from '../utils';

export const useDebugSpec = (
	debug: boolean,
	spec: Spec,
	chartData: unknown[],
	chartWidth: number,
	height: number,
	config: Config
): void => {
	useEffect(() => {
		if (debug) {
			const data = JSON.parse(JSON.stringify(spec.data));

			// Merge raw values into the Vega datasets array for a combined view of the data
			const combinedData = mergeValuesIntoData(data, chartData);

			debugLog(debug, {
				title: 'react-spectrum-charts Vega Spec',
				contents: { width: chartWidth, height, config, ...spec, data: combinedData },
			});
		}
	}, [debug, spec, chartData, chartWidth, height, config]);
};
