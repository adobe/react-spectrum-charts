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

import {
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_DIMENSION_SCALE_TYPE,
	DEFAULT_LINEAR_DIMENSION,
	DEFAULT_METRIC,
} from '@constants';
import { initializeSpec } from '@specBuilder/specUtils';
import { ScatterSpecProps } from 'types';
import { GroupMark } from 'vega';

import { addData, addScales, addScatterMarks } from './scatterSpecBuilder';

const defaultScatterProps: ScatterSpecProps = {
	children: [],
	color: { value: 'categorical-100' },
	colorScaleType: 'ordinal',
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_LINEAR_DIMENSION,
	dimensionScaleType: DEFAULT_DIMENSION_SCALE_TYPE,
	index: 0,
	metric: DEFAULT_METRIC,
	name: 'scatter0',
	opacity: 0.8,
	size: { value: 'M' },
};

describe('addData()', () => {
	test('should add time transform is dimensionScaleType === "time"', () => {
		const data = addData(initializeSpec().data ?? [], { ...defaultScatterProps, dimensionScaleType: 'time' });
		expect(data).toHaveLength(2);
		expect(data[0].transform).toHaveLength(2);
		expect(data[0].transform?.[1].type).toBe('timeunit');
	});
});

describe('addScales()', () => {
	test('should add all the correct scales', () => {
		const scales = addScales([], defaultScatterProps);
		expect(scales).toHaveLength(2);
		expect(scales[0].name).toBe('xLinear');
		expect(scales[1].name).toBe('yLinear');
	});
	test('should add the color scale if color is a reference to a key', () => {
		const scales = addScales([], { ...defaultScatterProps, color: DEFAULT_COLOR });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe('color');
	});
});

describe('addScatterMarks()', () => {
	test('should add the scatter group with the symbol marks', () => {
		const marks = addScatterMarks([], defaultScatterProps);
		expect(marks).toHaveLength(1);
		expect(marks[0].name).toBe('scatter0_group');
		expect(marks[0].type).toBe('group');
		expect((marks[0] as GroupMark).marks).toHaveLength(1);
	});
});
