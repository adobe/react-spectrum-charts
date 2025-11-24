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
import { DonutSpecOptions, SegmentLabelSpecOptions } from '../types';
import { defaultDonutOptions } from './donutTestUtils';
import {
  getSegmentLabelMarks,
  getSegmentLabelTextMark,
  getSegmentLabelValueText,
  getSegmentLabelValueTextMark,
} from './segmentLabelUtils';

const defaultDonutOptionsWithSegmentLabel: DonutSpecOptions = {
  ...defaultDonutOptions,
  segmentLabels: [{}],
};

const defaultSegmentLabelOptions: SegmentLabelSpecOptions = {
  donutOptions: defaultDonutOptionsWithSegmentLabel,
  percent: false,
  value: false,
  valueFormat: 'standardNumber',
};

describe('getSegmentLabelMarks()', () => {
  test('should return empty array if isBoolean', () => {
    const marks = getSegmentLabelMarks({
      ...defaultDonutOptionsWithSegmentLabel,
      isBoolean: true,
    });
    expect(marks).toEqual([]);
  });
  test('should return emptry array if there is not SegmentLabel on the Donut', () => {
    const marks = getSegmentLabelMarks({
      ...defaultDonutOptions,
    });
    expect(marks).toEqual([]);
  });
  test('should return segment label marks', () => {
    const marks = getSegmentLabelMarks({
      ...defaultDonutOptionsWithSegmentLabel,
    });
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('group');
    expect(marks[0].marks).toHaveLength(1);
    expect(marks[0].marks?.[0].type).toEqual('text');
  });
});

describe('getSegmentLabelValueTextMark()', () => {
  test('should return empty array if value and percent are false', () => {
    expect(getSegmentLabelValueTextMark(defaultSegmentLabelOptions)).toEqual([]);
  });
  test('should return a text mark if value is true', () => {
    const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('text');
  });
  test('should return a text mark if percent is true', () => {
    const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, percent: true });
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('text');
  });
  test('should return two text marks if value and percent are true', () => {
    const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true, percent: true });
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('text');
  });
});

describe('getSegmentLabelValueText()', () => {
  test('should return undefined if value and percent are false', () => {
    expect(getSegmentLabelValueText(defaultSegmentLabelOptions)).toBeUndefined();
  });
  test('should return a simple percentSignal if percent is true and value is false', () => {
    expect(getSegmentLabelValueText({ ...defaultSegmentLabelOptions, percent: true })).toHaveProperty(
      'signal',
      `format(datum['testName_arcPercent'], '.0%')`
    );
  });
  test('should return an array of rules if value is true', () => {
    const rules = getSegmentLabelValueText({ ...defaultSegmentLabelOptions, value: true });
    expect(rules).toHaveLength(1);
    expect(rules?.[0]).toHaveProperty('signal', "format(datum['testMetric'], ',')");
  });
  test('should have percentSignal combined with value signal if value and percent are true', () => {
    const rules = getSegmentLabelValueText({ ...defaultSegmentLabelOptions, value: true, percent: true });
    expect(rules).toHaveLength(1);
    expect(rules?.[0].signal).toContain('_arcPercent');
    expect(rules?.[0].signal).toContain('testMetric');
  });
});

describe('getSegmentLabelTextMark()', () => {
  test('should define dy if value or percent are true', () => {
    const mark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(mark.encode?.enter).toHaveProperty('dy');
  });
  test('should not define dy if value and percent are false', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    expect(mark.encode?.enter?.dy).toBeUndefined();
  });
});

describe('s2 styles', () => {
  describe('getSegmentLabelTextMark()', () => {
    test('should not add bold fontWeight when s2 is true', () => {
      const mark = getSegmentLabelTextMark({
        ...defaultSegmentLabelOptions,
        donutOptions: { ...defaultDonutOptionsWithSegmentLabel, s2: true },
      });
      expect(mark.encode?.enter?.fontWeight).toBeUndefined();
    });

    test('should add bold fontWeight when s2 is false', () => {
      const mark = getSegmentLabelTextMark({
        ...defaultSegmentLabelOptions,
        donutOptions: { ...defaultDonutOptionsWithSegmentLabel, s2: false },
      });
      expect(mark.encode?.enter?.fontWeight).toEqual({ value: 'bold' });
    });

    test('should add gray-700 fill when s2 is true', () => {
      const mark = getSegmentLabelTextMark({
        ...defaultSegmentLabelOptions,
        donutOptions: { ...defaultDonutOptionsWithSegmentLabel, s2: true },
      });
      expect(mark.encode?.enter?.fill).toEqual({ value: '#505050' });
    });

    test('should not add fill when s2 is false', () => {
      const mark = getSegmentLabelTextMark({
        ...defaultSegmentLabelOptions,
        donutOptions: { ...defaultDonutOptionsWithSegmentLabel, s2: false },
      });
      expect(mark.encode?.enter?.fill).toBeUndefined();
    });
  });

  describe('getSegmentLabelValueTextMark()', () => {
    test('should add bold fontWeight and fontSize 16 when s2 is true', () => {
      const marks = getSegmentLabelValueTextMark({
        ...defaultSegmentLabelOptions,
        value: true,
        donutOptions: { ...defaultDonutOptionsWithSegmentLabel, s2: true },
      });
      expect(marks).toHaveLength(1);
      expect(marks[0].encode?.enter?.fontWeight).toEqual({ value: 'bold' });
      // Font size is controlled by getBaseSegmentLabelEnterEncode with baseFontSize=16 for s2
    });

    test('should add gray-700 fill when s2 is true', () => {
      const marks = getSegmentLabelValueTextMark({
        ...defaultSegmentLabelOptions,
        value: true,
        donutOptions: { ...defaultDonutOptionsWithSegmentLabel, s2: true },
      });
      expect(marks).toHaveLength(1);
      expect(marks[0].encode?.enter?.fill).toEqual({ value: '#505050' });
    });

    test('should not add fontWeight or fill when s2 is false', () => {
      const marks = getSegmentLabelValueTextMark({
        ...defaultSegmentLabelOptions,
        value: true,
        donutOptions: { ...defaultDonutOptionsWithSegmentLabel, s2: false },
      });
      expect(marks).toHaveLength(1);
      expect(marks[0].encode?.enter?.fontWeight).toBeUndefined();
      expect(marks[0].encode?.enter?.fill).toBeUndefined();
    });
  });
});
