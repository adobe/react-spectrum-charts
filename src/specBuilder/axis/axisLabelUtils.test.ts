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
	getEncodedLabelBaselineAlign,
	getLabelAlign,
	getLabelBaseline,
	getLabelBaselineAlign,
	getLabelOffset,
	getLabelValue,
} from './axisLabelUtils';

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

describe('getLabelBaselineAlign()', () => {
	describe('bottom/top axis', () => {
		test('should return labelAlign object', () => {
			expect(getLabelBaselineAlign('start', 'bottom')).toEqual('left');
			expect(getLabelBaselineAlign('start', 'top')).toEqual('left');
			expect(getLabelBaselineAlign('center', 'bottom')).toEqual('center');
			expect(getLabelBaselineAlign('center', 'top')).toEqual('center');
			expect(getLabelBaselineAlign('end', 'bottom')).toEqual('right');
			expect(getLabelBaselineAlign('end', 'top')).toEqual('right');
		});
	});
	describe('left/right axis', () => {
		test('should return labelBaseline object', () => {
			expect(getLabelBaselineAlign('start', 'left')).toEqual('top');
			expect(getLabelBaselineAlign('start', 'right')).toEqual('top');
			expect(getLabelBaselineAlign('center', 'left')).toEqual('middle');
			expect(getLabelBaselineAlign('center', 'right')).toEqual('middle');
			expect(getLabelBaselineAlign('end', 'left')).toEqual('bottom');
			expect(getLabelBaselineAlign('end', 'right')).toEqual('bottom');
		});
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

describe('getEncodedLabelBaselineAlign()', () => {
	test('should return the correct key based on the position of the axis', () => {
		expect(getEncodedLabelBaselineAlign('bottom', 'mySignal', 'center')).toHaveProperty('align');
		expect(getEncodedLabelBaselineAlign('top', 'mySignal', 'center')).toHaveProperty('align');
		expect(getEncodedLabelBaselineAlign('left', 'mySignal', 'center')).toHaveProperty('baseline');
		expect(getEncodedLabelBaselineAlign('right', 'mySignal', 'center')).toHaveProperty('baseline');
	});
});

describe('getLabelAlign()', () => {
	test('should return the correct mappings for labelAlgin to vega Align', () => {
		expect(getLabelAlign(undefined, 'bottom')).toBeUndefined();
		expect(getLabelAlign('start', 'bottom')).toEqual('left');
		expect(getLabelAlign('center', 'bottom')).toEqual('center');
		expect(getLabelAlign('end', 'bottom')).toEqual('right');
	});
	test('should return controlled vegaLabelAlign value if supplied', () => {
		expect(getLabelAlign(undefined, 'bottom', 'left')).toEqual('left');
		expect(getLabelAlign('start', 'bottom', 'left')).toEqual('left');
		expect(getLabelAlign('center', 'bottom', 'left')).toEqual('left');
		expect(getLabelAlign('end', 'bottom', 'left')).toEqual('left');
	});
	test('should return undefined if position is left or right', () => {
		expect(getLabelAlign(undefined, 'left')).toBeUndefined();
		expect(getLabelAlign('start', 'left')).toBeUndefined();
		expect(getLabelAlign('center', 'left')).toBeUndefined();
		expect(getLabelAlign('end', 'left')).toBeUndefined();
		expect(getLabelAlign(undefined, 'right')).toBeUndefined();
		expect(getLabelAlign('start', 'right')).toBeUndefined();
		expect(getLabelAlign('center', 'right')).toBeUndefined();
		expect(getLabelAlign('end', 'right')).toBeUndefined();
	});
});

describe('getLabelBaseline()', () => {
	test('should return the correct mappings for labelAlgin to vega Align', () => {
		expect(getLabelBaseline(undefined, 'left')).toEqual(undefined);
		expect(getLabelBaseline('start', 'left')).toEqual('top');
		expect(getLabelBaseline('center', 'left')).toEqual('middle');
		expect(getLabelBaseline('end', 'left')).toEqual('bottom');
	});
	test('should return controlled vegaLabelBaseline value if supplied', () => {
		expect(getLabelBaseline(undefined, 'left', 'top')).toEqual('top');
		expect(getLabelBaseline('start', 'left', 'top')).toEqual('top');
		expect(getLabelBaseline('center', 'left', 'top')).toEqual('top');
		expect(getLabelBaseline('end', 'left', 'top')).toEqual('top');
	});
	test('should return undefined if position is top or bottom', () => {
		expect(getLabelBaseline(undefined, 'top')).toBeUndefined();
		expect(getLabelBaseline('start', 'top')).toBeUndefined();
		expect(getLabelBaseline('center', 'top')).toBeUndefined();
		expect(getLabelBaseline('end', 'top')).toBeUndefined();
		expect(getLabelBaseline(undefined, 'bottom')).toBeUndefined();
		expect(getLabelBaseline('start', 'bottom')).toBeUndefined();
		expect(getLabelBaseline('center', 'bottom')).toBeUndefined();
		expect(getLabelBaseline('end', 'bottom')).toBeUndefined();
	});
});
