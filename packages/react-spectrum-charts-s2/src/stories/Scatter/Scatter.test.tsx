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
import { Scatter } from '../../lab/components/Scatter/index.js';
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  render,
  rightClickNthElement,
} from '../../test-utils/index.js';
import { Basic } from './Features/ScatterFeatures.story.js';

describe('Scatter', () => {
  // Scatter is not a real React component. This is test just provides test coverage for sonarqube
  test('Scatter pseudo element', () => {
    render(<Scatter />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // characterData has 16 character groups
    const points = await findAllMarksByGroupName(chart, 'scatter0');
    expect(points.length).toEqual(16);
  });

  test('calls onClick with the clicked point', async () => {
    const onClick = jest.fn();
    render(<Basic {...Basic.args} onClick={onClick} />);
    const chart = await findChart();
    const cells = await findAllMarksByGroupName(chart, 'scatter0_voronoi', 'path');
    await clickNthElement(cells, 0);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ weightClass: expect.any(String) }));
  });

  test('calls onContextMenu with the event and the right-clicked point', async () => {
    const onContextMenu = jest.fn();
    render(<Basic {...Basic.args} onContextMenu={onContextMenu} />);
    const chart = await findChart();
    const cells = await findAllMarksByGroupName(chart, 'scatter0_voronoi', 'path');
    await rightClickNthElement(cells, 0);
    expect(onContextMenu).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ weightClass: expect.any(String) })
    );
  });
});
