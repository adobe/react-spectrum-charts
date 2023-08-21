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

import {
	DEFAULT_CATEGORICAL_DIMENSION,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC,
	DEFAULT_SECONDARY_COLOR,
	HIGHLIGHT_CONTRAST_RATIO,
	TABLE,
} from '@constants';
import { Data, Legend, LegendEncode, Mark, Scale, Spec, SymbolEncodeEntry } from 'vega';

import { defaultHighlightSignal } from '../signal/signalSpecBuilder.test';
import {
	addData,
	addLegend,
	formatFacetRefsWithPresets,
	getHighlightOpacityRule,
	getOpacityEncoding,
	getOpacityRule,
	getSymbolEncodings,
	setHoverOpacityForMarks,
} from './legendSpecBuilder';

const defaultSpec: Spec = {
	scales: [
		{
			name: 'color',
			type: 'ordinal',
			domain: { data: TABLE, fields: [DEFAULT_COLOR] },
		},
	],
	marks: [],
};

const opacityEncoding = [
	{ test: 'highlightedSeries && datum.value !== highlightedSeries', value: 1 / HIGHLIGHT_CONTRAST_RATIO },
	{ value: 1 },
];
const colorEncoding = { signal: `scale('color', data('legendAggregate')[datum.index].${DEFAULT_COLOR})` };
const defaultSymbolUpdateEncodings: SymbolEncodeEntry = {
	fill: colorEncoding,
	stroke: colorEncoding,
};

const defaultTooltipLegendEncoding: LegendEncode = {
	entries: {
		name: 'legendEntry',
		interactive: true,
		enter: { tooltip: { signal: 'datum' } },
		update: { fill: { value: 'transparent' } },
	},
	labels: { update: { fillOpacity: undefined } },
	symbols: { update: { ...defaultSymbolUpdateEncodings, fillOpacity: undefined, strokeOpacity: undefined } },
};

const defaultHighlightLegendEncoding: LegendEncode = {
	entries: {
		name: 'legendEntry',
		interactive: true,
		enter: { tooltip: undefined },
		update: { fill: { value: 'transparent' } },
	},
	labels: { update: { fillOpacity: opacityEncoding } },
	symbols: {
		update: {
			...defaultSymbolUpdateEncodings,
			fillOpacity: opacityEncoding,
			strokeOpacity: opacityEncoding,
		},
	},
};

const defaultLegend: Legend = {
	direction: 'horizontal',
	encode: { entries: { name: 'legendEntry' }, symbols: { update: { ...defaultSymbolUpdateEncodings } } },
	fill: 'legendEntries',
	orient: 'bottom',
	title: undefined,
	columns: { signal: 'floor(width / 220)' },
};

const defaultMark: Mark = {
	name: 'line0',
	type: 'line',
	from: {
		data: 'table',
	},
	encode: {
		enter: {
			x: { scale: 'x', field: DEFAULT_CATEGORICAL_DIMENSION },
			y: { scale: 'y', field: DEFAULT_METRIC },
			stroke: { scale: 'color', field: DEFAULT_COLOR },
		},
	},
};
const defaultGroupMark: Mark = {
	type: 'group',
	marks: [defaultMark],
};

const defaultOpacityEncoding = {
	fillOpacity: [
		{ test: `highlightedSeries && highlightedSeries !== datum.prismSeriesId`, value: 1 / HIGHLIGHT_CONTRAST_RATIO },
	],
	strokeOpacity: [
		{ test: `highlightedSeries && highlightedSeries !== datum.prismSeriesId`, value: 1 / HIGHLIGHT_CONTRAST_RATIO },
	],
};

const defaultLegendAggregateData: Data = {
	name: 'legendAggregate',
	source: TABLE,
	transform: [
		{
			type: 'aggregate',
			groupby: [DEFAULT_COLOR],
		},
		{
			type: 'formula',
			as: 'legendEntries',
			expr: `datum.${DEFAULT_COLOR}`,
		},
	],
};

const defaultLegendEntriesScale: Scale = {
	name: 'legendEntries',
	type: 'ordinal',
	domain: { data: 'legendAggregate', field: 'legendEntries' },
};

const defaultOpacitySignalEncoding = [
	{
		test: 'highlightedSeries && datum.value !== highlightedSeries',
		signal: `scale('opacity', data('legendAggregate')[datum.index].${DEFAULT_COLOR}) / 5`,
	},
	{ signal: `scale('opacity', data('legendAggregate')[datum.index].${DEFAULT_COLOR})` },
];

describe('addLegend()', () => {
	describe('no initial legend', () => {
		test('no props, should setup default legend', () => {
			expect(addLegend(defaultSpec, {})).toStrictEqual({
				...defaultSpec,
				data: [defaultLegendAggregateData],
				scales: [...(defaultSpec.scales || []), defaultLegendEntriesScale],
				legends: [defaultLegend],
			});
		});

		test('descriptions, should add encoding', () => {
			expect(
				addLegend(defaultSpec, { descriptions: [{ seriesName: 'test', description: 'test' }] }),
			).toStrictEqual({
				...defaultSpec,
				data: [defaultLegendAggregateData],
				scales: [...(defaultSpec.scales || []), defaultLegendEntriesScale],
				legends: [{ ...defaultLegend, encode: defaultTooltipLegendEncoding }],
			});
		});

		test('highlight, should add encoding', () => {
			expect(addLegend(defaultSpec, { highlight: true })).toStrictEqual({
				...defaultSpec,
				data: [defaultLegendAggregateData],
				scales: [...(defaultSpec.scales || []), defaultLegendEntriesScale],
				signals: [defaultHighlightSignal],
				legends: [{ ...defaultLegend, encode: defaultHighlightLegendEncoding }],
			});
		});

		test('position, should set the orientation correctly', () => {
			expect(addLegend(defaultSpec, { position: 'left' }).legends).toStrictEqual([
				{ ...defaultLegend, orient: 'left', direction: 'vertical', columns: undefined },
			]);
		});

		test('title, should add title', () => {
			expect(addLegend(defaultSpec, { title: 'My title' }).legends?.[0].title).toStrictEqual('My title');
		});
		test('should add labels to signals using legendLabels', () => {
			expect(
				addLegend(defaultSpec, {
					legendLabels: [
						{ seriesName: 1, label: 'Any event' },
						{ seriesName: 2, label: 'Any event' },
					],
				}).legends?.[0].encode,
			).toStrictEqual({
				entries: {
					name: 'legendEntry',
				},
				labels: {
					update: {
						text: [
							{
								test: "indexof(pluck(legendLabels, 'seriesName'), datum.value) > -1",
								signal: "legendLabels[indexof(pluck(legendLabels, 'seriesName'), datum.value)].label",
							},
							{
								signal: 'datum.value',
							},
						],
					},
				},
				symbols: { update: { ...defaultSymbolUpdateEncodings } },
			});
		});
		test('should have both labels and highlight encoding', () => {
			expect(
				addLegend(defaultSpec, {
					highlight: true,
					legendLabels: [
						{ seriesName: 1, label: 'Any event' },
						{ seriesName: 2, label: 'Any event' },
					],
				}).legends?.[0].encode,
			).toStrictEqual({
				...defaultHighlightLegendEncoding,
				labels: {
					update: {
						...defaultHighlightLegendEncoding.labels?.update,
						text: [
							{
								test: "indexof(pluck(legendLabels, 'seriesName'), datum.value) > -1",
								signal: "legendLabels[indexof(pluck(legendLabels, 'seriesName'), datum.value)].label",
							},
							{
								signal: 'datum.value',
							},
						],
					},
				},
			});
		});
		test('should add custom labels to encoding based on legendLabels', () => {
			expect(
				addLegend(defaultSpec, {
					legendLabels: [
						{ seriesName: 1, label: 'Any event' },
						{ seriesName: 2, label: 'Any event' },
					],
				}).signals,
			).toStrictEqual([
				{
					name: 'legendLabels',
					value: [
						{ seriesName: 1, label: 'Any event' },
						{ seriesName: 2, label: 'Any event' },
					],
				},
			]);
		});
	});
});

describe('addData()', () => {
	test('should add legendAggregate data', () => {
		expect(addData([], { facets: [DEFAULT_COLOR], hiddenEntries: [] })).toStrictEqual([defaultLegendAggregateData]);
	});
	test('should join multiple facets', () => {
		expect(addData([], { facets: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR], hiddenEntries: [] })).toStrictEqual([
			{
				name: 'legendAggregate',
				source: 'table',
				transform: [
					{ groupby: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR], type: 'aggregate' },
					{
						as: 'legendEntries',
						expr: `datum.${DEFAULT_COLOR} + " | " + datum.${DEFAULT_SECONDARY_COLOR}`,
						type: 'formula',
					},
				],
			},
		]);
	});
	test('should add filter transform if hiddenEntries has length', () => {
		expect(addData([], { facets: [DEFAULT_COLOR], hiddenEntries: ['test'] })).toStrictEqual([
			{
				...defaultLegendAggregateData,
				transform: [
					...(defaultLegendAggregateData.transform || []),
					{ type: 'filter', expr: 'indexof(["test"], datum.legendEntries) === -1' },
				],
			},
		]);
	});
});

describe('setHoverOpacityForMarks()', () => {
	describe('no initial state', () => {
		test('should return undefined', () => {
			expect(setHoverOpacityForMarks([])).toStrictEqual([]);
		});
	});
	describe('bar mark initial state', () => {
		test('encoding should be added for fillOpacity and strokOpacity', () => {
			expect(setHoverOpacityForMarks([defaultMark])).toStrictEqual([
				{ ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } },
			]);
		});
		test('fillOpacity encoding already exists, rules should be added in the correct spot', () => {
			expect(
				setHoverOpacityForMarks([
					{ ...defaultMark, encode: { ...defaultMark.encode, update: { fillOpacity: [{ value: 1 }] } } },
				]),
			).toStrictEqual([
				{
					...defaultMark,
					encode: {
						...defaultMark.encode,
						update: {
							...defaultOpacityEncoding,
							fillOpacity: [...defaultOpacityEncoding.fillOpacity, { value: 1 }],
						},
					},
				},
			]);
		});
	});
	describe('group mark initial state', () => {
		test('encoding should be added for fillOpacity and strokOpacity', () => {
			expect(setHoverOpacityForMarks([defaultGroupMark])).toStrictEqual([
				{
					...defaultGroupMark,
					marks: [{ ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } }],
				},
			]);
		});
	});
});

describe('formatFacetRefsWithPresets()', () => {
	test('should swap out preset values with vega supported values', () => {
		const { formattedColor, formattedLineType, formattedLineWidth, formattedSymbolShape } =
			formatFacetRefsWithPresets(
				{ value: 'red-500' },
				{ value: 'dotDash' },
				{ value: 'XL' },
				{ value: 'wedge' },
				DEFAULT_COLOR_SCHEME,
			);
		expect(formattedColor).toStrictEqual({ value: 'rgb(255, 155, 136)' });
		expect(formattedLineType).toStrictEqual({ value: [2, 3, 7, 4] });
		expect(formattedLineWidth).toStrictEqual({ value: 4 });
		expect(formattedSymbolShape).toStrictEqual({ value: 'wedge' });
	});
	test('should not alter string facet references', () => {
		const { formattedColor, formattedLineType, formattedLineWidth, formattedSymbolShape } =
			formatFacetRefsWithPresets('series', 'series', 'series', 'series', DEFAULT_COLOR_SCHEME);
		expect(formattedColor).toEqual('series');
		expect(formattedLineType).toEqual('series');
		expect(formattedLineWidth).toEqual('series');
		expect(formattedSymbolShape).toStrictEqual('series');
	});
	test('should pass through static values that are not presets', () => {
		const svgPath =
			'M -0.01 -0.38 C -0.04 -0.27 -0.1 -0.07 -0.15 0.08 H 0.14 C 0.1 -0.03 0.03 -0.26 -0.01 -0.38 H -0.01 M -1 -1 M 0.55 -1 H -0.55 C -0.8 -1 -1 -0.8 -1 -0.55 V 0.55 C -1 0.8 -0.8 1 -0.55 1 H 0.55 C 0.8 1 1 0.8 1 0.55 V -0.55 C 1 -0.8 0.8 -1 0.55 -1 M 0.49 0.55 H 0.3 S 0.29 0.55 0.28 0.55 L 0.18 0.27 H -0.22 L -0.31 0.55 S -0.31 0.56 -0.33 0.56 H -0.5 S -0.51 0.56 -0.51 0.54 L -0.17 -0.44 S -0.16 -0.47 -0.15 -0.53 C -0.15 -0.53 -0.15 -0.54 -0.15 -0.54 H 0.08 S 0.09 -0.54 0.09 -0.53 L 0.48 0.54 S 0.48 0.56 0.48 0.56f';
		const { formattedColor, formattedLineType, formattedLineWidth, formattedSymbolShape } =
			formatFacetRefsWithPresets(
				{ value: 'rgb(50, 50, 50)' },
				{ value: [3, 4, 5, 6] },
				{ value: 10 },
				{ value: svgPath },
				DEFAULT_COLOR_SCHEME,
			);
		expect(formattedColor).toStrictEqual({ value: 'rgb(50, 50, 50)' });
		expect(formattedLineType).toStrictEqual({ value: [3, 4, 5, 6] });
		expect(formattedLineWidth).toStrictEqual({ value: 10 });
		expect(formattedSymbolShape).toStrictEqual({ value: svgPath });
	});
});

describe('getOpacityEncoding()', () => {
	test('should return undefined if highlight is false', () => {
		expect(getOpacityEncoding(false)).toBeUndefined();
	});

	test('should return default highlight encoding if opacity and facets are undefined', () => {
		expect(getOpacityEncoding(true)).toStrictEqual(opacityEncoding);
	});

	test('should return signal-based encoding if facets includes opacity facet when opacity id undefined', () => {
		expect(getOpacityEncoding(true, undefined, [{ facetType: 'opacity', field: DEFAULT_COLOR }])).toStrictEqual(
			defaultOpacitySignalEncoding,
		);
	});

	test('should return value-based encoding if opacity exists and is a static value', () => {
		const opacity = 0.5;
		expect(getOpacityEncoding(true, { value: opacity })).toStrictEqual([
			{
				test: 'highlightedSeries && datum.value !== highlightedSeries',
				value: opacity / HIGHLIGHT_CONTRAST_RATIO,
			},
			{ value: opacity },
		]);
	});

	test('should return signal based highlight encodings if opacity is a signal ref', () => {
		expect(getOpacityEncoding(true, DEFAULT_COLOR, [{ facetType: 'opacity', field: 'testing' }])).toStrictEqual(
			defaultOpacitySignalEncoding,
		);
	});

	test('should return value based highlight encodings if opacity and facets are valid', () => {
		expect(getOpacityEncoding(true, DEFAULT_COLOR, [{ facetType: 'opacity', field: 'testing' }])).toStrictEqual(
			defaultOpacitySignalEncoding,
		);
	});
});

describe('getSymbolEncodings()', () => {
	test('no factes and no custom values, should return all the defaults', () => {
		expect(
			getSymbolEncodings([], {
				position: 'bottom',
				highlight: false,
				colorScheme: DEFAULT_COLOR_SCHEME,
				hiddenEntries: [],
			}),
		).toStrictEqual({
			entries: { name: 'legendEntry' },
			symbols: { update: { fill: { value: 'rgb(15, 181, 174)' }, stroke: { value: 'rgb(15, 181, 174)' } } },
		});
	});
});

describe('getOpacityRule()', () => {
	test('array, should return the last value', () => {
		expect(getOpacityRule([{ value: 0.5 }])).toStrictEqual({ value: 0.5 });
		expect(getOpacityRule([{ value: 0.5 }, { signal: `scale('opacity', datum.${DEFAULT_COLOR})` }])).toStrictEqual({
			signal: `scale('opacity', datum.${DEFAULT_COLOR})`,
		});
	});
	test('empty array, should return default value', () => {
		expect(getOpacityRule([])).toStrictEqual({ value: 1 });
	});
	test('object, should return object', () => {
		expect(getOpacityRule({ value: 0.5 })).toStrictEqual({ value: 0.5 });
	});
	test('undefined, should return default value', () => {
		expect(getOpacityRule(undefined)).toStrictEqual({ value: 1 });
	});
});

describe('getHighlightOpacityrule()', () => {
	test('scale ref should divide by highlight contrast ratio', () => {
		expect(getHighlightOpacityRule({ scale: 'opacity', field: DEFAULT_COLOR })).toStrictEqual({
			test: 'highlightedSeries && highlightedSeries !== datum.prismSeriesId',
			signal: `scale('opacity', datum.${DEFAULT_COLOR}) / ${HIGHLIGHT_CONTRAST_RATIO}`,
		});
	});
	test('signal ref should divide by highlight contrast ratio', () => {
		expect(getHighlightOpacityRule({ signal: `scale('opacity', datum.${DEFAULT_COLOR})` })).toStrictEqual({
			test: 'highlightedSeries && highlightedSeries !== datum.prismSeriesId',
			signal: `scale('opacity', datum.${DEFAULT_COLOR}) / ${HIGHLIGHT_CONTRAST_RATIO}`,
		});
	});
	test('value ref should divide by highlight contrast ratio', () => {
		expect(getHighlightOpacityRule({ value: 0.5 })).toStrictEqual({
			test: 'highlightedSeries && highlightedSeries !== datum.prismSeriesId',
			value: 0.5 / HIGHLIGHT_CONTRAST_RATIO,
		});
	});
	test('empty ref should rturn default rule', () => {
		expect(getHighlightOpacityRule({})).toStrictEqual({
			test: 'highlightedSeries && highlightedSeries !== datum.prismSeriesId',
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		});
	});
});
