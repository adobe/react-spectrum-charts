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
import { Item } from 'vega';

import { ClickItem, getItemBounds, getItemName, getLegendItemValue, handleLegendItemClick } from './markClickUtils';

describe('getItemBounds()', () => {
	test('should return default bounds if null or undefined', () => {
		expect(getItemBounds(null)).toStrictEqual({ x1: 0, x2: 0, y1: 0, y2: 0 });
		expect(getItemBounds(undefined)).toStrictEqual({ x1: 0, x2: 0, y1: 0, y2: 0 });
	});
});

describe('handleLegendItemClick()', () => {
	let setHiddenSeries;
	beforeEach(() => {
		setHiddenSeries = jest.fn();
	});
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should call setHiddenSeries if legendItemValue is found', () => {
		const item = {
			context: null,
			height: null,
			width: null,
			items: [{ role: 'legend-label', bounds: null, clip: null, items: [{ datum: { value: 'test' } }] }],
		} as unknown as Item;
		handleLegendItemClick(item, [], setHiddenSeries, true);
		expect(setHiddenSeries).toHaveBeenCalled();
	});
	test('should not call setHiddenSeries if legendItemValue is not found', () => {
		handleLegendItemClick(undefined, [], setHiddenSeries, true);
		expect(setHiddenSeries).not.toHaveBeenCalled();
	});
});

describe('getLegendItemValue', () => {
	test('should return the legend item value for SceneGroup', () => {
		const item = {
			context: null,
			height: null,
			width: null,
			items: [{ role: 'legend-label', bounds: null, clip: null, items: [{ datum: { value: 'test' } }] }],
		} as unknown as Item;
		expect(getLegendItemValue(item)).toBe('test');
	});
	test('should return the legend item value for SceneItem', () => {
		const item = { datum: { value: 'test' }, bounds: null } as unknown as Item;
		expect(getLegendItemValue(item)).toBe('test');
	});

	describe('should return undefined', () => {
		test('if labelItem is not a Scene', () => {
			const item = {
				context: null,
				height: null,
				width: null,
				items: [{ role: 'legend-label', items: [{ datum: { value: 'test' } }] }],
			} as unknown as Item;
			expect(getLegendItemValue(item)).toBeUndefined();
		});
		test('if labelItem has no items', () => {
			const item = {
				context: null,
				height: null,
				width: null,
				items: [],
			} as unknown as Item;
			expect(getLegendItemValue(item)).toBeUndefined();
		});
		test('id datum does not exist on the first labelItem', () => {
			const item = {
				context: null,
				height: null,
				width: null,
				items: [{ role: 'legend-label', bounds: null, clip: null, items: [{}] }],
			} as unknown as Item;
			expect(getLegendItemValue(item)).toBeUndefined();
		});
		test('if item is undefined', () => {
			expect(getLegendItemValue(undefined)).toBeUndefined();
		});
	});
});

describe('getItemName()', () => {
	test('should return undefined if the item is invalid', () => {
		expect(getItemName(undefined)).toBeUndefined();
		expect(
			getItemName({ datum: undefined, mark: { marktype: 'line', role: 'mark', group: undefined, items: [] } })
		).toBeUndefined();
	});
	test('should return undefined if there is no name on the mark', () => {
		expect(
			getItemName({
				datum: undefined,
				bounds: undefined,
				mark: { marktype: 'line', role: 'mark', group: undefined, items: [] },
			} as ClickItem)
		).toBeUndefined();
	});
	test('should return the name if it exists on the mark', () => {
		expect(
			getItemName({
				datum: undefined,
				bounds: undefined,
				mark: { marktype: 'line', role: 'mark', group: undefined, items: [], name: 'rect0_test' },
			} as ClickItem)
		).toBe('rect0');
	});
});
