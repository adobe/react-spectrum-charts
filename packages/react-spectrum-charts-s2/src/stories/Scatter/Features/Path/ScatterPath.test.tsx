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
import { ScatterPath } from '../../../../pre-alpha/components/ScatterPath';
import { findAllMarksByGroupName, findChart, render } from '../../../../test-utils';
import { Basic } from './ScatterPath.story';

describe('ScatterPath', () => {
  // ScatterPath is not a real React component. This is test just provides test coverage for sonarqube
  test('ScatterPath pseudo element', () => {
    render(<ScatterPath />);
  });

  test('Basic renders a path for each weight class', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // characterData has 3 weight classes and groupBy is ['weightClass'], so 3 faceted trail paths are drawn
    const paths = await findAllMarksByGroupName(chart, 'scatter0Path0');
    expect(paths.length).toEqual(3);
  });
});
