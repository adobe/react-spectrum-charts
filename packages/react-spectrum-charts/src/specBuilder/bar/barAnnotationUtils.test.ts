/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { FILTERED_TABLE } from '../../constants';
import {
	getAnnotationMarks,
	getAnnotationMetricAxisPosition,
	getAnnotationPositionOffset,
	getAnnotationWidth,
	getAnnotationXEncode,
	getMinBandwidth,
} from './barAnnotationUtils';
import { defaultBarOptions, defaultBarOptionsWithSecondayColor } from './barTestUtils';

describe('getAnnotationMarks()', () => {
	test('should retrun an empty array if there is no annotation on the bar', () => {
		expect(getAnnotationMarks(defaultBarOptions, FILTERED_TABLE, 'xBand', 'category')).toStrictEqual([]);
	});

	test('should return the annotation group if an annotation exists on the bar', () => {
		const marks = getAnnotationMarks(
			{ ...defaultBarOptions, barAnnotations: [{}] },
			FILTERED_TABLE,
			'xBand',
			'category'
		);
		expect(marks).toHaveLength(1);
		expect(marks[0].type).toEqual('group');
		expect(marks[0].name).toEqual(`${defaultBarOptions.name}_annotationGroup`);
	});
});

describe('getMinBandwidth()', () => {
	test('should be 48 if bar is vertical', () => {
		expect(getMinBandwidth('vertical')).toEqual(48);
	});
	test('should be fontsize + 2*padding if bar is horizontal', () => {
		expect(getMinBandwidth('horizontal')).toEqual(20);
	});
});

describe('getAnnotationXEncode()', () => {
	test('should use xc and width if width is defined', () => {
		const xEncode = getAnnotationXEncode(100);
		expect(xEncode).toHaveProperty('xc');
		expect(xEncode).toHaveProperty('width');
	});
	test('should use x and x2 if width is not defined', () => {
		const xEncode = getAnnotationXEncode();
		expect(xEncode).toHaveProperty('x');
		expect(xEncode).toHaveProperty('x2');
	});
});

describe('getAnnotationWidth()', () => {
	test('should return hardcoded signal if width is defined', () => {
		expect(getAnnotationWidth('textLabel', { width: 100 })).toEqual({ value: 100 });
	});
	test('should return signal that gets the label width if width is not defined', () => {
		const width = getAnnotationWidth('textLabel');
		expect(width).toHaveProperty('signal');

		expect((width as { signal: string }).signal).toContain('getLabelWidth(datum.textLabel,');
	});
});

describe('getAnnotationPositionOffset()', () => {
	test('returns 12.5 for vertical orientation', () => {
		expect(getAnnotationPositionOffset(defaultBarOptions, { value: 12345 })).toEqual('12.5');
	});

	test('returns provided value / 2 + 2.5 when value is set and orientation is not vertical', () => {
		expect(getAnnotationPositionOffset({ ...defaultBarOptions, orientation: 'horizontal' }, { value: 50 })).toEqual(
			'27.5'
		);
	});

	test('returns the signal string wrapped with parens when signal is set and orientation is not vertical', () => {
		expect(
			getAnnotationPositionOffset({ ...defaultBarOptions, orientation: 'horizontal' }, { signal: 'foo' })
		).toEqual('((foo) / 2 + 2.5)');
	});
});

describe('getAnnotationMetricAxisPosition()', () => {
	const defaultAnnotationWidth = { value: 22 };

	test("defaultBarOptions, should return '${value}1' field", () => {
		expect(getAnnotationMetricAxisPosition(defaultBarOptions, defaultAnnotationWidth)).toStrictEqual([
			{
				signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) + 12.5)`,
				test: `datum.${defaultBarOptions.metric}1 < 0`,
			},
			{ signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) - 12.5)` },
		]);
	});
	test('horizontal orientation, should return with xLinear scale and min/max properties flipped', () => {
		expect(
			getAnnotationMetricAxisPosition({ ...defaultBarOptions, orientation: 'horizontal' }, defaultAnnotationWidth)
		).toStrictEqual([
			{
				test: `datum.${defaultBarOptions.metric}1 < 0`,
				signal: `min(scale('xLinear', datum.${defaultBarOptions.metric}1), scale('xLinear', 0) - 13.5)`,
			},
			{ signal: `max(scale('xLinear', datum.${defaultBarOptions.metric}1), scale('xLinear', 0) + 13.5)` },
		]);
	});
	test("stacked with seconday scale, should return '${value}1' field", () => {
		expect(
			getAnnotationMetricAxisPosition(defaultBarOptionsWithSecondayColor, defaultAnnotationWidth)
		).toStrictEqual([
			{
				signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) + 12.5)`,
				test: `datum.${defaultBarOptions.metric}1 < 0`,
			},
			{ signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) - 12.5)` },
		]);
	});
	test("dodged without secondary scale, should return 'value' field", () => {
		expect(
			getAnnotationMetricAxisPosition({ ...defaultBarOptions, type: 'dodged' }, defaultAnnotationWidth)
		).toStrictEqual([
			{
				signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}), scale('yLinear', 0) + 12.5)`,
				test: `datum.${defaultBarOptions.metric} < 0`,
			},
			{ signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}), scale('yLinear', 0) - 12.5)` },
		]);
	});
	test("dodged with secondary scale, should return '${value}1' field", () => {
		expect(
			getAnnotationMetricAxisPosition(defaultBarOptionsWithSecondayColor, defaultAnnotationWidth)
		).toStrictEqual([
			{
				signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) + 12.5)`,
				test: `datum.${defaultBarOptions.metric}1 < 0`,
			},
			{ signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) - 12.5)` },
		]);
	});
});
