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

import { getTrellisProperties, getTrellisGroupMark, getTrellisedEncodeEntries, isTrellised } from './trellisedBarUtils';
import { defaultBarProps } from './barTestUtils';
import { BarSpecProps } from 'types';
import { Scale } from 'vega';
import { FILTERED_TABLE, TABLE } from '@constants';

const defaultTrellisProps: BarSpecProps = { ...defaultBarProps, trellis: 'trellisProperty' };
const defaultRepeatedScale: Scale = { name: 'xLinear', type: 'linear', domain: { data: TABLE, field: 'x' } };

describe('trellisedBarUtils', () => {
	describe('getTrellisGroupMark()', () => {
		test('facets the mark with correct data, name, and grouping', () => {
			const result = getTrellisGroupMark(defaultTrellisProps, [], defaultRepeatedScale);
			const from = result.from as { facet: { groupby: string; name: string; data: string } };

			expect(from?.facet?.data).toEqual(FILTERED_TABLE);
			expect(from?.facet?.name).toEqual('bar0_trellis');
			expect(from?.facet?.groupby).toEqual('trellisProperty');
		});
		describe('horizontal trellis', () => {
			const horizontalTrellisProps: BarSpecProps = {
				...defaultTrellisProps,
				trellisOrientation: 'horizontal',
			};

			test('uses "xTrellisGroup" as the mark name', () => {
				const result = getTrellisGroupMark(horizontalTrellisProps, [], defaultRepeatedScale);

				expect(result.name).toEqual('xTrellisGroup');
			});

			test('overrides the width signal with bandwidth("xTrellisBand")', () => {
				const result = getTrellisGroupMark(horizontalTrellisProps, [], defaultRepeatedScale);

				expect(result.signals).toEqual([{ name: 'width', update: "bandwidth('xTrellisBand')" }]);
			});

			test('encodes the x axis with the "xTrellisBand" scale and trellis field', () => {
				const result = getTrellisGroupMark(horizontalTrellisProps, [], defaultRepeatedScale);
				const xEncoding = result.encode?.enter?.x as { scale: string; field: string };

				expect(xEncoding).toBeDefined();
				expect(xEncoding.scale).toEqual('xTrellisBand');
				expect(xEncoding.field).toEqual('trellisProperty');
			});

			test('encodes the width with bandwidth("xTrellisBand") and height with "height"', () => {
				const result = getTrellisGroupMark(horizontalTrellisProps, [], defaultRepeatedScale);

				expect(result.encode?.enter?.width).toEqual({ signal: "bandwidth('xTrellisBand')" });
				expect(result.encode?.enter?.height).toEqual({ signal: 'height' });
			});
		});

		describe('vertical trellis', () => {
			const verticalTrellisProps: BarSpecProps = {
				...defaultTrellisProps,
				trellisOrientation: 'vertical',
			};

			test('uses "yTrellisGroup" as the mark name', () => {
				const result = getTrellisGroupMark(verticalTrellisProps, [], defaultRepeatedScale);

				expect(result.name).toEqual('yTrellisGroup');
			});

			test('overrides the height signal with bandwidth("yTrellisBand")', () => {
				const result = getTrellisGroupMark(verticalTrellisProps, [], defaultRepeatedScale);

				expect(result.signals).toEqual([{ name: 'height', update: "bandwidth('yTrellisBand')" }]);
			});

			test('encodes the y axis with the "yTrellisBand" scale and trellis field', () => {
				const result = getTrellisGroupMark(verticalTrellisProps, [], defaultRepeatedScale);
				const xEncoding = result.encode?.enter?.y as { scale: string; field: string };

				expect(xEncoding).toBeDefined();
				expect(xEncoding.scale).toEqual('yTrellisBand');
				expect(xEncoding.field).toEqual('trellisProperty');
			});

			test('encodes the height with bandwidth("yTrellisBand") and width with "width"', () => {
				const result = getTrellisGroupMark(verticalTrellisProps, [], defaultRepeatedScale);

				expect(result.encode?.enter?.height).toEqual({ signal: "bandwidth('yTrellisBand')" });
				expect(result.encode?.enter?.width).toEqual({ signal: 'width' });
			});
		});
	});

	describe('getTrellisProperties()', () => {
		test('returns expected strings for vertical trellis', () => {
			const result = getTrellisProperties({
				...defaultTrellisProps,
				trellisOrientation: 'vertical',
			});

			expect(result).toEqual({
				facetName: `${defaultTrellisProps.name}_trellis`,
				markName: 'yTrellisGroup',
				scaleName: 'yTrellisBand',
				rangeScale: 'height',
				axis: 'y',
			});
		});

		test('returns expected strings for horizontal trellis', () => {
			const result = getTrellisProperties({
				...defaultTrellisProps,
				trellisOrientation: 'horizontal',
				trellis: 'trellisProperty',
			});

			expect(result).toEqual({
				facetName: `${defaultTrellisProps.name}_trellis`,
				markName: 'xTrellisGroup',
				scaleName: 'xTrellisBand',
				rangeScale: 'width',
				axis: 'x',
			});
		});
	});

	describe('getTrellisedEncodeEntries()', () => {
		describe('stacked', () => {
			test('returns y and height encodings for horizontal chart orientation with yBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisProps,
					orientation: 'horizontal',
					type: 'stacked',
				});

				expect(result).toEqual({
					y: { field: defaultTrellisProps.dimension, scale: 'yBand' },
					height: { scale: 'yBand', band: 1 },
				});
			});

			test('returns x and width encodings for vertical chart orientation with xBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisProps,
					orientation: 'vertical',
					type: 'stacked',
				});

				expect(result).toEqual({
					x: { field: defaultTrellisProps.dimension, scale: 'xBand' },
					width: { scale: 'xBand', band: 1 },
				});
			});
		});

		describe('dodged', () => {
			test('returns x and width encodings for vertical chart orientation with xBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisProps,
					orientation: 'vertical',
					type: 'dodged',
				});

				expect(result).toEqual({
					x: {
						scale: `${defaultTrellisProps.name}_position`,
						field: `${defaultTrellisProps.name}_dodgeGroup`,
					},
					width: { scale: `${defaultTrellisProps.name}_position`, band: 1 },
				});
			});

			test('returns y and height encodings for horizontal chart orientation with yBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisProps,
					orientation: 'horizontal',
					type: 'dodged',
				});

				expect(result).toEqual({
					y: {
						scale: `${defaultTrellisProps.name}_position`,
						field: `${defaultTrellisProps.name}_dodgeGroup`,
					},
					height: { scale: `${defaultTrellisProps.name}_position`, band: 1 },
				});
			});
		});

		describe('dodged and stacked', () => {
			test('returns x and width encodings for vertical chart orientation with xBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisProps,
					orientation: 'vertical',
					color: ['red', 'blue'],
					type: 'stacked',
				});

				expect(result).toEqual({
					x: {
						scale: `${defaultTrellisProps.name}_position`,
						field: `${defaultTrellisProps.name}_dodgeGroup`,
					},
					width: { scale: `${defaultTrellisProps.name}_position`, band: 1 },
				});
			});

			test('returns y and height encodings for horizontal chart orientation with yBand', () => {
				const result = getTrellisedEncodeEntries({
					...defaultTrellisProps,
					orientation: 'horizontal',
					color: ['red', 'blue'],
					type: 'stacked',
				});

				expect(result).toEqual({
					y: {
						scale: `${defaultTrellisProps.name}_position`,
						field: `${defaultTrellisProps.name}_dodgeGroup`,
					},
					height: { scale: `${defaultTrellisProps.name}_position`, band: 1 },
				});
			});
		});
	});

	describe('isTrellised()', () => {
		test('returns true if trellis property is defined', () => {
			expect(isTrellised(defaultTrellisProps)).toBe(true);
		});

		test('returns false if trellis property is undefined', () => {
			expect(isTrellised({ ...defaultTrellisProps, trellis: undefined })).toBe(false);
		});
	});
});
