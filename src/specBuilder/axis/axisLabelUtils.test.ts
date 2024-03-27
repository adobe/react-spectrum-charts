/*
 * Copyright 2023 Adobe. All rights reserved.
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
	getControlledLabelAnchorValues,
	getLabelAnchor,
	getLabelAnchorValues,
	getLabelAngle,
	getLabelFormat,
	getLabelNumberFormat,
	getLabelOffset,
	getLabelValue,
	labelIsParallelToAxis,
} from './axisLabelUtils';
import { defaultAxisProps } from './axisTestUtils';

describe('getLabelValue()', () => {
	test('should return the value key if an object', () => {
		expect(getLabelValue({ value: 1 })).toEqual(1);
		expect(getLabelValue({ value: 'test', label: 'testing' })).toEqual('test');
	});
	test('should return the label as is if not an object', () => {
		expect(getLabelValue(1)).toEqual(1);
		expect(getLabelValue('test')).toEqual('test');
	});
});

describe('getLabelOffset()', () => {
	test('start', () => {
		expect(getLabelOffset('start', 'xBand')).toStrictEqual({ signal: "bandwidth('xBand') / -2" });
	});
	test('end', () => {
		expect(getLabelOffset('end', 'xBand')).toStrictEqual({ signal: "bandwidth('xBand') / 2" });
	});
	test('center', () => {
		expect(getLabelOffset('center', 'xBand')).toStrictEqual(undefined);
	});
	test('should return vegaLabelOffset if provided', () => {
		expect(getLabelOffset('start', 'xBand', 10)).toEqual(10);
		expect(getLabelOffset('start', 'xBand', 0)).toEqual(0);
	});
});

describe('getControlledLabelAnchorValues()', () => {
	test('should return correct align and baseline for labelAlign', () => {
		expect(getControlledLabelAnchorValues('bottom', 'horizontal', 'center')).toEqual({
			align: 'center',
			baseline: 'top',
		});
	});
	test('should return undefined for align and baseline if labelAlign is undefined', () => {
		const anchor = getControlledLabelAnchorValues('bottom', 'horizontal');
		expect(anchor.align).toBeUndefined();
		expect(anchor.baseline).toBeUndefined();
	});
});

describe('getLabelAnchorValues()', () => {
	test('should return override values if they are supplied', () => {
		expect(getLabelAnchorValues('bottom', 'horizontal', 'center')).toEqual({
			labelAlign: 'center',
			labelBaseline: 'top',
		});
		expect(getLabelAnchorValues('bottom', 'horizontal', 'center', 'left')).toEqual({
			labelAlign: 'left',
			labelBaseline: 'top',
		});
		expect(getLabelAnchorValues('bottom', 'horizontal', 'center', undefined, 'middle')).toEqual({
			labelAlign: 'center',
			labelBaseline: 'middle',
		});
		expect(getLabelAnchorValues('bottom', 'horizontal', 'center', 'right', 'bottom')).toEqual({
			labelAlign: 'right',
			labelBaseline: 'bottom',
		});
	});
});

describe('getLabelAnchor()', () => {
	describe('should return the correct align and baseline for each combination of position, labelOrientation and align', () => {
		describe('bottom', () => {
			test('horizontal', () => {
				expect(getLabelAnchor('bottom', 'horizontal', 'start')).toEqual({ align: 'left', baseline: 'top' });
				expect(getLabelAnchor('bottom', 'horizontal', 'center')).toEqual({ align: 'center', baseline: 'top' });
				expect(getLabelAnchor('bottom', 'horizontal', 'end')).toEqual({ align: 'right', baseline: 'top' });
			});
			test('vertical', () => {
				expect(getLabelAnchor('bottom', 'vertical', 'start')).toEqual({ align: 'right', baseline: 'top' });
				expect(getLabelAnchor('bottom', 'vertical', 'center')).toEqual({ align: 'right', baseline: 'middle' });
				expect(getLabelAnchor('bottom', 'vertical', 'end')).toEqual({ align: 'right', baseline: 'bottom' });
			});
		});
		describe('top', () => {
			test('horizontal', () => {
				expect(getLabelAnchor('top', 'horizontal', 'start')).toEqual({ align: 'left', baseline: 'bottom' });
				expect(getLabelAnchor('top', 'horizontal', 'center')).toEqual({ align: 'center', baseline: 'bottom' });
				expect(getLabelAnchor('top', 'horizontal', 'end')).toEqual({ align: 'right', baseline: 'bottom' });
			});
			test('vertical', () => {
				expect(getLabelAnchor('top', 'vertical', 'start')).toEqual({ align: 'left', baseline: 'top' });
				expect(getLabelAnchor('top', 'vertical', 'center')).toEqual({ align: 'left', baseline: 'middle' });
				expect(getLabelAnchor('top', 'vertical', 'end')).toEqual({ align: 'left', baseline: 'bottom' });
			});
		});
		describe('left', () => {
			test('horizontal', () => {
				expect(getLabelAnchor('left', 'horizontal', 'start')).toEqual({ align: 'right', baseline: 'top' });
				expect(getLabelAnchor('left', 'horizontal', 'center')).toEqual({ align: 'right', baseline: 'middle' });
				expect(getLabelAnchor('left', 'horizontal', 'end')).toEqual({ align: 'right', baseline: 'bottom' });
			});
			test('vertical', () => {
				expect(getLabelAnchor('left', 'vertical', 'start')).toEqual({ align: 'left', baseline: 'bottom' });
				expect(getLabelAnchor('left', 'vertical', 'center')).toEqual({ align: 'center', baseline: 'bottom' });
				expect(getLabelAnchor('left', 'vertical', 'end')).toEqual({ align: 'right', baseline: 'bottom' });
			});
		});
		describe('right', () => {
			test('horizontal', () => {
				expect(getLabelAnchor('right', 'horizontal', 'start')).toEqual({ align: 'left', baseline: 'top' });
				expect(getLabelAnchor('right', 'horizontal', 'center')).toEqual({ align: 'left', baseline: 'middle' });
				expect(getLabelAnchor('right', 'horizontal', 'end')).toEqual({ align: 'left', baseline: 'bottom' });
			});
			test('vertical', () => {
				expect(getLabelAnchor('right', 'vertical', 'start')).toEqual({ align: 'left', baseline: 'top' });
				expect(getLabelAnchor('right', 'vertical', 'center')).toEqual({ align: 'center', baseline: 'top' });
				expect(getLabelAnchor('right', 'vertical', 'end')).toEqual({ align: 'right', baseline: 'top' });
			});
		});
	});
});

describe('labelIsParallelToAxis()', () => {
	test('should return the true if parallel and false if perpendicular', () => {
		expect(labelIsParallelToAxis('bottom', 'horizontal')).toBeTruthy();
		expect(labelIsParallelToAxis('top', 'horizontal')).toBeTruthy();
		expect(labelIsParallelToAxis('left', 'vertical')).toBeTruthy();
		expect(labelIsParallelToAxis('right', 'vertical')).toBeTruthy();
		expect(labelIsParallelToAxis('bottom', 'vertical')).toBeFalsy();
		expect(labelIsParallelToAxis('top', 'vertical')).toBeFalsy();
		expect(labelIsParallelToAxis('left', 'horizontal')).toBeFalsy();
		expect(labelIsParallelToAxis('right', 'horizontal')).toBeFalsy();
	});
});

describe('getLabelAngle', () => {
	test('should return 0 for horizontal and 270 for vertical', () => {
		expect(getLabelAngle('horizontal')).toEqual(0);
		expect(getLabelAngle('vertical')).toEqual(270);
	});
});

describe('getLabelFormat()', () => {
	test('should include text truncation if truncateText is true', () => {
		const labelEncodings = getLabelFormat({ ...defaultAxisProps, truncateLabels: true }, 'xBand');
		expect(labelEncodings).toHaveLength(2);
		expect(labelEncodings[1].signal).toContain('truncateText');
	});
	test('should not include text truncation if the scale name does not include band', () => {
		expect(getLabelFormat({ ...defaultAxisProps, truncateLabels: true }, 'xLinear')[1].signal).not.toContain(
			'truncateText'
		);
	});
	test('should not include truncae text if labels are perpendicular to the axis', () => {
		expect(
			getLabelFormat(
				{ ...defaultAxisProps, truncateLabels: true, position: 'bottom', labelOrientation: 'vertical' },
				'xBand'
			)[1].signal
		).not.toContain('truncateText');
		expect(
			getLabelFormat(
				{ ...defaultAxisProps, truncateLabels: true, position: 'left', labelOrientation: 'horizontal' },
				'yBand'
			)[1].signal
		).not.toContain('truncateText');
	});
	test('should return duration formatter if labelFormat is duration', () => {
		expect(getLabelFormat({ ...defaultAxisProps, labelFormat: 'duration' }, 'xLinear')).toHaveProperty(
			'signal',
			'formatTimeDurationLabels(datum)'
		);
	});
});

describe('getLabelNumberFormat()', () => {
	test('should return correct signal for shortNumber', () => {
		const format = getLabelNumberFormat('shortNumber');
		expect(format).toHaveLength(1);
		expect(format[0]).toHaveProperty('signal', "upper(replace(format(datum.value, '.3~s'), /(\\d+)G/, '$1B'))");
	});
	test('should return correct signal for shortCurrency', () => {
		const format = getLabelNumberFormat('shortCurrency');
		expect(format).toHaveLength(2);
		expect(format[0]).toHaveProperty('signal', "upper(replace(format(datum.value, '$.3~s'), /(\\d+)G/, '$1B'))");
	});
	test('should return correct signal for string specifier', () => {
		const numberFormat = '.2f';
		const format = getLabelNumberFormat(numberFormat);
		expect(format).toHaveLength(1);
		expect(format[0]).toHaveProperty('signal', `format(datum.value, '${numberFormat}')`);
	});
});
