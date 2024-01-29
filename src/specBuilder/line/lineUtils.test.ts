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
import { createElement } from 'react';

import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { Trendline } from '@components/Trendline';

import { getInteractiveMarkName, getPopoverMarkName } from './lineUtils';

describe('getInteractiveMarkName()', () => {
	test('should return undefined if there are no interactive children', () => {
		expect(getInteractiveMarkName([], 'line0')).toBeUndefined();
		expect(getInteractiveMarkName([createElement(Trendline)], 'line0')).toBeUndefined();
	});
	test('should return the name provided if there is a tooltip or popover in the children', () => {
		expect(getInteractiveMarkName([createElement(ChartTooltip)], 'line0')).toEqual('line0');
		expect(getInteractiveMarkName([createElement(ChartPopover)], 'line0')).toEqual('line0');
	});
	test('should return the aggregated trendline name if the line has a trendline with any interactive children', () => {
		expect(getInteractiveMarkName([createElement(Trendline, {}, createElement(ChartTooltip))], 'line0')).toEqual(
			'line0Trendline'
		);
		expect(getInteractiveMarkName([createElement(Trendline, {}, createElement(ChartPopover))], 'line0')).toEqual(
			'line0Trendline'
		);
	});
});

describe('getPopoverMarkName()', () => {
	test('should return undefined if there are no popovers', () => {
		expect(getPopoverMarkName([], 'line0')).toBeUndefined();
		expect(getPopoverMarkName([createElement(Trendline)], 'line0')).toBeUndefined();
		expect(getPopoverMarkName([createElement(ChartTooltip)], 'line0')).toBeUndefined();
	});
	test('should return the name provided if there is a popover in the children', () => {
		expect(getPopoverMarkName([createElement(ChartPopover)], 'line0')).toEqual('line0');
	});
	test('should return the aggregated trendline name if the line has a trendline with a popover on it', () => {
		expect(getPopoverMarkName([createElement(Trendline, {}, createElement(ChartPopover))], 'line0')).toEqual(
			'line0Trendline'
		);
	});
});
