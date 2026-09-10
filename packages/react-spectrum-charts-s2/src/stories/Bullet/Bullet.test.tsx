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
import { Bullet } from '../../pre-alpha/components/Bullet';
import { findAllMarksByGroupName, findChart, render } from '../../test-utils';
import { Basic } from './Features/BulletBasic.story';

describe('Bullet', () => {
  // Bullet is not a real React component. This test just provides test coverage for sonarqube
  test('Bullet pseudo element', () => {
    render(<Bullet />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // basicBulletData has 2 rows, so 2 metric bar rects should be drawn (rect marks render as <path> in SVG)
    const rects = await findAllMarksByGroupName(chart, `${Basic.args?.name ?? 'bullet0'}Rect`);
    expect(rects.length).toEqual(2);
  });
});
