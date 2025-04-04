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
import { addBullet } from './bulletSpecBuilder';

export const samplePropsColumn: BulletSpecProps = {
	children: [],
	colorScheme: 'light',
	index: 0,
	color: 'green',
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	name: 'bullet0',
	idKey: 'rscMarkId',
	direction: 'column',
	showTarget: true,
	showTargetValue: false,
	labelPosition: 'top',
	scaleType: 'normal',
	maxScaleValue: 100,
	track: false,
	thresholdBarColor: false,
	metricAxis: false,
};

export const samplePropsRow: BulletSpecProps = {
	children: [],
	colorScheme: 'light',
	index: 0,
	color: 'green',
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	name: 'bullet0',
	idKey: 'rscMarkId',
	direction: 'row',
	showTarget: true,
	showTargetValue: false,
	labelPosition: 'top',
	scaleType: 'normal',
	maxScaleValue: 100,
	track: false,
	thresholdBarColor: false,
	metricAxis: false
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

		expect(newSpec).toBeDefined();
		expect(newSpec).toHaveProperty('data');
		expect(newSpec).toHaveProperty('marks');
		expect(newSpec).toHaveProperty('scales');
		expect(newSpec).toHaveProperty('signals');
	});
});
