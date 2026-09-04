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
import {
  CustomLabels,
  CustomLabelsRowDirection,
  CustomLabelsSidePosition,
  CustomTargetLabel,
} from './BulletCustomLabels.story';

describe('Bullet CustomLabels', () => {
  test('CustomLabels renders properly', async () => {
    render(<CustomLabels {...CustomLabels.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('CustomLabelsSidePosition renders properly', async () => {
    render(<CustomLabelsSidePosition {...CustomLabelsSidePosition.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('CustomTargetLabel renders properly', async () => {
    render(<CustomTargetLabel {...CustomTargetLabel.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('CustomLabelsRowDirection renders properly', async () => {
    render(<CustomLabelsRowDirection {...CustomLabelsRowDirection.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });
});
