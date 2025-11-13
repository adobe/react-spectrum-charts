/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { spectrumColors } from '@spectrum-charts/themes';
import { Gauge } from '../../../alpha';
import { findAllMarksByGroupName, findChart, findMarksByGroupName, render } from '../../../test-utils';
import { Basic } from './Gauge.story';
import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants';

describe('Gauge', () => {
  // Gauge is not a real React component. This test provides test coverage for sonarqube
  test('Gauge pseudo element', () => {
    render(<Gauge />);
  });

  test('Basic gauge renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const backgroundArc = await findMarksByGroupName(chart, 'BackgroundArcRounded');
    expect(backgroundArc).toBeDefined();

    const fillerArc = await findMarksByGroupName(chart, 'FillerArc');
    expect(fillerArc).toBeDefined();

    const needleRule = await findMarksByGroupName(chart, 'Needle', 'line');
    expect(needleRule).toBeDefined();
  });
});
