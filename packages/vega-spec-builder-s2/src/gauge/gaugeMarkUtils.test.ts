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
import { ArcMark } from 'vega';

import { getS2ColorValue } from '@spectrum-charts/themes';

import { getGaugeMarks } from './gaugeMarkUtils';
import { defaultGaugeOptions } from './gaugeTestUtils';

describe('getGaugeMarks', () => {
  test('should not mark any gauge mark as interactive', () => {
    const marks = getGaugeMarks(defaultGaugeOptions);
    for (const mark of marks) {
      expect(mark).toHaveProperty('interactive', false);
    }
  });

  test('should render the track with a fixed neutral color, not the color prop', () => {
    const marks = getGaugeMarks({ ...defaultGaugeOptions, color: 'categorical-200' });
    const track = marks.find((m) => m.name === 'testName_track') as ArcMark;
    expect(track.encode?.enter?.fill).toHaveProperty('value', getS2ColorValue('gray-200', 'light'));
  });

  test('should render needle marks and no fill mark when showNeedle is true', () => {
    const marks = getGaugeMarks({ ...defaultGaugeOptions, showNeedle: true });
    expect(marks.find((m) => m.name === 'testName_needle')).toBeDefined();
    expect(marks.find((m) => m.name === 'testName_pivot')).toBeDefined();
    expect(marks.find((m) => m.name === 'testName_fill')).toBeUndefined();
  });

  test('should render a fill mark and no needle marks when showNeedle is false', () => {
    const marks = getGaugeMarks({ ...defaultGaugeOptions, showNeedle: false });
    expect(marks.find((m) => m.name === 'testName_fill')).toBeDefined();
    expect(marks.find((m) => m.name === 'testName_needle')).toBeUndefined();
    expect(marks.find((m) => m.name === 'testName_pivot')).toBeUndefined();
  });

  test('should always render the label mark, even without a value', () => {
    const marks = getGaugeMarks(defaultGaugeOptions);
    const label = marks.find((m) => m.name === 'testName_label');
    expect(label).toHaveProperty('encode.enter.text', { value: 'Test label' });
  });

  test('should keep resize-reactive geometry in update, not enter, on every mark', () => {
    // VegaChart's resizeView live-updates width/height signals on an existing view without
    // recreating mark items, and Vega only re-evaluates `update` (not `enter`) for existing
    // items - putting cx/cy/radius-derived positions in `enter` would freeze them at their
    // initial value and never re-center on a live container resize.
    const marks = getGaugeMarks(defaultGaugeOptions);
    const track = marks.find((m) => m.name === 'testName_track') as ArcMark;
    expect(track.encode?.enter).not.toHaveProperty('x');
    expect(track.encode?.update).toHaveProperty('x', { signal: 'testName_cx' });
    expect(track.encode?.update).toHaveProperty('outerRadius', { signal: 'testName_radius' });

    const pivot = marks.find((m) => m.name === 'testName_pivot');
    expect(pivot?.encode?.enter).not.toHaveProperty('x');
    expect(pivot?.encode?.update).toHaveProperty('x', { signal: 'testName_cx' });

    const value = marks.find((m) => m.name === 'testName_value');
    expect(value?.encode?.enter).not.toHaveProperty('y');
    expect(value?.encode?.update).toHaveProperty('x', { signal: 'testName_cx' });

    const label = marks.find((m) => m.name === 'testName_label');
    expect(label?.encode?.enter).not.toHaveProperty('y');
    expect(label?.encode?.update).toHaveProperty('x', { signal: 'testName_cx' });
  });

  test('should derive value/label text size and truncation from the rendered radius, not a size prop', () => {
    const marks = getGaugeMarks(defaultGaugeOptions);
    const value = marks.find((m) => m.name === 'testName_value');
    expect(value?.encode?.enter).not.toHaveProperty('fontSize');
    expect(value?.encode?.update).toHaveProperty('fontSize', [
      { test: 'testName_innerRadius < 20', value: 0 },
      { signal: 'testName_valueFontSize' },
    ]);
    expect(value?.encode?.update?.limit).toHaveProperty(
      'signal',
      '2 * sqrt(max(0, pow(testName_innerRadius, 2) - pow(testName_radius * 0.4, 2)))'
    );

    const label = marks.find((m) => m.name === 'testName_label');
    expect(label?.encode?.update).toHaveProperty('fontSize', [
      { test: 'testName_innerRadius < 20', value: 0 },
      { signal: 'testName_metricFontSize' },
    ]);
  });
});
