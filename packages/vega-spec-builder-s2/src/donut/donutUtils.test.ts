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
import { FILTERED_TABLE } from '@spectrum-charts/constants';
import { spectrum2Colors } from '@spectrum-charts/themes';

import { defaultDonutOptions } from './donutTestUtils';
import { getArcMark, getDonutEmptyStateTest, getEmptyStateArcMark, getSumData } from './donutUtils';

describe('getDonutEmptyStateTest()', () => {
  test('should test for empty data and a metric sum of 0', () => {
    const test = getDonutEmptyStateTest('testName');
    expect(test).toBe(`length(data('${FILTERED_TABLE}')) === 0 || !data('testName_sumData')[0]['sum']`);
  });
});

describe('getSumData()', () => {
  test('should aggregate the sum of the metric from the filtered table', () => {
    const sumData = getSumData(defaultDonutOptions);
    expect(sumData).toHaveProperty('name', 'testName_sumData');
    expect(sumData).toHaveProperty('source', FILTERED_TABLE);
    expect(sumData.transform).toEqual([
      {
        type: 'aggregate',
        fields: ['testMetric'],
        ops: ['sum'],
        as: ['sum'],
      },
    ]);
  });
});

describe('getArcMark()', () => {
  test('should hide the arcs when the donut is in the empty state', () => {
    const arcMark = getArcMark(defaultDonutOptions);
    const opacity = arcMark.encode?.update?.opacity;
    expect(opacity).toHaveLength(2);
    expect(opacity?.[0]).toEqual({ test: getDonutEmptyStateTest('testName'), value: 0 });
  });
});

describe('getEmptyStateArcMark()', () => {
  test('should return a gray-200 ring', () => {
    const emptyStateMark = getEmptyStateArcMark(defaultDonutOptions);
    expect(emptyStateMark).toHaveProperty('name', 'testName_emptyState');
    expect(emptyStateMark).toHaveProperty('type', 'arc');
    expect(emptyStateMark).toHaveProperty('interactive', false);
    expect(emptyStateMark.encode?.enter?.fill).toEqual({ value: spectrum2Colors.light['gray-200'] });
    expect(emptyStateMark.encode?.enter?.startAngle).toEqual({ value: 0 });
    expect(emptyStateMark.encode?.enter?.endAngle).toEqual({ signal: '2 * PI' });
  });
  test('should only be visible when the donut is in the empty state', () => {
    const emptyStateMark = getEmptyStateArcMark(defaultDonutOptions);
    expect(emptyStateMark.encode?.update?.opacity).toEqual([
      { test: getDonutEmptyStateTest('testName'), value: 1 },
      { value: 0 },
    ]);
  });
});
