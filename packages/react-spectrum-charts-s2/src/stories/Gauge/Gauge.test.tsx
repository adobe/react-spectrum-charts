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
import { Gauge } from '../../pre-alpha/components/Gauge';
import { findAllMarksByGroupName, findChart, queryAllMarksByGroupName, render } from '../../test-utils';
import { Fill, Needle } from './Features/GaugeBasic.story';

describe('Gauge', () => {
  // Gauge is not a real React component. This test just provides test coverage for sonarqube
  test('Gauge pseudo element', () => {
    render(<Gauge label="Test" />);
  });

  test('Needle renders the track and needle marks', async () => {
    render(<Needle {...Needle.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const track = await findAllMarksByGroupName(chart, 'gauge0_track');
    expect(track.length).toEqual(1);

    const needle = await findAllMarksByGroupName(chart, 'gauge0_needle');
    expect(needle.length).toEqual(1);
  });

  test('Fill renders a fill arc instead of a needle', async () => {
    render(<Fill {...Fill.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const fill = await findAllMarksByGroupName(chart, 'gauge0_fill');
    expect(fill.length).toEqual(1);

    const needle = queryAllMarksByGroupName(chart, 'gauge0_needle');
    expect(needle.length).toEqual(0);
  });
});
