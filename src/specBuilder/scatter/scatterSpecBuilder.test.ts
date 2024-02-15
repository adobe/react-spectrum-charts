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
import { DEFAULT_COLOR } from '@constants';
import { initializeSpec } from '@specBuilder/specUtils';

import { addData, addSignals, setScales } from './scatterSpecBuilder';
import { defaultScatterProps } from './scatterTestUtils';

describe('addData()', () => {
	test('should add time transform is dimensionScaleType === "time"', () => {
		const data = addData(initializeSpec().data ?? [], { ...defaultScatterProps, dimensionScaleType: 'time' });
		expect(data).toHaveLength(2);
		expect(data[0].transform).toHaveLength(2);
		expect(data[0].transform?.[1].type).toBe('timeunit');
	});
	test('should add trendline data if trendline exists as a child', () => {
		const data = addData(initializeSpec().data ?? [], {
			...defaultScatterProps,
			children: [createElement(Trendline)],
		});
		expect(data).toHaveLength(3);
		expect(data[2].transform).toHaveLength(2);
		expect(data[2].transform?.[0].type).toBe('regression');
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
