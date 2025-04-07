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
import { Data } from 'vega';

import { BulletSpecProps, ThresholdBackground } from '../../types';
import { generateThresholdColorExpr, getBulletTableData, getBulletTransforms } from './bulletDataUtils';
import { samplePropsColumn } from './bulletSpecBuilder.test';

describe('getBulletTableData', () => {
	it('Should create a new table data if it does not exist', () => {
		const data: Data[] = [];

		const result = getBulletTableData(data);

		expect(result.name).toBe('table');
		expect(result.values).toEqual([]);
		expect(result.transform).toEqual([]);

		expect(data.length).toBe(1);
		expect(data[0]).toEqual(result);
	});

	it('Should return the existing table data if it exists', () => {
		const existingTableData: Data = {
			name: 'table',
			values: [],
			transform: [],
		};
		const data: Data[] = [existingTableData];

		const result = getBulletTableData(data);

		expect(result).toEqual(existingTableData);
	});
});

describe('getBulletTransforms', () => {
	it('Should return a formula transform using the target property', () => {
		const props: BulletSpecProps = {
			...samplePropsColumn,
			target: 'target',
		};

		const result = getBulletTransforms(props);

		expect(result).toHaveLength(1);

		expect(result).toEqual([
			{
				type: 'formula',
				expr: 'isValid(datum.target) ? round(datum.target * 1.05) : 0',
				as: 'xPaddingForTarget',
			},
		]);
	});
	it('Should return a formula transform using the maxScaleValue property', () => {
		const props: BulletSpecProps = {
			...samplePropsColumn,
			target: 'target',
			scaleType: 'flexible',
			maxScaleValue: 100,
		};

		const result = getBulletTransforms(props);

		expect(result).toHaveLength(2);

		expect(result[1]).toEqual({
			type: 'formula',
			expr: '100',
			as: 'flexibleScaleValue',
		});
	});
});

describe('generateThresholdColorExpr', () => {
	const metricField = 'currentAmount';

	test('returns default color if no thresholds provided', () => {
		const expr = generateThresholdColorExpr([], metricField, 'blue-900');
		expect(expr).toBe(`'blue-900'`);
	});

	test('generates correct expression for complete thresholds', () => {
		const thresholds: ThresholdBackground[] = [
			{ fill: 'rgb(234, 56, 41)' }, // first threshold, no thresholdMin → treated as -1e12
			{ thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
			{ thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
		];

		const expected =
			`(datum.${metricField} < -1000000000000) ? 'blue' : ` +
			`(datum.${metricField} < 120) ? 'rgb(234, 56, 41)' : ` +
			`(datum.${metricField} < 235) ? 'rgb(249, 137, 23)' : ` +
			`'rgb(21, 164, 110)'`;
		const expr = generateThresholdColorExpr(thresholds, metricField, 'blue');
		expect(expr).toBe(expected);
	});

	test('returns proper expression when one threshold is removed', () => {
		// Only two thresholds provided.
		const thresholds: ThresholdBackground[] = [
			{ fill: 'rgb(234, 56, 41)' }, // covers below 120
			{ thresholdMin: 120, fill: 'rgb(249, 137, 23)' }, // covers from 120 upward
		];

		const expected =
			`(datum.${metricField} < -1000000000000) ? 'blue' : ` +
			`(datum.${metricField} < 120) ? 'rgb(234, 56, 41)' : ` +
			`'rgb(249, 137, 23)'`;
		const expr = generateThresholdColorExpr(thresholds, metricField, 'blue');
		expect(expr).toBe(expected);
	});
});
