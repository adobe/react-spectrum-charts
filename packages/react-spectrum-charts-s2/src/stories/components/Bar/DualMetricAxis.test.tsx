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
import { findChart, render, screen } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { DualMetricAxis as Basic } from './DualMetricAxis.story';

describe('Dual metric axis bar axis styling', () => {
  describe('Two series', () => {
    test('axis title should have fill color based on series', async () => {
      render(<Basic {...Basic.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // set timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // first axis uses first series color.
      expect(screen.getByText('Total sessions')).toHaveAttribute('fill', '#5424DB'); // S2 categorical-100
      // second axis uses second series color.
      expect(screen.getByText('Total orders')).toHaveAttribute('fill', '#D92361'); // S2 categorical-200
    });
    test('axis label should have fill color based on series', async () => {
      render(<Basic {...Basic.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // first axis
      expect(screen.getAllByText('0')[0]).toHaveAttribute('fill', '#5424DB'); // S2 categorical-100
      // second axis uses second series color.
      expect(screen.getAllByText('0')[1]).toHaveAttribute('fill', '#D92361'); // S2 categorical-200
    });
  });
});
