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
import { createElement } from 'react';

import { Annotation } from '@components/Annotation';
import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_CATEGORICAL_DIMENSION,
	DEFAULT_COLOR,
	DEFAULT_METRIC,
	DEFAULT_OPACITY_RULE,
	DEFAULT_SECONDARY_COLOR,
	FILTERED_TABLE,
	LINE_TYPE_SCALE,
	MARK_ID,
	OPACITY_SCALE,
	STACK_ID,
	TABLE,
} from '@constants';
import { defaultSignals } from '@specBuilder/specTestUtils';
import { spectrumColors } from '@themes';
import {
	AggregateTransform,
	Data,
	GroupMark,
	Mark,
	Scale,
	ScaleData,
	SourceData,
	Spec,
	Transforms,
	ValuesData,
} from 'vega';

import { baseData, initializeSpec } from '../specUtils';
import {
	addBar,
	addData,
	addMarks,
	addScales,
	addSecondaryScales,
	addSignals,
	getDodgeGroupTransform,
	getRepeatedScale,
	getStackAggregateData,
	getStackIdTransform,
} from './barSpecBuilder';
import {
	defaultBarProps,
	defaultBarPropsWithSecondayColor,
	defaultBarStrokeEncodings,
	defaultCornerRadiusEncodings,
	defaultStackedYEncodings,
	stackedAnnotationMarks,
} from './barTestUtils';
import { defaultDodgedMark } from './dodgedBarUtils.test';

const startingSpec: Spec = initializeSpec({
	scales: [{ name: COLOR_SCALE, type: 'ordinal' }],
});

const defaultMetricScaleDomain: ScaleData = { data: FILTERED_TABLE, fields: ['value1'] };
const defaultMetricScale: Scale = {
	name: 'yLinear',
	type: 'linear',
	range: 'height',
	nice: true,
	zero: true,
	domain: defaultMetricScaleDomain,
};

const defaultDimensionScaleDomain: ScaleData = { data: FILTERED_TABLE, fields: [DEFAULT_CATEGORICAL_DIMENSION] };
const defaultDimensionScale: Scale = {
	name: 'xBand',
	type: 'band',
	range: 'width',
	paddingInner: 0.4,
	paddingOuter: 0.2,
	domain: defaultDimensionScaleDomain,
};

const defaultColorScaleDomain: ScaleData = { data: TABLE, fields: [DEFAULT_COLOR] };
const defaultColorScale: Scale = {
	name: COLOR_SCALE,
	type: 'ordinal',
	domain: defaultColorScaleDomain,
};

const defaultTableData: ValuesData = {
	name: TABLE,
	values: [],
	transform: [{ type: 'identifier', as: MARK_ID }],
};
const defaultFilteredTableData: SourceData = { name: FILTERED_TABLE, source: TABLE };

const defaultData: Data[] = [defaultTableData, defaultFilteredTableData];

const defaultStacksTransforms: Transforms[] = [
	{
		type: 'aggregate',
		groupby: [DEFAULT_CATEGORICAL_DIMENSION],
		fields: [`${DEFAULT_METRIC}1`, `${DEFAULT_METRIC}1`],
		ops: ['min', 'max'],
	},
	{
		type: 'formula',
		as: STACK_ID,
		expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION}`,
	},
];

const defaultStacksData: Data = {
	name: 'bar0_stacks',
	source: FILTERED_TABLE,
	transform: defaultStacksTransforms,
};

const defaultStackedTransforms: Transforms[] = [
	{
		type: 'stack',
		groupby: [DEFAULT_CATEGORICAL_DIMENSION],
		field: DEFAULT_METRIC,
		sort: undefined,
		as: ['value0', 'value1'],
	},
	{
		type: 'formula',
		as: STACK_ID,
		expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION}`,
	},
];

const defaultBackgroundStackedMark: Mark = {
	name: 'bar0_background',
	type: 'rect',
	from: { data: FILTERED_TABLE },
	interactive: false,
	encode: {
		enter: {
			...defaultStackedYEncodings,
			...defaultCornerRadiusEncodings,
			fill: { signal: BACKGROUND_COLOR },
		},
		update: {
			x: { scale: 'xBand', field: DEFAULT_CATEGORICAL_DIMENSION },
			width: { scale: 'xBand', band: 1 },
		},
	},
};
const defaultStackedMark: Mark = {
	name: 'bar0',
	type: 'rect',
	from: { data: FILTERED_TABLE },
	interactive: false,
	encode: {
		enter: {
			...defaultStackedYEncodings,
			...defaultCornerRadiusEncodings,
			fill: { scale: COLOR_SCALE, field: DEFAULT_COLOR },
			fillOpacity: DEFAULT_OPACITY_RULE,
			tooltip: undefined,
		},
		update: {
			...defaultBarStrokeEncodings,
			cursor: undefined,
			opacity: [DEFAULT_OPACITY_RULE],
			width: { scale: 'xBand', band: 1 },
			x: { scale: 'xBand', field: DEFAULT_CATEGORICAL_DIMENSION },
		},
	},
};
const defaultStackedBarMarks = [defaultBackgroundStackedMark, defaultStackedMark];
const defaultPaddingSignal = {
	name: 'paddingInner',
	value: 0.4,
};
const defaultSpec: Spec = {
	...startingSpec,
	data: [
		{
			name: TABLE,
			transform: [{ type: 'identifier', as: MARK_ID }],
			values: [],
		},
		{
			name: FILTERED_TABLE,
			source: TABLE,
			transform: defaultStackedTransforms,
		},
		defaultStacksData,
	],
	signals: [defaultPaddingSignal],
	scales: [{ name: COLOR_SCALE, type: 'ordinal' }, defaultMetricScale, defaultDimensionScale],
	marks: [
		defaultBackgroundStackedMark,
		{
			...defaultStackedMark,
			encode: {
				...defaultStackedMark.encode,
				enter: {
					...defaultStackedMark.encode?.enter,
					fill: { value: spectrumColors.light['categorical-100'] },
				},
				update: {
					...defaultStackedMark.encode?.update,
					stroke: [{ value: spectrumColors.light['categorical-100'] }],
				},
			},
		},
	],
};

describe('barSpecBuilder', () => {
	describe('addBar()', () => {
		test('no props', () => {
			expect(addBar(startingSpec, {})).toStrictEqual(defaultSpec);
		});
	});

	describe('addSignals()', () => {
		test('should add padding signal', () => {
			const signals = addSignals(defaultSignals, defaultBarProps);
			expect(signals).toHaveLength(5);
			expect(signals.at(-1)).toHaveProperty('name', 'paddingInner');
		});
		test('should add hover events if tooltip is present', () => {
			const signals = addSignals(defaultSignals, { ...defaultBarProps, children: [createElement(ChartTooltip)] });
			expect(signals[0]).toHaveProperty('on');
			expect(signals[0].on).toHaveLength(2);
			expect(signals[0].on?.[0]).toHaveProperty('events', '@bar0:mouseover');
		});
		test('should exclude data with key from update if tooltip has excludeDataKey', () => {
			const signals = addSignals(defaultSignals, { ...defaultBarProps, children: [createElement(ChartTooltip, { excludeDataKey: 'excludeFromTooltip' })] });
			expect(signals[0]).toHaveProperty('on');
			expect(signals[0].on).toHaveLength(2);
			expect(signals[0].on?.[0]).toHaveProperty('events', '@bar0:mouseover');
			expect(signals[0].on?.[0]).toHaveProperty('update', 'datum.excludeFromTooltip ? null : datum.rscMarkId');
		});
	});

	describe('addScales()', () => {
		describe('no initial state', () => {
			test('default props, should add default scales', () => {
				expect(addScales([{ name: COLOR_SCALE, type: 'ordinal' }], defaultBarProps)).toStrictEqual([
					defaultColorScale,
					defaultMetricScale,
					defaultDimensionScale,
				]);
			});

			test('secondary series, should add default scales', () => {
				expect(
					addScales([{ name: COLOR_SCALE, type: 'ordinal' }], defaultBarPropsWithSecondayColor)
				).toStrictEqual([
					defaultColorScale,
					defaultMetricScale,
					defaultDimensionScale,
					{
						name: 'secondaryColor',
						type: 'ordinal',
						domain: { data: TABLE, fields: [DEFAULT_SECONDARY_COLOR] },
					},
					{
						name: 'colors',
						type: 'ordinal',
						range: { signal: 'colors' },
						domain: { data: TABLE, fields: [DEFAULT_COLOR] },
					},
				]);
			});

			test('should add facet scales', () => {
				expect(
					addScales(
						[
							{ name: COLOR_SCALE, type: 'ordinal' },
							{ name: LINE_TYPE_SCALE, type: 'ordinal' },
							{ name: OPACITY_SCALE, type: 'point' },
						],
						{
							...defaultBarProps,
							lineType: DEFAULT_COLOR,
							opacity: DEFAULT_COLOR,
						}
					)
				).toStrictEqual([
					defaultColorScale,
					{ domain: { data: TABLE, fields: [DEFAULT_COLOR] }, name: LINE_TYPE_SCALE, type: 'ordinal' },
					{ domain: { data: TABLE, fields: [DEFAULT_COLOR] }, name: OPACITY_SCALE, type: 'point' },
					defaultMetricScale,
					defaultDimensionScale,
				]);
			});

			test('should add trellis scales', () => {
				expect(
					addScales([{ name: COLOR_SCALE, type: 'ordinal' }], {
						...defaultBarProps,
						trellis: 'event',
						trellisOrientation: 'vertical',
						trellisPadding: 0.5,
					})
				).toStrictEqual([
					defaultColorScale,
					defaultMetricScale,
					defaultDimensionScale,
					{
						name: 'yTrellisBand',
						type: 'band',
						domain: { data: TABLE, fields: ['event'] },
						range: 'height',
						paddingInner: 0.5,
					},
				]);
			});
		});
	});

	describe('addSecondaryScales()', () => {
		test('no secondary facets, should do nothing', () => {
			const scales = [];
			addSecondaryScales(scales, defaultBarProps);
			expect(scales).toStrictEqual([]);
		});
		test('secondary color facet, should add colors secondary scale', () => {
			const scales = [];
			addSecondaryScales(scales, { ...defaultBarProps, color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] });
			expect(scales).toStrictEqual([
				{
					name: 'secondaryColor',
					type: 'ordinal',
					domain: { data: TABLE, fields: [DEFAULT_SECONDARY_COLOR] },
				},
				{
					name: 'colors',
					type: 'ordinal',
					range: { signal: 'colors' },
					domain: { data: TABLE, fields: [DEFAULT_COLOR] },
				},
			]);
		});
		test('secondary lineType facet, should add colors secondary scale', () => {
			const scales = [];
			addSecondaryScales(scales, { ...defaultBarProps, lineType: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] });
			expect(scales).toStrictEqual([
				{
					name: 'secondaryLineType',
					type: 'ordinal',
					domain: { data: TABLE, fields: [DEFAULT_SECONDARY_COLOR] },
				},
				{
					name: 'lineTypes',
					type: 'ordinal',
					range: { signal: 'lineTypes' },
					domain: { data: TABLE, fields: [DEFAULT_COLOR] },
				},
			]);
		});
		test('secondary opacity facet, should add colors secondary scale', () => {
			const scales = [];
			addSecondaryScales(scales, { ...defaultBarProps, opacity: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] });
			expect(scales).toStrictEqual([
				{
					name: 'secondaryOpacity',
					type: 'ordinal',
					domain: { data: TABLE, fields: [DEFAULT_SECONDARY_COLOR] },
				},
				{
					name: 'opacities',
					type: 'ordinal',
					range: { signal: 'opacities' },
					domain: { data: TABLE, fields: [DEFAULT_COLOR] },
				},
			]);
		});
	});

	describe('addMarks()', () => {
		describe('no initial state', () => {
			test('default props, should add default stacked bar', () => {
				expect(addMarks([], defaultBarProps)).toStrictEqual(defaultStackedBarMarks);
			});
			test('default props + type = "dodged", should add default dodged bar', () => {
				expect(addMarks([], { ...defaultBarProps, type: 'dodged' })).toStrictEqual([defaultDodgedMark]);
			});
		});

		describe('with annotations', () => {
			test('default props', () => {
				const annotation = createElement(Annotation, { textKey: 'textLabel' });
				expect(
					addMarks([], {
						...defaultBarProps,
						children: [...defaultBarProps.children, annotation],
					})
				).toStrictEqual([...defaultStackedBarMarks, ...stackedAnnotationMarks]);
			});
		});

		test('stacked and dodged with annotations', () => {
			const annotation = createElement(Annotation, { textKey: 'textLabel' });
			const addedMarks = addMarks([], {
				...defaultBarProps,
				color: ['#000', '#fff'],
				type: 'dodged',
				children: [...defaultBarProps.children, annotation],
			});

			expect(addedMarks).toHaveLength(1);
			expect(addedMarks[0].name).toEqual('bar0_group');
			expect((addedMarks[0] as GroupMark).marks).toHaveLength(4);
		});

		test('should add trellis group mark if trellis prop is set', () => {
			const marks = addMarks([], { ...defaultBarProps, trellis: 'trellis' });
			expect(marks).toHaveLength(1);
			const trellisMark = marks[0] as GroupMark;
			expect(trellisMark.type).toEqual('group');
			expect(trellisMark.name).toEqual('xTrellisGroup');
		});
	});

	describe('addData()', () => {
		describe('existing data "table"', () => {
			test('new transform should be added to the data table', () => {
				expect(
					addData(defaultData, { ...defaultBarProps, metric: 'views', dimension: 'browser' })
				).toStrictEqual([
					defaultTableData,
					{
						...defaultFilteredTableData,
						transform: [
							{
								...defaultStackedTransforms[0],
								groupby: ['browser'],
								field: 'views',
								as: ['views0', 'views1'],
							},
							{ ...defaultStackedTransforms[1], expr: 'datum.browser' },
						],
					},
					{
						...defaultStacksData,
						transform: [
							{ ...defaultStacksTransforms[0], groupby: ['browser'], fields: ['views1', 'views1'] },
							{ ...defaultStacksTransforms[1], expr: 'datum.browser' },
						],
					},
				]);
			});

			test('no props, transform should use default values', () => {
				expect(addData(defaultData, defaultBarProps)).toStrictEqual([
					defaultTableData,
					{
						...defaultFilteredTableData,
						transform: defaultStackedTransforms,
					},
					defaultStacksData,
				]);
			});

			test('order supplied, transform should include sort by order', () => {
				expect(addData(defaultData, { ...defaultBarProps, order: 'order' })).toStrictEqual([
					defaultTableData,
					{
						...defaultFilteredTableData,
						transform: [
							{
								...defaultStackedTransforms[0],
								sort: {
									field: 'order',
								},
							},
							defaultStackedTransforms[1],
						],
					},
					defaultStacksData,
				]);
			});
		});

		describe('transform already exists', () => {
			test('no props, new transform should be pushed onto the end with default values', () => {
				expect(
					addData([{ ...defaultFilteredTableData, transform: defaultStackedTransforms }], defaultBarProps)
				).toStrictEqual([
					{
						...defaultFilteredTableData,
						transform: [...defaultStackedTransforms, ...defaultStackedTransforms],
					},
					defaultStacksData,
				]);
			});
		});

		describe('no initial state', () => {
			test('children, selectedData transform should be added to the filteredTable', () => {
				const popover = createElement(ChartPopover);
				expect(addData(baseData, { ...defaultBarProps, children: [popover] })[1]).toHaveProperty(
					'transform',
					defaultStackedTransforms
				);
			});
		});

		test('dodged stacked', () => {
			expect(
				addData(defaultData, {
					...defaultBarProps,
					type: 'dodged',
					color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR],
				})
			).toStrictEqual([
				defaultTableData,
				{
					...defaultFilteredTableData,
					transform: [
						{
							as: [`${DEFAULT_METRIC}0`, `${DEFAULT_METRIC}1`],
							field: DEFAULT_METRIC,
							groupby: [DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_COLOR],
							sort: undefined,
							type: 'stack',
						},
						{
							as: STACK_ID,
							expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION} + "," + datum.${DEFAULT_COLOR}`,
							type: 'formula',
						},
						{ as: 'bar0_dodgeGroup', expr: `datum.${DEFAULT_COLOR}`, type: 'formula' },
					],
				},
				{
					name: 'bar0_stacks',
					source: FILTERED_TABLE,
					transform: [
						{
							fields: [`${DEFAULT_METRIC}1`, `${DEFAULT_METRIC}1`],
							groupby: [DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_COLOR],
							ops: ['min', 'max'],
							type: 'aggregate',
						},
						{
							as: STACK_ID,
							expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION} + "," + datum.${DEFAULT_COLOR}`,
							type: 'formula',
						},
					],
				},
			]);
		});
		test('stacked dodged', () => {
			expect(
				addData(defaultData, { ...defaultBarProps, color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] })
			).toStrictEqual([
				defaultTableData,
				{
					...defaultFilteredTableData,
					transform: [
						{
							as: [`${DEFAULT_METRIC}0`, `${DEFAULT_METRIC}1`],
							field: DEFAULT_METRIC,
							groupby: [DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_SECONDARY_COLOR],
							sort: undefined,
							type: 'stack',
						},
						{
							as: STACK_ID,
							expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION} + "," + datum.${DEFAULT_SECONDARY_COLOR}`,
							type: 'formula',
						},
						{ as: 'bar0_dodgeGroup', expr: `datum.${DEFAULT_SECONDARY_COLOR}`, type: 'formula' },
					],
				},
				{
					name: 'bar0_stacks',
					source: FILTERED_TABLE,
					transform: [
						{
							fields: [`${DEFAULT_METRIC}1`, `${DEFAULT_METRIC}1`],
							groupby: [DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_SECONDARY_COLOR],
							ops: ['min', 'max'],
							type: 'aggregate',
						},
						{
							as: STACK_ID,
							expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION} + "," + datum.${DEFAULT_SECONDARY_COLOR}`,
							type: 'formula',
						},
					],
				},
			]);
		});
	});

	describe('getStackAggregateData()', () => {
		test('should return default stack aggregate data', () => {
			expect(getStackAggregateData(defaultBarProps)).toStrictEqual({
				name: `bar0_stacks`,
				source: FILTERED_TABLE,
				transform: [
					{
						type: 'aggregate',
						groupby: [DEFAULT_CATEGORICAL_DIMENSION],
						fields: [`${DEFAULT_METRIC}1`, `${DEFAULT_METRIC}1`],
						ops: ['min', 'max'],
					},
					{ as: STACK_ID, expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION}`, type: 'formula' },
				],
			});
		});
		test('should include facets in groupby if dodged', () => {
			const { groupby } = getStackAggregateData({ ...defaultBarProps, type: 'dodged' })
				.transform?.[0] as AggregateTransform;
			expect(groupby).toStrictEqual([DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_COLOR]);
		});
	});

	describe('getStackIdTransform()', () => {
		test('should return default stack id transform', () => {
			expect(getStackIdTransform(defaultBarProps)).toStrictEqual({
				as: STACK_ID,
				expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION}`,
				type: 'formula',
			});
		});

		test('should join all facets if dodged', () => {
			expect(getStackIdTransform({ ...defaultBarProps, type: 'dodged' })).toStrictEqual({
				as: STACK_ID,
				expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION} + "," + datum.${DEFAULT_COLOR}`,
				type: 'formula',
			});

			expect(
				getStackIdTransform({ ...defaultBarProps, type: 'dodged', opacity: DEFAULT_SECONDARY_COLOR })
			).toStrictEqual({
				as: STACK_ID,
				expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION} + "," + datum.${DEFAULT_COLOR} + "," + datum.${DEFAULT_SECONDARY_COLOR}`,
				type: 'formula',
			});
		});
	});

	describe('getDodgeGroupTransform()', () => {
		test('should join facets together', () => {
			expect(
				getDodgeGroupTransform({ ...defaultBarProps, type: 'dodged', opacity: DEFAULT_SECONDARY_COLOR })
			).toStrictEqual({
				as: 'bar0_dodgeGroup',
				expr: `datum.${DEFAULT_COLOR} + "," + datum.${DEFAULT_SECONDARY_COLOR}`,
				type: 'formula',
			});
		});
	});

	describe('getRepeatedScale()', () => {
		test('should return a linear scale if the bar and trellis orientations are the same', () => {
			expect(
				getRepeatedScale({ ...defaultBarProps, orientation: 'horizontal', trellisOrientation: 'horizontal' })
			).toHaveProperty('type', 'linear');
			expect(
				getRepeatedScale({ ...defaultBarProps, orientation: 'vertical', trellisOrientation: 'vertical' })
			).toHaveProperty('type', 'linear');
		});
		test('should return a band scale if the bar and trellis orientations are not the same', () => {
			expect(
				getRepeatedScale({ ...defaultBarProps, orientation: 'horizontal', trellisOrientation: 'vertical' })
			).toHaveProperty('type', 'band');
			expect(
				getRepeatedScale({ ...defaultBarProps, orientation: 'vertical', trellisOrientation: 'horizontal' })
			).toHaveProperty('type', 'band');
		});
	});
});
