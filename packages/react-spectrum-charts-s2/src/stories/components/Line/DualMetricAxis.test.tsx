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
import { Basic, WithThreeSeries } from './DualMetricAxis.story';

describe('Dual metric axis line axis styling', () => {
  describe('Two series', () => {
    test('axis title should have fill color based on series', async () => {
      render(<Basic {...Basic.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // set timeout to allow chart to render
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Get all occurrences - in S2, axis titles may not have font-weight attribute
      // Just verify the axis titles exist with correct colors
      const allTexts = Array.from(chart.querySelectorAll('text'));
      const downloadsAxisTitle = allTexts.find(el => el.textContent === 'Downloads' && el.getAttribute('fill') === '#5424DB');
      const conversionRateAxisTitle = allTexts.find(el => el.textContent === 'Conversion Rate (%)' && el.getAttribute('fill') === '#D92361');
      
      expect(downloadsAxisTitle).toBeTruthy();
      expect(conversionRateAxisTitle).toBeTruthy();
    });

    test('axis labels should have fill color based on series', async () => {
      render(<Basic {...Basic.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Wait for chart to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const zeroLabels = screen.getAllByText('0');
      
      // first axis (left) uses first series color
      expect(zeroLabels[0]).toHaveAttribute('fill', '#5424DB'); // S2 categorical-100
      // second axis (right) uses second series color
      expect(zeroLabels[1]).toHaveAttribute('fill', '#D92361'); // S2 categorical-200
    });
  });

  describe('Three series', () => {
    test('axis title should have fill color based on series', async () => {
      render(<WithThreeSeries {...WithThreeSeries.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Wait for chart to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get all text elements - in S2, axis titles may not have font-weight attribute
      const allTexts = Array.from(chart.querySelectorAll('text'));
      const countAxisTitle = allTexts.find(el => el.textContent === 'Count' && el.getAttribute('fill') === '#292929');
      const conversionRateAxisTitle = allTexts.find(el => el.textContent === 'Conversion Rate (%)' && el.getAttribute('fill') === '#E86A00');

      expect(countAxisTitle).toBeTruthy();
      expect(conversionRateAxisTitle).toBeTruthy();
    });

    test('axis labels should have fill color based on series', async () => {
      render(<WithThreeSeries {...WithThreeSeries.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Wait for chart to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const zeroLabels = screen.getAllByText('0');

      // first axis has more than one series. Use default color.
      expect(zeroLabels[0]).toHaveAttribute('fill', '#292929'); // S2 gray-800 light
      // second axis uses third series color.
      expect(zeroLabels[1]).toHaveAttribute('fill', '#E86A00'); // S2 categorical-300
    });
  });
});

