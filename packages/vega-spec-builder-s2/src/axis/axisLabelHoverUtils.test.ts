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
import { Signal } from 'vega';

import { DIMENSION_HOVER_AREA, FADE_FACTOR, HOVERED_ITEM } from '@spectrum-charts/constants';

import {
  addAxisLabelHoverSignalWiring,
  getAxisLabelDimensionFillOpacity,
  getAxisLabelHoverMarkName,
} from './axisLabelHoverUtils';

const getDimensionHoverAreaSignal = (barName: string): Signal => ({
  description: `Tracks the hovered item for ${barName}_${DIMENSION_HOVER_AREA}`,
  name: `${barName}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`,
  value: null,
  on: [
    { events: `@${barName}_${DIMENSION_HOVER_AREA}:mouseover`, update: 'datum' },
    { events: `@${barName}_${DIMENSION_HOVER_AREA}:mouseout`, update: 'null' },
  ],
});

describe('getAxisLabelHoverMarkName()', () => {
  test('returns a name derived from the axis name', () => {
    expect(getAxisLabelHoverMarkName('axis0')).toEqual('axis0_labelHover');
  });
});

describe('addAxisLabelHoverSignalWiring()', () => {
  test('appends mouseover/mouseout handlers to a matching bar signal', () => {
    const signals = [getDimensionHoverAreaSignal('bar0')];
    const result = addAxisLabelHoverSignalWiring(
      signals,
      [{ name: 'bar0', dimension: 'category' }],
      'category',
      'axis0_labelHover'
    );

    const signal = result.find((s) => s.name === 'bar0_dimensionHoverArea_hoveredItem');
    expect(signal?.on).toHaveLength(4);
    expect(signal?.on?.[2]).toStrictEqual({
      events: '@axis0_labelHover:mouseover',
      update: '{ category: datum.value }',
    });
    expect(signal?.on?.[3]).toStrictEqual({
      events: '@axis0_labelHover:mouseout',
      update: 'null',
    });
  });

  test('does not touch any signal when no barDimensionFields entry matches scaleField', () => {
    const signals = [getDimensionHoverAreaSignal('bar0')];
    const result = addAxisLabelHoverSignalWiring(
      signals,
      [{ name: 'bar0', dimension: 'category' }],
      'otherField',
      'axis0_labelHover'
    );

    expect(result[0].on).toHaveLength(2);
  });

  test('no-ops when scaleField is undefined', () => {
    const signals = [getDimensionHoverAreaSignal('bar0')];
    const result = addAxisLabelHoverSignalWiring(
      signals,
      [{ name: 'bar0', dimension: 'category' }],
      undefined,
      'axis0_labelHover'
    );

    expect(result[0].on).toHaveLength(2);
  });

  test('no-ops when the matching bar has no interactive signal (bar is not interactive)', () => {
    const signals: Signal[] = [];
    const result = addAxisLabelHoverSignalWiring(
      signals,
      [{ name: 'bar0', dimension: 'category' }],
      'category',
      'axis0_labelHover'
    );

    expect(result).toHaveLength(0);
  });

  test('wires multiple matching bars sharing the same dimension (e.g. a combo chart)', () => {
    const signals = [getDimensionHoverAreaSignal('bar0'), getDimensionHoverAreaSignal('bar1')];
    const result = addAxisLabelHoverSignalWiring(
      signals,
      [
        { name: 'bar0', dimension: 'category' },
        { name: 'bar1', dimension: 'category' },
      ],
      'category',
      'axis0_labelHover'
    );

    expect(result.find((s) => s.name === 'bar0_dimensionHoverArea_hoveredItem')?.on).toHaveLength(4);
    expect(result.find((s) => s.name === 'bar1_dimensionHoverArea_hoveredItem')?.on).toHaveLength(4);
  });

  test('does not duplicate handlers when called twice', () => {
    let signals = [getDimensionHoverAreaSignal('bar0')];
    signals = addAxisLabelHoverSignalWiring(signals, [{ name: 'bar0', dimension: 'category' }], 'category', 'axis0_labelHover');
    signals = addAxisLabelHoverSignalWiring(signals, [{ name: 'bar0', dimension: 'category' }], 'category', 'axis0_labelHover');

    expect(signals[0].on).toHaveLength(4);
  });
});

describe('getAxisLabelDimensionFillOpacity()', () => {
  test('returns a fade rule keyed on the matching bar dimension-hover-area signal, plus a default', () => {
    const rules = getAxisLabelDimensionFillOpacity([{ name: 'bar0', dimension: 'category' }], 'category');

    expect(rules).toHaveLength(2);
    expect(rules[0]).toStrictEqual({
      test: 'isValid(bar0_dimensionHoverArea_hoveredItem)',
      signal: `bar0_dimensionHoverArea_hoveredItem.category === datum.value ? 1 : ${FADE_FACTOR}`,
    });
    expect(rules[1]).toStrictEqual({ value: 1 });
  });

  test('returns just the default rule when no barDimensionFields entry matches scaleField', () => {
    const rules = getAxisLabelDimensionFillOpacity([{ name: 'bar0', dimension: 'category' }], 'otherField');
    expect(rules).toStrictEqual([{ value: 1 }]);
  });

  test('returns just the default rule when scaleField is undefined', () => {
    const rules = getAxisLabelDimensionFillOpacity([{ name: 'bar0', dimension: 'category' }], undefined);
    expect(rules).toStrictEqual([{ value: 1 }]);
  });

  test('returns one rule per matching bar for multi-bar (e.g. combo) charts sharing a dimension', () => {
    const rules = getAxisLabelDimensionFillOpacity(
      [
        { name: 'bar0', dimension: 'category' },
        { name: 'bar1', dimension: 'category' },
      ],
      'category'
    );

    expect(rules).toHaveLength(3);
    expect(rules[0]).toHaveProperty('test', 'isValid(bar0_dimensionHoverArea_hoveredItem)');
    expect(rules[1]).toHaveProperty('test', 'isValid(bar1_dimensionHoverArea_hoveredItem)');
    expect(rules[2]).toStrictEqual({ value: 1 });
  });
});
