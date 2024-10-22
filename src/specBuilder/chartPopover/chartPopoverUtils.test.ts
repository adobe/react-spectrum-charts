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
import { defaultBarProps } from '@specBuilder/bar/barTestUtils';
import { baseData } from '@specBuilder/specUtils';
import { Data } from 'vega';

import { BarSpecProps, ChartPopoverProps } from '../../types';
import { addPopoverData, applyPopoverPropDefaults, getPopovers } from './chartPopoverUtils';

const getDefautltMarkProps = (popoverProps: ChartPopoverProps = {}): BarSpecProps => ({
	...defaultBarProps,
	children: [createElement(ChartPopover, popoverProps)],
});

describe('getPopovers()', () => {
	test('should get all the popovers from props', () => {
		const markProps = { ...defaultBarProps, children: [createElement(ChartPopover)] };
		const popovers = getPopovers(markProps);
		expect(popovers.length).toBe(1);
	});
});

describe('applyPopoverPropDefaults()', () => {
	test('should apply all defaults to ChartPopoverProps', () => {
		const chartPopoverProps: ChartPopoverProps = {};
		const markName = 'bar0';
		const popoverSpecProps = applyPopoverPropDefaults(chartPopoverProps, markName);
		expect(popoverSpecProps).toHaveProperty('UNSAFE_highlightBy', 'item');
		expect(popoverSpecProps).toHaveProperty('markName', markName);
	});
});

describe('addPopoverData()', () => {
	let data: Data[];
	beforeEach(() => {
		data = JSON.parse(JSON.stringify(baseData));
	});
	test('should add the group id transform if highlightBy is `item`', () => {
		const markProps = getDefautltMarkProps({ UNSAFE_highlightBy: 'item' });
		addPopoverData(data, markProps);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_selectedGroupId');
	});
	test('should add the group id transform if highlightBy is `dimension`', () => {
		const markProps = getDefautltMarkProps({ UNSAFE_highlightBy: 'dimension' });
		addPopoverData(data, markProps);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_selectedGroupId');
	});
	test('should add the group id transform if highlightBy is `series`', () => {
		const markProps = getDefautltMarkProps({ UNSAFE_highlightBy: 'series' });
		addPopoverData(data, markProps);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_selectedGroupId');
	});
	test('should add the group id transform if highlightBy is a key array', () => {
		const markProps = getDefautltMarkProps({ UNSAFE_highlightBy: ['operatingSystem'] });
		addPopoverData(data, markProps);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_selectedGroupId');
	});
	test('should not add highlightedData for the mark if false', () => {
		const dataLength = data.length;
		const markProps = getDefautltMarkProps({ UNSAFE_highlightBy: 'series' });
		addPopoverData(data, markProps, false);
		// length sholdn't be changed
		expect(data).toHaveLength(dataLength);
	});
});
