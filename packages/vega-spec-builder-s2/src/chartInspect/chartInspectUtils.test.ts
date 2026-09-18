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
import { Data, NumericValueRef, Signal } from 'vega';

import {
  CONTROLLED_HIGHLIGHTED_ITEM,
  DEFAULT_OPACITY_RULE,
  DIMENSION_HOVER_AREA,
  GROUP_ID,
  HIGHLIGHTED_GROUP,
  HOVERED_ITEM,
} from '@spectrum-charts/constants';

import { defaultBarOptions } from '../bar/barTestUtils';
import { defaultScatterOptions } from '../scatter/scatterTestUtils';
import { defaultSignals } from '../specTestUtils';
import { baseData } from '../specUtils';
import { BarSpecOptions, ChartInspectOptions, LineSpecOptions } from '../types';
import {
  addHoverdDimenstionAreaOpacityRules,
  addHoveredItemOpacityRules,
  addInspectData,
  addInspectSignals,
  applyInspectPropDefaults,
  getInspects,
  isHighlightedByGroup,
} from './chartInspectUtils';

const getDefaultMarkOptions = (inspectOptions: ChartInspectOptions = {}): BarSpecOptions => ({
  ...defaultBarOptions,
  chartInspects: [inspectOptions],
});

describe('getInspects()', () => {
  test('should get all the inspects from options', () => {
    const markOptions: BarSpecOptions = {
      ...defaultBarOptions,
      chartInspects: [{}],
      chartPopovers: [{}],
    };
    const inspects = getInspects(markOptions);
    expect(inspects.length).toBe(1);
  });
});

describe('applyInspectPropDefaults()', () => {
  test('should apply all defaults to ChartInspectOptions', () => {
    const chartInspectOptions: ChartInspectOptions = {};
    const markName = 'bar0';
    const inspectSpecOptions = applyInspectPropDefaults(chartInspectOptions, markName);
    expect(inspectSpecOptions).toHaveProperty('highlightBy', 'item');
    expect(inspectSpecOptions).toHaveProperty('markName', markName);
  });
});

describe('addInspectData()', () => {
  let data: Data[];
  beforeEach(() => {
    data = JSON.parse(JSON.stringify(baseData));
  });
  test('if highlightBy is `item` or undefined, no data should be added', () => {
    const markOptions = getDefaultMarkOptions();
    addInspectData(data, markOptions);
    expect(data).toEqual(baseData);
    addInspectData(data, getDefaultMarkOptions({ highlightBy: 'item' }));
    expect(data).toEqual(baseData);
  });
  test('should add the group id transform if highlightBy is `dimension`', () => {
    const markOptions = getDefaultMarkOptions({ highlightBy: 'dimension' });
    addInspectData(data, markOptions);
    expect(data[1].transform?.length).toBe(1);
    expect(data[1].transform?.[0]).toHaveProperty('as', `bar0_${GROUP_ID}`);
  });
  test('should add the group id transform if highlightBy is `series`', () => {
    const markOptions = getDefaultMarkOptions({ highlightBy: 'series' });
    addInspectData(data, markOptions);
    expect(data[1].transform?.length).toBe(1);
    expect(data[1].transform?.[0]).toHaveProperty('as', `bar0_${GROUP_ID}`);
  });
  test('should add the group id transform if highlightBy is a key array', () => {
    const markOptions = getDefaultMarkOptions({ highlightBy: ['operatingSystem'] });
    addInspectData(data, markOptions);
    expect(data[1].transform?.length).toBe(1);
    expect(data[1].transform?.[0]).toHaveProperty('as', `bar0_${GROUP_ID}`);
  });
  test('should not add highlightedData for the mark if false', () => {
    const dataLength = data.length;
    const markOptions = getDefaultMarkOptions({ highlightBy: 'series' });
    addInspectData(data, markOptions, false);
    // length shouldn't be changed
    expect(data).toHaveLength(dataLength);
  });
});

describe('isHighlightedByGroup()', () => {
  test('should return true if highlightBy is `dimension` or `series`', () => {
    expect(isHighlightedByGroup(getDefaultMarkOptions({ highlightBy: 'dimension' }))).toBe(true);
    expect(isHighlightedByGroup(getDefaultMarkOptions({ highlightBy: 'series' }))).toBe(true);
  });
  test('should return true if highlightBy is an array', () => {
    expect(isHighlightedByGroup(getDefaultMarkOptions({ highlightBy: ['operatingSystem'] }))).toBe(true);
  });
  test('should return false if highlightBy is `item` or undefined', () => {
    expect(isHighlightedByGroup(getDefaultMarkOptions({ highlightBy: 'item' }))).toBe(false);
    expect(isHighlightedByGroup(getDefaultMarkOptions())).toBe(false);
  });
});

describe('addInspectSignals()', () => {
  let signals: Signal[] = [];
  let highlightedGroupSignal: Signal;
  beforeEach(() => {
    signals = JSON.parse(JSON.stringify(defaultSignals));
    highlightedGroupSignal = signals.find((signal) => signal.name === HIGHLIGHTED_GROUP) as Signal;
  });

  test('if mark is not highlighted by group id, should not add any signals', () => {
    addInspectSignals(signals, getDefaultMarkOptions());
    expect(highlightedGroupSignal).not.toHaveProperty('on');
    addInspectSignals(signals, getDefaultMarkOptions({ highlightBy: 'item' }));
    expect(highlightedGroupSignal).not.toHaveProperty('on');
  });

  test('should add on events if highlightBy is `series`', () => {
    addInspectSignals(signals, getDefaultMarkOptions({ highlightBy: 'series' }));
    expect(highlightedGroupSignal).toHaveProperty('on');
    expect(highlightedGroupSignal.on).toHaveLength(2);
  });

  test('should add on events if highlightBy is `dimension`', () => {
    addInspectSignals(signals, getDefaultMarkOptions({ highlightBy: 'dimension' }));
    expect(highlightedGroupSignal).toHaveProperty('on');
    expect(highlightedGroupSignal.on).toHaveLength(2);
  });

  test('should add on events if highlightBy is a key array', () => {
    addInspectSignals(signals, getDefaultMarkOptions({ highlightBy: ['operatingSystem'] }));
    expect(highlightedGroupSignal).toHaveProperty('on');
    expect(highlightedGroupSignal.on).toHaveLength(2);
  });

  test('should include voronoi in the mark name if the markoptions are for scatter or line', () => {
    addInspectSignals(signals, {
      ...defaultScatterOptions,
      chartInspects: [{ highlightBy: 'series' }],
    });
    expect(highlightedGroupSignal.on?.[0].events.toString().includes('_voronoi')).toBeTruthy();
  });

  test('should add on events if highlightBy is `series` and interactionMode is `item`', () => {
    addInspectSignals(signals, {
      interactionMode: 'item',
      chartInspects: [{ highlightBy: 'series' }],
    } as unknown as LineSpecOptions);
    expect(highlightedGroupSignal.on).toHaveLength(8);
  });
});

describe('addHoveredItemOpacityRules()', () => {
  // getDefaultMarkOptions() always includes a `dimension`, so addHoverdDimenstionAreaOpacityRules
  // now unconditionally splices in one extra rule (regardless of chartInspect target) - see below.
  test('should add hovered item opacity rules', () => {
    const opacityRules = [];
    addHoveredItemOpacityRules(opacityRules, getDefaultMarkOptions());
    expect(opacityRules).toHaveLength(3);
  });
  test('should add hovered item opacity rule at the correct index', () => {
    let opacityRules: ({ test?: string } & NumericValueRef)[] = [DEFAULT_OPACITY_RULE];
    addHoveredItemOpacityRules(opacityRules, getDefaultMarkOptions());
    expect(opacityRules).toHaveLength(4);
    expect(opacityRules[0].test).toContain(HOVERED_ITEM);
    expect(opacityRules[1].test).toContain(`isArray(${CONTROLLED_HIGHLIGHTED_ITEM})`);
    expect(opacityRules[2]).toHaveProperty('test', `isValid(bar0_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM})`);
    expect(opacityRules[3]).toBe(DEFAULT_OPACITY_RULE);

    opacityRules = [DEFAULT_OPACITY_RULE, { test: `this is a test ${HOVERED_ITEM}` }];
    addHoveredItemOpacityRules(opacityRules, getDefaultMarkOptions());
    expect(opacityRules).toHaveLength(5);
    expect(opacityRules[0]).toBe(DEFAULT_OPACITY_RULE);
    expect(opacityRules[1]).toHaveProperty('test', `this is a test ${HOVERED_ITEM}`);
    expect(opacityRules[2].test).toContain(HOVERED_ITEM);
    expect(opacityRules[3].test).toContain(`isArray(${CONTROLLED_HIGHLIGHTED_ITEM})`);
    expect(opacityRules[4]).toHaveProperty('test', `isValid(bar0_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM})`);
  });
  test('should use group id if highlighted by group', () => {
    const opacityRules: ({ test?: string; signal?: string } & NumericValueRef)[] = [];
    addHoveredItemOpacityRules(opacityRules, getDefaultMarkOptions({ highlightBy: 'dimension' }));
    expect(opacityRules).toHaveLength(3);
    expect(opacityRules[0].signal).toContain(GROUP_ID);
  });
  test('should add combo sibling names if combo sibling names are provided', () => {
    const opacityRules: ({ test?: string; signal?: string } & NumericValueRef)[] = [DEFAULT_OPACITY_RULE];
    const options = getDefaultMarkOptions();
    options.comboSiblingNames = ['combo0Bar0', 'combo0Line0'];
    addHoveredItemOpacityRules(opacityRules, options);
    expect(opacityRules).toHaveLength(5);
    expect(opacityRules[2]).toHaveProperty('test', `isValid(bar0_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM})`);
    expect(opacityRules[3].test).toContain('combo0Bar0_');
    expect(opacityRules[3].test).toContain('combo0Line0_');
    expect(opacityRules[4]).toBe(DEFAULT_OPACITY_RULE);
  });
});

describe('addHoverdDimenstionAreaOpacityRules()', () => {
  test('should add hovered item opacity rules', () => {
    const opacityRules = [];
    addHoverdDimenstionAreaOpacityRules(opacityRules, getDefaultMarkOptions({ targets: ['dimensionArea'] }));
    expect(opacityRules).toHaveLength(1);
    expect(opacityRules[0]).toHaveProperty('test', `isValid(bar0_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM})`);
  });
  test('should add rules regardless of chartInspect target, as long as the mark has a dimension', () => {
    const opacityRules = [];
    addHoverdDimenstionAreaOpacityRules(opacityRules, getDefaultMarkOptions());
    expect(opacityRules).toHaveLength(1);
    expect(opacityRules[0]).toHaveProperty('test', `isValid(bar0_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM})`);
  });
  test('should not add rules if dimension is not provided', () => {
    const opacityRules = [];
    const { dimension: _dimension, ...markOptions } = getDefaultMarkOptions({ targets: ['dimensionArea'] });
    addHoverdDimenstionAreaOpacityRules(opacityRules, markOptions as BarSpecOptions);
    expect(opacityRules).toHaveLength(0);
  });
  test('should not add rules for non-bar mark types even if they have a dimension field', () => {
    const opacityRules = [];
    addHoverdDimenstionAreaOpacityRules(opacityRules, {
      ...getDefaultMarkOptions(),
      markType: 'scatter',
    } as unknown as BarSpecOptions);
    expect(opacityRules).toHaveLength(0);
  });
});
