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
import { FADE_FACTOR } from '@spectrum-charts/core-s2/constants';

import {
  allElementsHaveAttributeValue,
  findAllMarksByGroupName,
  findChart,
  getAllLegendEntries,
  getAllLegendSymbols,
  hoverNthElement,
  render,
  unhoverNthElement,
  waitFor,
  waitForMarksByGroupName,
} from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { HistoricalCompare } from './LineHistoricalCompare.story.js';

describe('Line', () => {
  test('HistoricalCompare renders', async () => {
    render(<HistoricalCompare {...HistoricalCompare.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines.length).toEqual(4);
    // dotted teal line
    expect(lines[0].getAttribute('stroke-dasharray')).toEqual('0,4');
    expect(lines[0].getAttribute('stroke')).toEqual('#5424DB'); // S2 categorical-100
    // solid teal line
    expect(lines[1].getAttribute('stroke-dasharray')).toEqual('');
    expect(lines[1].getAttribute('stroke')).toEqual('#5424DB'); // S2 categorical-100
    // dotted purple line
    expect(lines[2].getAttribute('stroke-dasharray')).toEqual('0,4');
    expect(lines[3].getAttribute('stroke')).toEqual('#D92361'); // S2 categorical-200
    // solid purple line
    expect(lines[3].getAttribute('stroke-dasharray')).toEqual('');
    expect(lines[3].getAttribute('stroke')).toEqual('#D92361'); // S2 categorical-200
  });

  test('Hovering over the entries on HistoricalCompare should highlight hovered series', async () => {
    render(<HistoricalCompare {...HistoricalCompare.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const entries = getAllLegendEntries(chart);
    expect(entries.length).toEqual(4);
    await hoverNthElement(entries, 0);

    // symbol opacity should be reduced for all but the first symbol. Legend opacity is now driven by
    // the same animated fraction data as the line for animated marks, so it settles asynchronously
    // rather than flipping instantly — hence the waitFor rather than a direct synchronous assertion.
    let symbols = getAllLegendSymbols(chart);
    await waitFor(() => {
      expect(symbols[0]).toHaveAttribute('opacity', '1');
      expect(allElementsHaveAttributeValue(symbols.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
    });

    await waitForMarksByGroupName(chart, 'line0', (lines) => {
      expect(lines[0]).toHaveAttribute('opacity', '1');
      expect(allElementsHaveAttributeValue(lines.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
    });

    await unhoverNthElement(entries, 0);
    await hoverNthElement(entries, 3);

    // symbol opacity should be reduced for all but the last symbol
    symbols = getAllLegendSymbols(chart);
    await waitFor(() => {
      expect(allElementsHaveAttributeValue(symbols.slice(0, 3), 'opacity', FADE_FACTOR)).toBeTruthy();
      expect(symbols[3]).toHaveAttribute('opacity', '1');
    });

    // line opacity should be reduced for all but the last line
    await waitForMarksByGroupName(chart, 'line0', (lines) => {
      expect(allElementsHaveAttributeValue(lines.slice(0, 3), 'opacity', FADE_FACTOR)).toBeTruthy();
      expect(lines[3]).toHaveAttribute('opacity', '1');
    });
  });
});
