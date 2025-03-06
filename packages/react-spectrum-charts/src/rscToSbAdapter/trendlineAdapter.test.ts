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
import { createElement } from 'react';

import { ChartTooltip } from '../components/ChartTooltip';
import { TrendlineAnnotation } from '../components/TrendlineAnnotation';
import { DEFAULT_COLOR } from '../constants';
import { getTrendlineOptions } from './trendlineAdapter';

describe('getTrendlineOptions()', () => {
	it('should return all basic options', () => {
		const options = getTrendlineOptions({});
		expect(options.chartTooltips).toHaveLength(0);
		expect(options.trendlineAnnotations).toHaveLength(0);
	});
	it('should convert tooltip children to chartTooltips array', () => {
		const options = getTrendlineOptions({ children: [createElement(ChartTooltip)] });
		expect(options.chartTooltips).toHaveLength(1);
	});
	it('should convert trendline annotation children to trendlineAnnotations array', () => {
		const options = getTrendlineOptions({ children: [createElement(TrendlineAnnotation)] });
		expect(options.trendlineAnnotations).toHaveLength(1);
	});
	it('should pass through included props', () => {
		const options = getTrendlineOptions({ color: DEFAULT_COLOR });
		expect(options).toHaveProperty('color', DEFAULT_COLOR);
	});
	it('should not add props that are not provided', () => {
		const options = getTrendlineOptions({});
		expect(options).not.toHaveProperty('color');
	});
});
