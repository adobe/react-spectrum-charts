/*
 * Copyright 2025 Adobe. All rights reserved.
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

import { Axis } from '../components/Axis';
import { Bar } from '../components/Bar';
import { ChartTooltip } from '../components/ChartTooltip';
import { Legend } from '../components/Legend';
import { Line } from '../components/Line';
import { Scatter } from '../components/Scatter';
import { ScatterPath } from '../components/ScatterPath';
import { Title } from '../components/Title';
import { Trendline } from '../components/Trendline';
import { TrendlineAnnotation } from '../components/TrendlineAnnotation';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_LINE_TYPES, MARK_ID } from '../constants';
import { LineType } from '../specBuilder/types';
import { SanitizedSpecProps } from '../types';
import { rscPropsToSpecBuilderOptions } from './chartAdapter';

const chartProps: SanitizedSpecProps = {
	backgroundColor: DEFAULT_BACKGROUND_COLOR,
	colors: 'categorical12',
	colorScheme: DEFAULT_COLOR_SCHEME,
	hiddenSeries: [],
	idKey: MARK_ID,
	lineTypes: DEFAULT_LINE_TYPES as LineType[],
	lineWidths: ['M'],
	symbolShapes: ['rounded-square'],
	symbolSizes: ['XS', 'XL'],
	children: [
		createElement(Axis, { baseline: true, position: 'bottom', title: 'Browser' }),
		createElement(Axis, { grid: true, position: 'left', title: 'Downloads' }),
		createElement(Bar, { dimension: 'browser', metric: 'downloads' }),
	],
};

describe('rscPropsToSpecBuilderOptions()', () => {
	describe('axes', () => {
		test('should return one axis per axis element', () => {
			const options = rscPropsToSpecBuilderOptions(chartProps);
			expect(options.axes).toHaveLength(2);
			expect(options.axes?.[0]).toHaveProperty('position', 'bottom');
			expect(options.axes?.[1]).toHaveProperty('position', 'left');
		});
		test('should not return axes that are not cartesian', () => {
			const options = rscPropsToSpecBuilderOptions({
				...chartProps,
				children: [createElement(Scatter, { dimension: 'datetime', metric: 'views' })],
			});
			expect(options.axes).toHaveLength(0);
		});
	});

	describe('marks', () => {
		test('should return provided marks in the marks array', () => {
			const options = rscPropsToSpecBuilderOptions({
				...chartProps,
				children: [
					createElement(Bar, { dimension: 'browser', metric: 'downloads' }),
					createElement(Scatter, { dimension: 'datetime', metric: 'views' }),
				],
			});
			expect(options.marks).toHaveLength(2);

			expect(options.marks[0]).toHaveProperty('markType', 'bar');
			expect(options.marks[0]).toHaveProperty('dimension', 'browser');
			expect(options.marks[0]).toHaveProperty('metric', 'downloads');

			expect(options.marks[1]).toHaveProperty('markType', 'scatter');
			expect(options.marks[1]).toHaveProperty('dimension', 'datetime');
			expect(options.marks[1]).toHaveProperty('metric', 'views');
		});
		test('should return an empty marks array if no mark children exist', () => {
			const options = rscPropsToSpecBuilderOptions({
				...chartProps,
				children: [createElement(Legend), createElement(Axis, { position: 'bottom' })],
			});
			expect(options.marks).toHaveLength(0);
		});
	});

	describe('legends', () => {
		test('should return one legend per legend element', () => {
			const options = rscPropsToSpecBuilderOptions({
				...chartProps,
				children: [createElement(Legend, { position: 'top' })],
			});
			expect(options.legends).toHaveLength(1);
			expect(options.legends?.[0]).toHaveProperty('position', 'top');
		});
		test('should not return legends if legend element is absent', () => {
			const options = rscPropsToSpecBuilderOptions(chartProps);
			expect(options.legends).toHaveLength(0);
		});
	});

	describe('titles', () => {
		test('should return one title per title element', () => {
			const options = rscPropsToSpecBuilderOptions({
				...chartProps,
				children: [createElement(Title, { text: 'Test title' })],
			});
			expect(options.titles).toHaveLength(1);
			expect(options.titles?.[0]).toHaveProperty('text', 'Test title');
		});
		test('should not return titles if title element is absent', () => {
			const options = rscPropsToSpecBuilderOptions(chartProps);
			expect(options.titles).toHaveLength(0);
		});
	});

	describe('examples', () => {
		test('basic bar', () => {
			expect(rscPropsToSpecBuilderOptions(chartProps)).toStrictEqual({
				axes: [
					{ axisAnnotations: [], baseline: true, position: 'bottom', referenceLines: [], title: 'Browser' },
					{ axisAnnotations: [], grid: true, position: 'left', referenceLines: [], title: 'Downloads' },
				],
				backgroundColor: DEFAULT_BACKGROUND_COLOR,
				colorScheme: DEFAULT_COLOR_SCHEME,
				colors: 'categorical12',
				hiddenSeries: [],
				idKey: MARK_ID,
				legends: [],
				lineTypes: DEFAULT_LINE_TYPES,
				lineWidths: ['M'],
				marks: [
					{
						barAnnotations: [],
						chartPopovers: [],
						chartTooltips: [],
						dimension: 'browser',
						hasOnClick: false,
						markType: 'bar',
						metric: 'downloads',
						trendlines: [],
					},
				],
				symbolShapes: ['rounded-square'],
				symbolSizes: ['XS', 'XL'],
				titles: [],
			});
		});

		test('basic line', () => {
			const options = rscPropsToSpecBuilderOptions({
				...chartProps,
				children: [
					createElement(Line, {
						color: 'series',
						dimension: 'datetime',
						metric: 'value',
						name: 'line0',
						scaleType: 'time',
					}),
					createElement(Legend, { lineWidth: { value: 0 } }),
				],
			});
			expect(options).toStrictEqual({
				axes: [],
				backgroundColor: 'transparent',
				colorScheme: 'light',
				colors: 'categorical12',
				hiddenSeries: [],
				idKey: 'rscMarkId',
				legends: [{ hasMouseInteraction: false, hasOnClick: false, lineWidth: { value: 0 } }],
				lineTypes: ['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash'],
				lineWidths: ['M'],
				marks: [
					{
						chartPopovers: [],
						chartTooltips: [],
						color: 'series',
						dimension: 'datetime',
						hasOnClick: false,
						markType: 'line',
						metric: 'value',
						metricRanges: [],
						name: 'line0',
						scaleType: 'time',
						trendlines: [],
					},
				],
				symbolShapes: ['rounded-square'],
				symbolSizes: ['XS', 'XL'],
				titles: [],
			});
		});

		test('Supreme scatter', () => {
			const options = rscPropsToSpecBuilderOptions({
				...chartProps,
				lineTypes: ['dotted', 'solid'],
				opacities: [0.5, 1],
				symbolSizes: [1, 'M'],
				children: [
					createElement(Axis, {
						grid: true,
						labelFormat: 'percentage',
						position: 'bottom',
						title: 'Percentage of daily users (DAU)',
					}),
					createElement(Axis, { grid: true, position: 'left', title: 'Average number of times per day' }),
					createElement(
						Scatter,
						{
							color: 'segment',
							dimension: 'dauPercent',
							lineType: 'period',
							lineWidth: { value: 1 },
							metric: 'countAvg',
							opacity: 'period',
						},
						[
							createElement(ChartTooltip, { highlightBy: ['event', 'segment'] }),
							createElement(
								Trendline,
								{
									dimensionExtent: ['domain', 'domain'],
									displayOnHover: true,
									lineType: 'solid',
									lineWidth: 'XS',
									method: 'median',
									orientation: 'horizontal',
								},
								[createElement(TrendlineAnnotation, { numberFormat: '.3', prefix: 'Median times' })]
							),
							createElement(
								Trendline,
								{
									dimensionExtent: ['domain', 'domain'],
									displayOnHover: true,
									lineType: 'solid',
									lineWidth: 'XS',
									method: 'median',
									orientation: 'vertical',
								},
								[createElement(TrendlineAnnotation, { numberFormat: '.2%', prefix: 'Median %DAU' })]
							),
							createElement(ScatterPath, {
								groupBy: ['event', 'segment'],
								opacity: 0.2,
								pathWidth: 'pathWidth',
							}),
						]
					),
					createElement(Legend, { highlight: true, position: 'bottom' }),
				],
			});
			expect(options).toStrictEqual({
				axes: [
					{
						axisAnnotations: [],
						grid: true,
						labelFormat: 'percentage',
						position: 'bottom',
						referenceLines: [],
						title: 'Percentage of daily users (DAU)',
					},
					{
						axisAnnotations: [],
						grid: true,
						position: 'left',
						referenceLines: [],
						title: 'Average number of times per day',
					},
				],
				backgroundColor: 'transparent',
				colorScheme: 'light',
				colors: 'categorical12',
				hiddenSeries: [],
				idKey: 'rscMarkId',
				legends: [{ hasMouseInteraction: false, hasOnClick: false, highlight: true, position: 'bottom' }],
				lineTypes: ['dotted', 'solid'],
				lineWidths: ['M'],
				marks: [
					{
						chartPopovers: [],
						chartTooltips: [{ highlightBy: ['event', 'segment'] }],
						color: 'segment',
						dimension: 'dauPercent',
						lineType: 'period',
						lineWidth: { value: 1 },
						markType: 'scatter',
						metric: 'countAvg',
						opacity: 'period',
						scatterPaths: [{ groupBy: ['event', 'segment'], opacity: 0.2, pathWidth: 'pathWidth' }],
						trendlines: [
							{
								chartTooltips: [],
								dimensionExtent: ['domain', 'domain'],
								displayOnHover: true,
								lineType: 'solid',
								lineWidth: 'XS',
								method: 'median',
								orientation: 'horizontal',
								trendlineAnnotations: [{ numberFormat: '.3', prefix: 'Median times' }],
							},
							{
								chartTooltips: [],
								dimensionExtent: ['domain', 'domain'],
								displayOnHover: true,
								lineType: 'solid',
								lineWidth: 'XS',
								method: 'median',
								orientation: 'vertical',
								trendlineAnnotations: [{ numberFormat: '.2%', prefix: 'Median %DAU' }],
							},
						],
					},
				],
				opacities: [0.5, 1],
				symbolShapes: ['rounded-square'],
				symbolSizes: [1, 'M'],
				titles: [],
			});
		});
	});
});
