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
	AggregateTransform,
	Data,
	GroupMark,
	Mark,
	RectMark,
	Scale,
	ScaleData,
	SourceData,
	Transforms,
	ValuesData,
} from 'vega';

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
} from '@spectrum-charts/constants';
import { spectrumColors } from '@spectrum-charts/themes';

import { defaultSignals } from '../specTestUtils';
import { baseData, initializeSpec } from '../specUtils';
import { ScSpec } from '../types/specUtil.types';
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
	defaultBarOptions,
	defaultBarOptionsWithSecondayColor,
	defaultBarStrokeEncodings,
	defaultCornerRadiusEncodings,
	defaultStackedYEncodings,
} from './barTestUtils';
import { defaultDodgedMark } from './dodgedBarUtils.test';

const startingSpec = initializeSpec({
	scales: [{ name: COLOR_SCALE, type: 'ordinal' }],
}) as ScSpec;

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

const timeTransform: Transforms[] = [
	{
		as: 'browser',
		expr: 'toDate(datum["browser"])',
		type: 'formula',
	},
	{
		as: ['datetime0', 'datetime1'],
		field: 'browser',
		type: 'timeunit',
		units: ['year', 'month', 'date', 'hours', 'minutes'],
	},
];

const defaultSelectedGroupIdTransform: Transforms[] = [
	{
		type: 'formula',
		expr: `datum.${MARK_ID}`,
		as: 'bar0_selectedGroupId',
	},
];

const defaultBackgroundStackedMark: Mark = {
	name: 'bar0_background',
	description: 'bar0_background',
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
	description: 'bar0',
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
const defaultSpec: ScSpec = {
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
	usermeta: {
		orientation: 'vertical',
	},
};

describe('barSpecBuilder', () => {
	describe('addBar()', () => {
		test('no options', () => {
			expect(addBar(startingSpec, { idKey: MARK_ID, markType: 'bar' })).toStrictEqual(defaultSpec);
		});

		describe('usermeta', () => {
			test('should add vertical orientation to usermeta if bar orientation is vertical', () => {
				// default orientation is vertical
				expect(addBar(startingSpec, { idKey: MARK_ID, markType: 'bar' }).usermeta).toHaveProperty(
					'orientation',
					'vertical'
				);
			});
			test('should add horizontal orientation to usermeta if bar orientation is horizontal', () => {
				expect(
					addBar(startingSpec, { idKey: MARK_ID, markType: 'bar', orientation: 'horizontal' }).usermeta
				).toHaveProperty('orientation', 'horizontal');
			});
		});
	});

	describe('addSignals()', () => {
		test('should add padding signal', () => {
			const signals = addSignals(defaultSignals, defaultBarOptions);
			expect(signals).toHaveLength(defaultSignals.length + 1);
			expect(signals.at(-1)).toHaveProperty('name', 'paddingInner');
		});
		test('should add hover events if tooltip is present', () => {
			const signals = addSignals(defaultSignals, { ...defaultBarOptions, chartTooltips: [{}] });
			expect(signals[0]).toHaveProperty('on');
			expect(signals[0].on).toHaveLength(2);
			expect(signals[0].on?.[0]).toHaveProperty('events', '@bar0:mouseover');
		});
		test('should exclude data with key from update if tooltip has excludeDataKey', () => {
			const signals = addSignals(defaultSignals, {
				...defaultBarOptions,
				chartTooltips: [{ excludeDataKeys: ['excludeFromTooltip'] }],
			});
			expect(signals[0]).toHaveProperty('on');
			expect(signals[0].on).toHaveLength(2);
			expect(signals[0].on?.[0]).toHaveProperty('events', '@bar0:mouseover');
			expect(signals[0].on?.[0]).toHaveProperty('update', '(datum.excludeFromTooltip) ? null : datum.rscMarkId');
		});

		describe('dualYAxis signals', () => {
			function getMousedOverSeriesSignal(signal) {
				return signal.name === 'mousedOverSeries';
			}

			function getFirstRscSeriesIdSignal(signal) {
				return signal.name === 'firstRscSeriesId';
			}

			function getLastRscSeriesIdSignal(signal) {
				return signal.name === 'lastRscSeriesId';
			}

			test('should add mousedOverSeries if dualYAxis is true and type is dodged', () => {
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					type: 'dodged',
					dualYAxis: true,
				});
				const mousedOverSeriesSignal = signals.find(getMousedOverSeriesSignal);
				// update to moused over series id on mouseover
				expect(mousedOverSeriesSignal?.on?.[0]).toHaveProperty('events', '@bar0:mouseover');
				expect(mousedOverSeriesSignal?.on?.[0]).toHaveProperty('update', 'datum.rscSeriesId');
				// update to null on mouseout
				expect(mousedOverSeriesSignal?.on?.[1]).toHaveProperty('events', '@bar0:mouseout');
				expect(mousedOverSeriesSignal?.on?.[1]).toHaveProperty('update', 'null');
			});

			test('should add firstRscSeriesId if dualYAxis is true and type is dodged', () => {
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					type: 'dodged',
					dualYAxis: true,
				});
				const firstRscSeriesIdSignal = signals.find(getFirstRscSeriesIdSignal);
				// first series in the color domain is the first series in the 'order'
				expect(firstRscSeriesIdSignal).toHaveProperty('value', null);
				expect(firstRscSeriesIdSignal).toHaveProperty(
					'update',
					'length(domain("color")) > 0 ? domain("color")[0] : null'
				);
			});

			test('should add lastRscSeriesId if dualYAxis is true and type is dodged', () => {
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					type: 'dodged',
					dualYAxis: true,
				});
				const lastRscSeriesIdSignal = signals.find(getLastRscSeriesIdSignal);
				// last series in the color domain is the last series in the 'order'
				expect(lastRscSeriesIdSignal).toHaveProperty('value', null);
				expect(lastRscSeriesIdSignal).toHaveProperty(
					'update',
					'length(domain("color")) > 0 ? peek(domain("color")) : null'
				);
			});

			test('should not add mousedOverSeries if dualYAxis is true and type is not dodged', () => {
				// default type is stacked
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					dualYAxis: true,
				});
				const mousedOverSeriesSignal = signals.find(getMousedOverSeriesSignal);
				expect(mousedOverSeriesSignal).toBeUndefined();
			});

			test('should not add firstRscSeriesId if dualYAxis is true and type is not dodged', () => {
				// default type is stacked
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					dualYAxis: true,
				});
				const firstRscSeriesIdSignal = signals.find(getFirstRscSeriesIdSignal);
				expect(firstRscSeriesIdSignal).toBeUndefined();
			});

			test('should not add lastRscSeriesId if dualYAxis is true and type is not dodged', () => {
				// default type is stacked
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					dualYAxis: true,
				});
				const lastRscSeriesIdSignal = signals.find(getLastRscSeriesIdSignal);
				expect(lastRscSeriesIdSignal).toBeUndefined();
			});

			test('should not add mousedOverSeries if dualYAxis is false', () => {
				// default type is stacked
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					dualYAxis: false,
					type: 'dodged',
				});
				const mousedOverSeriesSignal = signals.find(getMousedOverSeriesSignal);
				expect(mousedOverSeriesSignal).toBeUndefined();
			});

			test('should not add firstRscSeriesId if dualYAxis is false', () => {
				// default type is stacked
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					dualYAxis: false,
					type: 'dodged',
				});
				const firstRscSeriesIdSignal = signals.find(getFirstRscSeriesIdSignal);
				expect(firstRscSeriesIdSignal).toBeUndefined();
			});

			test('should not add lastRscSeriesId if dualYAxis is false', () => {
				// default type is stacked
				const signals = addSignals(defaultSignals, {
					...defaultBarOptions,
					dualYAxis: false,
					type: 'dodged',
				});
				const lastRscSeriesIdSignal = signals.find(getLastRscSeriesIdSignal);
				expect(lastRscSeriesIdSignal).toBeUndefined();
			});
		});
	});

	describe('addScales()', () => {
		describe('no initial state', () => {
			test('default options, should add default scales', () => {
				expect(addScales([{ name: COLOR_SCALE, type: 'ordinal' }], defaultBarOptions)).toStrictEqual([
					defaultColorScale,
					defaultMetricScale,
					defaultDimensionScale,
				]);
			});

			test('secondary series, should add default scales', () => {
				expect(
					addScales([{ name: COLOR_SCALE, type: 'ordinal' }], defaultBarOptionsWithSecondayColor)
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
							...defaultBarOptions,
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
						...defaultBarOptions,
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

		describe('dualYAxis scales', () => {
			function getPrimaryMetricScale(scale) {
				return scale.name === 'yLinearPrimary';
			}
			function getSecondaryMetricScale(scale) {
				return scale.name === 'yLinearSecondary';
			}

			const baseMetricScale = {
				name: 'yLinearPrimary',
				type: 'linear',
				domain: { data: 'yLinearPrimaryDomain', fields: [DEFAULT_METRIC] },
				range: 'height',
				nice: true,
				zero: true,
			};

			test('should add primary metric scale if dualYAxis is true and type is dodged', () => {
				const scales = addScales([{ name: COLOR_SCALE, type: 'ordinal' }], {
					...defaultBarOptions,
					dualYAxis: true,
					type: 'dodged',
				});
				expect(scales.find(getPrimaryMetricScale)).toEqual({
					...baseMetricScale,
				});
			});

			test('should add secondary metric scale if dualYAxis is true and type is dodged', () => {
				const scales = addScales([{ name: COLOR_SCALE, type: 'ordinal' }], {
					...defaultBarOptions,
					dualYAxis: true,
					type: 'dodged',
				});
				expect(scales.find(getSecondaryMetricScale)).toEqual({
					...baseMetricScale,
					name: 'yLinearSecondary',
					domain: { data: 'yLinearSecondaryDomain', fields: [DEFAULT_METRIC] },
				});
			});

			test('should not add primary metric scale if dualYAxis is true and type is not dodged', () => {
				const scales = addScales([{ name: COLOR_SCALE, type: 'ordinal' }], {
					...defaultBarOptions,
					dualYAxis: true,
					type: 'stacked',
				});
				expect(scales.find(getPrimaryMetricScale)).toBeUndefined();
			});

			test('should not add secondary metric scale if dualYAxis is true and type is not dodged', () => {
				const scales = addScales([{ name: COLOR_SCALE, type: 'ordinal' }], {
					...defaultBarOptions,
					dualYAxis: true,
					type: 'stacked',
				});
				expect(scales.find(getSecondaryMetricScale)).toBeUndefined();
			});

			test('should not add primary metric scale if dualYAxis is false', () => {
				const scales = addScales([{ name: COLOR_SCALE, type: 'ordinal' }], {
					...defaultBarOptions,
					dualYAxis: false,
					type: 'dodged',
				});
				expect(scales.find(getPrimaryMetricScale)).toBeUndefined();
			});

			test('should not add secondary metric scale if dualYAxis is false', () => {
				const scales = addScales([{ name: COLOR_SCALE, type: 'ordinal' }], {
					...defaultBarOptions,
					dualYAxis: false,
					type: 'dodged',
				});
				expect(scales.find(getSecondaryMetricScale)).toBeUndefined();
			});
		});
	});

	describe('addSecondaryScales()', () => {
		test('no secondary facets, should do nothing', () => {
			const scales = [];
			addSecondaryScales(scales, defaultBarOptions);
			expect(scales).toStrictEqual([]);
		});
		test('secondary color facet, should add colors secondary scale', () => {
			const scales = [];
			addSecondaryScales(scales, { ...defaultBarOptions, color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] });
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
			addSecondaryScales(scales, { ...defaultBarOptions, lineType: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] });
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
			addSecondaryScales(scales, { ...defaultBarOptions, opacity: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] });
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
			test('default options, should add default stacked bar', () => {
				expect(addMarks([], defaultBarOptions)).toStrictEqual(defaultStackedBarMarks);
			});
			test('default options + type = "dodged", should add default dodged bar', () => {
				expect(addMarks([], { ...defaultBarOptions, type: 'dodged' })).toStrictEqual([defaultDodgedMark]);
			});
		});

		describe('with annotations', () => {
			test('default options', () => {
				const marks = addMarks([], {
					...defaultBarOptions,
					barAnnotations: [{ textKey: 'textLabel' }],
				});

				expect(marks).toHaveLength(3);
				expect(marks[0].name).toEqual('bar0_background');
				expect(marks[1].name).toEqual('bar0');
				expect(marks[2].name).toEqual('bar0_annotationGroup');
			});
		});

		test('stacked and dodged with annotations', () => {
			const addedMarks = addMarks([], {
				...defaultBarOptions,
				color: ['#000', '#fff'],
				type: 'dodged',
				barAnnotations: [{ textKey: 'textLabel' }],
			});

			expect(addedMarks).toHaveLength(1);
			expect(addedMarks[0].name).toEqual('bar0_group');
			expect((addedMarks[0] as GroupMark).marks).toHaveLength(3);
		});

		test('should add dimension selection ring if a popover is highlighting by dimension', () => {
			const marks = addMarks([], {
				...defaultBarOptions,
				chartPopovers: [{ UNSAFE_highlightBy: 'dimension' }],
			});
			expect(marks).toHaveLength(3);

			const selectionRingMark = marks[2] as RectMark;
			expect(selectionRingMark.type).toEqual('rect');
			expect(selectionRingMark.name).toEqual('bar0_selectionRing');
		});

		test('should add trellis group mark if trellis prop is set', () => {
			const marks = addMarks([], { ...defaultBarOptions, trellis: 'trellis' });
			expect(marks).toHaveLength(1);
			const trellisMark = marks[0] as GroupMark;
			expect(trellisMark.type).toEqual('group');
			expect(trellisMark.name).toEqual('xTrellisGroup');
		});
	});

	describe('addData()', () => {
		describe('existing data "table"', () => {
			test('"dimensionDataType = time" transform should be added to the data table', () => {
				expect(
					addData(defaultData, {
						...defaultBarOptions,
						dimensionDataType: 'time',
						metric: 'views',
						dimension: 'browser',
					})
				).toStrictEqual([
					{
						...defaultTableData,
						transform: [
							...(defaultTableData.transform ? defaultTableData.transform : []),
							...timeTransform,
						],
					},
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

			test('new transform should be added to the data table', () => {
				expect(
					addData(defaultData, { ...defaultBarOptions, metric: 'views', dimension: 'browser' })
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

			test('no options, transform should use default values', () => {
				expect(addData(defaultData, defaultBarOptions)).toStrictEqual([
					defaultTableData,
					{
						...defaultFilteredTableData,
						transform: defaultStackedTransforms,
					},
					defaultStacksData,
				]);
			});

			test('order supplied, transform should include sort by order', () => {
				expect(addData(defaultData, { ...defaultBarOptions, order: 'order' })).toStrictEqual([
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
			test('no options, new transform should be pushed onto the end with default values', () => {
				expect(
					addData(
						[defaultTableData, { ...defaultFilteredTableData, transform: defaultStackedTransforms }],
						defaultBarOptions
					)
				).toStrictEqual([
					defaultTableData,
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
				expect(addData(baseData, { ...defaultBarOptions, chartPopovers: [{}] })[1]).toHaveProperty(
					'transform',
					[...defaultStackedTransforms, ...defaultSelectedGroupIdTransform]
				);
			});
		});

		test('dodged stacked', () => {
			expect(
				addData(defaultData, {
					...defaultBarOptions,
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
				addData(defaultData, { ...defaultBarOptions, color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] })
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

		describe('dualYAxis', () => {
			function getDualYAxisPrimaryDomain(data) {
				return data.find((d) => d.name === 'yLinearPrimaryDomain');
			}
			function getDualYAxisSecondaryDomain(data) {
				return data.find((d) => d.name === 'yLinearSecondaryDomain');
			}

			test('should add primary domain data if dualYAxis is true and type is dodged', () => {
				const data = addData(defaultData, { ...defaultBarOptions, dualYAxis: true, type: 'dodged' });
				expect(getDualYAxisPrimaryDomain(data)).toStrictEqual({
					name: 'yLinearPrimaryDomain',
					source: FILTERED_TABLE,
					transform: [{ type: 'filter', expr: 'datum.rscSeriesId !== lastRscSeriesId' }],
				});
			});

			test('should add secondary domain data if dualYAxis is true and type is dodged', () => {
				const data = addData(defaultData, { ...defaultBarOptions, dualYAxis: true, type: 'dodged' });
				expect(getDualYAxisSecondaryDomain(data)).toStrictEqual({
					name: 'yLinearSecondaryDomain',
					source: FILTERED_TABLE,
					transform: [{ type: 'filter', expr: 'datum.rscSeriesId === lastRscSeriesId' }],
				});
			});

			test('should not add primary domain data if dualYAxis is true and type is not dodged', () => {
				const data = addData(defaultData, { ...defaultBarOptions, dualYAxis: true, type: 'stacked' });
				expect(getDualYAxisPrimaryDomain(data)).toBeUndefined();
			});

			test('should not add secondary domain data if dualYAxis is true and type is not dodged', () => {
				const data = addData(defaultData, { ...defaultBarOptions, dualYAxis: true, type: 'stacked' });
				expect(getDualYAxisSecondaryDomain(data)).toBeUndefined();
			});

			test('should not add primary domain data if dualYAxis is false', () => {
				const data = addData(defaultData, { ...defaultBarOptions, dualYAxis: false, type: 'dodged' });
				expect(getDualYAxisPrimaryDomain(data)).toBeUndefined();
			});

			test('should not add secondary domain data if dualYAxis is false', () => {
				const data = addData(defaultData, { ...defaultBarOptions, dualYAxis: false, type: 'dodged' });
				expect(getDualYAxisSecondaryDomain(data)).toBeUndefined();
			});
		});
	});

	describe('getStackAggregateData()', () => {
		test('should return default stack aggregate data', () => {
			expect(getStackAggregateData(defaultBarOptions)).toStrictEqual({
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
			const { groupby } = getStackAggregateData({ ...defaultBarOptions, type: 'dodged' })
				.transform?.[0] as AggregateTransform;
			expect(groupby).toStrictEqual([DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_COLOR]);
		});
	});

	describe('getStackIdTransform()', () => {
		test('should return default stack id transform', () => {
			expect(getStackIdTransform(defaultBarOptions)).toStrictEqual({
				as: STACK_ID,
				expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION}`,
				type: 'formula',
			});
		});

		test('should join all facets if dodged', () => {
			expect(getStackIdTransform({ ...defaultBarOptions, type: 'dodged' })).toStrictEqual({
				as: STACK_ID,
				expr: `datum.${DEFAULT_CATEGORICAL_DIMENSION} + "," + datum.${DEFAULT_COLOR}`,
				type: 'formula',
			});

			expect(
				getStackIdTransform({ ...defaultBarOptions, type: 'dodged', opacity: DEFAULT_SECONDARY_COLOR })
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
				getDodgeGroupTransform({ ...defaultBarOptions, type: 'dodged', opacity: DEFAULT_SECONDARY_COLOR })
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
				getRepeatedScale({ ...defaultBarOptions, orientation: 'horizontal', trellisOrientation: 'horizontal' })
			).toHaveProperty('type', 'linear');
			expect(
				getRepeatedScale({ ...defaultBarOptions, orientation: 'vertical', trellisOrientation: 'vertical' })
			).toHaveProperty('type', 'linear');
		});
		test('should return a band scale if the bar and trellis orientations are not the same', () => {
			expect(
				getRepeatedScale({ ...defaultBarOptions, orientation: 'horizontal', trellisOrientation: 'vertical' })
			).toHaveProperty('type', 'band');
			expect(
				getRepeatedScale({ ...defaultBarOptions, orientation: 'vertical', trellisOrientation: 'horizontal' })
			).toHaveProperty('type', 'band');
		});
	});
});
