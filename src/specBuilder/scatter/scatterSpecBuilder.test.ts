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

import { Trendline } from '@components/Trendline';
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

import { addData, addScatterMarks, addSignals, setScales } from './scatterSpecBuilder';

const defaultScatterProps: ScatterSpecProps = {
	children: [],
	color: { value: 'categorical-100' },
	colorScaleType: 'ordinal',
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_LINEAR_DIMENSION,
	dimensionScaleType: DEFAULT_DIMENSION_SCALE_TYPE,
	index: 0,
	interactiveMarkName: 'scatter0',
	lineType: { value: 'solid' },
	lineWidth: { value: 0 },
	metric: DEFAULT_METRIC,
	name: 'scatter0',
	opacity: { value: 1 },
	size: { value: 'M' },
};

describe('addData()', () => {
	test('should add time transform is dimensionScaleType === "time"', () => {
		const data = addData(initializeSpec().data ?? [], { ...defaultScatterProps, dimensionScaleType: 'time' });
		expect(data).toHaveLength(4);
		expect(data[0].transform).toHaveLength(2);
		expect(data[0].transform?.[1].type).toBe('timeunit');
	});
	test('should add trendline data if trendline exists as a child', () => {
		const data = addData(initializeSpec().data ?? [], {
			...defaultScatterProps,
			children: [createElement(Trendline)],
		});
		expect(data).toHaveLength(5);
		expect(data[4].transform).toHaveLength(2);
		expect(data[4].transform?.[0].type).toBe('regression');
	});
});

describe('addSignals()', () => {
	test('should add trendline signals if trendline exists as a child', () => {
		const signals = addSignals([], {
			...defaultScatterProps,
			children: [createElement(Trendline, { displayOnHover: true })],
		});
		expect(signals).toHaveLength(1);
	});
});

describe('setScales()', () => {
	test('should add all the correct scales', () => {
		const scales = setScales([], defaultScatterProps);
		expect(scales).toHaveLength(2);
		expect(scales[0].name).toBe('xLinear');
		expect(scales[1].name).toBe('yLinear');
	});
	test('should add the color scale if color is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, color: DEFAULT_COLOR });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe('color');
	});
	test('should add the lineType scale if lineType is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, lineType: DEFAULT_COLOR });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe('lineType');
	});
	test('should add the lineWidth scale if lineWidth is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, lineWidth: DEFAULT_COLOR });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe('lineWidth');
	});
	test('should add the opacity scale if opacity is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, opacity: DEFAULT_COLOR });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe('opacity');
	});
	test('should add the symbolSize scale if size is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, size: 'weight' });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe('symbolSize');
		expect(scales[2].domain).toEqual({ data: 'table', fields: ['weight'] });
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

	test('should use "multiply" blend mode in light mode', () => {
		const marks = addScatterMarks([], { ...defaultScatterProps, colorScheme: 'light' });
		expect((marks[0] as GroupMark).marks?.[0].encode?.enter?.blend).toEqual({ value: 'multiply' });
	});
	test('should "screen" blend mode in dark mode', () => {
		const marks = addScatterMarks([], { ...defaultScatterProps, colorScheme: 'dark' });
		expect((marks[0] as GroupMark).marks?.[0].encode?.enter?.blend).toEqual({ value: 'screen' });
	});
	test('should add trendline marks if trendline exists as a child', () => {
		const marks = addScatterMarks([], { ...defaultScatterProps, children: [createElement(Trendline)] });
		expect(marks).toHaveLength(2);
		expect(marks[1].name).toBe('scatter0Trendline0_group');
	});
});
