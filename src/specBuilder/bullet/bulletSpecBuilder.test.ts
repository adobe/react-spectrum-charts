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
import { addBullet, addScales, addSignals } from './bulletSpecBuilder';

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
	metricAxis: false,
	track: false,
	thresholdBarColor: false,
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
	metricAxis: false,
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

describe('getBulletScales', () => {
	test('Should return the correct scales object for column mode', () => {
		const data = addScales([], samplePropsColumn);
		expect(data).toBeDefined();
		expect(data).toHaveLength(2);
		expect('range' in data[0] && data[0].range && data[0].range[1]).toBeTruthy();
		if ('range' in data[0] && data[0].range && data[0].range[1]) {
			expect(data[0].range[1].signal).toBe('bulletChartHeight');
		}
	});

	test('Should return the correct scales object for row mode', () => {
		const data = addScales([], samplePropsRow);
		expect(data).toBeDefined();
		expect(data).toHaveLength(2);
		expect('range' in data[0] && data[0].range && data[0].range[1]).toBeTruthy();
		if ('range' in data[0] && data[0].range && data[0].range[1]) {
			expect(data[0].range[1].signal).toBe('width');
		}
	});

	test('Should return the correct scales object for flexible scale mode', () => {
		const props = { ...samplePropsColumn, scaleType: 'flexible' as 'normal' | 'flexible' | 'fixed' };
		const data = addScales([], props);
		expect(data).toBeDefined();
		expect(data[1].domain).toBeDefined();
		expect(data[1].domain).toStrictEqual({
			data: 'table',
			fields: ['xPaddingForTarget', props.metric, 'flexibleScaleValue'],
		});
	});

	test('Should return the correct scales object for fixed scale mode', () => {
		const props = { ...samplePropsColumn, scaleType: 'fixed' as 'normal' | 'flexible' | 'fixed' };
		const data = addScales([], props);
		expect(data).toBeDefined();
		expect(data[1].domain).toBeDefined();
		expect(data[1].domain).toStrictEqual([0, `${props.maxScaleValue}`]);
	});

	test('Should return the correct scales object for normal scale mode', () => {
		const props = { ...samplePropsColumn, scaleType: 'normal' as 'normal' | 'flexible' | 'fixed' };
		const data = addScales([], props);
		expect(data).toBeDefined();
		expect(data[1].domain).toBeDefined();
		expect(data[1].domain).toStrictEqual({ data: 'table', fields: ['xPaddingForTarget', props.metric] });
	});

	test('Should return the correct scales object when a negative value is passed for maxScaleValue', () => {
		const props = {
			...samplePropsColumn,
			scaleType: 'fixed' as 'normal' | 'flexible' | 'fixed',
			maxScaleValue: -100,
		};
		const data = addScales([], props);
		expect(data).toBeDefined();
		expect(data[1].domain).toBeDefined();

		// Expect normal scale mode to be used
		expect(data[1].domain).toStrictEqual({ data: 'table', fields: ['xPaddingForTarget', props.metric] });
	});
});

describe('getBulletSignals', () => {
	test('Should return the correct signals object in column mode', () => {
		const data = addSignals([], samplePropsColumn);
		expect(data).toBeDefined();
		expect(data).toHaveLength(7);
	});

	test('Should return the correct signals object in row mode', () => {
		const data = addSignals([], samplePropsRow);
		expect(data).toBeDefined();
		expect(data).toHaveLength(8);
	});

	test('Should include targetValueLabelHeight signal when showTargetValue is true', () => {
		const props = { ...samplePropsColumn, showTarget: true, showTargetValue: true };
		const signals = addSignals([], props);
		expect(signals.find((signal) => signal.name === 'targetValueLabelHeight')).toBeDefined();
	});

	test('Should include correct targetValueLabelHeight signal when showTargetValue is true', () => {
		const props = {
			...samplePropsColumn,
			showTarget: true,
			showTargetValue: true,
			labelPosition: 'side' as 'side' | 'top',
		};
		const signals = addSignals([], props);
		expect(signals.find((signal) => signal.name === 'bulletGroupHeight')).toStrictEqual({
			name: 'bulletGroupHeight',
			update: 'bulletThresholdHeight + targetValueLabelHeight + 10',
		});
	});

	test('Should include correct targetValueLabelHeight signal when showTargetValue is true', () => {
		const props = {
			...samplePropsColumn,
			showTarget: true,
			showTargetValue: true,
			labelPosition: 'top' as 'side' | 'top',
		};
		const signals = addSignals([], props);
		expect(signals.find((signal) => signal.name === 'bulletGroupHeight')).toStrictEqual({
			name: 'bulletGroupHeight',
			update: 'bulletThresholdHeight + targetValueLabelHeight + 24',
		});
	});

	test('Should include correct targetValueLabelHeight signal when showTargetValue is true', () => {
		const props = {
			...samplePropsColumn,
			showTarget: true,
			showTargetValue: false,
			labelPosition: 'side' as 'side' | 'top',
		};
		const signals = addSignals([], props);
		expect(signals.find((signal) => signal.name === 'bulletGroupHeight')).toStrictEqual({
			name: 'bulletGroupHeight',
			update: 'bulletThresholdHeight + 10',
		});
	});

	test('Should include correct bulletChartHeight signal when props.axis is true and showTargetValue is false', () => {
		const props = {
			...samplePropsColumn,
			showTargetValue: false,
			metricAxis: true,
		};
		const signals = addSignals([], props);
		expect(signals.find((signal) => signal.name === 'bulletChartHeight')).toStrictEqual({
			name: 'bulletChartHeight',
			update: "length(data('table')) * bulletGroupHeight + (length(data('table')) - 1) * gap + 10",
		});
	});
});
