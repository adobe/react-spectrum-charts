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

import { createElement } from 'react';

import { ScatterPath } from '@components/ScatterPath';
import { DEFAULT_COLOR, SYMBOL_TRAIL_SIZE_SCALE } from '@constants';
import { defaultScatterProps } from '@specBuilder/scatter/scatterTestUtils';

import { getScatterPathMarks, getScatterPathSpecProps, getTrailSize } from './scatterPathUtils';

describe('getScatterPathSpecProps()', () => {
	test('should apply defaults', () => {
		const pathProps = getScatterPathSpecProps({}, 0, defaultScatterProps);
		expect(pathProps).toHaveProperty('color', 'gray-500');
		expect(pathProps).toHaveProperty('name', 'scatter0Path0');
		expect(pathProps).toHaveProperty('pathWidth', { value: 'M' });
		expect(pathProps).toHaveProperty('opacity', 0.5);
	});
	test('should pick up groupBy properties from scatter facets', () => {
		const pathProps = getScatterPathSpecProps({}, 0, {
			...defaultScatterProps,
			color: DEFAULT_COLOR,
			size: 'size',
		});
		expect(pathProps).toHaveProperty('groupBy', [DEFAULT_COLOR, 'size']);
	});
	test('should use groupBy instead of scatter facets is supplied', () => {
		const groupBy = ['test'];
		const pathProps = getScatterPathSpecProps({ groupBy }, 0, {
			...defaultScatterProps,
			color: DEFAULT_COLOR,
			size: 'size',
		});
		expect(pathProps).toHaveProperty('groupBy', groupBy);
	});
});

describe('getScatterPathMarks()', () => {
	test('should return an epmty array if there are not any ScatterPath components', () => {
		const marks = getScatterPathMarks(defaultScatterProps);
		expect(marks).toHaveLength(0);
	});
	test('should return scatter path marks', () => {
		const marks = getScatterPathMarks({ ...defaultScatterProps, children: [createElement(ScatterPath)] });
		expect(marks).toHaveLength(1);
		expect(marks[0]).toHaveProperty('type', 'group');
		expect(marks[0]).toHaveProperty('name', 'scatter0Path0_group');
		expect(marks[0].marks).toHaveLength(1);
		expect(marks[0]?.marks?.[0]).toHaveProperty('type', 'trail');
		expect(marks[0]?.marks?.[0]).toHaveProperty('name', 'scatter0Path0');
	});
});

describe('getTrailSize()', () => {
	test('should use scale if pathWidth is a string', () => {
		const trailSize = getTrailSize('size');
		expect(trailSize).toHaveProperty('scale', SYMBOL_TRAIL_SIZE_SCALE);
		expect(trailSize).toHaveProperty('field', 'size');
	});
	test('should convert named pathWidths', () => {
		const trailSize = getTrailSize({ value: 'M' });
		expect(trailSize).toHaveProperty('value', 2);
	});
	test('should pass through static number values', () => {
		const trailSize = getTrailSize({ value: 3 });
		expect(trailSize).toHaveProperty('value', 3);
	});
});
