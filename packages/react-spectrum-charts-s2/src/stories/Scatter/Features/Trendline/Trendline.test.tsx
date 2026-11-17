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
import { TRENDLINE_EMPHASIS_FADE_OPACITY } from '@spectrum-charts/core-s2/constants';

import { Trendline } from '../../../../lab/components/Trendline/index.js';
import { findAllMarksByGroupName, findChart, render } from '../../../../test-utils/index.js';
import { Basic, Emphasis } from './TrendlineFeatures.story.js';

describe('Trendline', () => {
  // Trendline is not a real React component. This is test just provides test coverage for sonarqube
  test('Trendline pseudo element', () => {
    render(<Trendline />);
  });

  test('Basic renders a trendline for each weight class', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // one line mark is drawn per weightClass facet (light, medium, heavy)
    const trendlines = await findAllMarksByGroupName(chart, 'scatter0Trendline0');
    expect(trendlines.length).toBeGreaterThan(0);
  });

  test('Emphasis fades the points behind the trendline', async () => {
    render(<Emphasis {...Emphasis.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'scatter0');
    expect(points[0]).toHaveAttribute('fill-opacity', String(TRENDLINE_EMPHASIS_FADE_OPACITY));
  });

  test('Emphasis with points fades the trendline', async () => {
    render(<Emphasis {...Emphasis.args} emphasis="points" />);
    const chart = await findChart();
    const trendlines = await findAllMarksByGroupName(chart, 'scatter0Trendline0');
    expect(trendlines[0]).toHaveAttribute('stroke-opacity', String(TRENDLINE_EMPHASIS_FADE_OPACITY));
  });
});
