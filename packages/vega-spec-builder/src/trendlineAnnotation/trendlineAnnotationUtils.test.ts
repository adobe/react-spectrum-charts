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
import {
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_TIME_DIMENSION,
	TRENDLINE_VALUE,
} from '@spectrum-charts/constants';
import { spectrumColors } from '@spectrum-charts/themes';

import { defaultTrendlineOptions } from '../trendline/trendlineTestUtils';
import { TrendlineAnnotationSpecOptions } from '../types';
import {
	getColorKey,
	getTextFill,
	getTrendlineAnnotationBadgeMark,
	getTrendlineAnnotationMarks,
	getTrendlineAnnotationPointX,
	getTrendlineAnnotationPointY,
	getTrendlineAnnotationSpecOptions,
	getTrendlineAnnotationTextMark,
	getTrendlineAnnotations,
} from './trendlineAnnotationUtils';

const defaultAnnotationOptions: TrendlineAnnotationSpecOptions = {
	badge: false,
	colorScheme: DEFAULT_COLOR_SCHEME,
	displayOnHover: false,
	dimensionValue: 'end',
	markName: 'line0',
	name: 'line0Trendline0Annotation0',
	numberFormat: '',
	prefix: '',
	trendlineColor: DEFAULT_COLOR,
	trendlineDimension: DEFAULT_TIME_DIMENSION,
	trendlineDimensionExtent: [null, null],
	trendlineDimensionScaleType: 'time',
	trendlineName: 'line0Trendline0',
	trendlineOrientation: 'horizontal',
	trendlineWidth: 2,
};

const colors = spectrumColors.light;

describe('applyTrendlineAnnotationDefaults()', () => {
	test('should apply all defaults', () => {
		const annotationOptions = getTrendlineAnnotationSpecOptions({}, 0, defaultTrendlineOptions, 'line0');
		expect(annotationOptions).toEqual(defaultAnnotationOptions);
	});
});

describe('getTrendlineAnnotations()', () => {
	test('should get all annotations from trendline children', () => {
		expect(
			getTrendlineAnnotations(
				{
					...defaultTrendlineOptions,
					chartTooltips: [{}],
					trendlineAnnotations: [{}],
				},
				'line0'
			)
		).toHaveLength(1);
	});
});

describe('getTrendlineAnnotationMarks()', () => {
	test('should return the marks for trendline annotations', () => {
		expect(getTrendlineAnnotationMarks(defaultTrendlineOptions, 'line0')).toHaveLength(0);
		const annotationGroups = getTrendlineAnnotationMarks(
			{ ...defaultTrendlineOptions, trendlineAnnotations: [{}] },
			'line0'
		);
		expect(annotationGroups).toHaveLength(1);
		expect(annotationGroups[0]).toHaveProperty('type', 'group');
		expect(annotationGroups[0]).toHaveProperty('name', 'line0Trendline0Annotation0_group');
	});
});

describe('getTrendlineAnnotationPointX()', () => {
	test('should return rule for TRENDLINE_VALUE if vertical', () => {
		const xRule = getTrendlineAnnotationPointX({ ...defaultAnnotationOptions, trendlineOrientation: 'vertical' });
		expect(xRule).toHaveProperty('scale', 'xTime');
		expect(xRule).toHaveProperty('field', TRENDLINE_VALUE);
	});
	test('should get end rule if dimensionValue is "end"', () => {
		const xRule = getTrendlineAnnotationPointX({ ...defaultAnnotationOptions, dimensionValue: 'end' });
		expect(xRule).toHaveProperty('field', `${DEFAULT_TIME_DIMENSION}Max`);
	});
	test('should get start rule if dimensionValue is "start"', () => {
		const xRule = getTrendlineAnnotationPointX({ ...defaultAnnotationOptions, dimensionValue: 'start' });
		expect(xRule).toHaveProperty('field', `${DEFAULT_TIME_DIMENSION}Min`);
	});
	test('should use dimensionValue as value if it is a number', () => {
		const xRule = getTrendlineAnnotationPointX({ ...defaultAnnotationOptions, dimensionValue: 1 });
		expect(xRule).toHaveProperty('value', 1);
	});
});

describe('getTrendlineAnnotationPointY()', () => {
	test('should return rule for TRENDLINE_VALUE if horizontal', () => {
		const xRule = getTrendlineAnnotationPointY({ ...defaultAnnotationOptions, trendlineOrientation: 'horizontal' });
		expect(xRule).toHaveProperty('field', TRENDLINE_VALUE);
	});
	test('should get end rule if dimensionValue is "end"', () => {
		const xRule = getTrendlineAnnotationPointY({
			...defaultAnnotationOptions,
			trendlineOrientation: 'vertical',
			dimensionValue: 'end',
		});
		expect(xRule).toHaveProperty('field', `${DEFAULT_TIME_DIMENSION}Max`);
	});
	test('should get start rule if dimensionValue is "start"', () => {
		const xRule = getTrendlineAnnotationPointY({
			...defaultAnnotationOptions,
			trendlineOrientation: 'vertical',
			dimensionValue: 'start',
		});
		expect(xRule).toHaveProperty('field', `${DEFAULT_TIME_DIMENSION}Min`);
	});
	test('should use dimensionValue as value if it is a number', () => {
		const xRule = getTrendlineAnnotationPointY({
			...defaultAnnotationOptions,
			trendlineOrientation: 'vertical',
			dimensionValue: 1,
		});
		expect(xRule).toHaveProperty('value', 1);
	});
});

describe('getTrendlineAnnotationTextMark()', () => {
	test('should return text mark', () => {
		const textMark = getTrendlineAnnotationTextMark(defaultAnnotationOptions);
		expect(textMark).toHaveProperty('type', 'text');
		expect(textMark).toHaveProperty('name', 'line0Trendline0Annotation0');
		expect(textMark.transform).toHaveLength(1);
		expect(textMark.transform?.[0]).toHaveProperty('type', 'label');
	});
	test('should add the prefix if it is a valid string', () => {
		const prefix = 'Median times';
		const textMark = getTrendlineAnnotationTextMark({ ...defaultAnnotationOptions, prefix });
		expect(textMark.encode?.enter?.text).toHaveProperty(
			'signal',
			`'${prefix} ' + format(datum.datum.${TRENDLINE_VALUE}, '')`
		);
	});
	test('should not add the prefix if it is not a valid string', () => {
		const textMark = getTrendlineAnnotationTextMark({ ...defaultAnnotationOptions, prefix: '' });
		expect(textMark.encode?.enter?.text).toHaveProperty('signal', `format(datum.datum.${TRENDLINE_VALUE}, '')`);
	});
});

describe('getTextFill()', () => {
	test('should return the correct fill for the text', () => {
		expect(getTextFill({ ...defaultAnnotationOptions, badge: true })).toEqual([
			{
				test: `contrast(scale('color', datum.datum.${DEFAULT_COLOR}), '${colors['gray-50']}') >= 4.5`,
				value: colors['gray-50'],
			},
			{ value: colors['gray-900'] },
		]);
	});
	test('should return undefined if badge is false', () => {
		expect(getTextFill(defaultAnnotationOptions)).toBeUndefined();
	});
});

describe('getTrendlineAnnotationBadgeMark()', () => {
	test('should return the badge mark', () => {
		const badgeMark = getTrendlineAnnotationBadgeMark({ ...defaultAnnotationOptions, badge: true });
		expect(badgeMark).toHaveLength(1);
		expect(badgeMark[0]).toHaveProperty('type', 'rect');
	});
	test('should return empty array if badge is false', () => {
		expect(getTrendlineAnnotationBadgeMark(defaultAnnotationOptions)).toHaveLength(0);
	});
});

describe('getColorKey()', () => {
	test('should return the correct color key', () => {
		expect(getColorKey(DEFAULT_COLOR)).toEqual(`datum.${DEFAULT_COLOR}`);
		expect(getColorKey(DEFAULT_COLOR, 2)).toEqual(`datum.datum.${DEFAULT_COLOR}`);
		expect(getColorKey({ value: 'red-500' })).toEqual({ value: 'red-500' });
	});
});
