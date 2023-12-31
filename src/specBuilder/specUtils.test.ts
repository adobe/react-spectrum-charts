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
import { DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR, TABLE } from '@constants';
import { ROUNDED_SQUARE_PATH } from 'svgPaths';
import { BandScale, OrdinalScale } from 'vega';

import {
	getColorValue,
	getFacetsFromProps,
	getFacetsFromScales,
	getLineWidthPixelsFromLineWidth,
	getPathFromSymbolShape,
	getStrokeDashFromLineType,
} from './specUtils';

const defaultColorScale: OrdinalScale = {
	name: 'color',
	type: 'ordinal',
	domain: { data: TABLE, fields: [DEFAULT_COLOR] },
};
const defaultLineTypeScale: OrdinalScale = {
	name: 'lineType',
	type: 'ordinal',
	domain: { data: TABLE, fields: [DEFAULT_SECONDARY_COLOR] },
};
const defaultOpacityScale: BandScale = {
	name: 'lineType',
	type: 'band',
	domain: { data: TABLE, fields: [DEFAULT_SECONDARY_COLOR] },
};

describe('specUtils', () => {
	describe('getFacetsFromProps()', () => {
		test('should exclude static values', () => {
			expect(getFacetsFromProps({ color: DEFAULT_COLOR, lineType: { value: 'solid' } })).toStrictEqual({
				facets: [DEFAULT_COLOR],
				secondaryFacets: [],
			});
		});
		test('should exclude undefined values', () => {
			expect(getFacetsFromProps({ color: undefined, lineType: { value: 'solid' } })).toStrictEqual({
				facets: [],
				secondaryFacets: [],
			});
			expect(getFacetsFromProps({ color: DEFAULT_COLOR, lineType: undefined })).toStrictEqual({
				facets: [DEFAULT_COLOR],
				secondaryFacets: [],
			});
		});
		test('should getSecondaryFacets', () => {
			expect(getFacetsFromProps({ color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] })).toStrictEqual({
				facets: [DEFAULT_COLOR],
				secondaryFacets: [DEFAULT_SECONDARY_COLOR],
			});
		});
	});

	describe('getFacetsFromScales()', () => {
		test('should return the facets from scales', () => {
			expect(getFacetsFromScales([defaultColorScale, defaultLineTypeScale])).toStrictEqual([
				DEFAULT_COLOR,
				DEFAULT_SECONDARY_COLOR,
			]);
		});

		test('should not return duplicate keys', () => {
			expect(
				getFacetsFromScales([
					defaultColorScale,
					{ ...defaultLineTypeScale, domain: { data: TABLE, fields: [DEFAULT_COLOR] } },
				])
			).toStrictEqual([DEFAULT_COLOR]);
			expect(getFacetsFromScales([defaultColorScale, defaultLineTypeScale, defaultOpacityScale])).toStrictEqual([
				DEFAULT_COLOR,
				DEFAULT_SECONDARY_COLOR,
			]);
		});

		test('should return empty array if no scales are provided', () => {
			expect(getFacetsFromScales([])).toStrictEqual([]);
		});

		test('should return empty array if scales are undefined', () => {
			expect(getFacetsFromScales()).toStrictEqual([]);
		});

		test('should return empty array if no scales have fields', () => {
			expect(getFacetsFromScales([{ ...defaultColorScale, domain: { data: TABLE, fields: [] } }])).toStrictEqual(
				[]
			);
		});

		test('should return empty array if no scales have domains', () => {
			expect(getFacetsFromScales([{ ...defaultColorScale, domain: undefined }])).toStrictEqual([]);
		});
	});

	describe('getColorValue()', () => {
		test('should return color values from spectrum names', () => {
			expect(getColorValue('categorical-100', 'light')).toEqual('rgb(15, 181, 174)');
			expect(getColorValue('gray-800', 'light')).toEqual('rgb(34, 34, 34)');
			expect(getColorValue('gray-800', 'dark')).toEqual('rgb(235, 235, 235)');
		});

		test('should pass through non-spectrum color values', () => {
			expect(getColorValue('transparent', 'light')).toEqual('transparent');
			expect(getColorValue('gray', 'light')).toEqual('gray');
			expect(getColorValue('#FFF', 'dark')).toEqual('#FFF');
		});
	});

	describe('getStrokeDashFromLineType()', () => {
		test('should return same array if an array is passed in', () => {
			expect(getStrokeDashFromLineType([1, 2, 3])).toStrictEqual([1, 2, 3]);
			expect(getStrokeDashFromLineType([])).toStrictEqual([]);
		});

		test('should convert line type names to their coresponding stroke dash array', () => {
			expect(getStrokeDashFromLineType('solid')).toStrictEqual([]);
			expect(getStrokeDashFromLineType('dashed')).toStrictEqual([7, 4]);
			expect(getStrokeDashFromLineType('dotted')).toStrictEqual([2, 3]);
			expect(getStrokeDashFromLineType('dotDash')).toStrictEqual([2, 3, 7, 4]);
			expect(getStrokeDashFromLineType('shortDash')).toStrictEqual([3, 4]);
			expect(getStrokeDashFromLineType('longDash')).toStrictEqual([11, 4]);
			expect(getStrokeDashFromLineType('twoDash')).toStrictEqual([5, 2, 11, 2]);
		});
	});

	describe('getLineWidthPixelsFromLineWidth', () => {
		test('should return same number if number is provided', () => {
			expect(getLineWidthPixelsFromLineWidth(1)).toBe(1);
			expect(getLineWidthPixelsFromLineWidth(2)).toBe(2);
		});
		test('should return correct pixel value from named line width', () => {
			expect(getLineWidthPixelsFromLineWidth('XS')).toBe(1);
			expect(getLineWidthPixelsFromLineWidth('S')).toBe(1.5);
			expect(getLineWidthPixelsFromLineWidth('M')).toBe(2);
			expect(getLineWidthPixelsFromLineWidth('L')).toBe(3);
			expect(getLineWidthPixelsFromLineWidth('XL')).toBe(4);
		});
	});

	describe('getPathFromSymbolShape()', () => {
		test('return rounded square path for rounded-square', () => {
			expect(getPathFromSymbolShape('rounded-square')).toBe(ROUNDED_SQUARE_PATH);
		});
		test('return input unless input is rounded-square', () => {
			expect(getPathFromSymbolShape('circle')).toBe('circle');
		});
		test('return input unless input is rounded-square', () => {
			expect(getPathFromSymbolShape('abc123')).toBe('abc123');
		});
	});
});
