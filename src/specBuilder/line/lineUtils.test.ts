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
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_CONTINUOUS_DIMENSION,
	DEFAULT_METRIC,
	FILTERED_TABLE,
} from '@constants';
import { FilterTransform } from 'vega';

import { LineMarkProps, getLineHighlightedData, getLineHoverMarks, getLineMark, getXProductionRule } from './lineUtils';

const defaultLineProps: LineMarkProps = {
	name: 'line0',
	color: DEFAULT_COLOR,
	metric: DEFAULT_METRIC,
	dimension: DEFAULT_CONTINUOUS_DIMENSION,
	scaleType: 'time',
	lineType: { value: 'solid' },
	lineWidth: { value: 1 },
	opacity: { value: 1 },
	colorScheme: DEFAULT_COLOR_SCHEME,
};

describe('getLineMark()', () => {
	test('should return line mark', () => {
		const lineMark = getLineMark(defaultLineProps, 'line0_facet');
		expect(lineMark).toEqual({
			name: 'line0',
			type: 'line',
			from: { data: 'line0_facet' },
			interactive: false,
			encode: {
				enter: {
					stroke: { field: 'series', scale: 'color' },
					strokeDash: { value: [] },
					strokeWidth: { value: 1 },
					y: { field: 'value', scale: 'yLinear' },
				},
				update: { x: { field: 'datetime0', scale: 'xTime' }, strokeOpacity: [{ value: 1 }] },
			},
		});
	});

	test('should have undefined strokeWidth if lineWidth if undefined', () => {
		const lineMark = getLineMark({ ...defaultLineProps, lineWidth: undefined }, 'line0_facet');
		expect(lineMark.encode?.enter?.strokeWidth).toBeUndefined();
	});

	test('adds metric range opacity rules if isMetricRange and displayOnHover', () => {
		const lineMark = getLineMark({ ...defaultLineProps, isMetricRange: true, displayOnHover: true }, 'line0_facet');
		expect(lineMark.encode?.update?.strokeOpacity).toEqual([
			{
				test: 'line0MetricRange_hoveredSeries && line0MetricRange_hoveredSeries === datum.series',
				value: 1,
			},
			{
				test: 'line0_selectedSeries && line0_selectedSeries === datum.series',
				value: 1,
			},
			{ test: 'highlightedSeries && highlightedSeries === datum.prismSeriesId', value: 1 },
			{ value: 0 },
		]);
	});

	test('does not add metric range opacity rules if isMetricRange is false and displayOnHover', () => {
		const lineMark = getLineMark({ ...defaultLineProps, displayOnHover: true }, 'line0_facet');
		expect(lineMark.encode?.update?.strokeOpacity).toEqual([{ value: 1 }]);
	});

	test('does not add metric range opacity rules if displayOnHover is false and isMetricRange', () => {
		const lineMark = getLineMark({ ...defaultLineProps, displayOnHover: true }, 'line0_facet');
		expect(lineMark.encode?.update?.strokeOpacity).toEqual([{ value: 1 }]);
	});
});

describe('getXProductionRule()', () => {
	test('should return the correct scale based on scale type', () => {
		expect(getXProductionRule('time', 'datetime')).toEqual({ scale: 'xTime', field: 'datetime0' });
		expect(getXProductionRule('linear', 'datetime')).toEqual({ scale: 'xLinear', field: 'datetime' });
		expect(getXProductionRule('point', 'datetime')).toEqual({ scale: 'xPoint', field: 'datetime' });
	});
});

describe('getLineHoverMarks()', () => {
	test('should return 4 marks', () => {
		expect(getLineHoverMarks({ ...defaultLineProps, children: [] }, 'line0_facet')).toHaveLength(5);
	});
});

describe('getLineHighlightedData()', () => {
	test('should include select signal if hasPopover', () => {
		const expr = (getLineHighlightedData('line0', FILTERED_TABLE, true).transform?.[0] as FilterTransform).expr;
		expect(expr.includes('line0_selectedId')).toBeTruthy();
	});
	test('should not include select signal if does not hasPopover', () => {
		const expr = (getLineHighlightedData('line0', FILTERED_TABLE, false).transform?.[0] as FilterTransform).expr;
		expect(expr.includes('line0_selectedId')).toBeFalsy();
	});
});
