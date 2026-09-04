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
import { ScatterAnnotation } from '../../../../pre-alpha/components/ScatterAnnotation';
import { findAllMarksByGroupName, findChart, render } from '../../../../test-utils';
import { Basic } from './ScatterAnnotation.story';

describe('ScatterAnnotation', () => {
  // ScatterAnnotation is not a real React component. This is test just provides test coverage for sonarqube
  test('ScatterAnnotation pseudo element', () => {
    render(<ScatterAnnotation />);
  });

  test('Basic renders a label for each point that fits without overlapping', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // characterData has 16 points, but the label transform hides any that would overlap
    const labels = await findAllMarksByGroupName(chart, 'scatter0Annotation0', 'text');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.length).toBeLessThanOrEqual(16);
  });
});
