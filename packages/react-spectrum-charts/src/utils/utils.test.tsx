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
import { Fragment, createElement } from 'react';
import React from 'react';

import { Bar } from '@components/Bar';
import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { Line } from '@components/Line';
import { Trendline } from '@components/Trendline';
import { Donut } from '@rsc/rc';
import {
	combineNames,
	getAllElements,
	getComponentName,
	sanitizeAxisAnnotationChildren,
	toCamelCase,
	toggleStringArrayValue,
} from '@utils';

import { Chart } from '../Chart';

describe('utils', () => {
	describe('toCamelCase()', () => {
		test('camelCase should convert to camelCase', () => {
			expect(toCamelCase('camelTest')).toStrictEqual('camelTest');
		});
		test('kebab-case should convert to camelCase', () => {
			expect(toCamelCase('kebab-test')).toStrictEqual('kebabTest');
		});
		test('PascalCase should convert to camelCase', () => {
			expect(toCamelCase('PascalTest')).toStrictEqual('pascalTest');
		});
		test('snake_case should convert to camelCase', () => {
			expect(toCamelCase('snake_test')).toStrictEqual('snakeTest');
		});
		test('sentence should convert to camelCase', () => {
			expect(toCamelCase('This is a test')).toStrictEqual('thisIsATest');
		});
		test('wild string should convert to camelCase', () => {
			expect(toCamelCase('The quickFox_jumped-over 2 DOGS!')).toStrictEqual('theQuickFoxJumpedOver2Dogs');
		});
		test('no alpha numeric characters should return original string', () => {
			expect(toCamelCase('&()*')).toStrictEqual('&()*');
		});
	});

	describe('sanitizeAxisAnnotationChildren()', () => {
		test('should filter out invalid children', () => {
			const popover = createElement(ChartPopover);
			const tooltip = createElement(ChartTooltip);
			const fragment = createElement(Fragment);
			const children = [popover, tooltip, true, fragment];
			expect(sanitizeAxisAnnotationChildren(children)).toStrictEqual([popover, tooltip]);
		});
		test('should flatten children', () => {
			const popover = createElement(ChartPopover);
			const tooltip = createElement(ChartTooltip);
			expect(sanitizeAxisAnnotationChildren([[popover, tooltip]])).toStrictEqual([popover, tooltip]);
			expect(sanitizeAxisAnnotationChildren([[popover], tooltip])).toStrictEqual([popover, tooltip]);
		});
	});

	describe('toggleStringArrayValue()', () => {
		test('should add value to target if it does not exist', () => {
			expect(toggleStringArrayValue(['a', 'b'], 'c')).toStrictEqual(['a', 'b', 'c']);
			expect(toggleStringArrayValue([], 'a')).toStrictEqual(['a']);
		});
		test('should remove value if it already exists in the target', () => {
			expect(toggleStringArrayValue(['a', 'b', 'c'], 'b')).toStrictEqual(['a', 'c']);
		});
	});

	describe('getAllElements()', () => {
		test('should return all matches', () => {
			const element = (
				<Chart data={[]}>
					<Bar>
						<Trendline>
							<ChartTooltip />
						</Trendline>
					</Bar>
					<Line name="myLine">
						<></>
						<ChartTooltip />
					</Line>
					<Line>
						<ChartTooltip />
					</Line>
					<Donut>
						<ChartTooltip />
					</Donut>
				</Chart>
			);

			const matches = getAllElements(element, ChartTooltip);

			expect(matches).toHaveLength(4);
			expect(matches[0].name).toBe('bar0Trendline');
			expect(matches[1].name).toBe('myLine');
			expect(matches[2].name).toBe('line1');
			expect(matches[3].name).toBe('donut0');
		});
	});

	describe('getComponentName()', () => {
		test('should return default name if name is not in the props passed in', () => {
			expect(getComponentName(createElement(Bar), 'bar0')).toBe('bar0');
		});
		test('should return camelCase name if provide in props', () => {
			expect(getComponentName(createElement(Bar, { name: 'funnel chart' }), 'bar0')).toBe('funnelChart');
		});
	});

	describe('combineElementNames()', () => {
		test('should return child name if parent name is null', () => {
			expect(combineNames(null, 'bar0')).toBe('bar0');
		});
		test('should return parent name if child name is null', () => {
			expect(combineNames('combo0', null)).toBe('combo0');
		});
		test('should return combined name if both parent and child names are provided', () => {
			expect(combineNames('combo0', 'bar0')).toBe('combo0Bar0');
		});
	});
});
