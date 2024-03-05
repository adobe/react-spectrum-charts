/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { defaultTrendlineProps } from '@specBuilder/trendline/trendlineTestUtils';
import {
	applyTrendlineAnnotationDefaults,
	getTrendlineAnnotationMarks,
	getTrendlineAnnotationPointX,
	getTrendlineAnnotationPointY,
	getTrendlineAnnotationTextMark,
	getTrendlineAnnotations,
} from './trendlineAnnotationUtils';
import { TrendlineAnnotationSpecProps } from 'types';
import { DEFAULT_TIME_DIMENSION, TRENDLINE_VALUE } from '@constants';
import { createElement } from 'react';
import { TrendlineAnnotation } from '@components/TrendlineAnnotation';
import { ChartTooltip } from '@components/ChartTooltip';

const defaultAnnotationProps: TrendlineAnnotationSpecProps = {
	dimensionValue: 'end',
	markName: 'line0',
	name: 'line0Trendline0Annotation0',
	numberFormat: '',
	prefix: '',
	trendlineDimension: DEFAULT_TIME_DIMENSION,
	trendlineDimensionExtent: [null, null],
	trendlineDimensionScaleType: 'time',
	trendlineName: 'line0Trendline0',
	trendlineOrientation: 'horizontal',
	trendlineWidth: 2,
};

describe('applyTrendlineAnnotationDefaults()', () => {
	test('should apply all defaults', () => {
		const annotationProps = applyTrendlineAnnotationDefaults({}, 0, defaultTrendlineProps, 'line0');
		expect(annotationProps).toEqual(defaultAnnotationProps);
	});
});

describe('getTrendlineAnnotations()', () => {
	test('should get all annotations from trendline children', () => {
		expect(
			getTrendlineAnnotations(
				{
					...defaultTrendlineProps,
					children: [createElement(TrendlineAnnotation), createElement(ChartTooltip)],
				},
				'line0',
			),
		).toHaveLength(1);
	});
});

describe('getTrendlineAnnotationMarks()', () => {
	test('should return the marks for trendline annotations', () => {
		expect(getTrendlineAnnotationMarks(defaultTrendlineProps, 'line0')).toHaveLength(0);
		const annotationGroups = getTrendlineAnnotationMarks(
			{ ...defaultTrendlineProps, children: [createElement(TrendlineAnnotation)] },
			'line0',
		);
		expect(annotationGroups).toHaveLength(1);
		expect(annotationGroups[0]).toHaveProperty('type', 'group');
		expect(annotationGroups[0]).toHaveProperty('name', 'line0Trendline0Annotation0_group');
	});
});

describe('getTrendlineAnnotationPointX()', () => {
	test('should return rule for TRENDLINE_VALUE if vertical', () => {
		const xRule = getTrendlineAnnotationPointX({ ...defaultAnnotationProps, trendlineOrientation: 'vertical' });
		expect(xRule).toHaveProperty('scale', 'xTime');
		expect(xRule).toHaveProperty('field', TRENDLINE_VALUE);
	});
	test('should get end rule if dimensionValue is "end"', () => {
		const xRule = getTrendlineAnnotationPointX({ ...defaultAnnotationProps, dimensionValue: 'end' });
		expect(xRule).toHaveProperty('field', `${DEFAULT_TIME_DIMENSION}Max`);
	});
	test('should get start rule if dimensionValue is "start"', () => {
		const xRule = getTrendlineAnnotationPointX({ ...defaultAnnotationProps, dimensionValue: 'start' });
		expect(xRule).toHaveProperty('field', `${DEFAULT_TIME_DIMENSION}Min`);
	});
	test('should use dimensionValue as value if it is a number', () => {
		const xRule = getTrendlineAnnotationPointX({ ...defaultAnnotationProps, dimensionValue: 1 });
		expect(xRule).toHaveProperty('value', 1);
	});
});

describe('getTrendlineAnnotationPointY()', () => {
	test('should return rule for TRENDLINE_VALUE if horizontal', () => {
		const xRule = getTrendlineAnnotationPointY({ ...defaultAnnotationProps, trendlineOrientation: 'horizontal' });
		expect(xRule).toHaveProperty('field', TRENDLINE_VALUE);
	});
	test('should get end rule if dimensionValue is "end"', () => {
		const xRule = getTrendlineAnnotationPointY({
			...defaultAnnotationProps,
			trendlineOrientation: 'vertical',
			dimensionValue: 'end',
		});
		expect(xRule).toHaveProperty('field', `${DEFAULT_TIME_DIMENSION}Max`);
	});
	test('should get start rule if dimensionValue is "start"', () => {
		const xRule = getTrendlineAnnotationPointY({
			...defaultAnnotationProps,
			trendlineOrientation: 'vertical',
			dimensionValue: 'start',
		});
		expect(xRule).toHaveProperty('field', `${DEFAULT_TIME_DIMENSION}Min`);
	});
	test('should use dimensionValue as value if it is a number', () => {
		const xRule = getTrendlineAnnotationPointY({
			...defaultAnnotationProps,
			trendlineOrientation: 'vertical',
			dimensionValue: 1,
		});
		expect(xRule).toHaveProperty('value', 1);
	});
});

describe('getTrendlineAnnotationTextMark()', () => {
	test('should return text mark', () => {
		const textMark = getTrendlineAnnotationTextMark(defaultAnnotationProps);
		expect(textMark).toHaveProperty('type', 'text');
		expect(textMark).toHaveProperty('name', 'line0Trendline0Annotation0');
		expect(textMark.transform).toHaveLength(1);
		expect(textMark.transform?.[0]).toHaveProperty('type', 'label');
	});
	test('should add the prefix if it is a valid string', () => {
		const prefix = 'Median times';
		const textMark = getTrendlineAnnotationTextMark({ ...defaultAnnotationProps, prefix });
		expect(textMark.encode?.enter?.text).toHaveProperty(
			'signal',
			`'${prefix} ' + format(datum.datum.${TRENDLINE_VALUE}, '')`,
		);
	});
	test('should not add the prefix if it is not a valid string', () => {
		const textMark = getTrendlineAnnotationTextMark({ ...defaultAnnotationProps, prefix: '' });
		expect(textMark.encode?.enter?.text).toHaveProperty('signal', `format(datum.datum.${TRENDLINE_VALUE}, '')`);
	});
});