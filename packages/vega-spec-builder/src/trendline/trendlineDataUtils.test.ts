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
import { Data } from 'vega';

import {
	DEFAULT_COLOR,
	DEFAULT_TIME_DIMENSION,
	FILTERED_TABLE,
	MS_PER_DAY,
	SERIES_ID,
	TRENDLINE_VALUE,
} from '@spectrum-charts/constants';

import { baseData } from '../specUtils';
import {
	addTableDataTransforms,
	addTrendlineData,
	getAggregateTrendlineData,
	getRegressionTrendlineData,
	getTrendlineStatisticalTransforms,
} from './trendlineDataUtils';
import { defaultLineOptions, defaultTrendlineOptions } from './trendlineTestUtils';

const getDefaultData = (): Data[] => JSON.parse(JSON.stringify(baseData));

describe('addTrendlineData()', () => {
	test('should add normalized dimension for regression trendline', () => {
		const trendlineData = getDefaultData();
		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'linear' }],
		});
		expect(trendlineData[0].transform).toHaveLength(4);
		expect(trendlineData[0].transform?.[1]).toStrictEqual({
			as: ['datetimeMin'],
			fields: ['datetime'],
			ops: ['min'],
			type: 'joinaggregate',
		});
		expect(trendlineData[0].transform?.[2]).toStrictEqual({
			as: 'datetimeNormalized',
			expr: `(datum.datetime - datum.datetimeMin + ${MS_PER_DAY}) / ${MS_PER_DAY}`,
			type: 'formula',
		});
	});

	test('should not add normalized dimension in not regression trendline', () => {
		const trendlineData = getDefaultData();
		addTrendlineData(trendlineData, defaultLineOptions);
		expect(trendlineData[0].transform).toHaveLength(1);
	});

	test('should add datasource for trendline', () => {
		const trendlineData = getDefaultData();
		expect(trendlineData).toHaveLength(2);
		addTrendlineData(trendlineData, defaultLineOptions);
		expect(trendlineData).toHaveLength(3);
		expect(trendlineData[2]).toStrictEqual({
			name: 'line0Trendline0_highResolutionData',
			source: FILTERED_TABLE,
			transform: [
				{
					as: [TRENDLINE_VALUE, `${DEFAULT_TIME_DIMENSION}Min`, `${DEFAULT_TIME_DIMENSION}Max`],
					fields: ['value', DEFAULT_TIME_DIMENSION, DEFAULT_TIME_DIMENSION],
					groupby: ['series'],
					ops: ['mean', 'min', 'max'],
					type: 'aggregate',
				},
				{
					type: 'formula',
					expr: `datum.${DEFAULT_COLOR}`,
					as: SERIES_ID,
				},
			],
		});
	});

	test('should add data sources for hover interactiontions if ChartTooltip exists', () => {
		const trendlineData = getDefaultData();
		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ chartTooltips: [{}] }],
		});
		expect(trendlineData).toHaveLength(7);
		expect(trendlineData[5]).toHaveProperty('name', 'line0_allTrendlineData');
		expect(trendlineData[6]).toHaveProperty('name', 'line0Trendline_highlightedData');
	});

	test('should add _highResolutionData if doing a regression method', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'linear' }],
		});
		expect(trendlineData).toHaveLength(3);
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
	});

	test('should add _params and _data if doing a regression method and there is a tooltip on the trendline', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'linear', chartTooltips: [{}] }],
		});
		expect(trendlineData).toHaveLength(7);
		expect(trendlineData[3]).toHaveProperty('name', 'line0Trendline0_params');
		expect(trendlineData[4]).toHaveProperty('name', 'line0Trendline0_data');
	});

	test('should add sort transform, then window trandform, and then dimension range filter transform for movingAverage', () => {
		const trendlineData = getDefaultData();
		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'movingAverage-3', dimensionRange: [1, 2] }],
		});
		expect(trendlineData).toHaveLength(3);
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_data');
		expect(trendlineData[2].transform).toHaveLength(3);
		expect(trendlineData[2].transform?.[0]).toHaveProperty('type', 'collect');
		expect(trendlineData[2].transform?.[1]).toHaveProperty('type', 'window');
		expect(trendlineData[2].transform?.[2]).toHaveProperty('type', 'filter');
	});

	test('should add filter transforms for regression method if trendline has excludeDataKey', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'linear', excludeDataKeys: ['exclude1', 'exclude2'] }],
		});
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
		expect(trendlineData[2].transform).toHaveLength(4);
		expect(trendlineData[2].transform?.[0]).toStrictEqual({
			type: 'filter',
			expr: '!datum.exclude1',
		});
		expect(trendlineData[2].transform?.[1]).toStrictEqual({
			type: 'filter',
			expr: '!datum.exclude2',
		});
	});

	test('should not add filter transform for regression method if trendline does not have excludeDataKey', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'linear' }],
		});
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
		expect(trendlineData[2].transform).toHaveLength(2);
		expect(trendlineData[2].transform).not.toContain(expect.objectContaining({ type: 'filter' }));
	});

	test('should add filter transforms for aggregate method if trendline has excludeDataKey', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'median', excludeDataKeys: ['exclude1', 'exclude2'] }],
		});
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
		expect(trendlineData[2].transform).toHaveLength(4);
		expect(trendlineData[2].transform?.[0]).toStrictEqual({
			type: 'filter',
			expr: '!datum.exclude1',
		});
		expect(trendlineData[2].transform?.[1]).toStrictEqual({
			type: 'filter',
			expr: '!datum.exclude2',
		});
	});

	test('should not add filter transform for aggregate method if trendline does not have excludeDataKey', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'median' }],
		});
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
		expect(trendlineData[2].transform).toHaveLength(2);
		expect(trendlineData[2].transform).not.toContain(expect.objectContaining({ type: 'filter' }));
	});

	test('should add filter transform for window method if trendline has excludeDataKey', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'movingAverage-2', excludeDataKeys: ['exclude1', 'exclude2'] }],
		});
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_data');
		expect(trendlineData[2].transform).toHaveLength(4);
		expect(trendlineData[2].transform?.[0]).toStrictEqual({
			type: 'filter',
			expr: '!datum.exclude1',
		});
		expect(trendlineData[2].transform?.[1]).toStrictEqual({
			type: 'filter',
			expr: '!datum.exclude2',
		});
	});

	test('should not add filter transform for window method if trendline does not have excludeDataKey', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineOptions,
			trendlines: [{ method: 'movingAverage-2' }],
		});
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_data');
		expect(trendlineData[2].transform).toHaveLength(2);
		expect(trendlineData[2].transform).not.toContain(expect.objectContaining({ type: 'filter' }));
	});
});

describe('getAggregateTrendlineData()', () => {
	test('should return one data source if there are not any interactive children', () => {
		const data = getAggregateTrendlineData(defaultLineOptions, defaultTrendlineOptions, [DEFAULT_COLOR]);
		expect(data).toHaveLength(1);
		expect(data[0]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
	});
	test('should return two data sources if there are interactive children', () => {
		const data = getAggregateTrendlineData(
			defaultLineOptions,
			{ ...defaultTrendlineOptions, chartTooltips: [{}] },
			[DEFAULT_COLOR]
		);
		expect(data).toHaveLength(2);
		expect(data[1]).toHaveProperty('name', 'line0Trendline0_data');
	});
});

describe('getRegressionTrendlineData()', () => {
	test('should return one data source if there are not any interactive children', () => {
		const data = getRegressionTrendlineData(defaultLineOptions, defaultTrendlineOptions, [DEFAULT_COLOR]);
		expect(data).toHaveLength(1);
		expect(data[0]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
	});
	test('should return three data sources if there are interactive children', () => {
		const data = getRegressionTrendlineData(
			defaultLineOptions,
			{ ...defaultTrendlineOptions, chartTooltips: [{}] },
			[DEFAULT_COLOR]
		);
		expect(data).toHaveLength(3);
		expect(data[1]).toHaveProperty('name', 'line0Trendline0_params');
		expect(data[2]).toHaveProperty('name', 'line0Trendline0_data');
	});
});

describe('getTrendlineStatisticalTransforms()', () => {
	test('should return the aggregate transform for aggregate methods', () => {
		const aggregateTransforms = getTrendlineStatisticalTransforms(
			defaultLineOptions,
			{ ...defaultTrendlineOptions, method: 'average' },
			true
		);
		expect(aggregateTransforms).toHaveLength(1);
		expect(aggregateTransforms[0]).toHaveProperty('type', 'aggregate');
	});
	test('should return the regression transform for regression methods', () => {
		const aggregateTransforms = getTrendlineStatisticalTransforms(
			defaultLineOptions,
			{ ...defaultTrendlineOptions, method: 'linear' },
			true
		);
		expect(aggregateTransforms).toHaveLength(1);
		expect(aggregateTransforms[0]).toHaveProperty('type', 'regression');
	});
	test('should return the window transform for window methods', () => {
		const aggregateTransforms = getTrendlineStatisticalTransforms(
			defaultLineOptions,
			{ ...defaultTrendlineOptions, method: 'movingAverage-2' },
			true
		);
		expect(aggregateTransforms).toHaveLength(2);
		expect(aggregateTransforms[0]).toHaveProperty('type', 'collect');
		expect(aggregateTransforms[1]).toHaveProperty('type', 'window');
	});
});

describe('addTableDataTransforms()', () => {
	test('should add normalized dimension transform if regression method and time scale type', () => {
		const transforms = addTableDataTransforms([], {
			...defaultLineOptions,
			scaleType: 'time',
			trendlines: [{ method: 'linear' }],
		});
		expect(transforms).toHaveLength(3);
		expect(transforms[0]).toHaveProperty('type', 'joinaggregate');
		expect(transforms[1]).toHaveProperty('type', 'formula');
		expect(transforms[2]).toHaveProperty('type', 'extent');
	});
	test('should add extent transforms if there are trendlines with regression methods', () => {
		const transforms = addTableDataTransforms([], {
			...defaultLineOptions,
			scaleType: 'linear',
			trendlines: [{ method: 'linear' }],
		});
		expect(transforms).toHaveLength(1);
		expect(transforms[0]).toHaveProperty('type', 'extent');
	});
	test('should not add any transforms if there are not any regression trendlines', () => {
		expect(
			addTableDataTransforms([], {
				...defaultLineOptions,
				scaleType: 'linear',
				trendlines: [{ method: 'average' }],
			})
		).toHaveLength(0);
		expect(
			addTableDataTransforms([], {
				...defaultLineOptions,
				scaleType: 'linear',
				trendlines: [{ method: 'movingAverage-2' }],
			})
		).toHaveLength(0);
	});
	test('should not add normalized dimension transform if it is not a time scale', () => {
		const transforms = addTableDataTransforms([], {
			...defaultLineOptions,
			scaleType: 'linear',
			trendlines: [{ method: 'linear' }],
		});
		expect(transforms).toHaveLength(1);
		expect(transforms[0]).toHaveProperty('type', 'extent');
	});
});
