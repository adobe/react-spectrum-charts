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
import { COLOR_SCALE, DEFAULT_COLOR, LINE_TYPE_SCALE, SYMBOL_SIZE_SCALE, TABLE } from '@constants';
import { Scale } from 'vega';

import { getFacets, getFacetsFromKeys } from './legendFacetUtils';

describe('getFacets()', () => {
	test('should correctly identify continuous and categorical facets', () => {
		const scales: Scale[] = [
			{
				name: COLOR_SCALE,
				type: 'ordinal',
				domain: { data: TABLE, fields: [DEFAULT_COLOR] },
			},
			{
				name: LINE_TYPE_SCALE,
				type: 'ordinal',
			},
			{
				name: SYMBOL_SIZE_SCALE,
				type: 'linear',
				domain: { data: TABLE, fields: ['weight'] },
			},
		];
		const { ordinalFacets, continuousFacets } = getFacets(scales);
		expect(ordinalFacets).toHaveLength(1);
		expect(continuousFacets).toHaveLength(1);
	});
});

describe('getFacetsFromKeys()', () => {
	test('should find the correct facets from the provided keys', () => {
		const scales: Scale[] = [
			{
				name: COLOR_SCALE,
				type: 'ordinal',
				domain: { data: TABLE, fields: [DEFAULT_COLOR] },
			},
			{
				name: LINE_TYPE_SCALE,
				type: 'ordinal',
			},
			{
				name: SYMBOL_SIZE_SCALE,
				type: 'linear',
				domain: { data: TABLE, fields: ['weight'] },
			},
		];
		let facets = getFacetsFromKeys(['weight'], scales);
		expect(facets.ordinalFacets).toHaveLength(0);
		expect(facets.continuousFacets).toHaveLength(1);
		facets = getFacetsFromKeys([DEFAULT_COLOR], scales);
		expect(facets.ordinalFacets).toHaveLength(1);
		expect(facets.continuousFacets).toHaveLength(0);
	});
});
