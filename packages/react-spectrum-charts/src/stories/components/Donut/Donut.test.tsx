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
import { Donut } from '../../../rc/components/Donut';
import { findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import { Basic } from './Donut.story';

describe('Donut', () => {
  // Donut is not a real React component. This is test just provides test coverage for sonarqube
  test('Donut pseudo element', () => {
    render(<Donut />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // donut data has 7 segments
    const bars = await findAllMarksByGroupName(chart, 'donut0');
    expect(bars.length).toEqual(7);
  });
});
