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
import { HIGHLIGHTED_GROUP } from '@constants';
import { defaultBarProps } from '@specBuilder/bar/barTestUtils';
import { defaultScatterProps } from '@specBuilder/scatter/scatterTestUtils';
import { defaultSignals } from '@specBuilder/specTestUtils';
import { baseData } from '@specBuilder/specUtils';
import { Data, Signal } from 'vega';

import { BarSpecProps, ChartTooltipProps, LineSpecProps } from '../../types';
import {
	addHighlightMarkOpacityRules,
	addTooltipData,
	addTooltipSignals,
	applyTooltipPropDefaults,
	getTooltips,
	isHighlightedByGroup,
} from './chartTooltipUtils';

const getDefautltMarkProps = (tooltipProps: ChartTooltipProps = {}): BarSpecProps => ({
	...defaultBarProps,
	children: [createElement(ChartTooltip, tooltipProps)],
});

describe('getTooltips()', () => {
	test('should get all the tooltips from props', () => {
		const markProps = { ...defaultBarProps, children: [createElement(ChartTooltip), createElement(ChartPopover)] };
		const tooltips = getTooltips(markProps);
		expect(tooltips.length).toBe(1);
	});
});

describe('applyTooltipPropDefaults()', () => {
	test('should apply all defaults to ChartTooltipProps', () => {
		const chartTooltipProps: ChartTooltipProps = {};
		const markName = 'bar0';
		const tooltipSpecProps = applyTooltipPropDefaults(chartTooltipProps, markName);
		expect(tooltipSpecProps).toHaveProperty('highlightBy', 'item');
		expect(tooltipSpecProps).toHaveProperty('markName', markName);
	});
});

describe('addTooltipData()', () => {
	let data: Data[];
	beforeEach(() => {
		data = JSON.parse(JSON.stringify(baseData));
	});
	test('if highlightBy is `item` or undefined, no data should be added', () => {
		const markProps = getDefautltMarkProps();
		addTooltipData(data, markProps);
		expect(data).toEqual(baseData);
		addTooltipData(data, getDefautltMarkProps({ highlightBy: 'item' }));
		expect(data).toEqual(baseData);
	});
	test('should add the group id transform if highlightBy is `dimension`', () => {
		const markProps = getDefautltMarkProps({ highlightBy: 'dimension' });
		addTooltipData(data, markProps);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_highlightGroupId');
	});
	test('should add the group id transform if highlightBy is `series`', () => {
		const markProps = getDefautltMarkProps({ highlightBy: 'series' });
		addTooltipData(data, markProps);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_highlightGroupId');
	});
	test('should add the group id transform if highlightBy is a key array', () => {
		const markProps = getDefautltMarkProps({ highlightBy: ['operatingSystem'] });
		addTooltipData(data, markProps);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_highlightGroupId');
	});
	test('should not add highlightedData for the mark if false', () => {
		const dataLength = data.length;
		const markProps = getDefautltMarkProps({ highlightBy: 'series' });
		addTooltipData(data, markProps, false);
		// length sholdn't be changed
		expect(data).toHaveLength(dataLength);
	});
});

describe('isHighlightedByGroup()', () => {
	test('should return true if highlightBy is `dimension` or `series`', () => {
		expect(isHighlightedByGroup(getDefautltMarkProps({ highlightBy: 'dimension' }))).toBe(true);
		expect(isHighlightedByGroup(getDefautltMarkProps({ highlightBy: 'series' }))).toBe(true);
	});
	test('should return true if highlightBy is an array', () => {
		expect(isHighlightedByGroup(getDefautltMarkProps({ highlightBy: ['operatingSystem'] }))).toBe(true);
	});
	test('should return false if highlightBy is `item` or undefined', () => {
		expect(isHighlightedByGroup(getDefautltMarkProps({ highlightBy: 'item' }))).toBe(false);
		expect(isHighlightedByGroup(getDefautltMarkProps())).toBe(false);
	});
});

describe('addTooltipSignals()', () => {
	let signals: Signal[] = [];
	let highlightedGroupSignal: Signal;
	beforeEach(() => {
		signals = JSON.parse(JSON.stringify(defaultSignals));
		highlightedGroupSignal = signals.find((signal) => signal.name === HIGHLIGHTED_GROUP) as Signal;
	});

	test('if mark is not highlighted by group id, should not add any signals', () => {
		addTooltipSignals(signals, getDefautltMarkProps());
		expect(highlightedGroupSignal).not.toHaveProperty('on');
		addTooltipSignals(signals, getDefautltMarkProps({ highlightBy: 'item' }));
		expect(highlightedGroupSignal).not.toHaveProperty('on');
	});

	test('should add on events if highlightBy is `series`', () => {
		addTooltipSignals(signals, getDefautltMarkProps({ highlightBy: 'series' }));
		expect(highlightedGroupSignal).toHaveProperty('on');
		expect(highlightedGroupSignal.on).toHaveLength(2);
	});

	test('should add on events if highlightBy is `dimension`', () => {
		addTooltipSignals(signals, getDefautltMarkProps({ highlightBy: 'dimension' }));
		expect(highlightedGroupSignal).toHaveProperty('on');
		expect(highlightedGroupSignal.on).toHaveLength(2);
	});

	test('should add on events if highlightBy is a key array', () => {
		addTooltipSignals(signals, getDefautltMarkProps({ highlightBy: ['operatingSystem'] }));
		expect(highlightedGroupSignal).toHaveProperty('on');
		expect(highlightedGroupSignal.on).toHaveLength(2);
	});

	test('should include voronoi in the mark name if the markprops are for scatter or line', () => {
		addTooltipSignals(signals, {
			...defaultScatterProps,
			children: [createElement(ChartTooltip, { highlightBy: 'series' })],
		});
		expect(highlightedGroupSignal.on?.[0].events.toString().includes('_voronoi')).toBeTruthy();
	});

	test('should add on events if highlightBy is `series` and interactionMode is `item`', () => {
		addTooltipSignals(signals, {
			interactionMode: 'item',
			children: [createElement(ChartTooltip, { highlightBy: 'series' })],
		} as LineSpecProps);
		expect(highlightedGroupSignal.on).toHaveLength(8);
	});
});

describe('addTooltipMarkOpacityRules()', () => {
	test('should only add a simple item rule if not highlighted by group', () => {
		const opacityRules = [];
		addHighlightMarkOpacityRules(opacityRules, getDefautltMarkProps());
		expect(opacityRules).toHaveLength(2);
	});

	test('shold add highlight group rule if highlighted by group', () => {
		const opacityRules = [];
		addHighlightMarkOpacityRules(opacityRules, getDefautltMarkProps({ highlightBy: 'series' }));
		expect(opacityRules).toHaveLength(3);
	});
});
