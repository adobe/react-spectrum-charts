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
import { DEFAULT_COLOR_SCHEME } from '@constants';
import { spectrumColors } from '@themes';

import { defaultLegendProps } from './legendTestUtils';
import { getShowHideEncodings, getSymbolEncodings, getSymbolType, mergeLegendEncodings } from './legendUtils';

const hiddenSeriesEncoding = {
	test: 'indexof(hiddenSeries, datum.value) !== -1',
	value: 'rgb(213, 213, 213)',
};

const hiddenSeriesLabelUpdateEncoding = {
	update: {
		fill: [
			{
				test: 'indexof(hiddenSeries, datum.value) !== -1',
				value: 'rgb(144, 144, 144)',
			},
			{
				value: 'rgb(70, 70, 70)',
			},
		],
	},
};

describe('getSymbolEncodings()', () => {
	test('no factes and no custom values, should return all the defaults', () => {
		expect(
			getSymbolEncodings([], {
				colorScheme: DEFAULT_COLOR_SCHEME,
				hiddenEntries: [],
				hiddenSeries: [],
				highlight: false,
				index: 0,
				isToggleable: false,
				name: 'legend0',
				position: 'bottom',
			})
		).toStrictEqual({
			entries: { name: 'legend0_legendEntry' },
			symbols: {
				enter: {},
				update: {
					fill: [hiddenSeriesEncoding, { value: spectrumColors.light['categorical-100'] }],
					stroke: [hiddenSeriesEncoding, { value: spectrumColors.light['categorical-100'] }],
				},
			},
		});
	});
});

describe('getShowHideEncodings()', () => {
	test('should only return hiddenSeries encoding if isToggleable, onClick and hiddenSeries are all undefined/false', () => {
		expect(
			getShowHideEncodings({
				...defaultLegendProps,
				isToggleable: false,
				onClick: undefined,
			})
		).toEqual({ labels: hiddenSeriesLabelUpdateEncoding });
	});
	test('should return encodings if isToggleable', () => {
		const encoding = getShowHideEncodings({ ...defaultLegendProps, isToggleable: true });
		expect(encoding).toHaveProperty('entries');
		expect(encoding).toHaveProperty('labels');
	});
	test('should have labels encodings but not entries encodings for hiddenSeries', () => {
		const encoding = getShowHideEncodings({ ...defaultLegendProps, hiddenSeries: ['test'] });
		expect(encoding).not.toHaveProperty('entries');
		expect(encoding).toHaveProperty('labels');
	});
	test('should have entries encodings and only hiddenSeries labels encodings for onClick', () => {
		const encoding = getShowHideEncodings({ ...defaultLegendProps, onClick: () => {} });
		expect(encoding).toHaveProperty('entries');
		expect(encoding).toHaveProperty('labels');
		expect(encoding.labels).toStrictEqual(hiddenSeriesLabelUpdateEncoding);
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
