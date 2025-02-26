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
import { Spec } from 'vega';

import { BulletProps, BulletSpecProps } from '../../types';
import { addBullet, getBulletData, getBulletMarks, getBulletScales } from './bulletSpecBuilder';

const sampleProps: BulletSpecProps = {
	children: [],
	colorScheme: 'light',
	index: 0,
	color: 'green',
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	name: 'bullet0',
	idKey: 'rscMarkId',
};

describe('addBullet', () => {
	let spec: Spec;

	beforeEach(() => {
		spec = { data: [], marks: [], scales: [] };
	});

	test('should modify spec with bullet chart properties', () => {
		const bulletProps: BulletProps & { idKey: string } = {
			children: [],
			name: 'testBullet',
			metric: 'revenue',
			dimension: 'region',
			target: 'goal',
			idKey: 'rscMarkId',
		};

		const newSpec = addBullet(spec, bulletProps);

		const expectedScale = [
			{
				domain: [0, { signal: "data('max_values')[0].maxOverall" }],
				name: 'xscale',
				range: [0, { signal: 'width' }],
				type: 'linear',
			},
		];

		expect(newSpec.data).toHaveLength(2);
		expect(newSpec.marks).toHaveLength(4);
		expect(newSpec.scales).toEqual(expectedScale);
	});
});

describe('getBulletData', () => {
	test('should return the data object with max value being set', () => {
		const data = getBulletData(sampleProps);
		expect(data).toHaveLength(2);
	});
});

describe('getBulletScales', () => {
	//Not much here right now because the function only returns a single const
	test('should return the correct scales object', () => {
		const data = getBulletScales();
		expect(data).toBeDefined();
	});
});

describe('getBulletMarks', () => {
	test('should return the correct marks object', () => {
		const data = getBulletMarks(sampleProps);
		expect(data).toHaveLength(4);
		expect(data[0].type).toBe('rect');
		expect(data[1].type).toBe('text');
		expect(data[2].type).toBe('text');
		expect(data[3].type).toBe('rule');
	});
});
