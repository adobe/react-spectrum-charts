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
	test('should add target label mark when targetPrefix is provided', () => {
		const propsWithPrefix: BulletSpecProps = {
			...sampleProps,
			targetPrefix: '$',
		};
		const marks = getBulletMarks(propsWithPrefix);
		// When targetPrefix is provided, we expect 5 marks instead of 4.
		expect(marks).toHaveLength(5);
		// Verify the last mark is the target label mark.
		expect(marks[4].name).toContain('targetlabel');
	});

	test('should not add target label mark when no targetPrefix or targetSuffix is provided', () => {
		const propsWithoutPrefix: BulletSpecProps = { ...sampleProps };
		const marks = getBulletMarks(propsWithoutPrefix);
		// With no target prefix/suffix, there should be only 4 marks.
		expect(marks).toHaveLength(4);
	});
	test('should include metricPrefix, numberFormat, and metricSuffix in the metric label signal', () => {
		const propsWithFormatting: BulletSpecProps = {
			...sampleProps,
			metricPrefix: '$',
			metricSuffix: 'M',
			numberFormat: '.2f',
		};

		const marks = getBulletMarks(propsWithFormatting);

		// Ensure the metric text mark exists
		expect(marks[2]).toBeDefined();

		// Ensure the encode object and text property exist
		const textEncode = marks[2]?.encode?.enter?.text;
		expect(textEncode).toBeDefined();

		// Check if textEncode is a signal reference
		if (typeof textEncode === 'object' && 'signal' in textEncode) {
			const metricMarkSignal = textEncode.signal;

			expect(metricMarkSignal).toContain("'$'");
			expect(metricMarkSignal).toContain("'.2f'");
			expect(metricMarkSignal).toContain("'M'");
		} else {
			fail('Metric label text encoding does not contain a signal reference.');
		}
	});
});
