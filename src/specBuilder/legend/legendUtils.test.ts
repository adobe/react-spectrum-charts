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
import { FILTERED_TABLE } from '@constants';
import { spectrumColors } from '@themes';

import { defaultLegendOptions } from './legendTestUtils';
import {
	getHiddenSeriesColorRule,
	getShowHideEncodings,
	getSymbolEncodings,
	getSymbolType,
	mergeLegendEncodings,
} from './legendUtils';

const labelUpdateEncoding = {
	update: {
		fill: [
			{
				value: 'rgb(70, 70, 70)',
			},
		],
	},
};

describe('getSymbolEncodings()', () => {
	test('no factes and no custom values, should return all the defaults', () => {
		expect(getSymbolEncodings([], defaultLegendOptions)).toStrictEqual({
			entries: { name: 'legend0_legendEntry' },
			symbols: {
				enter: {},
				update: {
					fill: [{ value: spectrumColors.light['categorical-100'] }],
					stroke: [{ value: spectrumColors.light['categorical-100'] }],
				},
			},
		});
	});
});

describe('getShowHideEncodings()', () => {
	test('should only return hiddenSeries encoding if isToggleable, onClick and hiddenSeries are all undefined/false', () => {
		expect(
			getShowHideEncodings({
				...defaultLegendOptions,
				isToggleable: false,
				hasOnClick: false,
			})
		).toEqual({ labels: labelUpdateEncoding });
	});
	test('should return encodings if isToggleable', () => {
		const encoding = getShowHideEncodings({ ...defaultLegendOptions, isToggleable: true });
		expect(encoding).toHaveProperty('entries');
		expect(encoding).toHaveProperty('labels');
	});
	test('should have labels encodings but not entries encodings for hiddenSeries', () => {
		const encoding = getShowHideEncodings({ ...defaultLegendOptions, hiddenSeries: ['test'] });
		expect(encoding).not.toHaveProperty('entries');
		expect(encoding).toHaveProperty('labels');
	});
	test('should have entries encodings and only hiddenSeries labels encodings for onClick', () => {
		const encoding = getShowHideEncodings({ ...defaultLegendOptions, hasOnClick: true });
		expect(encoding).toHaveProperty('entries');
		expect(encoding).toHaveProperty('labels');
		expect(encoding.labels).toStrictEqual(labelUpdateEncoding);
	});
});

describe('mergeLegendEncodings()', () => {
	test('should keep last value', () => {
		expect(
			mergeLegendEncodings([
				{ entries: { name: 'legendEntry' } },
				{ entries: { name: 'legendEntry2' } },
				{ entries: { name: 'legendEntry3' } },
			])
		).toStrictEqual({ entries: { name: 'legendEntry3' } });
	});

	test('should combine unique keys', () => {
		expect(
			mergeLegendEncodings([
				{ entries: { name: 'legendEntry' } },
				{ labels: { name: 'legendLabel' } },
				{ title: { name: 'legendTitle' } },
			])
		).toStrictEqual({
			entries: { name: 'legendEntry' },
			labels: { name: 'legendLabel' },
			title: { name: 'legendTitle' },
		});
	});

	test('should merge deep properties', () => {
		expect(
			mergeLegendEncodings([
				{
					entries: {
						name: 'legendEntry',
						enter: { cursor: { value: 'default' }, fill: { value: 'transparent' } },
					},
				},
				{ entries: { name: 'legendEntry', interactive: true, enter: { cursor: { value: 'pointer' } } } },
			])
		).toStrictEqual({
			entries: {
				name: 'legendEntry',
				interactive: true,
				enter: { cursor: { value: 'pointer' }, fill: { value: 'transparent' } },
			},
		});
	});
});

describe('getSymbolType()', () => {
	test('should return the symbolShape if a static value is provided', () => {
		expect(getSymbolType({ value: 'diamond' })).toStrictEqual('diamond');
	});
	test('should default to circle if static value is not provided', () => {
		expect(getSymbolType('series')).toStrictEqual('circle');
	});
});

describe('getHiddenSeriesColorRule()', () => {
	test('should return empty array if not toggleable and no hiddenSeries', () => {
		expect(getHiddenSeriesColorRule(defaultLegendOptions, 'gray-300')).toEqual([]);
	});

	test('should use filteredTable if there are keys', () => {
		const colorRules = getHiddenSeriesColorRule(
			{ ...defaultLegendOptions, isToggleable: true, keys: ['key1'] },
			'gray-300'
		);
		expect(colorRules[0].test).toContain(FILTERED_TABLE);
	});

	test('should look at hiddenSeries if there are not any keys', () => {
		const colorRules = getHiddenSeriesColorRule({ ...defaultLegendOptions, isToggleable: true }, 'gray-300');
		expect(colorRules[0].test).toContain('hiddenSeries');
	});
});
