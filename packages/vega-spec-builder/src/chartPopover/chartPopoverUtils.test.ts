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
import { Data } from 'vega';

import { defaultBarOptions } from '../bar/barTestUtils';
import { baseData } from '../specUtils';
import { BarSpecOptions, ChartPopoverOptions } from '../types';
import { addPopoverData, applyPopoverPropDefaults, getPopovers } from './chartPopoverUtils';

const getDefautltMarkOptions = (popoverOptions: ChartPopoverOptions = {}): BarSpecOptions => ({
  ...defaultBarOptions,
  chartPopovers: [popoverOptions],
});

describe('getPopovers()', () => {
  test('should get all the popovers from options', () => {
    const markOptions: BarSpecOptions = { ...defaultBarOptions, chartPopovers: [{}] };
    const popovers = getPopovers(markOptions.chartPopovers, markOptions.name);
    expect(popovers.length).toBe(1);
  });
});

describe('applyPopoverPropDefaults()', () => {
  test('should apply all defaults to ChartPopoverOptions', () => {
    const chartPopoverOptions: ChartPopoverOptions = {};
    const markName = 'bar0';
    const popoverSpecOptions = applyPopoverPropDefaults(chartPopoverOptions, markName);
    expect(popoverSpecOptions).toHaveProperty('UNSAFE_highlightBy', 'item');
    expect(popoverSpecOptions).toHaveProperty('markName', markName);
  });
});

describe('addPopoverData()', () => {
  let data: Data[];
  beforeEach(() => {
    data = JSON.parse(JSON.stringify(baseData));
  });
  test('should add the group id transform if highlightBy is `item`', () => {
    const markOptions = getDefautltMarkOptions({ UNSAFE_highlightBy: 'item' });
    addPopoverData(data, markOptions);
    expect(data[1].transform?.length).toBe(1);
    expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_selectedGroupId');
  });
  test('should add the group id transform if highlightBy is `dimension`', () => {
    const markOptions = getDefautltMarkOptions({ UNSAFE_highlightBy: 'dimension' });
    addPopoverData(data, markOptions);
    expect(data[1].transform?.length).toBe(1);
    expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_selectedGroupId');
  });
  test('should add the group id transform if highlightBy is `series`', () => {
    const markOptions = getDefautltMarkOptions({ UNSAFE_highlightBy: 'series' });
    addPopoverData(data, markOptions);
    expect(data[1].transform?.length).toBe(1);
    expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_selectedGroupId');
  });
  test('should add the group id transform if highlightBy is a key array', () => {
    const markOptions = getDefautltMarkOptions({ UNSAFE_highlightBy: ['operatingSystem'] });
    addPopoverData(data, markOptions);
    expect(data[1].transform?.length).toBe(1);
    expect(data[1].transform?.[0]).toHaveProperty('as', 'bar0_selectedGroupId');
  });
  test('should not add highlightedData for the mark if false', () => {
    const dataLength = data.length;
    const markOptions = getDefautltMarkOptions({ UNSAFE_highlightBy: 'series' });
    addPopoverData(data, markOptions, false);
    // length sholdn't be changed
    expect(data).toHaveLength(dataLength);
  });
});
