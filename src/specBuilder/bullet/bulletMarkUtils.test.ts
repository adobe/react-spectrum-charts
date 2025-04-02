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
import { GroupMark } from 'vega';

import {
	addData,
	addMarks,
	addScales,
	addSignals,
	getBulletLabelAxes,
	getBulletMarkLabel,
	getBulletMarkRect,
	getBulletMarkTarget,
	getBulletMarkThreshold,
	getBulletMarkValueLabel,
	getBulletTrack,
} from './bulletMarkUtils';
import { samplePropsColumn, samplePropsRow } from './bulletSpecBuilder.test';

describe('getBulletMarks', () => {
	test('Should return the correct marks object for column mode', () => {
		const data = addMarks([], samplePropsColumn)[0] as GroupMark;
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
		const data = addMarks([], samplePropsRow)[0] as GroupMark;
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
		const marksGroup = addMarks([], props)[0] as GroupMark;
		expect(marksGroup.marks).toHaveLength(3);
		marksGroup.marks?.forEach((mark) => {
			expect(mark.description).not.toContain('Target');
		});
	});

	test('Should include target value label when showTargetValue is true', () => {
		const props = { ...samplePropsColumn, showTarget: true, showTargetValue: true };
		const marksGroup = addMarks([], props)[0] as GroupMark;
		expect(marksGroup.marks).toHaveLength(5);
		const targetValueMark = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
		expect(targetValueMark).toBeDefined();
	});

	test('Should include label marks when axis labels are enabled', () => {
		const props = { ...samplePropsColumn, showTarget: true, showTargetValue: true };
		const marksGroup = addMarks([], props)[0] as GroupMark;
		expect(marksGroup.marks).toHaveLength(5);
		const targetValueMark = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
		expect(targetValueMark).toBeDefined();
	});

	test('Should include bullet track when track is set to true and threshold is set to false.', () => {
		const props = { ...samplePropsColumn, threshold: false, track: true };
		const marksGroup = getBulletMarks(props);
		expect(marksGroup.marks).toHaveLength(5);
		const bulletTrackMark = marksGroup.marks?.find((mark) => mark.name?.includes('Track'));
		expect(bulletTrackMark).toBeDefined();

		// Threshold mark should not be present
		const bulletThresholdMark = marksGroup.marks?.find((mark) => mark.name?.includes('Threshold'));
		expect(bulletThresholdMark).toBeUndefined();
	});
});

describe('getBulletData', () => {
	test('Should return the data object', () => {
		const data = addData([], samplePropsColumn);
		expect(data).toHaveLength(1);
	});

	test('Should return the correct data object in flexible scale mode', () => {
		const props = { ...samplePropsColumn, scaleType: 'flexible' as 'normal' | 'flexible' | 'fixed' };
		const data = addData([], props);
		expect(data[0].transform).toHaveLength(2);
	});
});

describe('getBulletScales', () => {
	test('Should return the correct scales object for column mode', () => {
		const data = addScales([], samplePropsColumn);
		expect(data).toBeDefined();
		expect(data).toHaveLength(2);
		expect('range' in data[0] && data[0].range && data[0].range[1]).toBeTruthy();
		if ('range' in data[0] && data[0].range && data[0].range[1]) {
			expect(data[0].range[1].signal).toBe('height');
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
		const marksGroup = addMarks([], props)[0] as GroupMark;

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

describe('getBulletMarkSideLabel', () => {
	test('Should not return label marks when side label mode is enabled', () => {
		const props = { ...samplePropsColumn, labelPosition: 'side' as 'side' | 'top' };
		const marks = addMarks([], props)[0] as GroupMark;
		expect(marks.marks).toBeDefined();
		expect(marks.marks).toHaveLength(2);
	});
});

describe('getBulletAxes', () => {
	test('Should return the correct axes object when side label mode is enabled', () => {
		const props = { ...samplePropsColumn, labelPosition: 'side' as 'side' | 'top' };
		const axes = getBulletLabelAxes(props);
		expect(axes).toHaveLength(2);
		expect(axes[0].labelOffset).toBe(2);
	});

	test('Should return the correct axes object when side label mode is enabled and target label is shown', () => {
		const props = { ...samplePropsColumn, labelPosition: 'side' as 'side' | 'top', showTargetValue: true };
		const axes = getBulletLabelAxes(props);
		expect(axes).toHaveLength(2);
		expect(axes[0].labelOffset).toBe(-8);
	});

	test('Should return an empty list when top label mode is enabled', () => {
		const props = { ...samplePropsColumn };
		const axes = getBulletLabelAxes(props);
		expect(axes).toStrictEqual([]);
	});
});

describe('Threshold functionality', () => {
	describe('Data generation', () => {
		test('Should add threshold data and mark when thresholds are provided', () => {
			const detailedThresholds = [
				{ thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
				{ thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
				{ thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
			];
			const props = {
				...samplePropsRow,
				name: 'testBullet',
				thresholds: detailedThresholds,
			};

			const marksGroup = addMarks([], props)[0] as GroupMark;
			expect(marksGroup.data).toBeDefined();
			expect(marksGroup.data?.[0].name).toBe('thresholds');

			// Ensure that the generated values match the detailed thresholds.
			const dataItem = marksGroup.data?.[0];
			expect(dataItem).toHaveProperty('values');
			const values = (dataItem as { values: unknown[] }).values;
			expect(values).toEqual(detailedThresholds);

			const thresholdMark = marksGroup.marks?.find((mark) => mark.name === `${props.name}Threshold`);
			expect(thresholdMark).toBeDefined();
		});
	});

	describe('Y encoding', () => {
		test('Should adjust y encoding when showTarget and showTargetValue is enabled', () => {
			const props = {
				...samplePropsRow,
				name: 'testBullet',
				showTarget: true,
				showTargetValue: true,
			};
			expect(props.showTarget).toBe(true);
			expect(props.showTargetValue).toBe(true);

			const thresholdMark = getBulletMarkThreshold(props);
			expect(thresholdMark).toBeDefined();
			expect(thresholdMark.encode).toBeDefined();
			expect(thresholdMark.encode?.update).toBeDefined();

			const yEncoding = thresholdMark.encode?.update?.y;
			if (yEncoding && 'signal' in yEncoding) {
				expect(yEncoding.signal).toContain('targetValueLabelHeight');
				const expectedSignal = 'bulletGroupHeight - 3 - bulletThresholdHeight - targetValueLabelHeight';
				expect(yEncoding.signal).toBe(expectedSignal);
			}
		});

		test('Should compute y encoding without subtracting targetValueLabelHeight when showTargetValue is false', () => {
			const props = {
				...samplePropsRow,
				name: 'testBullet',
				showTarget: true,
				showTargetValue: false,
			};
			const thresholdMark = getBulletMarkThreshold(props);
			expect(thresholdMark).toBeDefined();
			expect(thresholdMark.encode).toBeDefined();
			expect(thresholdMark.encode?.update).toBeDefined();

			const yEncoding = thresholdMark.encode?.update?.y;
			if (yEncoding && 'signal' in yEncoding) {
				expect(yEncoding.signal).not.toContain('targetValueLabelHeight');
				const expectedSignal = 'bulletGroupHeight - 3 - bulletThresholdHeight';
				expect(yEncoding.signal).toBe(expectedSignal);
			}
		});
	});
});

describe('getBulletMarkTrack', () => {
	test('Should return the correct track mark object in column mode', () => {
		const props = {
			...samplePropsColumn,
			name: 'testBullet',
			threshold: false,
			track: true,
		};
		const data = getBulletTrack(props);
		expect(data).toBeDefined();
		expect(data.encode?.update).toBeDefined();
		expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
		expect(Object.keys(data.encode?.enter ?? {}).length).toBe(5);
		expect(data.encode?.update?.width).toBeDefined();
		expect(data.encode?.update?.width).toStrictEqual({ signal: 'width' });
	});

	test('Should return the correct track mark object in row mode', () => {
		const props = {
			...samplePropsRow,
			name: 'testBullet',
			threshold: false,
			track: true,
		};
		const data = getBulletTrack(props);
		expect(data.encode?.update?.width).toBeDefined();
		expect(data.encode?.update?.width).toStrictEqual({ signal: 'bulletGroupWidth' });
	});
});
