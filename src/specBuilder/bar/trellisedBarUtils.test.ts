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
import { FILTERED_TABLE, TABLE, TRELLIS_PADDING } from '@constants';
import { Scale } from 'vega';

import { BarSpecOptions } from '../../types';
import { defaultBarOptions } from './barTestUtils';
import { getTrellisGroupMark, getTrellisProperties, getTrellisedEncodeEntries, isTrellised } from './trellisedBarUtils';

const defaultTrellisOptions: BarSpecOptions = { ...defaultBarOptions, trellis: 'trellisProperty' };
const defaultRepeatedScale: Scale = { name: 'xLinear', type: 'linear', domain: { data: TABLE, field: 'x' } };

describe('trellisedBarUtils', () => {
	describe('getTrellisGroupMark()', () => {
		test('facets the mark with correct data, name, and grouping', () => {
			const result = getTrellisGroupMark(defaultTrellisOptions, [], defaultRepeatedScale);
			const from = result.from as { facet: { groupby: string; name: string; data: string } };

			expect(from?.facet?.data).toEqual(FILTERED_TABLE);
			expect(from?.facet?.name).toEqual('bar0_trellis');
			expect(from?.facet?.groupby).toEqual('trellisProperty');
		});
		describe('horizontal trellis', () => {
			const horizontalTrellisOptions: BarSpecOptions = {
				...defaultTrellisOptions,
				trellisOrientation: 'horizontal',
			};

			test('uses "xTrellisGroup" as the mark name', () => {
				const result = getTrellisGroupMark(horizontalTrellisOptions, [], defaultRepeatedScale);

				expect(result.name).toEqual('xTrellisGroup');
			});

			test('overrides the width signal with bandwidth("xTrellisBand")', () => {
				const result = getTrellisGroupMark(horizontalTrellisOptions, [], defaultRepeatedScale);

				expect(result.signals).toEqual([{ name: 'width', update: "bandwidth('xTrellisBand')" }]);
			});

			test('encodes the x axis with the "xTrellisBand" scale and trellis field', () => {
				const result = getTrellisGroupMark(horizontalTrellisOptions, [], defaultRepeatedScale);
				const xEncoding = result.encode?.enter?.x as { scale: string; field: string };

				expect(xEncoding).toBeDefined();
				expect(xEncoding.scale).toEqual('xTrellisBand');
				expect(xEncoding.field).toEqual('trellisProperty');
			});

			test('encodes the width with bandwidth("xTrellisBand") and height with "height"', () => {
				const result = getTrellisGroupMark(horizontalTrellisOptions, [], defaultRepeatedScale);

				expect(result.encode?.enter?.width).toEqual({ signal: "bandwidth('xTrellisBand')" });
				expect(result.encode?.enter?.height).toEqual({ signal: 'height' });
			});
		});

		describe('vertical trellis', () => {
			const verticalTrellisOptions: BarSpecOptions = {
				...defaultTrellisOptions,
				trellisOrientation: 'vertical',
			};

			test('uses "yTrellisGroup" as the mark name', () => {
				const result = getTrellisGroupMark(verticalTrellisOptions, [], defaultRepeatedScale);

				expect(result.name).toEqual('yTrellisGroup');
			});

			test('overrides the height signal with bandwidth("yTrellisBand")', () => {
				const result = getTrellisGroupMark(verticalTrellisOptions, [], defaultRepeatedScale);

				expect(result.signals).toEqual([{ name: 'height', update: "bandwidth('yTrellisBand')" }]);
			});

			test('encodes the y axis with the "yTrellisBand" scale and trellis field', () => {
				const result = getTrellisGroupMark(verticalTrellisOptions, [], defaultRepeatedScale);
				const xEncoding = result.encode?.enter?.y as { scale: string; field: string };

				expect(xEncoding).toBeDefined();
				expect(xEncoding.scale).toEqual('yTrellisBand');
				expect(xEncoding.field).toEqual('trellisProperty');
			});

			test('encodes the height with bandwidth("yTrellisBand") and width with "width"', () => {
				const result = getTrellisGroupMark(verticalTrellisOptions, [], defaultRepeatedScale);

				expect(result.encode?.enter?.height).toEqual({ signal: "bandwidth('yTrellisBand')" });
				expect(result.encode?.enter?.width).toEqual({ signal: 'width' });
			});
		});
	});

	describe('getTrellisProperties()', () => {
		test('returns expected strings for vertical trellis', () => {
			const result = getTrellisProperties({
				...defaultTrellisOptions,
				trellisOrientation: 'vertical',
			});

			expect(result).toEqual({
				facetName: `${defaultTrellisOptions.name}_trellis`,
				markName: 'yTrellisGroup',
				scaleName: 'yTrellisBand',
				paddingInner: TRELLIS_PADDING,
				rangeScale: 'height',
				axis: 'y',
			});
		});

		test('returns expected strings for horizontal trellis', () => {
			const result = getTrellisProperties({
				...defaultTrellisOptions,
				trellisOrientation: 'horizontal',
				trellis: 'trellisProperty',
			});

			expect(result).toEqual({
				facetName: `${defaultTrellisOptions.name}_trellis`,
				markName: 'xTrellisGroup',
				scaleName: 'xTrellisBand',
				paddingInner: TRELLIS_PADDING,
				rangeScale: 'width',
				axis: 'x',
			});
		});
	});

	describe('getTrellisedEncodeEntries()', () => {
		describe('stacked', () => {
			test('returns y and height encodings for horizontal chart orientation with yBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisOptions,
					orientation: 'horizontal',
					type: 'stacked',
				});

				expect(result).toEqual({
					y: { field: defaultTrellisOptions.dimension, scale: 'yBand' },
					height: { scale: 'yBand', band: 1 },
				});
			});

			test('returns x and width encodings for vertical chart orientation with xBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisOptions,
					orientation: 'vertical',
					type: 'stacked',
				});

				expect(result).toEqual({
					x: { field: defaultTrellisOptions.dimension, scale: 'xBand' },
					width: { scale: 'xBand', band: 1 },
				});
			});
		});

		describe('dodged', () => {
			test('returns x and width encodings for vertical chart orientation with xBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisOptions,
					orientation: 'vertical',
					type: 'dodged',
				});

				expect(result).toEqual({
					x: {
						scale: `${defaultTrellisOptions.name}_position`,
						field: `${defaultTrellisOptions.name}_dodgeGroup`,
					},
					width: { scale: `${defaultTrellisOptions.name}_position`, band: 1 },
				});
			});

			test('returns y and height encodings for horizontal chart orientation with yBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisOptions,
					orientation: 'horizontal',
					type: 'dodged',
				});

				expect(result).toEqual({
					y: {
						scale: `${defaultTrellisOptions.name}_position`,
						field: `${defaultTrellisOptions.name}_dodgeGroup`,
					},
					height: { scale: `${defaultTrellisOptions.name}_position`, band: 1 },
				});
			});
		});

		describe('dodged and stacked', () => {
			test('returns x and width encodings for vertical chart orientation with xBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisOptions,
					orientation: 'vertical',
					color: ['red', 'blue'],
					type: 'stacked',
				});

				expect(result).toEqual({
					x: {
						scale: `${defaultTrellisOptions.name}_position`,
						field: `${defaultTrellisOptions.name}_dodgeGroup`,
					},
					width: { scale: `${defaultTrellisOptions.name}_position`, band: 1 },
				});
			});

			test('returns y and height encodings for horizontal chart orientation with yBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisOptions,
					orientation: 'horizontal',
					color: ['red', 'blue'],
					type: 'stacked',
				});

				expect(result).toEqual({
					y: {
						scale: `${defaultTrellisOptions.name}_position`,
						field: `${defaultTrellisOptions.name}_dodgeGroup`,
					},
					height: { scale: `${defaultTrellisOptions.name}_position`, band: 1 },
				});
			});
		});
	});

	describe('isTrellised()', () => {
		test('returns true if trellis property is defined', () => {
			expect(isTrellised(defaultTrellisOptions)).toBe(true);
		});

		test('returns false if trellis property is undefined', () => {
			expect(isTrellised({ ...defaultTrellisOptions, trellis: undefined })).toBe(false);
		});
	});
});
