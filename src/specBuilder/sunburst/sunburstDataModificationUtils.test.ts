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
import { Datum } from 'vega';

import { createLeafValues } from './sunburstDataModificationUtils';

describe('createLeafValues', () => {
	test('should correctly calculate childSum and leafValue', () => {
		const data: Datum[] = [
			{ id: '1', metric: 10 },
			{ id: '2', parent: '1', metric: 3 },
			{ id: '3', parent: '1', metric: 2 },
			{ id: '4', parent: '2', metric: 1 },
		];

		createLeafValues(data, 'id', 'parent', 'metric');

		expect(data[0]).toEqual({
			id: '1',
			metric: 10,
			metric_childSum: 5,
			metric_leafValue: 5,
		});

		expect(data[1]).toEqual({
			id: '2',
			parent: '1',
			metric: 3,
			metric_childSum: 1,
			metric_leafValue: 2,
		});

		expect(data[2]).toEqual({
			id: '3',
			parent: '1',
			metric: 2,
			metric_childSum: 0,
			metric_leafValue: 2,
		});

		expect(data[3]).toEqual({
			id: '4',
			parent: '2',
			metric: 1,
			metric_childSum: 0,
			metric_leafValue: 1,
		});
	});

	test('should set leafValue to 0 if it is negative', () => {
		const data: Datum[] = [
			{ id: '1', parent: null, metric: 2 },
			{ id: '2', parent: '1', metric: 3 },
		];

		createLeafValues(data, 'id', 'parent', 'metric');

		expect(data[0]).toEqual({
			id: '1',
			parent: null,
			metric: 2,
			metric_childSum: 3,
			metric_leafValue: 0,
		});

		expect(data[1]).toEqual({
			id: '2',
			parent: '1',
			metric: 3,
			metric_childSum: 0,
			metric_leafValue: 3,
		});
	});
});
