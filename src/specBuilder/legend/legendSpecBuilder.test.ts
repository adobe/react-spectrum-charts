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

import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_SECONDARY_COLOR, FILTERED_TABLE, TABLE } from '@constants';
import { Data, Legend, LegendEncode, Scale, Spec, SymbolEncodeEntry } from 'vega';

import { defaultHighlightSignal } from '../signal/signalSpecBuilder.test';
import { addData, addLegend, addSignals, formatFacetRefsWithPresets } from './legendSpecBuilder';
import { defaultLegendProps, opacityEncoding } from './legendTestUtils';
import { baseData } from '@specBuilder/specUtils';

const defaultSpec: Spec = {
	signals: [],
	scales: [
		{
			name: 'color',
			type: 'ordinal',
			domain: { data: TABLE, fields: [DEFAULT_COLOR] },
		},
	],
	marks: [],
};

const colorEncoding = { signal: `scale('color', data('legendAggregate')[datum.index].${DEFAULT_COLOR})` };
const defaultSymbolUpdateEncodings: SymbolEncodeEntry = {
	fill: [colorEncoding],
	stroke: [colorEncoding],
};

const defaultTooltipLegendEncoding: LegendEncode = {
	entries: {
		name: 'legend0_legendEntry',
		interactive: true,
		enter: { tooltip: { signal: 'datum' } },
		update: { fill: { value: 'transparent' } },
	},
	labels: { update: { fillOpacity: undefined } },
	symbols: { update: { ...defaultSymbolUpdateEncodings, fillOpacity: undefined, strokeOpacity: undefined } },
};

const defaultHighlightLegendEncoding: LegendEncode = {
	entries: {
		name: 'legend0_legendEntry',
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
	encode: { entries: { name: 'legend0_legendEntry' }, symbols: { update: { ...defaultSymbolUpdateEncodings } } },
	fill: 'legendEntries',
	orient: 'bottom',
	title: undefined,
	columns: { signal: 'floor(width / 220)' },
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
					name: 'legend0_legendEntry',
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
		expect(addData([], { ...defaultLegendProps, facets: [DEFAULT_COLOR] })).toStrictEqual([
			defaultLegendAggregateData,
		]);
	});
	test('should join multiple facets', () => {
		expect(addData([], { ...defaultLegendProps, facets: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] })).toStrictEqual([
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
		expect(addData([], { ...defaultLegendProps, facets: [DEFAULT_COLOR], hiddenEntries: ['test'] })).toStrictEqual([
			{
				...defaultLegendAggregateData,
				transform: [
					...(defaultLegendAggregateData.transform || []),
					{ type: 'filter', expr: 'indexof(["test"], datum.legendEntries) === -1' },
				],
			},
		]);
	});
	test('should add the hiddenSeries transform to the filteredTable if isToggleable is true', () => {
		const data = addData(baseData, { ...defaultLegendProps, facets: [DEFAULT_COLOR], isToggleable: true });
		const hiddenSeriesTransform = data
			.find((d) => d.name === FILTERED_TABLE)
			?.transform?.find((t) => t.type === 'filter' && t.expr.includes('hiddenSeries'));
		expect(hiddenSeriesTransform).toBeDefined();
	});
	test('should not add the hiddenSeries transform to the filteredTable if isToggleable is false', () => {
		const data = addData(baseData, { ...defaultLegendProps, facets: [DEFAULT_COLOR], isToggleable: false });
		const hiddenSeriesTransform = data
			.find((d) => d.name === FILTERED_TABLE)
			?.transform?.find((t) => t.type === 'filter' && t.expr.includes('hiddenSeries'));
		expect(hiddenSeriesTransform).toBeUndefined();
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

describe('addSignals()', () => {
	test('should add highlightedSeries signal if highlight is true', () => {
		expect(
			addSignals([], { ...defaultLegendProps, highlight: true }).find(
				(signal) => signal.name === 'highlightedSeries',
			),
		).toBeDefined();
	});
	test('should add legendLabels signal if legendLabels are defined', () => {
		expect(
			addSignals([], { ...defaultLegendProps, legendLabels: [] }).find(
				(signal) => signal.name === 'legendLabels',
			),
		).toBeDefined();
	});
	test('should add hiddenSeries signal if isToggleable is true', () => {
		expect(
			addSignals([], { ...defaultLegendProps, isToggleable: true }).find(
				(signal) => signal.name === 'hiddenSeries',
			),
		).toBeDefined();
	});
	test('should NOT add hiddenSeries signal if isToggleable is false', () => {
		expect(
			addSignals([], { ...defaultLegendProps, isToggleable: false }).find(
				(signal) => signal.name === 'hiddenSeries',
			),
		).toBeUndefined();
	});
});
