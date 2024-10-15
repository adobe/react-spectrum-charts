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
import { DEFAULT_TIME_DIMENSION, DEFAULT_TRANSFORMED_TIME_DIMENSION, TABLE } from '@constants';

import { addTimeTransform, getSeriesIdTransform, getTableData } from './dataUtils';

describe('addTimeTransform()', () => {
	test('should return the time transforms', () => {
		const inputTransforms = [];
		const dimension = 'datetime';
		const outputTransforms = [
			{
				type: 'formula',
				expr: `toDate(datum[\"${dimension}\"])`,
				as: dimension,
			},
			{
				type: 'timeunit',
				field: dimension,
				units: ['year', 'month', 'date', 'hours', 'minutes'],
				as: [DEFAULT_TRANSFORMED_TIME_DIMENSION, `${DEFAULT_TIME_DIMENSION}1`],
			},
		];
		expect(addTimeTransform(inputTransforms, dimension)).toEqual(outputTransforms);
	});
});

describe('getTableData()', () => {
	test('should return the table data', () => {
		const data = [
			{ name: TABLE, values: [] },
			{ name: 'other', values: [] },
		];
		expect(getTableData(data)).toEqual(data[0]);
	});
});

describe('getSeriesIdTransform()', () => {
	test('should return empty array if there are not any facets', () => {
		expect(getSeriesIdTransform([])).toEqual([]);
	});
	test('should return facets joined as expression', () => {
		expect(getSeriesIdTransform(['facet1', 'facet2'])[0]).toHaveProperty(
			'expr',
			'datum.facet1 + " | " + datum.facet2'
		);
	});
});
