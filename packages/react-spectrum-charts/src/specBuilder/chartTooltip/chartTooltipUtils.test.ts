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
import { Data, Signal } from 'vega';

import { HIGHLIGHTED_GROUP } from '../../constants';
import { defaultBarOptions } from '../bar/barTestUtils';
import { defaultScatterOptions } from '../scatter/scatterTestUtils';
import { defaultSignals } from '../specTestUtils';
import { baseData } from '../specUtils';
import { BarSpecOptions, ChartTooltipOptions, LineSpecOptions } from '../types';
import {
	addHighlightMarkOpacityRules,
	addTooltipData,
	addTooltipSignals,
	applyTooltipPropDefaults,
	getTooltips,
	isHighlightedByGroup,
} from './chartTooltipUtils';

const getDefautltMarkOptions = (tooltipOptions: ChartTooltipOptions = {}): BarSpecOptions => ({
	...defaultBarOptions,
	chartTooltips: [tooltipOptions],
});

describe('getTooltips()', () => {
	test('should get all the tooltips from options', () => {
		const markOptions: BarSpecOptions = {
			...defaultBarOptions,
			chartTooltips: [{}],
			chartPopovers: [{}],
		};
		const tooltips = getTooltips(markOptions);
		expect(tooltips.length).toBe(1);
	});
});

describe('applyTooltipPropDefaults()', () => {
	test('should apply all defaults to ChartTooltipOptions', () => {
		const chartTooltipOptions: ChartTooltipOptions = {};
		const markName = 'bar0';
		const tooltipSpecOptions = applyTooltipPropDefaults(chartTooltipOptions, markName);
		expect(tooltipSpecOptions).toHaveProperty('highlightBy', 'item');
		expect(tooltipSpecOptions).toHaveProperty('markName', markName);
	});
});

describe('addTooltipData()', () => {
	let data: Data[];
	beforeEach(() => {
		data = JSON.parse(JSON.stringify(baseData));
	});
	test('if highlightBy is `item` or undefined, no data should be added', () => {
		const markOptions = getDefautltMarkOptions();
		addTooltipData(data, markOptions);
		expect(data).toEqual(baseData);
		addTooltipData(data, getDefautltMarkOptions({ highlightBy: 'item' }));
		expect(data).toEqual(baseData);
	});
	test('should add the group id transform if highlightBy is `dimension`', () => {
		const markOptions = getDefautltMarkOptions({ highlightBy: 'dimension' });
		addTooltipData(data, markOptions);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_highlightGroupId');
	});
	test('should add the group id transform if highlightBy is `series`', () => {
		const markOptions = getDefautltMarkOptions({ highlightBy: 'series' });
		addTooltipData(data, markOptions);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_highlightGroupId');
	});
	test('should add the group id transform if highlightBy is a key array', () => {
		const markOptions = getDefautltMarkOptions({ highlightBy: ['operatingSystem'] });
		addTooltipData(data, markOptions);
		expect(data[1].transform?.length).toBe(1);
		expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_highlightGroupId');
	});
	test('should not add highlightedData for the mark if false', () => {
		const dataLength = data.length;
		const markOptions = getDefautltMarkOptions({ highlightBy: 'series' });
		addTooltipData(data, markOptions, false);
		// length sholdn't be changed
		expect(data).toHaveLength(dataLength);
	});
});

describe('isHighlightedByGroup()', () => {
	test('should return true if highlightBy is `dimension` or `series`', () => {
		expect(isHighlightedByGroup(getDefautltMarkOptions({ highlightBy: 'dimension' }))).toBe(true);
		expect(isHighlightedByGroup(getDefautltMarkOptions({ highlightBy: 'series' }))).toBe(true);
	});
	test('should return true if highlightBy is an array', () => {
		expect(isHighlightedByGroup(getDefautltMarkOptions({ highlightBy: ['operatingSystem'] }))).toBe(true);
	});
	test('should return false if highlightBy is `item` or undefined', () => {
		expect(isHighlightedByGroup(getDefautltMarkOptions({ highlightBy: 'item' }))).toBe(false);
		expect(isHighlightedByGroup(getDefautltMarkOptions())).toBe(false);
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
		addTooltipSignals(signals, getDefautltMarkOptions());
		expect(highlightedGroupSignal).not.toHaveProperty('on');
		addTooltipSignals(signals, getDefautltMarkOptions({ highlightBy: 'item' }));
		expect(highlightedGroupSignal).not.toHaveProperty('on');
	});

	test('should add on events if highlightBy is `series`', () => {
		addTooltipSignals(signals, getDefautltMarkOptions({ highlightBy: 'series' }));
		expect(highlightedGroupSignal).toHaveProperty('on');
		expect(highlightedGroupSignal.on).toHaveLength(2);
	});

	test('should add on events if highlightBy is `dimension`', () => {
		addTooltipSignals(signals, getDefautltMarkOptions({ highlightBy: 'dimension' }));
		expect(highlightedGroupSignal).toHaveProperty('on');
		expect(highlightedGroupSignal.on).toHaveLength(2);
	});

	test('should add on events if highlightBy is a key array', () => {
		addTooltipSignals(signals, getDefautltMarkOptions({ highlightBy: ['operatingSystem'] }));
		expect(highlightedGroupSignal).toHaveProperty('on');
		expect(highlightedGroupSignal.on).toHaveLength(2);
	});

	test('should include voronoi in the mark name if the markoptions are for scatter or line', () => {
		addTooltipSignals(signals, {
			...defaultScatterOptions,
			chartTooltips: [{ highlightBy: 'series' }],
		});
		expect(highlightedGroupSignal.on?.[0].events.toString().includes('_voronoi')).toBeTruthy();
	});

	test('should add on events if highlightBy is `series` and interactionMode is `item`', () => {
		addTooltipSignals(signals, {
			interactionMode: 'item',
			chartTooltips: [{ highlightBy: 'series' }],
		} as LineSpecOptions);
		expect(highlightedGroupSignal.on).toHaveLength(8);
	});
});

describe('addTooltipMarkOpacityRules()', () => {
	test('should only add a simple item rule if not highlighted by group', () => {
		const opacityRules = [];
		addHighlightMarkOpacityRules(opacityRules, getDefautltMarkOptions());
		expect(opacityRules).toHaveLength(2);
	});

	test('shold add highlight group rule if highlighted by group', () => {
		const opacityRules = [];
		addHighlightMarkOpacityRules(opacityRules, getDefautltMarkOptions({ highlightBy: 'series' }));
		expect(opacityRules).toHaveLength(3);
	});
});
