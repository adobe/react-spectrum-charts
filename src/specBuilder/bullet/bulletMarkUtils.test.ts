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
import {
	getBulletData,
	getBulletMarkLabel,
	getBulletMarkRect,
	getBulletMarkTarget,
	getBulletMarkValueLabel,
	getBulletMarks,
	getBulletScales,
	getBulletSignals,
} from './bulletMarkUtils';
import { samplePropsColumn, samplePropsRow } from './bulletSpecBuilder.test';

describe('getBulletMarks', () => {
	test('Should return the correct marks object for column mode', () => {
		const data = getBulletMarks(samplePropsColumn);
		expect(data).toBeDefined;
		expect(data?.marks).toHaveLength(4);
		expect(data?.marks?.[0]?.type).toBe('rect');
		expect(data?.marks?.[1]?.type).toBe('rule');
		expect(data?.marks?.[2]?.type).toBe('text');
		expect(data?.marks?.[3]?.type).toBe('text');

		//Make sure the object that defines the orientation contains the correct key
		expect(Object.keys(data?.encode?.update || {})).toContain('y');
	});

	test('Should return the correct marks object for row mode', () => {
		const data = getBulletMarks(samplePropsRow);
		expect(data).toBeDefined;
		expect(data?.marks).toHaveLength(4);
		expect(data?.marks?.[0]?.type).toBe('rect');
		expect(data?.marks?.[1]?.type).toBe('rule');
		expect(data?.marks?.[2]?.type).toBe('text');
		expect(data?.marks?.[3]?.type).toBe('text');
		expect(Object.keys(data?.encode?.update || {})).toContain('x');
	});

	test('Should not include target marks when showTarget is false', () => {
		const props = { ...samplePropsColumn, showTarget: false, showTargetValue: true };
		const marksGroup = getBulletMarks(props);
		expect(marksGroup.marks).toHaveLength(3);
		marksGroup.marks?.forEach((mark) => {
			expect(mark.description).not.toContain('Target');
		});
	});

	test('Should include target value label when showTargetValue is true', () => {
		const props = { ...samplePropsColumn, showTarget: true, showTargetValue: true };
		const marksGroup = getBulletMarks(props);
		expect(marksGroup.marks).toHaveLength(5);
		const targetValueMark = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
		expect(targetValueMark).toBeDefined();
	});

	describe('Threshold functionality', () => {
		const thresholdConfig = {
			thresholds: [120, 235],
			colors: ['rgb(234, 56, 41)', 'rgb(249, 137, 23)', 'rgb(21, 164, 110)'],
		};

		test('Should add threshold data and threshold mark when thresholdConfig is provided', () => {
			const props = {
				...samplePropsRow,
				thresholds: undefined,
				thresholdConfig,
			};

			expect(props.thresholdConfig).toBeDefined();
			expect(props.thresholdConfig.thresholds).toHaveLength(2);
			expect(props.thresholdConfig.colors).toHaveLength(3);

			const marksGroup = getBulletMarks(props);

			expect(marksGroup.data).toBeDefined();
			expect(marksGroup.data?.[0].name).toBe('thresholds');

			const dataItem = marksGroup.data?.[0];
			expect(dataItem).toHaveProperty('values');
			const values = (dataItem as { values: unknown[] }).values;
			expect(Array.isArray(values)).toBeTruthy();
			expect(values).toHaveLength(3);

			const thresholdMark = marksGroup.marks?.find((mark) => mark.name === `${props.name}Threshold`);
			expect(thresholdMark).toBeDefined();
			expect(thresholdMark?.type).toBe('rect');
		});

		test('Should add threshold data and mark when detailed thresholds are provided', () => {
			const detailedThresholds = [
				{ thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
				{ thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
				{ thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
			];
			const props = { ...samplePropsRow, thresholds: detailedThresholds, thresholdConfig: undefined };

			const marksGroup = getBulletMarks(props);
			expect(marksGroup.data).toBeDefined();
			expect(marksGroup.data?.[0].name).toBe('thresholds');

			const dataItem = marksGroup.data?.[0];
			expect(dataItem).toHaveProperty('values');
			const values = (dataItem as { values: unknown[] }).values;
			expect(values).toEqual(detailedThresholds);

			const thresholdMark = marksGroup.marks?.find((mark) => mark.name === `${props.name}Threshold`);
			expect(thresholdMark).toBeDefined();
		});
	});
});

describe('getBulletData', () => {
	test('Should return the data object', () => {
		const data = getBulletData(samplePropsColumn);
		expect(data).toHaveLength(1);
	});
});

describe('getBulletScales', () => {
	test('Should return the correct scales object for column mode', () => {
		const data = getBulletScales(samplePropsColumn);
		expect(data).toBeDefined();
		expect(data).toHaveLength(2);
		expect('range' in data[0] && data[0].range && data[0].range[1]).toBeTruthy();
		if ('range' in data[0] && data[0].range && data[0].range[1]) {
			expect(data[0].range[1].signal).toBe('height');
		}
	});

	test('Should return the correct scales object for row mode', () => {
		const data = getBulletScales(samplePropsRow);
		expect(data).toBeDefined();
		expect(data).toHaveLength(2);
		expect('range' in data[0] && data[0].range && data[0].range[1]).toBeTruthy();
		if ('range' in data[0] && data[0].range && data[0].range[1]) {
			expect(data[0].range[1].signal).toBe('width');
		}
	});
});

describe('getBulletSignals', () => {
	test('Should return the correct signals object in column mode', () => {
		const data = getBulletSignals(samplePropsColumn);
		expect(data).toBeDefined();
		expect(data).toHaveLength(7);
	});

	test('Should return the correct signals object in row mode', () => {
		const data = getBulletSignals(samplePropsRow);
		expect(data).toBeDefined();
		expect(data).toHaveLength(8);
	});
});

describe('getBulletMarkRect', () => {
	test('Should return the correct rect mark object', () => {
		const data = getBulletMarkRect(samplePropsColumn);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();

		// Expect the correct amount of fields in the update object
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
	});
});

describe('getBulletMarkTarget', () => {
	test('Should return the correct target mark object', () => {
		const data = getBulletMarkTarget(samplePropsColumn);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(3);
	});
});

describe('getBulletMarkLabel', () => {
	test('Should return the correct label mark object', () => {
		const data = getBulletMarkLabel(samplePropsColumn);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
	});
});

describe('getBulletMarkValueLabel', () => {
	test('Should return the correct value label mark object in column mode', () => {
		const data = getBulletMarkValueLabel(samplePropsColumn);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
	});

	test('Should apply numberFormat specifier to metric and target values', () => {
		const props = { ...samplePropsColumn, showTarget: true, showTargetValue: true, numberFormat: '$,.2f' };
		const marksGroup = getBulletMarks(props);

		const metricValueLabel = marksGroup.marks?.find((mark) => mark.name === `${props.name}ValueLabel`);
		expect(metricValueLabel).toBeDefined();

		if (metricValueLabel?.encode?.enter?.text) {
			const textEncode = metricValueLabel.encode.enter.text;
			if (typeof textEncode === 'object' && 'signal' in textEncode) {
				expect(textEncode.signal).toContain(`format(datum.${props.metric}, '$,.2f')`);
			}
		}

		const TargetValueLabel = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
		expect(TargetValueLabel).toBeDefined();

		if (TargetValueLabel?.encode?.enter?.text) {
			const textEncode = TargetValueLabel.encode.enter.text;
			if (typeof textEncode === 'object' && 'signal' in textEncode) {
				expect(textEncode.signal).toContain(`format(datum.${props.target}, '$,.2f')`);
			}
		}
	});
});
