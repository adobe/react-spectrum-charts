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
import { sampleProps } from './bulletSpecBuilder.test';

describe('getBulletMarks', () => {
	test('Should return the correct marks object', () => {
		const data = getBulletMarks(sampleProps);
		expect(data).toBeDefined();
		expect(data?.marks).toHaveLength(4);
		expect(data?.marks?.[0]?.type).toBe('rule');
		expect(data?.marks?.[1]?.type).toBe('rect');
		expect(data?.marks?.[2]?.type).toBe('text');
		expect(data?.marks?.[3]?.type).toBe('text');
	});

	test('Should not include target marks when showTarget is false', () => {
		const props = { ...sampleProps, showTarget: false, showTargetValue: true };
		const marksGroup = getBulletMarks(props);
		expect(marksGroup.marks).toHaveLength(3);
		marksGroup.marks?.forEach((mark) => {
			expect(mark.description).not.toContain('Target');
		});
	});

	test('Should include target value label when showTargetValue is true', () => {
		const props = { ...sampleProps, showTarget: true, showTargetValue: true };
		const marksGroup = getBulletMarks(props);
		expect(marksGroup.marks).toHaveLength(5);
		const targetValueMark = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
		expect(targetValueMark).toBeDefined();
	});
});

describe('getBulletData', () => {
	test('Should return the data object', () => {
		const data = getBulletData(sampleProps);
		expect(data).toHaveLength(1);
	});
});

describe('getBulletScales', () => {
	test('Should return the correct scales object', () => {
		const data = getBulletScales(sampleProps);
		expect(data).toBeDefined();
		expect(data).toHaveLength(2);
	});
});

describe('getBulletSignals', () => {
	test('Should return the correct signals object', () => {
		const data = getBulletSignals();
		expect(data).toBeDefined();
		expect(data).toHaveLength(7);
	});
});

describe('getBulletMarkRect', () => {
	test('Should return the correct rect mark object', () => {
		const data = getBulletMarkRect(sampleProps);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();

		// Expect the correct amount of fields in the update object
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
	});
});

describe('getBulletMarkTarget', () => {
	test('Should return the correct target mark object', () => {
		const data = getBulletMarkTarget(sampleProps);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(3);
	});
});

describe('getBulletMarkLabel', () => {
	test('Should return the correct label mark object', () => {
		const data = getBulletMarkLabel(sampleProps);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
	});
});

describe('getBulletMarkValueLabel', () => {
	test('Should return the correct value label mark object', () => {
		const data = getBulletMarkValueLabel(sampleProps);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
	});

	test('Should apply numberFormat specifier to metric and target values', () => {
		const props = { ...sampleProps, showTarget: true, showTargetValue: true, numberFormat: '$,.2f' };
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
