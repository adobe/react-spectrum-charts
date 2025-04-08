/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ScatterOptions } from '@spectrum-charts/vega-spec-builder';

import { ScatterProps } from '../types';
import { childrenToOptions } from './childrenAdapter';

export const getScatterOptions = ({ children, ...scatterProps }: ScatterProps): ScatterOptions => {
	const { chartPopovers, chartTooltips, scatterPaths, trendlines } = childrenToOptions(children);
	return {
		...scatterProps,
		chartPopovers,
		chartTooltips,
		markType: 'scatter',
		scatterPaths,
		trendlines,
	};
};
