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
import { findChart, render } from '../../../../test-utils';
import { coloredThresholdsData } from '../../../data/bulletData';
import { Inspect } from './BulletInspect.story';

describe('Bullet Inspect', () => {
  test('Inspect renders properly', async () => {
    render(<Inspect {...Inspect.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('InspectWithThresholds renders properly', async () => {
    render(<Inspect {...Inspect.args} thresholds={coloredThresholdsData} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('InspectWithTrack renders properly', async () => {
    render(<Inspect {...Inspect.args} track />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });
});
