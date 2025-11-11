/*
 * Copyright 2025 Adobe. All rights reserved.
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
      
      // Get all occurrences and select the axis title (first occurrence is the axis, second is legend)
      const downloadsElements = screen.getAllByText('Downloads');
      const conversionRateElements = screen.getAllByText('Conversion Rate (%)');
      
      // first axis uses first series color (Downloads) - axis titles are bold
      expect(downloadsElements.find(el => el.getAttribute('font-weight') === 'bold')).toHaveAttribute('fill', 'rgb(15, 181, 174)');
      // second axis uses second series color (Conversion Rate)
      expect(conversionRateElements.find(el => el.getAttribute('font-weight') === 'bold')).toHaveAttribute('fill', 'rgb(64, 70, 202)');
    });

    test('axis labels should have fill color based on series', async () => {
      render(<Basic {...Basic.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Wait for chart to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const zeroLabels = screen.getAllByText('0');
      
      // first axis (left) uses first series color
      expect(zeroLabels[0]).toHaveAttribute('fill', 'rgb(15, 181, 174)');
      // second axis (right) uses second series color
      expect(zeroLabels[1]).toHaveAttribute('fill', 'rgb(64, 70, 202)');
    });
  });

  describe('Three series', () => {
    test('axis title should have fill color based on series', async () => {
      render(<WithThreeSeries {...WithThreeSeries.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Wait for chart to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get all occurrences and select the axis title (first occurrence is the axis, second is legend)
      const countElements = screen.getAllByText('Count');
      const conversionRateElements = screen.getAllByText('Conversion Rate (%)');

      // first axis has more than one series. Use default color.
      expect(countElements.find(el => el.getAttribute('font-weight') === 'bold')).toHaveAttribute('fill', 'rgb(34, 34, 34)');
      // second axis uses third series color.
      expect(conversionRateElements.find(el => el.getAttribute('font-weight') === 'bold')).toHaveAttribute('fill', 'rgb(246, 133, 17)');
    });

    test('axis labels should have fill color based on series', async () => {
      render(<WithThreeSeries {...WithThreeSeries.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Wait for chart to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const zeroLabels = screen.getAllByText('0');

      // first axis has more than one series. Use default color.
      expect(zeroLabels[0]).toHaveAttribute('fill', 'rgb(34, 34, 34)');
      // second axis uses third series color.
      expect(zeroLabels[1]).toHaveAttribute('fill', 'rgb(246, 133, 17)');
    });
  });
});

