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
import { BACKGROUND_COLOR, DEFAULT_COLOR_SCHEME } from '@constants';

import { getAreaMark } from './areaUtils';

describe('getAreaMark', () => {
	test('basic props', () => {
		expect(
			getAreaMark({
				name: 'area0',
				color: 'color',
				colorScheme: DEFAULT_COLOR_SCHEME,
				children: [],
				metricStart: 'metricStart',
				metricEnd: 'metricEnd',
				isStacked: false,
				dimension: 'dimension',
				scaleType: 'linear',
				opacity: 0.5,
			})
		).toStrictEqual({
			name: 'area0',
			type: 'area',
			from: {
				data: 'area0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					y: {
						scale: 'yLinear',
						field: 'metricStart',
					},
					y2: {
						scale: 'yLinear',
						field: 'metricEnd',
					},
					tooltip: undefined,

					fill: {
						scale: 'color',
						field: 'color',
					},
				},
				update: {
					cursor: undefined,
					x: {
						scale: 'xLinear',
						field: 'dimension',
					},
					fillOpacity: [
						{
							value: 0.5,
						},
					],
				},
			},
		});
	});

	test('stacked', () => {
		expect(
			getAreaMark({
				name: 'area0',
				color: 'color',
				colorScheme: DEFAULT_COLOR_SCHEME,
				children: [],
				metricStart: 'metricStart',
				metricEnd: 'metricEnd',
				isStacked: true,
				dimension: 'dimension',
				scaleType: 'linear',
				opacity: 0.5,
			})
		).toStrictEqual({
			name: 'area0',
			type: 'area',
			from: {
				data: 'area0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					tooltip: undefined,
					y: {
						scale: 'yLinear',
						field: 'metricStart',
					},
					y2: {
						scale: 'yLinear',
						field: 'metricEnd',
					},
					fill: {
						scale: 'color',
						field: 'color',
					},
					stroke: {
						signal: BACKGROUND_COLOR,
					},
					strokeWidth: {
						value: 1.5,
					},
					strokeJoin: {
						value: 'round',
					},
				},
				update: {
					cursor: undefined,
					x: {
						scale: 'xLinear',
						field: 'dimension',
					},
					fillOpacity: [
						{
							value: 0.5,
						},
					],
				},
			},
		});
	});

	test('time scale', () => {
		expect(
			getAreaMark({
				name: 'area0',
				color: 'color',
				colorScheme: DEFAULT_COLOR_SCHEME,
				children: [],
				metricStart: 'metricStart',
				metricEnd: 'metricEnd',
				isStacked: false,
				dimension: 'dimension',
				scaleType: 'time',
				opacity: 0.5,
			})
		).toStrictEqual({
			name: 'area0',
			type: 'area',
			from: {
				data: 'area0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					tooltip: undefined,

					y: {
						scale: 'yLinear',
						field: 'metricStart',
					},
					y2: {
						scale: 'yLinear',
						field: 'metricEnd',
					},
					fill: {
						scale: 'color',
						field: 'color',
					},
				},
				update: {
					cursor: undefined,
					x: {
						scale: 'xTime',
						field: 'datetime0',
					},
					fillOpacity: [
						{
							value: 0.5,
						},
					],
				},
			},
		});
	});

	test('point scale', () => {
		expect(
			getAreaMark({
				name: 'area0',
				color: 'color',
				colorScheme: DEFAULT_COLOR_SCHEME,
				children: [],
				metricStart: 'metricStart',
				metricEnd: 'metricEnd',
				isStacked: false,
				dimension: 'dimension',
				scaleType: 'point',
				opacity: 0.5,
			})
		).toStrictEqual({
			name: 'area0',
			type: 'area',
			from: {
				data: 'area0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					tooltip: undefined,
					y: {
						scale: 'yLinear',
						field: 'metricStart',
					},
					y2: {
						scale: 'yLinear',
						field: 'metricEnd',
					},
					fill: {
						scale: 'color',
						field: 'color',
					},
				},
				update: {
					cursor: undefined,
					x: {
						scale: 'xPoint',
						field: 'dimension',
					},
					fillOpacity: [
						{
							value: 0.5,
						},
					],
				},
			},
		});
	});
});
