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
import { BulletThresholdConfig } from '../../types';
import { ThresholdBackground } from '../../types';
import { samplePropsRow } from './bulletSpecBuilder.test';
import { getThresholdValues, parseThresholdConfig } from './bulletThresholdUtils';

describe('getThresholdValues', () => {
	test('Should return the detailed thresholds if provided', () => {
		const props = {
			...samplePropsRow,
			thresholds: [
				{ thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
				{ thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
				{ thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
			],
			thresholdConfig: undefined,
		};

		const result = getThresholdValues(props);
		expect(result).toEqual(props.thresholds);
	});

	test('Should convert thresholdConfig to thresholds when detailed thresholds are not provided', () => {
		const props = {
			...samplePropsRow,
			thresholds: undefined,
			thresholdConfig: {
				thresholds: [120, 235],
				colors: ['rgb(234, 56, 41)', 'rgb(249, 137, 23)', 'rgb(21, 164, 110)'],
			},
		};

		const expected: ThresholdBackground[] = [
			{ thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
			{ thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
			{ thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
		];

		const result = getThresholdValues(props);
		expect(result).toEqual(expected);
	});

	test('Should return undefined when no thresholds are provided', () => {
		const props = {
			...samplePropsRow,
			thresholds: undefined,
			thresholdConfig: undefined,
		};

		const result = getThresholdValues(props);
		expect(result).toBeUndefined();
	});
});

describe('parseThresholdConfig', () => {
	test('Should convert a valid threshold config into an array of ThresholdBackground objects', () => {
		const config: BulletThresholdConfig = {
			thresholds: [120, 235],
			colors: ['rgb(234, 56, 41)', 'rgb(249, 137, 23)', 'rgb(21, 164, 110)'],
		};

		const expected: ThresholdBackground[] = [
			{ thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
			{ thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
			{ thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
		];

		const result = parseThresholdConfig(config);
		expect(result).toEqual(expected);
	});

	test('Should throw an error when the colors array length does not equal thresholds.length + 1', () => {
		const config: BulletThresholdConfig = {
			thresholds: [120, 235],
			colors: ['rgb(234, 56, 41)', 'rgb(249, 137, 23)'],
		};
		expect(() => parseThresholdConfig(config)).toThrow('The number of colors must match the number of thresholds.');
	});
});
