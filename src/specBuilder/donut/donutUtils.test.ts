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
import {
	COLOR_SCALE,
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	HIGHLIGHT_CONTRAST_RATIO,
	MARK_ID,
	SELECTED_ITEM,
} from '@constants';
import { getTooltip } from '@specBuilder/marks/markUtils';
import { MarkChildElement } from 'types';

import {
	fontBreakpoints,
	getAggregateMetricBaseline,
	getArcMark,
	getDirectLabelMark,
	getDirectLabelTextEntry,
	getDisplayTextForLargeSlice,
	getFontSize,
	getLabelYWithOffset,
	getMetricLabelEncodeEnter,
	getMetricNumberText,
	metricLabelFontSizes,
	metricNumberFontSizes,
} from './donutUtils';
import { getMetricNumberEncodeEnter } from './donutUtils';
import { getPercentMetricMark } from './donutUtils';
import { getAggregateMetricMark } from './donutUtils';
import { getOpacityRules } from './donutUtils';

describe('getMetricNumberText', () => {
	test('should return the correct text for boolean metric', () => {
		const metric = 'exampleMetric';
		const isBoolean = true;

		const result = getMetricNumberText(metric, isBoolean);

		expect(result).toEqual({ signal: `format(datum['exampleMetric'], '.0%')` });
	});

	test('should return the correct text for non-boolean metric', () => {
		const metric = 'exampleMetric';
		const isBoolean = false;

		const result = getMetricNumberText(metric, isBoolean);

		expect(result).toEqual({ signal: "upper(replace(format(datum.sum, '.3~s'), 'G', 'B'))" });
	});
});

describe('getDisplayTextForLargeSlice', () => {
	test('should format data if format is true', () => {
		const radius = 'min(width, height) / 2';
		const datumProperty = 'exampleDatum';
		const format = true;

		const result = getDisplayTextForLargeSlice(radius, datumProperty, format);

		expect(result).toEqual({
			signal: `if((min(width, height) / 2 * (datum['endAngle'] - datum['startAngle'])) < 40, '', format(datum['exampleDatum'], ','))`,
		});
	});

	test('should use 40 as default minArcLength with format false', () => {
		const radius = 'min(width, height) / 2';
		const datumProperty = 'exampleDatum';
		const format = false;

		const result = getDisplayTextForLargeSlice(radius, datumProperty, format);

		expect(result).toEqual({
			signal: `if((min(width, height) / 2 * (datum['endAngle'] - datum['startAngle'])) < 40, '', datum['exampleDatum'])`,
		});
	});

	test('should access supplied datum property with format false', () => {
		const radius = 'min(width, height) / 2';
		const datumProperty = 'exampleDatum';
		const format = false;

		const result = getDisplayTextForLargeSlice(radius, datumProperty, format);

		expect(result).toEqual({
			signal: `if((min(width, height) / 2 * (datum['endAngle'] - datum['startAngle'])) < 40, '', datum['exampleDatum'])`,
		});
	});
});

describe('getDirectLabelTextEntry', () => {
	test('should return text entry for top baseline position without formatting', () => {
		const radius = 'min(width, height) / 2';
		const datumProperty = 'exampleDatum';
		const baselinePosition = 'top';
		const format = false;

		const result = getDirectLabelTextEntry(radius, datumProperty, baselinePosition, format);

		expect(result).toEqual({
			text: {
				signal: `if((min(width, height) / 2 * (datum['endAngle'] - datum['startAngle'])) < 40, '', datum['exampleDatum'])`,
			},
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			radius: { signal: 'min(width, height) / 2 + 15' },
			theta: { signal: "(datum['startAngle'] + datum['endAngle']) / 2" },
			fontSize: { value: 14 },
			width: { signal: `getLabelWidth(datum['exampleDatum'], 'bold', '14') + 10` },
			align: { signal: "(datum['startAngle'] + datum['endAngle']) / 2 <= PI ? 'left' : 'right'" },
			baseline: { value: 'top' },
		});
	});

	test('should return text entry for bottom baseline position with formatting', () => {
		const radius = 'min(width, height) / 2';
		const datumProperty = 'exampleDatum';
		const baselinePosition = 'bottom';
		const format = true;

		const result = getDirectLabelTextEntry(radius, datumProperty, baselinePosition, format);

		expect(result).toEqual({
			text: {
				signal: `if((min(width, height) / 2 * (datum['endAngle'] - datum['startAngle'])) < 40, '', format(datum['exampleDatum'], ','))`,
			},
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			radius: { signal: 'min(width, height) / 2 + 15' },
			theta: { signal: "(datum['startAngle'] + datum['endAngle']) / 2" },
			fontSize: { value: 14 },
			width: { signal: `getLabelWidth(datum['exampleDatum'], 'bold', '14') + 10` },
			align: { signal: "(datum['startAngle'] + datum['endAngle']) / 2 <= PI ? 'left' : 'right'" },
			baseline: { value: 'bottom' },
		});
	});
});

describe('getDirectLabelMark', () => {
	test('should return direct label marks for a given name, radius, metric, and segment', () => {
		const name = 'exampleName';
		const radius = 'min(width, height) / 2';
		const metric = 'exampleMetric';
		const segment = 'exampleSegment';

		const result = getDirectLabelMark(name, radius, metric, segment);

		expect(result).toEqual({
			name: 'exampleName_directLabels',
			type: 'group',
			marks: [
				{
					type: 'text',
					name: 'exampleName_directLabelSegment',
					from: { data: FILTERED_TABLE },
					encode: {
						enter: {
							text: {
								signal: `if((min(width, height) / 2 * (datum['endAngle'] - datum['startAngle'])) < 40, '', datum['exampleSegment'])`,
							},
							x: { signal: 'width / 2' },
							y: { signal: 'height / 2' },
							radius: { signal: 'min(width, height) / 2 + 15' },
							theta: { signal: "(datum['startAngle'] + datum['endAngle']) / 2" },
							fontSize: { value: 14 },
							width: { signal: `getLabelWidth(datum['exampleSegment'], 'bold', '14') + 10` },
							align: { signal: "(datum['startAngle'] + datum['endAngle']) / 2 <= PI ? 'left' : 'right'" },
							baseline: { value: 'bottom' },
						},
					},
				},
				{
					type: 'text',
					name: 'exampleName_directLabelMetric',
					from: { data: FILTERED_TABLE },
					encode: {
						enter: {
							text: {
								signal: `if((min(width, height) / 2 * (datum['endAngle'] - datum['startAngle'])) < 40, '', format(datum['exampleMetric'], ','))`,
							},
							x: { signal: 'width / 2' },
							y: { signal: 'height / 2' },
							radius: { signal: 'min(width, height) / 2 + 15' },
							theta: { signal: "(datum['startAngle'] + datum['endAngle']) / 2" },
							fontSize: { value: 14 },
							width: { signal: `getLabelWidth(datum['exampleMetric'], 'bold', '14') + 10` },
							align: { signal: "(datum['startAngle'] + datum['endAngle']) / 2 <= PI ? 'left' : 'right'" },
							baseline: { value: 'top' },
						},
					},
				},
			],
		});
	});
});

describe('getLabelYWithOffset', () => {
	test('should return nested ternary for vega to resolve', () => {
		const radius = 'min(width, height)';
		const holeRatio = 0.85;

		const result = getLabelYWithOffset(radius, holeRatio);

		expect(result).toEqual({
			signal: 'height / 2',
			offset: {
				signal: `min(width, height) * 0.85 > ${fontBreakpoints[0]} ? ${metricLabelFontSizes[0]} : min(width, height) * 0.85 > ${fontBreakpoints[1]} ? ${metricLabelFontSizes[1]} : min(width, height) * 0.85 > ${fontBreakpoints[2]} ? ${metricLabelFontSizes[2]} : 0`,
			},
		});
	});
});

describe('getFontSize', () => {
	test('should return correct font size for primary text', () => {
		const result = getFontSize('min(width, height) / 2', 0.85, true);
		expect(result).toEqual([
			{
				test: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[0]}`,
				value: metricNumberFontSizes[0],
			},
			{
				test: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[1]}`,
				value: metricNumberFontSizes[1],
			},
			{
				test: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[2]}`,
				value: metricNumberFontSizes[2],
			},
			{
				test: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[3]}`,
				value: metricNumberFontSizes[3],
			},
			{ value: 0 },
		]);
	});

	test('should return correct font size for secondary text', () => {
		const result = getFontSize('min(width, height) / 2', 0.85, false);
		expect(result).toEqual([
			{
				test: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[0]}`,
				value: metricLabelFontSizes[0],
			},
			{
				test: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[1]}`,
				value: metricLabelFontSizes[1],
			},
			{
				test: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[2]}`,
				value: metricLabelFontSizes[2],
			},
			{
				test: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[3]}`,
				value: metricLabelFontSizes[3],
			},
			{ value: 0 },
		]);
	});
});

describe('getAggregateMetricBaseline', () => {
	test('should return middle when showingLabel is false', () => {
		const result = getAggregateMetricBaseline('min(width, height) / 2', 0.85, false);
		expect(result).toEqual({
			signal: 'middle',
		});
	});

	test('should return an if for vega to resolve if showing label', () => {
		const result = getAggregateMetricBaseline('min(width, height) / 2', 0.85, true);
		expect(result).toEqual({
			signal: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[2]} ? 'alphabetic' : 'middle'`,
		});
	});
});

describe('getMetricLabelEncodeEnter', () => {
	test('should return correct encode entry', () => {
		const result = getMetricLabelEncodeEnter('min(width, height) / 2', 0.85, 'Test Label');
		expect(result).toEqual({
			enter: {
				x: { signal: 'width / 2' },
				y: getLabelYWithOffset('min(width, height) / 2', 0.85),
				text: { value: 'Test Label' },
				fontSize: getFontSize('min(width, height) / 2', 0.85, false),
				align: { value: 'center' },
				baseline: { value: 'top' },
			},
		});
	});
});

describe('getMetricNumberEncodeEnter', () => {
	test('should return correct encode entry', () => {
		const result = getMetricNumberEncodeEnter('Test Metric', 'min(width, height) / 2', 0.85, true, false);
		expect(result).toEqual({
			enter: {
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
				text: getMetricNumberText('Test Metric', false),
				fontSize: getFontSize('min(width, height) / 2', 0.85, true),
				align: { value: 'center' },
				baseline: getAggregateMetricBaseline('min(width, height) / 2', 0.85, true),
			},
		});
	});
});

describe('getPercentMetricMark', () => {
	test('should return correct mark without metric label', () => {
		const result = getPercentMetricMark('Test', 'metric', 'min(width, height) / 2', 0.85, undefined);
		expect(result).toEqual({
			type: 'group',
			name: 'Test_percentText',
			marks: [
				{
					type: 'text',
					name: 'Test_percentMetricNumber',
					from: { data: 'Test_booleanData' },
					encode: getMetricNumberEncodeEnter('metric', 'min(width, height) / 2', 0.85, false, true),
				},
			],
		});
	});

	test('should return correct mark with metric label', () => {
		const result = getPercentMetricMark('Test', 'metric', 'min(width, height) / 2', 0.85, 'Test Label');
		expect(result).toEqual({
			type: 'group',
			name: 'Test_percentText',
			marks: [
				{
					type: 'text',
					name: 'Test_percentMetricNumber',
					from: { data: 'Test_booleanData' },
					encode: getMetricNumberEncodeEnter('metric', 'min(width, height) / 2', 0.85, true, true),
				},
				{
					type: 'text',
					name: 'Test_percentMetricLabel',
					from: { data: 'Test_booleanData' },
					encode: getMetricLabelEncodeEnter('min(width, height) / 2', 0.85, 'Test Label'),
				},
			],
		});
	});
});

describe('getAggregateMetricMark', () => {
	test('should return correct mark without metric label', () => {
		const result = getAggregateMetricMark('Test', 'metric', 'min(width, height) / 2', 0.85, undefined);
		expect(result).toEqual({
			type: 'group',
			name: 'Test_aggregateText',
			marks: [
				{
					type: 'text',
					name: 'Test_aggregateMetricNumber',
					from: { data: 'Test_aggregateData' },
					encode: getMetricNumberEncodeEnter('metric', 'min(width, height) / 2', 0.85, false, false),
				},
			],
		});
	});

	test('should return correct mark with metric label', () => {
		const result = getAggregateMetricMark('Test', 'metric', 'min(width, height) / 2', 0.85, 'Test Label');
		expect(result).toEqual({
			type: 'group',
			name: 'Test_aggregateText',
			marks: [
				{
					type: 'text',
					name: 'Test_aggregateMetricNumber',
					from: { data: 'Test_aggregateData' },
					encode: getMetricNumberEncodeEnter('metric', 'min(width, height) / 2', 0.85, true, false),
				},
				{
					type: 'text',
					name: 'Test_aggregateMetricLabel',
					from: { data: 'Test_aggregateData' },
					encode: getMetricLabelEncodeEnter('min(width, height) / 2', 0.85, 'Test Label'),
				},
			],
		});
	});
});

describe('getOpacityRules', () => {
	test('should return correct opacity rules without popover', () => {
		const result = getOpacityRules('Test', []);
		expect(result).toEqual([
			{
				test: `${HIGHLIGHTED_ITEM} && datum.${MARK_ID} !== ${HIGHLIGHTED_ITEM}`,
				value: 1 / HIGHLIGHT_CONTRAST_RATIO,
			},
			{
				value: 1,
			},
		]);
	});

	test('should return correct opacity rules with popover', () => {
		const children: MarkChildElement[] = [createElement(ChartPopover)];
		const result = getOpacityRules('Test', children);
		expect(result).toEqual([
			{
				test: `${HIGHLIGHTED_ITEM} && datum.${MARK_ID} !== ${HIGHLIGHTED_ITEM}`,
				value: 1 / HIGHLIGHT_CONTRAST_RATIO,
			},
			{
				test: `${SELECTED_ITEM} && datum.${MARK_ID} !== ${SELECTED_ITEM}`,
				value: 1 / HIGHLIGHT_CONTRAST_RATIO,
			},
			{
				value: 1,
			},
		]);
	});
});

describe('getArcMark', () => {
	test('should return correct arc mark without children', () => {
		const result = getArcMark('Test', 0.85, 'min(width, height) / 2', []);
		expect(result).toEqual({
			type: 'arc',
			name: 'Test',
			from: { data: FILTERED_TABLE },
			encode: {
				enter: {
					fill: { scale: COLOR_SCALE, field: 'id' },
					x: { signal: 'width / 2' },
					y: { signal: 'height / 2' },
					tooltip: undefined,
				},
				update: {
					startAngle: { field: 'startAngle' },
					endAngle: { field: 'endAngle' },
					padAngle: { value: 0.01 },
					innerRadius: { signal: '0.85 * min(width, height) / 2' },
					outerRadius: { signal: 'min(width, height) / 2' },
					fillOpacity: getOpacityRules('Test', []),
				},
			},
		});
	});

	test('should return correct arc mark with children', () => {
		const children: MarkChildElement[] = [createElement(ChartPopover)];
		const result = getArcMark('Test', 0.85, 'min(width, height) / 2', children);
		expect(result).toEqual({
			type: 'arc',
			name: 'Test',
			from: { data: FILTERED_TABLE },
			encode: {
				enter: {
					fill: { scale: COLOR_SCALE, field: 'id' },
					x: { signal: 'width / 2' },
					y: { signal: 'height / 2' },
					tooltip: getTooltip(children, 'Test'),
				},
				update: {
					startAngle: { field: 'startAngle' },
					endAngle: { field: 'endAngle' },
					padAngle: { value: 0.01 },
					innerRadius: { signal: '0.85 * min(width, height) / 2' },
					outerRadius: { signal: 'min(width, height) / 2' },
					fillOpacity: getOpacityRules('Test', children),
				},
			},
		});
	});
});
