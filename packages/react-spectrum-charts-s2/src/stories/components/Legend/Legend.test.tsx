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
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  getAllLegendEntries,
  render,
  waitFor,
} from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic } from './Legend.story.js';
import { HiddenSeries } from './SeriesVisibility/LegendSeriesVisibility.story.js';

describe('Legend demo stories', () => {
  test('Basic renders a legend entry per traffic source', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(getAllLegendEntries(chart)).toHaveLength(5);
  });

  test('HiddenSeries toggles the controlled hidden series from the legend onClick', async () => {
    render(<HiddenSeries {...HiddenSeries.args} />);
    const chart = await findChart();
    expect(await findAllMarksByGroupName(chart, 'line0')).toHaveLength(4);

    await clickNthElement(getAllLegendEntries(chart), 4);
    await waitFor(async () => expect(await findAllMarksByGroupName(chart, 'line0')).toHaveLength(5));
  });
});
