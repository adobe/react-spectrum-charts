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
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_SECONDARY_COLOR,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	LINEAR_COLOR_SCALE,
	RSC_ANIMATION,
	TABLE,
} from '@constants';
import {
	defaultHighlightedItemSignal,
	defaultHighlightedSeriesSignal,
	defaultSelectedItemSignal,
	defaultSelectedSeriesSignal,
	defaultSignals,
} from '@specBuilder/specTestUtils';
import { Data, Legend, LegendEncode, Scale, Spec, SymbolEncodeEntry } from 'vega';

import { addData, addLegend, addSignals, formatFacetRefsWithPresets, getContinuousLegend } from './legendSpecBuilder';
import { defaultLegendProps, opacityEncoding } from './legendTestUtils';
import { defaultAnimationScales } from '@specBuilder/scale/scaleSpecBuilder.test';

const defaultSpec: Spec = {
	signals: defaultSignals,
	scales: [
		{
			name: COLOR_SCALE,
			type: 'ordinal',
			domain: { data: TABLE, fields: [DEFAULT_COLOR] },
		},
	],
	marks: [],
};

const colorEncoding = { signal: `scale('${COLOR_SCALE}', data('legend0Aggregate')[datum.index].${DEFAULT_COLOR})` };
const hiddenSeriesEncoding = {
	test: 'indexof(hiddenSeries, datum.value) !== -1',
	value: 'rgb(213, 213, 213)',
};

const defaultSymbolUpdateEncodings: SymbolEncodeEntry = {
	fill: [hiddenSeriesEncoding, colorEncoding],
	stroke: [hiddenSeriesEncoding, colorEncoding],
};
const hiddenSeriesLabelUpdateEncoding = {
	fill: [
		{
			test: 'indexof(hiddenSeries, datum.value) !== -1',
			value: 'rgb(144, 144, 144)',
		},
		{
			value: 'rgb(70, 70, 70)',
		},
	],
};
const defaultTooltipLegendEncoding: LegendEncode = {
	entries: {
		name: 'legend0_legendEntry',
		interactive: true,
		enter: { tooltip: { signal: "merge(datum, {'rscComponentName': 'legend0'})" } },
		update: { fill: { value: 'transparent' } },
	},
	labels: { update: { ...hiddenSeriesLabelUpdateEncoding, opacity: undefined } },
	symbols: { enter: {}, update: { ...defaultSymbolUpdateEncodings, opacity: undefined } },
};

const defaultHighlightLegendEncoding: LegendEncode = {
	entries: {
		name: 'legend0_legendEntry',
		interactive: true,
		enter: { tooltip: undefined },
		update: { fill: { value: 'transparent' } },
	},
	labels: { update: { ...hiddenSeriesLabelUpdateEncoding, opacity: opacityEncoding } },
	symbols: {
		enter: {},
		update: {
			...defaultSymbolUpdateEncodings,
			opacity: opacityEncoding,
		},
	},
};

const defaultLegend: Legend = {
	direction: 'horizontal',
	encode: {
		entries: { name: 'legend0_legendEntry' },
		labels: { update: { ...hiddenSeriesLabelUpdateEncoding } },
		symbols: { enter: {}, update: { ...defaultSymbolUpdateEncodings } },
	},
	fill: 'legend0Entries',
	labelLimit: undefined,
	orient: 'bottom',
	title: undefined,
	columns: { signal: 'floor(width / 220)' },
};

const defaultLegendAggregateData: Data = {
	name: 'legend0Aggregate',
	source: TABLE,
	transform: [
		{
			type: 'aggregate',
			groupby: [DEFAULT_COLOR],
		},
		{
			type: 'formula',
			as: 'legend0Entries',
			expr: `datum.${DEFAULT_COLOR}`,
		},
	],
};

const defaultLegendEntriesScale: Scale = {
	name: 'legend0Entries',
	type: 'ordinal',
	domain: { data: 'legend0Aggregate', field: 'legend0Entries' },
};

const defaultHighlightSeriesSignal = {
	...defaultHighlightedSeriesSignal,
	on: [
		{
			events: '@legend0_legendEntry:mouseover',
			update: 'indexof(hiddenSeries, domain("legend0Entries")[datum.index]) === -1 ? domain("legend0Entries")[datum.index] : null',
		},
		{ events: '@legend0_legendEntry:mouseout', update: 'null' },
	],
};

describe('addLegend()', () => {
	describe('no initial legend', () => {
		test('no props, should setup default legend', () => {
			expect(addLegend(defaultSpec, {animations: false,})).toStrictEqual({
				...defaultSpec,
				data: [defaultLegendAggregateData],
				scales: [...(defaultSpec.scales || []), defaultLegendEntriesScale],
				legends: [defaultLegend],
			});
		});

		test('descriptions, should add encoding', () => {
			expect(
				addLegend(defaultSpec, { animations: false, descriptions: [{ seriesName: 'test', description: 'test' }] })
			).toStrictEqual({
				...defaultSpec,
				data: [defaultLegendAggregateData],
				scales: [...(defaultSpec.scales || []), defaultLegendEntriesScale],
				legends: [{ ...defaultLegend, encode: defaultTooltipLegendEncoding }],
			});
		});

		test('highlight, should add encoding', () => {
			expect(addLegend(defaultSpec, { animations: false, highlight: true })).toStrictEqual({
				...defaultSpec,
				data: [defaultLegendAggregateData],
				scales: [...(defaultSpec.scales || []), defaultLegendEntriesScale],
				signals: [
					defaultHighlightedItemSignal,
					defaultHighlightSeriesSignal,
					defaultSelectedItemSignal,
					defaultSelectedSeriesSignal,
				],
				legends: [{ ...defaultLegend, encode: defaultHighlightLegendEncoding }],
			});
		});

		test('position, should set the orientation correctly', () => {
			expect(addLegend(defaultSpec, { animations: false, position: 'left' }).legends).toStrictEqual([
				{ ...defaultLegend, orient: 'left', direction: 'vertical', columns: undefined, labelLimit: undefined },
			]);
		});

		test('title, should add title', () => {
			expect(addLegend(defaultSpec, { title: 'My title' }).legends?.[0].title).toStrictEqual('My title');
		});

		test('should add labels to signals using legendLabels', () => {
			expect(
				addLegend(defaultSpec, {
					animations: false,
					legendLabels: [
						{ seriesName: 1, label: 'Any event' },
						{ seriesName: 2, label: 'Any event' },
					],
				}).legends?.[0].encode
			).toStrictEqual({
				entries: {
					name: 'legend0_legendEntry',
				},
				labels: {
					update: {
						...hiddenSeriesLabelUpdateEncoding,
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
				symbols: { enter: {}, update: { ...defaultSymbolUpdateEncodings } },
			});
		});

		test('should have both labels and highlight encoding', () => {
			expect(
				addLegend(defaultSpec, {
					animations: false,
					highlight: true,
					legendLabels: [
						{ seriesName: 1, label: 'Any event' },
						{ seriesName: 2, label: 'Any event' },
					],
				}).legends?.[0].encode
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
					animations: false,
					legendLabels: [
						{ seriesName: 1, label: 'Any event' },
						{ seriesName: 2, label: 'Any event' },
					],
				}).signals
			).toStrictEqual([
				...defaultSignals,
				{
					name: 'legendLabels',
					value: [
						{ seriesName: 1, label: 'Any event' },
						{ seriesName: 2, label: 'Any event' },
					],
				},
			]);
		});

		test('should add labelLimit if provided', () => {
			const legendSpec = addLegend(defaultSpec, {
				animations: false,
				descriptions: [{ seriesName: 'test', description: 'test' }],
				labelLimit: 300,
			});
			const legend = legendSpec.legends?.[0];
			expect(legend?.labelLimit).toBe(300);
			expect(legendSpec.legends).toEqual([
				{ ...defaultLegend, labelLimit: 300, encode: defaultTooltipLegendEncoding },
			]);
			expect(legendSpec.data).toEqual([defaultLegendAggregateData]);
			expect(legendSpec.scales).toEqual([...(defaultSpec.scales || []), defaultLegendEntriesScale]);
		});

		test('should add fields to scales if they have not been added', () => {
			const legendSpec = addLegend(
				{ ...defaultSpec, scales: [{ name: COLOR_SCALE, type: 'ordinal' }] },
				{ animations: false, color: 'series' }
			);
			expect(legendSpec.scales).toEqual([
				{
					name: COLOR_SCALE,
					type: 'ordinal',
					domain: { data: 'table', fields: ['series'] },
				},
				{
					name: 'legend0Entries',
					type: 'ordinal',
					domain: {
						data: 'legend0Aggregate',
						field: 'legend0Entries',
					},
				},
			]);
		});

		test('should add fields to scales if they have not been added with animations', () => {
			const legendSpec = addLegend(
				{ ...defaultSpec, scales: [{ name: COLOR_SCALE, type: 'ordinal' }] },
				{ color: 'series', animations: true }
			);
			expect(legendSpec.scales).toEqual([
				{
					name: COLOR_SCALE,
					type: 'ordinal',
					domain: { data: 'table', fields: ['series'] },
				},
				...defaultAnimationScales,
				{
					name: 'legend0Entries',
					type: 'ordinal',
					domain: {
						data: 'legend0Aggregate',
						field: 'legend0Entries',
					},
				},
			]);
		});
	});
});

describe('addData()', () => {
	test('should add legend0Aggregate data', () => {
		expect(addData([], { ...defaultLegendProps, facets: [DEFAULT_COLOR] })).toStrictEqual([
			defaultLegendAggregateData,
		]);
	});
	test('should join multiple facets', () => {
		expect(addData([], { ...defaultLegendProps, facets: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] })).toStrictEqual([
			{
				name: 'legend0Aggregate',
				source: 'table',
				transform: [
					{ groupby: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR], type: 'aggregate' },
					{
						as: 'legend0Entries',
						expr: `datum.${DEFAULT_COLOR} + " | " + datum.${DEFAULT_SECONDARY_COLOR}`,
						type: 'formula',
					},
				],
			},
		]);
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
				DEFAULT_COLOR_SCHEME
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
				DEFAULT_COLOR_SCHEME
			);
		expect(formattedColor).toStrictEqual({ value: 'rgb(50, 50, 50)' });
		expect(formattedLineType).toStrictEqual({ value: [3, 4, 5, 6] });
		expect(formattedLineWidth).toStrictEqual({ value: 10 });
		expect(formattedSymbolShape).toStrictEqual({ value: svgPath });
	});
});

describe('addSignals()', () => {
	test('should add highlightedSeries signal events if highlight is true', () => {
		const highlightSignal = addSignals(defaultSignals, { ...defaultLegendProps, highlight: true }).find(
			(signal) => signal.name === HIGHLIGHTED_SERIES
		);
		expect(highlightSignal?.on).toHaveLength(2);
		expect(highlightSignal?.on?.[0]).toHaveProperty('events', '@legend0_legendEntry:mouseover');
	});
	test('should add legendLabels signal if legendLabels are defined', () => {
		expect(
			addSignals(defaultSignals, { ...defaultLegendProps, legendLabels: []}).find(
				(signal) => signal.name === 'legendLabels'
			)
		).toBeDefined();
	});
	test('should add animation signals if animations is true', () => {
		const signals = addSignals(defaultSignals, { ...defaultLegendProps, animations: true })
		expect(signals).toBeDefined()
		expect(signals).toHaveLength(9);
		expect(signals[4]).toHaveProperty('name', RSC_ANIMATION);
		expect(signals[4].on).toHaveLength(1);
		expect(signals[5]).toHaveProperty('name', 'rscColorAnimationDirection');
		expect(signals[5].on).toHaveLength(4);
		expect(signals[6]).toHaveProperty('name', 'rscColorAnimation');
		expect(signals[6].on).toHaveLength(1);
		expect(signals[7]).toHaveProperty('name', `${HIGHLIGHTED_ITEM}_prev`);
		expect(signals[7].on).toHaveLength(2);
		expect(signals[8]).toHaveProperty('name', `${HIGHLIGHTED_SERIES}_prev`);
		expect(signals[8].on).toHaveLength(1);
	});
	test('should NOT add hiddenSeries signal if isToggleable is false', () => {
		expect(
			addSignals(defaultSignals, { ...defaultLegendProps, isToggleable: false }).find(
				(signal) => signal.name === 'hiddenSeries'
			)
		).toBeUndefined();
	});
});

describe('getContinuousLegend()', () => {
	test('should return symbolSize legend if facetType is symbolSize', () => {
		expect(getContinuousLegend({ facetType: 'symbolSize', field: 'weight' }, defaultLegendProps)).toHaveProperty(
			'size',
			'symbolSize'
		);
	});
	test('should return linearColor scale if facetType is linearColor', () => {
		expect(
			getContinuousLegend({ facetType: LINEAR_COLOR_SCALE, field: 'weight' }, defaultLegendProps)
		).toHaveProperty('fill', LINEAR_COLOR_SCALE);
	});
});
