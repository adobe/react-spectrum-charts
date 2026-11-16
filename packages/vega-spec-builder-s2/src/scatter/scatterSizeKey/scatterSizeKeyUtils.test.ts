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
import { View, parse } from 'vega';

import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { buildSpec } from '../../chartSpecBuilder.js';
import { defaultScatterOptions } from '../scatterTestUtils.js';
import { getRoundedMidpointExpr, getScatterSizeKeyLegend, getScatterSizeKeyLegends } from './scatterSizeKeyUtils.js';

describe('getScatterSizeKeyLegend()', () => {
  test('shows the min, middle, and max of the size scale as circles', () => {
    const legend = getScatterSizeKeyLegend({ title: 'Revenue' }, 'light');
    expect(legend).toMatchObject({ size: 'symbolSize', orient: 'right', title: 'Revenue', symbolType: 'circle' });
    expect(legend.values).toHaveProperty(
      'signal',
      `domain('symbolSize')[0] === peek(domain('symbolSize')) ? [domain('symbolSize')[0]] : [domain('symbolSize')[0], ${getRoundedMidpointExpr(
        "domain('symbolSize')[0]",
        "peek(domain('symbolSize'))"
      )}, peek(domain('symbolSize'))]`
    );
    expect(legend.encode?.labels?.update?.text).toHaveProperty('signal', 'formatShortNumber(datum.value)');
  });

  test('stacks vertically on the left or right and runs horizontally on the top or bottom', () => {
    expect(getScatterSizeKeyLegend({}, 'light')).toHaveProperty('direction', 'vertical');
    expect(getScatterSizeKeyLegend({ position: 'left' }, 'light')).toHaveProperty('direction', 'vertical');
    expect(getScatterSizeKeyLegend({ position: 'bottom' }, 'light')).toHaveProperty('direction', 'horizontal');
    expect(getScatterSizeKeyLegend({ position: 'top' }, 'light')).toHaveProperty('direction', 'horizontal');
    expect(getScatterSizeKeyLegend({ direction: 'horizontal' }, 'light')).toHaveProperty('direction', 'horizontal');
  });

  test('leaves the title off when none is given', () => {
    expect(getScatterSizeKeyLegend({}, 'light')).not.toHaveProperty('title');
  });

  test('draws neutral gray circles with the scatter outline in each color scheme', () => {
    const symbols = getScatterSizeKeyLegend({}, 'dark').encode?.symbols?.update;
    expect(symbols?.fill).toHaveProperty('value', getS2ColorValue('gray-500', 'dark'));
    expect(symbols?.stroke).toHaveProperty('value', getS2ColorValue('gray-1000', 'dark'));
    expect(symbols?.strokeOpacity).toHaveProperty('value', 0.42);
  });
});

describe('getScatterSizeKeyLegends()', () => {
  test('adds one key per ScatterSizeKey when size is a data field', () => {
    expect(
      getScatterSizeKeyLegends({ ...defaultScatterOptions, size: 'weight', scatterSizeKeys: [{}, {}] })
    ).toHaveLength(2);
  });

  test('adds nothing when size is a static value', () => {
    expect(getScatterSizeKeyLegends({ ...defaultScatterOptions, scatterSizeKeys: [{}] })).toEqual([]);
  });
});

describe('size key in a chart', () => {
  const data = [{ x: 1, value: 2, series: 'a', weight: 3 }];

  test('replaces the Legend size scale and sits after the color legend', () => {
    const spec = buildSpec({
      data,
      legends: [{ title: 'Series' }],
      marks: [{ markType: 'scatter', color: 'series', size: 'weight', scatterSizeKeys: [{ title: 'Weight' }] }],
    });
    expect(spec.legends?.map((legend) => legend.title)).toEqual(['Series', 'Weight']);
  });

  test('shows no size legend without a ScatterSizeKey', () => {
    const spec = buildSpec({
      data,
      legends: [{ title: 'Series' }],
      marks: [{ markType: 'scatter', color: 'series', size: 'weight' }],
    });
    expect(spec.legends?.some((legend) => legend.size)).toBe(false);
  });
});

describe('getRoundedMidpointExpr()', () => {
  const evaluate = async (min: number, max: number) => {
    const view = new View(parse({ signals: [{ name: 'mid', update: getRoundedMidpointExpr(`${min}`, `${max}`) }] }), {
      renderer: 'none',
    });
    await view.runAsync();
    const mid = view.signal('mid');
    view.finalize();
    return mid;
  };

  test.each([
    [2, 4.5, 3.5],
    [0, 100, 50],
    [12, 87, 50],
    [1000, 9000, 5000],
    [0.2, 0.9, 0.55],
  ])('rounds the midpoint of %p and %p to %p', async (min, max, mid) => {
    expect(await evaluate(min, max)).toBeCloseTo(mid);
  });
});
