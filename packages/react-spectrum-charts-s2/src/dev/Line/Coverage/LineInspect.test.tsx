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
import {
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  waitFor,
  within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock';
import { Inspect, ItemInspect } from './LineInspect.story';

describe('Line', () => {
  describe('Inspect', () => {
    test('Inspect should show on hover', async () => {
      render(<Inspect {...Inspect.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get voronoi paths
      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');

      // hover and validate all hover components are visible
      await hoverNthElement(paths, 0);
      const inspect = await screen.findByTestId('rsc-tooltip');
      expect(inspect).toBeInTheDocument();
      expect(within(inspect).getByText('Nov 8')).toBeInTheDocument();
    });
    test('should fade the opacity of non-hovered lines', async () => {
      render(<Inspect {...Inspect.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const lines = await findAllMarksByGroupName(chart, 'line0');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toHaveAttribute('opacity', '1');
      expect(lines[1]).toHaveAttribute('opacity', '1');

      // get voronoi paths
      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');

      // hover and validate all hover components are visible
      await hoverNthElement(paths, 0);

      await waitFor(() => {
        expect(lines[0]).toHaveAttribute('opacity', '1');
        expect(lines[1]).toHaveAttribute('opacity', '0.2');
      });
    });
  });

  test('Item inspect renders', async () => {
    render(<ItemInspect {...ItemInspect.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get item hover area
    const hoverGroup = await findAllMarksByGroupName(chart, 'line0_hover0');

    // hover and validate all hover components are visible
    await hoverNthElement(hoverGroup, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();
    expect(within(inspect).getByText('Nov 8')).toBeInTheDocument();
  });
});
