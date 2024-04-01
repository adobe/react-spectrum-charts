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

import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { Trendline } from '@components/Trendline';
import {
	COLOR_SCALE,
	DEFAULT_COLOR,
	HIGHLIGHTED_ITEM,
	LINEAR_COLOR_SCALE,
	LINE_TYPE_SCALE,
	LINE_WIDTH_SCALE,
	OPACITY_SCALE,
	SYMBOL_SIZE_SCALE,
} from '@constants';
import { defaultSignals } from '@specBuilder/specTestUtils';
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
	test('should add additional filteredData if tooltip exists', () => {
		const data = addData(initializeSpec().data ?? [], {
			...defaultScatterProps,
			children: [createElement(ChartTooltip)],
		});
		expect(data).toHaveLength(3);
		expect(data[2].name).toBe('scatter0_filteredTable');
	});
	test('tooltipFilteredData has undefined transform by default', () => {
		const data = addData(initializeSpec().data ?? [], {
			...defaultScatterProps,
			children: [createElement(ChartTooltip)],
		});

		expect(data[2].transform).toBeUndefined();
	});
	test('tooltipFilteredData has undefined transform by default', () => {
		const data = addData(initializeSpec().data ?? [], {
			...defaultScatterProps,
			children: [createElement(ChartTooltip, { excludeDataKey: 'exclude' })],
		});

		expect(data[2].transform).toStrictEqual([{
			type: 'filter',
			expr: '!datum.exclude',
		}]);
	});
	test('should add selectedData if popover exists', () => {
		const data = addData(initializeSpec().data ?? [], {
			...defaultScatterProps,
			children: [createElement(ChartPopover)],
		});
		expect(data).toHaveLength(4);
		expect(data[3].name).toBe('scatter0_selectedData');
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
	test('should add hoveredId signal events if tooltip exists', () => {
		const signals = addSignals(defaultSignals, {
			...defaultScatterProps,
			children: [createElement(ChartTooltip)],
		});
		expect(signals).toHaveLength(4);
		expect(signals[0].name).toBe(HIGHLIGHTED_ITEM);
		expect(signals[0].on).toHaveLength(2);
	});
	test('should add trendline signal events if trendline exists as a child', () => {
		const signals = addSignals(defaultSignals, {
			...defaultScatterProps,
			children: [createElement(Trendline, { displayOnHover: true })],
		});
		expect(signals).toHaveLength(4);
		expect(signals[0].name).toBe(HIGHLIGHTED_ITEM);
		expect(signals[0].on).toHaveLength(2);
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
		expect(scales[2].name).toBe(COLOR_SCALE);
	});
	test('should add color to linear color scale if the colorScaleType is linear', () => {
		const scales = setScales([], { ...defaultScatterProps, color: DEFAULT_COLOR, colorScaleType: 'linear' });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe(LINEAR_COLOR_SCALE);
	});
	test('should add the lineType scale if lineType is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, lineType: DEFAULT_COLOR });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe(LINE_TYPE_SCALE);
	});
	test('should add the lineWidth scale if lineWidth is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, lineWidth: DEFAULT_COLOR });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe(LINE_WIDTH_SCALE);
	});
	test('should add the opacity scale if opacity is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, opacity: DEFAULT_COLOR });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe(OPACITY_SCALE);
	});
	test('should add the symbolSize scale if size is a reference to a key', () => {
		const scales = setScales([], { ...defaultScatterProps, size: 'weight' });
		expect(scales).toHaveLength(3);
		expect(scales[2].name).toBe(SYMBOL_SIZE_SCALE);
		expect(scales[2].domain).toEqual({ data: 'table', fields: ['weight'] });
	});
});
