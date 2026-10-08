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
import { findAllMarksByGroupName, findChart, render } from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { BarWithUTCDatetimeFormat } from './BarUTCDatetime.story.js';

describe('Bar', () => {
  test('Bar with UTC date on dimension renders properly', async () => {
    render(<BarWithUTCDatetimeFormat {...BarWithUTCDatetimeFormat.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(6);
  });
});
