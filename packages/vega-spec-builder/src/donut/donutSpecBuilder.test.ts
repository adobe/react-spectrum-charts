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
import { COLOR_SCALE, FILTERED_TABLE, HIGHLIGHTED_ITEM } from '@spectrum-charts/constants';

import { defaultSignals } from '../specTestUtils';
import { initializeSpec } from '../specUtils';
import { addData, addDonut, addMarks, addScales, addSignals } from './donutSpecBuilder';
import { defaultDonutOptions } from './donutTestUtils';

describe('addData', () => {
  test('should add data correctly for boolean donut', () => {
    const data = addData(initializeSpec().data ?? [], { ...defaultDonutOptions, isBoolean: true });

    expect(data).toHaveLength(3);
    expect(data[2].transform).toHaveLength(2);
    expect(data[2].transform?.[0].type).toBe('window');
    expect(data[2].transform?.[1].type).toBe('filter');
  });

  test('should add data correctly for non-boolean donut', () => {
    const data = addData(initializeSpec().data ?? [], defaultDonutOptions);
    expect(data).toHaveLength(2);
    expect(data[1].transform).toHaveLength(4);
    expect(data[1].transform?.[0].type).toBe('pie');
    expect(data[1].transform?.[1]).toHaveProperty('as', 'testName_arcTheta');
    expect(data[1].transform?.[2]).toHaveProperty('as', 'testName_arcLength');
    expect(data[1].transform?.[3]).toHaveProperty('as', 'testName_arcPercent');
  });
});

describe('addSignals()', () => {
  test('should add hover events when tooltip is present', () => {
    const signals = addSignals(defaultSignals, { ...defaultDonutOptions, chartTooltips: [{}] });
    expect(signals).toHaveLength(defaultSignals.length + 1);
    expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
    expect(signals[0].on).toHaveLength(2);
    expect(signals[0].on?.[0]).toHaveProperty('events', '@testName:mouseover');
    expect(signals[0].on?.[1]).toHaveProperty('events', '@testName:mouseout');
  });
  test('should exclude data with key from update if tooltip has excludeDataKey', () => {
    const signals = addSignals(defaultSignals, {
      ...defaultDonutOptions,
      chartTooltips: [{ excludeDataKeys: ['excludeFromTooltip'] }],
    });
    expect(signals).toHaveLength(defaultSignals.length + 1);
    expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
    expect(signals[0].on).toHaveLength(2);
    expect(signals[0].on?.[0]).toHaveProperty('events', '@testName:mouseover');
    expect(signals[0].on?.[0]).toHaveProperty('update', '(datum.excludeFromTooltip) ? null : datum.rscMarkId');
    expect(signals[0].on?.[1]).toHaveProperty('events', '@testName:mouseout');
  });
});

describe('donutSpecBuilder', () => {
  test('should add scales correctly', () => {
    const scales = addScales([], defaultDonutOptions);
    expect(scales).toHaveLength(1);
    expect(scales[0]).toHaveProperty('name', COLOR_SCALE);
  });
});

describe('donutSpecBuilder', () => {
  test('should add donut correctly', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const options = { ...defaultDonutOptions, holeRatio: 0.85 };
    const result = addDonut(spec, options);
    const expectedSpec = {
      data: addData(spec.data, options),
      scales: addScales([], options),
      marks: addMarks([], options),
      signals: addSignals([], options),
      usermeta: {},
    };
    expect(result).toEqual(expectedSpec);
  });
});
