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
import { TrendlineAnnotation } from '../../../../../pre-alpha/components/TrendlineAnnotation';
import { findAllMarksByGroupName, findChart, render } from '../../../../../test-utils';
import { Basic } from './TrendlineAnnotation.story';

describe('TrendlineAnnotation', () => {
  // TrendlineAnnotation is not a real React component. This is test just provides test coverage for sonarqube
  test('TrendlineAnnotation pseudo element', () => {
    render(<TrendlineAnnotation />);
  });

  test('Basic renders a label for each trendline', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // one label is drawn per weightClass facet trendline
    const labels = await findAllMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text');
    expect(labels.length).toBeGreaterThan(0);
  });
});
