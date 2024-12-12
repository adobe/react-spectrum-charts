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

import { TABLE } from '@constants';
import { ChartTooltip } from '@rsc';
import { ArcMark } from 'vega';

import { getArcMark } from './sunburstMarkUtils';
import { defaultSunburstProps } from './sunburstTestUtils';

describe('getArcMark', () => {
	test('should return a valid ArcMark object', () => {
		const expectedArcMark: ArcMark = {
			type: 'arc',
			name: defaultSunburstProps.name,
			from: { data: TABLE },
			encode: {
				enter: {
					x: { signal: 'width / 2' },
					y: { signal: 'height / 2' },
					fill: {
						scale: 'color',
						field: 'segment',
					},
					fillOpacity: { scale: 'opacity', field: 'depth' },
					tooltip: undefined,
				},
				update: {
					startAngle: { field: 'a0' },
					endAngle: { field: 'a1' },
					innerRadius: { field: 'r0' },
					outerRadius: { field: 'r1' },
					stroke: { value: 'white' },
					strokeWidth: { value: 0.5 },
					zindex: { value: 0 },
					opacity: undefined,
				},
			},
		};

		const arcMark = getArcMark(defaultSunburstProps);
		expect(arcMark).toEqual(expectedArcMark);
	});

	test('should include tooltip and update opacity when proper props are passed', () => {
		const expectedArcMark: ArcMark = {
			type: 'arc',
			name: defaultSunburstProps.name,
			from: { data: TABLE },
			encode: {
				enter: {
					x: { signal: 'width / 2' },
					y: { signal: 'height / 2' },
					fill: {
						scale: 'color',
						field: 'segment',
					},
					fillOpacity: { scale: 'opacity', field: 'depth' },
					tooltip: {
						signal: "merge(datum, {'rscComponentName': 'testName'})",
					},
				},
				update: {
					startAngle: { field: 'a0' },
					endAngle: { field: 'a1' },
					innerRadius: { field: 'r0' },
					outerRadius: { field: 'r1' },
					stroke: { value: 'white' },
					strokeWidth: { value: 0.5 },
					zindex: { value: 0 },
					opacity: [
						{
							test: 'isArray(highlightedItem) && length(highlightedItem) > 0 && indexof(highlightedItem, datum.rscMarkId) === -1',
							value: 0.2,
						},
						{
							test: '!isArray(highlightedItem) && isValid(highlightedItem) && highlightedItem !== datum.rscMarkId',
							value: 0.2,
						},
						{
							value: 1,
						},
					],
				},
			},
		};

		const arcMark = getArcMark({
			...defaultSunburstProps,
			children: [createElement(ChartTooltip)],
			muteElementsOnHover: true,
		});
		expect(arcMark).toEqual(expectedArcMark);
	});
});
