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
import {
  BACKGROUND_COLOR,
  CHART_SIZE_FONT_SIZE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_TIME_DIMENSION,
  DIRECT_LABEL_FONT_WEIGHT,
  SERIES_ID,
  TRENDLINE_VALUE,
} from '@spectrum-charts/core-s2/constants';
import { spectrum2Colors } from '@spectrum-charts/core-s2/tokens';

import { defaultTrendlineOptions } from '../trendline/trendlineTestUtils.js';
import { TrendlineAnnotationSpecOptions } from '../types/index.js';
import {
  getColorKey,
  getTextFill,
  getTrendlineAnnotationBadgeMark,
  getTrendlineAnnotationMarks,
  getTrendlineAnnotationPointX,
  getTrendlineAnnotationPointY,
  getTrendlineAnnotationSpecOptions,
  getTrendlineAnnotationTextMarks,
  getTrendlineAnnotations,
} from './trendlineAnnotationUtils.js';

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
  trendlineWidth: 1.5,
};

const colors = spectrum2Colors.light;

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
          chartInspects: [{}],
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

describe('getTrendlineAnnotationTextMarks()', () => {
  test('should return a halo mark with the label transform and a foreground text mark', () => {
    const [background, foreground] = getTrendlineAnnotationTextMarks(defaultAnnotationOptions);
    expect(background).toHaveProperty('name', 'line0Trendline0Annotation0_background');
    expect(background.transform?.[0]).toHaveProperty('type', 'label');
    expect(background.encode?.update).toHaveProperty('stroke', { signal: BACKGROUND_COLOR });
    expect(foreground).toHaveProperty('name', 'line0Trendline0Annotation0');
    expect(foreground).toHaveProperty('from', { data: 'line0Trendline0Annotation0_background' });
    expect(foreground.encode?.update).toHaveProperty('fontSize', { signal: CHART_SIZE_FONT_SIZE });
    expect(foreground.encode?.update).toHaveProperty('fontWeight', { value: DIRECT_LABEL_FONT_WEIGHT });
  });
  test('should add the prefix if it is a valid string', () => {
    const prefix = 'Median times';
    const [background] = getTrendlineAnnotationTextMarks({ ...defaultAnnotationOptions, prefix });
    expect(background.encode?.update?.text).toHaveProperty(
      'signal',
      `'${prefix} ' + format(datum.datum.${TRENDLINE_VALUE}, '')`
    );
  });
  test('should not add the prefix if it is not a valid string', () => {
    const [background] = getTrendlineAnnotationTextMarks({ ...defaultAnnotationOptions, prefix: '' });
    expect(background.encode?.update?.text).toHaveProperty('signal', `format(datum.datum.${TRENDLINE_VALUE}, '')`);
  });
  test('should fade with the series when the parent mark animates', () => {
    const seriesFadeData = 'line0_hoverSeriesFractionData';
    const [background, foreground] = getTrendlineAnnotationTextMarks({ ...defaultAnnotationOptions, seriesFadeData });
    const fade = (path: string) => ({
      signal: `hoverDeemphasisOpacity(data('${seriesFadeData}'), '${SERIES_ID}', ${path}.${SERIES_ID})`,
    });
    expect(background.encode?.update).toHaveProperty('fillOpacity', fade('datum.datum'));
    expect(foreground.encode?.update).toHaveProperty('fillOpacity', fade('datum.datum.datum'));
    const [badge] = getTrendlineAnnotationBadgeMark({ ...defaultAnnotationOptions, badge: true, seriesFadeData });
    expect(badge.encode?.update).toHaveProperty('fillOpacity', fade('datum.datum.datum.datum'));
  });
  test('should not fade without series fade data', () => {
    const [background] = getTrendlineAnnotationTextMarks(defaultAnnotationOptions);
    expect(background.encode?.update).not.toHaveProperty('fillOpacity');
  });
});

describe('getTextFill()', () => {
  test('should return the correct fill for the text', () => {
    expect(getTextFill({ ...defaultAnnotationOptions, badge: true })).toEqual([
      {
        test: `contrast(scale('color', datum.datum.datum.${DEFAULT_COLOR}), '${colors['gray-50']}') >= 4.5`,
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
