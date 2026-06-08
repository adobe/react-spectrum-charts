/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Data, SourceData } from 'vega';

import {
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC,
	DEFAULT_TIME_DIMENSION,
	FILTERED_TABLE,
	MARK_ID,
	SERIES_ID,
} from '@spectrum-charts/constants';

import { LineDirectLabelOptions, LineDirectLabelSpecOptions, LineSpecOptions } from '../types';
import { getLineDirectLabelData, getLineDirectLabelMarks, getLineDirectLabelSpecOptions } from './lineDirectLabelUtils';

const asArray = (val: unknown): string[] => val as string[];
const asSourceData = (data: Data): SourceData => data as SourceData;
const getTransforms = (data: Data) => asSourceData(data).transform ?? [];

const defaultLineOptions: LineSpecOptions = {
	chartPopovers: [],
	chartInspects: [],
	color: DEFAULT_COLOR,
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_TIME_DIMENSION,
	forecasts: [],
	gradient: false,
	hasOnClick: false,
	hasOnContextMenu: false,
	idKey: MARK_ID,
	index: 0,
	interactiveMarkName: undefined,
	lineDirectLabels: [],
	linePointAnnotations: [],
	lineType: { value: 'solid' },
	markType: 'line',
	metric: DEFAULT_METRIC,
	metricRanges: [],
	name: 'line0',
	opacity: { value: 1 },
	popoverMarkName: undefined,
	scaleType: 'time',
	trendlines: [],
	lineCap: 'round',
	interpolate: undefined,
};

const defaultLabelSpecOptions: LineDirectLabelSpecOptions = {
	color: DEFAULT_COLOR,
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_TIME_DIMENSION,
	excludeSeries: [],
	format: '',
	index: 0,
	lineName: 'line0',
	metric: DEFAULT_METRIC,
	position: 'end',
	prefix: '',
	scaleType: 'time',
	value: 'last',
};

describe('getLineDirectLabelSpecOptions', () => {
	test('applies defaults when no options provided', () => {
		const result = getLineDirectLabelSpecOptions({}, 0, defaultLineOptions);
		expect(result).toEqual(defaultLabelSpecOptions);
	});

	test('preserves user-provided values', () => {
		const labelOptions: LineDirectLabelOptions = {
			value: 'average',
			format: ',.0f',
			prefix: '$',
			excludeSeries: ['seriesA'],
		};
		const result = getLineDirectLabelSpecOptions(labelOptions, 2, defaultLineOptions);
		expect(result).toEqual({
			...defaultLabelSpecOptions,
			value: 'average',
			format: ',.0f',
			prefix: '$',
			excludeSeries: ['seriesA'],
			index: 2,
		});
	});

	test('inherits color, dimension, metric, scaleType from line options', () => {
		const lineOptions: LineSpecOptions = {
			...defaultLineOptions,
			color: 'category',
			dimension: 'date',
			metric: 'revenue',
			scaleType: 'linear',
			name: 'myLine',
		};
		const result = getLineDirectLabelSpecOptions({}, 0, lineOptions);
		expect(result.color).toBe('category');
		expect(result.dimension).toBe('date');
		expect(result.metric).toBe('revenue');
		expect(result.scaleType).toBe('linear');
		expect(result.lineName).toBe('myLine');
	});

	test('defaults position to end', () => {
		const result = getLineDirectLabelSpecOptions({}, 0, defaultLineOptions);
		expect(result.position).toBe('end');
	});

	test('preserves position=start', () => {
		const result = getLineDirectLabelSpecOptions({ position: 'start' }, 0, defaultLineOptions);
		expect(result.position).toBe('start');
	});
});

describe('getLineDirectLabelData', () => {
	test('creates data source from FILTERED_TABLE', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		expect(data.name).toBe('line0DirectLabel0_data');
		expect(asSourceData(data).source).toBe(FILTERED_TABLE);
	});

	test('filters to max dimension for value=last', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const joinagg = transforms.find(
			(t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('_extremeDim')
		);
		expect(joinagg).toBeDefined();
		expect(joinagg).toHaveProperty('ops', ['max']);
	});

	test('includes mean aggregate for value=average', () => {
		const opts = { ...defaultLabelSpecOptions, value: 'average' as const };
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const meanAgg = transforms.find(
			(t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('directLabel_avg')
		);
		expect(meanAgg).toBeDefined();
		expect(meanAgg).toHaveProperty('ops', ['mean']);
	});

	test('does not include mean aggregate for non-average values', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const meanAgg = transforms.find(
			(t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('directLabel_avg')
		);
		expect(meanAgg).toBeUndefined();
	});

	test('adds excludeSeries filter as inline literal', () => {
		const opts = { ...defaultLabelSpecOptions, excludeSeries: ['seriesA', 'seriesB'] };
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const excludeFilter = transforms.find(
			(t) => t.type === 'filter' && 'expr' in t && t.expr.includes('indexof')
		);
		expect(excludeFilter).toBeDefined();
		expect((excludeFilter as { expr: string }).expr).toBe(
			`indexof(["seriesA","seriesB"], datum.${SERIES_ID}) === -1`
		);
	});

	test('omits excludeSeries filter when empty', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const excludeFilter = transforms.find(
			(t) => t.type === 'filter' && 'expr' in t && t.expr.includes('indexof')
		);
		expect(excludeFilter).toBeUndefined();
	});

	test('includes rank window transform', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const rankWindow = transforms.find(
			(t) => t.type === 'window' && 'as' in t && asArray(t.as).includes('_metricRank')
		);
		expect(rankWindow).toBeDefined();
	});

	test('includes _scaledY formula transform', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === '_scaledY');
		expect(formula).toBeDefined();
		expect((formula as { expr: string }).expr).toContain(`scale('yLinear', datum["${DEFAULT_METRIC}"])`);
	});

	test('includes _adjustedY formula transform', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === '_adjustedY');
		expect(formula).toBeDefined();
		expect((formula as { expr: string }).expr).toBe('datum._scaledY - datum._metricRank * 12');
	});

	test('includes _cumMaxAdjusted cumulative window transform', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const window = transforms.find(
			(t) => t.type === 'window' && 'as' in t && asArray(t.as).includes('_cumMaxAdjusted')
		);
		expect(window).toBeDefined();
		expect(window).toHaveProperty('ops', ['max']);
		expect(window).toHaveProperty('fields', ['_adjustedY']);
	});

	test('uses line name and index in data name', () => {
		const opts = { ...defaultLabelSpecOptions, index: 3 };
		const data = getLineDirectLabelData('myLine', opts, defaultLineOptions);
		expect(data.name).toBe('myLineDirectLabel3_data');
	});

	test('generates formula with default number format for last', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
		expect(formula).toBeDefined();
		expect((formula as { expr: string }).expr).toBe(`format(datum["${DEFAULT_METRIC}"], ",.2~f")`);
	});

	test('generates formula for series value', () => {
		const opts: LineDirectLabelSpecOptions = { ...defaultLabelSpecOptions, value: 'series', color: 'category' };
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
		expect((formula as { expr: string }).expr).toBe('datum["category"]');
	});

	test('uses custom format when provided', () => {
		const opts = { ...defaultLabelSpecOptions, format: ',.0f' };
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
		expect((formula as { expr: string }).expr).toBe(`format(datum["${DEFAULT_METRIC}"], ",.0f")`);
	});

	test('generates formula for average value with default format', () => {
		const opts = { ...defaultLabelSpecOptions, value: 'average' as const };
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
		expect((formula as { expr: string }).expr).toBe('format(datum.directLabel_avg, ",.2~f")');
	});

	test('generates empty string for series value when color is not a string', () => {
		const opts: LineDirectLabelSpecOptions = {
			...defaultLabelSpecOptions,
			value: 'series',
			color: { value: 'blue' },
		};
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
		expect((formula as { expr: string }).expr).toBe("''");
	});

	test('escapes quotes in format string', () => {
		const opts = { ...defaultLabelSpecOptions, format: '$"0.0"' };
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
		expect((formula as { expr: string }).expr).toContain('\\"');
	});

	test('includes dimension filter expression', () => {
		const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
		const transforms = getTransforms(data);
		const filter = transforms.find(
			(t) => t.type === 'filter' && 'expr' in t && t.expr.includes('_extremeDim')
		);
		expect(filter).toBeDefined();
		expect((filter as { expr: string }).expr).toBe('datum["datetime0"] === datum._extremeDim');
	});

	test('filters to min dimension for position=start', () => {
		const opts = { ...defaultLabelSpecOptions, position: 'start' as const };
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const joinagg = transforms.find(
			(t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('_extremeDim')
		);
		expect(joinagg).toHaveProperty('ops', ['min']);
	});

	test('filters to max dimension for position=end', () => {
		const opts = { ...defaultLabelSpecOptions, position: 'end' as const };
		const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
		const transforms = getTransforms(data);
		const joinagg = transforms.find(
			(t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('_extremeDim')
		);
		expect(joinagg).toHaveProperty('ops', ['max']);
	});
});

describe('getLineDirectLabelMarks', () => {
	test('returns two marks (background halo + foreground)', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		expect(marks).toHaveLength(2);
		expect(marks[0].type).toBe('text');
		expect(marks[1].type).toBe('text');
	});

	test('background mark has stroke and transparent fill', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		const bgMark = marks[0];
		expect(bgMark.encode?.enter).toHaveProperty('strokeWidth', { value: 4 });
		expect(bgMark.encode?.enter).toHaveProperty('fill', { value: 'transparent' });
		expect(bgMark.encode?.enter).toHaveProperty('stroke');
	});

	test('foreground mark has color fill', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		const mainMark = marks[1];
		expect(mainMark.encode?.enter).toHaveProperty('fill');
		expect(mainMark.encode?.enter?.fill).not.toEqual({ value: 'transparent' });
	});

	test('marks are non-interactive', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		expect(marks[0].interactive).toBe(false);
		expect(marks[1].interactive).toBe(false);
	});

	test('marks have correct names using lineName and index', () => {
		const opts = { ...defaultLabelSpecOptions, index: 2 };
		const marks = getLineDirectLabelMarks('myLine', opts, defaultLineOptions, 'gray-50', 'light');
		expect(marks[0].name).toBe('myLineDirectLabel2_bg');
		expect(marks[1].name).toBe('myLineDirectLabel2');
	});

	test('x is anchored to chart width', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		expect(marks[0].encode?.enter?.x).toEqual({ signal: 'width' });
	});

	test('text is right-aligned', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		expect(marks[0].encode?.enter?.align).toEqual({ value: 'right' });
	});

	describe('y offset signal evaluation', () => {
		const evalOffsetSignal = (datum: Record<string, number>): number => {
			const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
			const signal = (marks[0].encode?.enter?.y as { offset: { signal: string } }).offset.signal;
			return new Function('datum', `return ${signal}`)(datum);
		};

		test('rank 1 always places label 12px above the line terminus', () => {
			// cumMaxAdjusted = _scaledY - 1*12 for rank 1
			// offset = (100 - 12) + 1*12 - 12 - 100 = -12
			expect(evalOffsetSignal({ _metricRank: 1, _scaledY: 100, _cumMaxAdjusted: 88 })).toBe(-12);
		});

		test('rank 2 well-separated from rank 1: also placed 12px above', () => {
			// rank2 adjustedY (200 - 24 = 176) > rank1 adjustedY, so cumMaxAdjusted = 176
			// offset = 176 + 2*12 - 12 - 200 = -12
			expect(evalOffsetSignal({ _metricRank: 2, _scaledY: 200, _cumMaxAdjusted: 176 })).toBe(-12);
		});

		test('rank 2 close to rank 1: pushed above natural position to avoid overlap', () => {
			// rank1 adjustedY (100 - 12 = 88) > rank2 adjustedY (108 - 24 = 84), so cumMaxAdjusted = 88
			// offset = 88 + 2*12 - 12 - 108 = -8 (less negative than -12, meaning pushed further up)
			expect(evalOffsetSignal({ _metricRank: 2, _scaledY: 108, _cumMaxAdjusted: 88 })).toBe(-8);
		});

		test('rank 3 very close to preceding labels: stacked exactly MIN_LABEL_GAP below rank 2', () => {
			// rank1 adjustedY (100 - 12 = 88) dominates cumMaxAdjusted for all three
			// offset = 88 + 3*12 - 12 - 112 = 0 (at line terminus, pushed down from natural -12)
			expect(evalOffsetSignal({ _metricRank: 3, _scaledY: 112, _cumMaxAdjusted: 88 })).toBe(0);
		});

		test('y field is the metric', () => {
			const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
			const y = marks[0].encode?.enter?.y as { field: string };
			expect(y.field).toBe(DEFAULT_METRIC);
		});
	});

	test('uses metricAxis for y scale when provided', () => {
		const lineOpts = { ...defaultLineOptions, metricAxis: 'yCustom' };
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, lineOpts, 'gray-50', 'light');
		const y = marks[0].encode?.enter?.y as { scale: string };
		expect(y.scale).toBe('yCustom');
	});

	test('defaults to yLinear when no metricAxis', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		const y = marks[0].encode?.enter?.y as { scale: string };
		expect(y.scale).toBe('yLinear');
	});

	test('both marks have opacity in update encoding', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		expect(marks[0].encode?.update).toHaveProperty('opacity');
		expect(marks[1].encode?.update).toHaveProperty('opacity');
	});

	test('both marks have fontWeight 700 in update encoding', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		expect(marks[0].encode?.update).toHaveProperty('fontWeight', { value: 700 });
		expect(marks[1].encode?.update).toHaveProperty('fontWeight', { value: 700 });
	});

	test('adds prefix to text expression', () => {
		const opts = { ...defaultLabelSpecOptions, prefix: '$' };
		const marks = getLineDirectLabelMarks('line0', opts, defaultLineOptions, 'gray-50', 'light');
		const textSignal = (marks[1].encode?.enter?.text as { signal: string }).signal;
		expect(textSignal).toContain("'$ '");
	});

	test('resolves transparent background to spectrum background (gray-25)', () => {
		const lightMarks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'transparent', 'light');
		const lightStroke = lightMarks[0].encode?.enter?.stroke as { value: string };
		expect(lightStroke.value).toBe('white'); // gray-25 in light
		const darkMarks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'transparent', 'dark');
		const darkStroke = darkMarks[0].encode?.enter?.stroke as { value: string };
		expect(darkStroke.value).toBe('#111111'); // gray-25 in dark
	});

	test('resolves undefined background to spectrum background', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, undefined, 'light');
		const bgStroke = marks[0].encode?.enter?.stroke as { value: string };
		expect(bgStroke.value).toBe('white');
	});

	test('uses provided backgroundColor when not transparent or undefined', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'blue-100', 'light');
		const bgStroke = marks[0].encode?.enter?.stroke as { value: string };
		expect(bgStroke.value).toBeTruthy();
	});

	test('resolves background color with dark color scheme', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'dark');
		const bgStroke = marks[0].encode?.enter?.stroke as { value: string };
		expect(bgStroke.value).toBeTruthy();
	});

	test('text expression has no prefix when prefix is empty', () => {
		const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
		const textSignal = (marks[0].encode?.enter?.text as { signal: string }).signal;
		expect(textSignal).toBe('datum.directLabel_text');
	});

	test('escapes single quotes in prefix', () => {
		const opts = { ...defaultLabelSpecOptions, prefix: "it's" };
		const marks = getLineDirectLabelMarks('line0', opts, defaultLineOptions, 'gray-50', 'light');
		const textSignal = (marks[0].encode?.enter?.text as { signal: string }).signal;
		expect(textSignal).toContain(String.raw`it\'s`);
	});

	test('marks reference correct data source', () => {
		const opts = { ...defaultLabelSpecOptions, index: 1 };
		const marks = getLineDirectLabelMarks('line0', opts, defaultLineOptions, 'gray-50', 'light');
		expect(marks[0].from).toEqual({ data: 'line0DirectLabel1_data' });
		expect(marks[1].from).toEqual({ data: 'line0DirectLabel1_data' });
	});

	test('both marks have matching encoding for position=start', () => {
		const startOpts = { ...defaultLabelSpecOptions, position: 'start' as const };
		const marks = getLineDirectLabelMarks('line0', startOpts, defaultLineOptions, 'gray-50', 'light');
		expect(marks[0].encode?.enter?.x).toEqual({ value: 0 });
		expect(marks[1].encode?.enter?.x).toEqual({ value: 0 });
		expect(marks[0].encode?.enter?.align).toEqual({ value: 'left' });
		expect(marks[1].encode?.enter?.align).toEqual({ value: 'left' });
	});

	describe('position=start', () => {
		const startOpts = { ...defaultLabelSpecOptions, position: 'start' as const };

		test('x is anchored to 0', () => {
			const marks = getLineDirectLabelMarks('line0', startOpts, defaultLineOptions, 'gray-50', 'light');
			expect(marks[0].encode?.enter?.x).toEqual({ value: 0 });
		});

		test('text is left-aligned', () => {
			const marks = getLineDirectLabelMarks('line0', startOpts, defaultLineOptions, 'gray-50', 'light');
			expect(marks[0].encode?.enter?.align).toEqual({ value: 'left' });
		});

		test('limit is space from left edge to data point', () => {
			const marks = getLineDirectLabelMarks('line0', startOpts, defaultLineOptions, 'gray-50', 'light');
			const limit = marks[0].encode?.enter?.limit as { signal: string };
			expect(limit.signal).toContain("scale('xTime'");
			expect(limit.signal).not.toContain('width -');
		});
	});

	describe('position=end', () => {
		test('x is anchored to chart width', () => {
			const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
			expect(marks[0].encode?.enter?.x).toEqual({ signal: 'width' });
		});

		test('text is right-aligned', () => {
			const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
			expect(marks[0].encode?.enter?.align).toEqual({ value: 'right' });
		});

		test('limit is space from data point to right edge', () => {
			const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
			const limit = marks[0].encode?.enter?.limit as { signal: string };
			expect(limit.signal).toContain('width -');
		});
	});
});
