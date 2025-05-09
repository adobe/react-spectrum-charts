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
import { Data } from 'vega';

import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_LINE_TYPES,
	DEFAULT_SECONDARY_COLOR,
	FILTERED_TABLE,
	HIGHLIGHTED_SERIES,
	LINE_TYPE_SCALE,
	LINE_WIDTH_SCALE,
	MARK_ID,
	OPACITY_SCALE,
	ROUNDED_SQUARE_PATH,
	SERIES_ID,
	SYMBOL_SHAPE_SCALE,
	SYMBOL_SIZE_SCALE,
	TABLE,
} from '@spectrum-charts/constants';
import { spectrumColors, colorSchemes } from '@spectrum-charts/themes';

import {
	addData,
	buildSpec,
	getColorScale,
	getDefaultSignals,
	getLineTypeScale,
	getLineWidthScale,
	getLinearColorScale,
	getOpacityScale,
	getSymbolShapeScale,
	getSymbolSizeScale,
	getTwoDimensionalColorScheme,
	getTwoDimensionalLineTypes,
	getTwoDimensionalOpacities,
} from './chartSpecBuilder';
import { defaultSignals } from './specTestUtils';
import { baseData } from './specUtils';
import { BarOptions, ChartSpecOptions, LineType } from './types';

const defaultData: Data[] = [{ name: TABLE, values: [], transform: [{ type: 'identifier', as: MARK_ID }] }];

const defaultSpecOptions: ChartSpecOptions = {
	axes: [],
	backgroundColor: DEFAULT_BACKGROUND_COLOR,
	colors: 'categorical12',
	colorScheme: DEFAULT_COLOR_SCHEME,
	description: '',
	hiddenSeries: [],
	highlightedItem: undefined,
	highlightedSeries: undefined,
	idKey: MARK_ID,
	legends: [],
	lineTypes: DEFAULT_LINE_TYPES as LineType[],
	lineWidths: [1],
	marks: [],
	opacities: undefined,
	symbolShapes: ['rounded-square'],
	symbolSizes: ['XS', 'XL'],
	title: '',
	titles: [],
	UNSAFE_vegaSpec: undefined,
};

const defaultBarOptions: BarOptions = { markType: 'bar', dimension: 'browser', metric: 'downloads', color: 'series' };

jest.mock('./legend/legendHighlightUtils', () => {
	return {
		setHoverOpacityForMarks: jest.fn(),
	};
});

afterEach(() => {
	jest.resetAllMocks();
});

describe('Chart spec builder', () => {
	describe('getColorScale()', () => {
		test('default color scale used', () => {
			expect(getColorScale('categorical12', 'light')).toStrictEqual({
				domain: { data: 'table', fields: [] },
				name: COLOR_SCALE,
				range: [
					'rgb(15, 181, 174)',
					'rgb(64, 70, 202)',
					'rgb(246, 133, 17)',
					'rgb(222, 61, 130)',
					'rgb(126, 132, 250)',
					'rgb(114, 224, 106)',
					'rgb(20, 122, 243)',
					'rgb(115, 38, 211)',
					'rgb(232, 198, 0)',
					'rgb(203, 93, 0)',
					'rgb(0, 143, 93)',
					'rgb(188, 233, 49)',
				],
				type: 'ordinal',
			});
		});
		test('custom colors supplied', () => {
			expect(getColorScale(['red', 'blue'], 'light')).toStrictEqual({
				name: COLOR_SCALE,
				type: 'ordinal',
				range: ['red', 'blue'],
				domain: { data: 'table', fields: [] },
			});
		});
	});

	describe('getLinearColorScale()', () => {
		test('should return color scale from named scale', () => {
			expect(getLinearColorScale('categorical12', 'light')).toHaveProperty('range', colorSchemes.categorical12);
		});
		test('should transform custom color names', () => {
			const colors = spectrumColors.light;
			expect(getLinearColorScale(['blue-200', 'rgb(20, 30, 40)', 'static-black'], 'light')).toHaveProperty(
				'range',
				[colors['blue-200'], 'rgb(20, 30, 40)', colors['static-black']]
			);
		});
	});

	describe('getTwoDimensionalColorScheme()', () => {
		test('should get colors from scheme', () => {
			expect(getTwoDimensionalColorScheme('categorical6', 'light')).toStrictEqual([
				['rgb(15, 181, 174)'],
				['rgb(64, 70, 202)'],
				['rgb(246, 133, 17)'],
				['rgb(222, 61, 130)'],
				['rgb(126, 132, 250)'],
				['rgb(114, 224, 106)'],
			]);
		});
		test('should get colors from color names for light and dark mode', () => {
			expect(
				getTwoDimensionalColorScheme(['blue-400', 'blue-500', 'blue-600', 'blue-700'], 'light')
			).toStrictEqual([
				['rgb(150, 206, 253)'],
				['rgb(120, 187, 250)'],
				['rgb(89, 167, 246)'],
				['rgb(56, 146, 243)'],
			]);
			expect(
				getTwoDimensionalColorScheme(['blue-400', 'blue-500', 'blue-600', 'blue-700'], 'dark')
			).toStrictEqual([['rgb(0, 78, 166)'], ['rgb(0, 92, 200)'], ['rgb(6, 108, 231)'], ['rgb(29, 128, 245)']]);
		});
		test('should convert color scheme in second dimension to correct colors', () => {
			expect(
				getTwoDimensionalColorScheme(['categorical6', 'divergentOrangeYellowSeafoam5'], 'light')
			).toStrictEqual([
				[
					'rgb(15, 181, 174)',
					'rgb(64, 70, 202)',
					'rgb(246, 133, 17)',
					'rgb(222, 61, 130)',
					'rgb(126, 132, 250)',
					'rgb(114, 224, 106)',
				],
				['rgb(88, 0, 0)', 'rgb(221, 134, 41)', 'rgb(255, 255, 224)', 'rgb(62, 168, 166)', 'rgb(0, 44, 45)'],
			]);
			expect(getTwoDimensionalColorScheme(['categorical6', 'sequentialViridis5'], 'light')).toStrictEqual([
				[
					'rgb(15, 181, 174)',
					'rgb(64, 70, 202)',
					'rgb(246, 133, 17)',
					'rgb(222, 61, 130)',
					'rgb(126, 132, 250)',
					'rgb(114, 224, 106)',
				],
				['rgb(253, 231, 37)', 'rgb(122, 209, 81)', 'rgb(31, 152, 139)', 'rgb(57, 86, 140)', 'rgb(68, 1, 84)'],
			]);
		});
		test('should mix color schemes and color arrays', () => {
			expect(getTwoDimensionalColorScheme(['categorical6', ['red', 'blue']], 'light')).toStrictEqual([
				[
					'rgb(15, 181, 174)',
					'rgb(64, 70, 202)',
					'rgb(246, 133, 17)',
					'rgb(222, 61, 130)',
					'rgb(126, 132, 250)',
					'rgb(114, 224, 106)',
				],
				['red', 'blue'],
			]);
		});
	});

	describe('getTwoDimensionalLineTypes()', () => {
		test('should get 2d line types from line type array', () => {
			expect(getTwoDimensionalLineTypes(['solid', 'dashed'])).toStrictEqual([[[]], [[7, 4]]]);
			expect(getTwoDimensionalLineTypes([[1, 2, 3, 4], 'dashed'])).toStrictEqual([[[1, 2, 3, 4]], [[7, 4]]]);
		});

		test('should convert line type names', () => {
			expect(getTwoDimensionalLineTypes([['solid', 'dashed'], ['dotted']])).toStrictEqual([
				[[], [7, 4]],
				[[2, 3]],
			]);
		});
	});

	describe('getTwoDimensionalOpacities()', () => {
		test('should return default 2d opacities if undefined', () => {
			expect(getTwoDimensionalOpacities(undefined)).toStrictEqual([[1]]);
		});

		test('should return default 2d opacities if from 1d array', () => {
			expect(getTwoDimensionalOpacities([1, 0.75, 0.5])).toStrictEqual([[1], [0.75], [0.5]]);
		});

		test('should pass through a 2d array', () => {
			expect(getTwoDimensionalOpacities([[1, 0.75, 0.5]])).toStrictEqual([[1, 0.75, 0.5]]);
		});
	});

	describe('getLineTypeScale()', () => {
		test('should return lineType scale', () => {
			expect(getLineTypeScale(['solid', 'dashed'])).toStrictEqual({
				name: LINE_TYPE_SCALE,
				type: 'ordinal',
				range: [[], [7, 4]],
				domain: { data: 'table', fields: [] },
			});
		});

		test('should return lineType scale from 2d input', () => {
			expect(getLineTypeScale([['solid', 'dashed']])).toStrictEqual({
				name: LINE_TYPE_SCALE,
				type: 'ordinal',
				range: [[]],
				domain: { data: 'table', fields: [] },
			});
		});
	});

	describe('getOpacityScale()', () => {
		test('should return default opacity point scale if no scale provided', () => {
			const defaultOpacityScale = {
				name: OPACITY_SCALE,
				type: 'point',
				range: [1, 0],
				padding: 1,
				align: 1,
				domain: { data: 'table', fields: [] },
			};
			expect(getOpacityScale()).toStrictEqual(defaultOpacityScale);
			expect(getOpacityScale([])).toStrictEqual(defaultOpacityScale);
		});

		test('should return opacity ordinal scale if scale values are provided', () => {
			expect(getOpacityScale([0.2, 0.4, 0.6, 0.8])).toStrictEqual({
				name: OPACITY_SCALE,
				type: 'ordinal',
				range: [0.2, 0.4, 0.6, 0.8],
				domain: { data: 'table', fields: [] },
			});
		});

		test('should return opacity ordinal scale if 2d values are provided', () => {
			expect(
				getOpacityScale([
					[0.2, 0.4],
					[0.6, 0.8],
				])
			).toStrictEqual({
				name: OPACITY_SCALE,
				type: 'ordinal',
				range: [0.2, 0.6],
				domain: { data: 'table', fields: [] },
			});
		});
	});

	describe('getLineWidthScale()', () => {
		test('should return lineWidth scale with line width pixel values provided', () => {
			expect(getLineWidthScale([1, 2, 3, 4])).toStrictEqual({
				name: LINE_WIDTH_SCALE,
				type: 'ordinal',
				range: [1, 2, 3, 4],
				domain: { data: 'table', fields: [] },
			});
		});

		test('should return corect pixel values in scale if pixels and preset names are passed in', () => {
			expect(getLineWidthScale(['S', 'L', 2, 4])).toStrictEqual({
				name: LINE_WIDTH_SCALE,
				type: 'ordinal',
				range: [1.5, 3, 2, 4],
				domain: { data: 'table', fields: [] },
			});
		});
	});

	describe('getSymbolShapeScale()', () => {
		test('should return symbolShape scale with vega shapes', () => {
			expect(getSymbolShapeScale(['circle', 'square'])).toStrictEqual({
				name: SYMBOL_SHAPE_SCALE,
				type: 'ordinal',
				range: ['circle', 'square'],
				domain: { data: 'table', fields: [] },
			});
		});

		test('should return symbolShape scale with custom path', () => {
			const path =
				'M -0.01 -0.38 C -0.04 -0.27 -0.1 -0.07 -0.15 0.08 H 0.14 C 0.1 -0.03 0.03 -0.26 -0.01 -0.38 H -0.01 M -1 -1 M 0.55 -1 H -0.55 C -0.8 -1 -1 -0.8 -1 -0.55 V 0.55 C -1 0.8 -0.8 1 -0.55 1 H 0.55 C 0.8 1 1 0.8 1 0.55 V -0.55 C 1 -0.8 0.8 -1 0.55 -1 M 0.49 0.55 H 0.3 S 0.29 0.55 0.28 0.55 L 0.18 0.27 H -0.22 L -0.31 0.55 S -0.31 0.56 -0.33 0.56 H -0.5 S -0.51 0.56 -0.51 0.54 L -0.17 -0.44 S -0.16 -0.47 -0.15 -0.53 C -0.15 -0.53 -0.15 -0.54 -0.15 -0.54 H 0.08 S 0.09 -0.54 0.09 -0.53 L 0.48 0.54 S 0.48 0.56 0.48 0.56 Z';
			expect(getSymbolShapeScale([path])).toStrictEqual({
				name: SYMBOL_SHAPE_SCALE,
				type: 'ordinal',
				range: [path],
				domain: { data: 'table', fields: [] },
			});
		});

		test('should return symbolShape scale with supported shapes', () => {
			expect(getSymbolShapeScale(['rounded-square'])).toStrictEqual({
				name: SYMBOL_SHAPE_SCALE,
				type: 'ordinal',
				range: [ROUNDED_SQUARE_PATH],
				domain: { data: 'table', fields: [] },
			});
		});

		test('should return symbolShape scale from 2d input', () => {
			expect(
				getSymbolShapeScale([
					['circle', 'square'],
					['triangle,', 'circle'],
				])
			).toStrictEqual({
				name: SYMBOL_SHAPE_SCALE,
				type: 'ordinal',
				range: ['circle', 'triangle,'],
				domain: { data: 'table', fields: [] },
			});
		});
	});

	describe('getSymbolSizeScale()', () => {
		test('should return the symbolSize scale', () => {
			expect(getSymbolSizeScale(['XS', 'XL'])).toStrictEqual({
				name: SYMBOL_SIZE_SCALE,
				type: 'linear',
				zero: false,
				domain: { data: 'table', fields: [] },
				range: [36, 256],
			});
		});
	});

	describe('addData()', () => {
		test('should do nothing if there are not any facets and there is no filteredTable data', () => {
			expect(addData(defaultData, { facets: [] })[0].transform).toHaveLength(1);
		});

		test('should add the hiddenSeries transform to the filteredTable if filteredTable data exists', () => {
			const data = addData(baseData, { facets: [DEFAULT_COLOR] });
			const hiddenSeriesTransform = data
				.find((d) => d.name === FILTERED_TABLE)
				?.transform?.find((t) => t.type === 'filter' && t.expr.includes('hiddenSeries'));
			expect(hiddenSeriesTransform).toBeDefined();
		});

		test('should join the facets', () => {
			expect(
				addData(defaultData, { facets: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] })[0].transform?.at(-1)
			).toStrictEqual({ as: SERIES_ID, expr: 'datum.series + " | " + datum.subSeries', type: 'formula' });
		});
	});

	describe('controlled highlighting', () => {
		test('adds highlightedSeries signal if there is a highlighted series', () => {
			const spec = buildSpec({
				...defaultSpecOptions,
				marks: [defaultBarOptions],
				highlightedSeries: 'Chrome',
			});

			expect(spec.signals?.find((signal) => signal.name === HIGHLIGHTED_SERIES)).toStrictEqual({
				name: HIGHLIGHTED_SERIES,
				value: 'Chrome',
			});
		});

		test('adds highlightedSeries signal if there is a highlighted series and legend does not have highlight', () => {
			const spec = buildSpec({
				...defaultSpecOptions,
				marks: [defaultBarOptions],
				legends: [{ highlight: false }],
				highlightedSeries: 'Chrome',
			});

			expect(spec.signals?.find((signal) => signal.name === HIGHLIGHTED_SERIES)).toStrictEqual({
				name: HIGHLIGHTED_SERIES,
				value: 'Chrome',
			});
		});

		test('does not apply controlled highlighting if uncontrolled highlighting is applied', () => {
			const spec = buildSpec({
				...defaultSpecOptions,
				marks: [defaultBarOptions],
				legends: [{ highlight: true }],
			});
			const uncontrolledHighlightSignal = {
				name: HIGHLIGHTED_SERIES,
				value: null,
				on: [
					{
						events: '@legend0_legendEntry:mouseover',
						update: 'indexof(hiddenSeries, domain("legend0Entries")[datum.index]) === -1 ? domain("legend0Entries")[datum.index] : null',
					},
					{
						events: '@legend0_legendEntry:mouseout',
						update: 'null',
					},
				],
			};

			expect(spec.signals?.find((signal) => signal.name === 'highlightedSeries')).toStrictEqual(
				uncontrolledHighlightSignal
			);
		});
	});

	describe('getDefaultSignals()', () => {
		const beginningSignals = [
			{ name: BACKGROUND_COLOR, value: 'rgb(255, 255, 255)' },
			{
				name: 'colors',
				value: [
					['rgb(15, 181, 174)'],
					['rgb(64, 70, 202)'],
					['rgb(246, 133, 17)'],
					['rgb(222, 61, 130)'],
					['rgb(126, 132, 250)'],
					['rgb(114, 224, 106)'],
					['rgb(20, 122, 243)'],
					['rgb(115, 38, 211)'],
					['rgb(232, 198, 0)'],
					['rgb(203, 93, 0)'],
					['rgb(0, 143, 93)'],
					['rgb(188, 233, 49)'],
				],
			},
			{ name: 'lineTypes', value: [[[7, 4]]] },
			{ name: 'opacities', value: [[1]] },
		];

		const endSignals = defaultSignals;

		test('hiddenSeries is empty when no hidden series', () => {
			expect(getDefaultSignals({ ...defaultSpecOptions, lineTypes: ['dashed'] })).toStrictEqual([
				...beginningSignals,
				{ name: 'hiddenSeries', value: [] },
				...endSignals,
			]);
		});

		test('hiddenSeries contains provided hidden series', () => {
			const hiddenSeries = ['test'];
			expect(getDefaultSignals({ ...defaultSpecOptions, hiddenSeries, lineTypes: ['dashed'] })).toStrictEqual([
				...beginningSignals,
				{ name: 'hiddenSeries', value: hiddenSeries },
				...endSignals,
			]);
		});
	});
});
