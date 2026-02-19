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
import { FADE_FACTOR } from '@spectrum-charts/constants';

import {
  allElementsHaveAttributeValue,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
} from '../../../test-utils';
import { Basic, Dimension, Keys, LineChart, Series } from './HighlightBy.story';

describe('Basic', () => {
  test('Only the hovered element should be highlighted', async () => {
    render(<Basic {...Basic.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars).toHaveLength(9);

    await hoverNthElement(bars, 2);
    // highlighed bar
    expect(bars[2]).toHaveAttribute('opacity', '1');
    // all other bars
    expect(allElementsHaveAttributeValue([...bars.slice(0, 2), ...bars.slice(3)], 'opacity', FADE_FACTOR)).toBe(true);
  });
});

describe('Dimension', () => {
  test('All the bars with the same dimension should be highlighted', async () => {
    render(<Dimension {...Dimension.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars).toHaveLength(9);

    await hoverNthElement(bars, 2);
    // first three bars (same dimension)
    expect(allElementsHaveAttributeValue(bars.slice(0, 2), 'opacity', '1')).toBe(true);
    // all other bars
    expect(allElementsHaveAttributeValue(bars.slice(3), 'opacity', FADE_FACTOR)).toBe(true);
  });
});

describe('Series', () => {
  test('All the bars with the same series should be highlighted', async () => {
    render(<Series {...Series.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars).toHaveLength(9);

    await hoverNthElement(bars, 2);
    // bars 2, 5, and 8 (same series)
    expect(allElementsHaveAttributeValue([bars[2], bars[5], bars[8]], 'opacity', '1')).toBe(true);
    // all other bars
    expect(
      allElementsHaveAttributeValue(
        [...bars.slice(0, 1), ...bars.slice(3, 4), ...bars.slice(6, 7)],
        'opacity',
        FADE_FACTOR
      )
    ).toBe(true);
  });
});

describe('Keys', () => {
  test('All the bars with the same keys should be highlighted', async () => {
    render(<Keys {...Keys.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars).toHaveLength(9);

    await hoverNthElement(bars, 2);
    // bars 2, 5, and 8 (same series)
    expect(allElementsHaveAttributeValue([bars[2], bars[5], bars[8]], 'opacity', '1')).toBe(true);
    // all other bars
    expect(
      allElementsHaveAttributeValue(
        [...bars.slice(0, 1), ...bars.slice(3, 4), ...bars.slice(6, 7)],
        'opacity',
        FADE_FACTOR
      )
    ).toBe(true);
  });
});

describe('LineChart', () => {
  test('All lines should be highlighted and the points for each dimension should be highlighted', async () => {
    render(<LineChart {...LineChart.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines).toHaveLength(3);

    const lineHoverAreas = await findAllMarksByGroupName(chart, 'line0_voronoi');
    expect(lineHoverAreas).toHaveLength(9);

    await hoverNthElement(lineHoverAreas, 0);

    const highlightedPoints = await findAllMarksByGroupName(chart, 'line0_point_highlight');
    expect(highlightedPoints).toHaveLength(3);

    expect(allElementsHaveAttributeValue(lines, 'opacity', '1')).toBe(true);
  });
});
