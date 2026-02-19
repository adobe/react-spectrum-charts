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
import React from 'react';

import { spectrum2Colors } from '@spectrum-charts/themes';

import {
  findChart,
  getAllLegendEntries,
  getAllLegendSymbols,
  getAllMarksByGroupName,
  render,
  screen,
} from '../test-utils';
import '../test-utils/__mocks__/matchMedia.mock.js';
import {
  FunnelConversion,
  FunnelTimeComparison,
  TrendsTimeComparisonBar,
  TrendsTimeComparisonStackedBar,
  UserGrowthTimeComparisonBarGrowth,
} from './ChartExamples.story';

const colors = spectrum2Colors.light;

function testBarOpacity(bar: HTMLElement, opacity: string) {
  expect(bar).toHaveAttribute('fill-opacity', opacity);
}

function testBarStroke(bar: HTMLElement, strokeDasharray: string, strokeWidth: string) {
  expect(bar).toHaveAttribute('stroke-dasharray', strokeDasharray);
  expect(bar).toHaveAttribute('stroke-width', strokeWidth);
}

describe('Funnel stories', () => {
  describe('FunnelConversion', () => {
    test('legend should only have 2 items in it', async () => {
      render(<FunnelConversion {...FunnelConversion.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(12);

      const legendEntries = getAllLegendEntries(chart);
      expect(legendEntries).toHaveLength(2);

      expect(screen.getByText('All users')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
    });
  });
});

describe('Time comparison stories', () => {
  describe('TrendsTimeComparisonBar', () => {
    test('historical series should have special style', async () => {
      render(<TrendsTimeComparisonBar {...TrendsTimeComparisonBar.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(112);

      testBarOpacity(bars[0], '0.5');
      testBarStroke(bars[0], '3,4', '1.5');
    });

    test('current series should have typical style', async () => {
      render(<TrendsTimeComparisonBar {...TrendsTimeComparisonBar.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(112);

      testBarOpacity(bars[1], '1');
      testBarStroke(bars[1], '', '1.5');
    });
  });

  describe('FunnelTimeComparison', () => {
    test('historical series should have special style', async () => {
      render(<FunnelTimeComparison {...FunnelTimeComparison.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(24);

      testBarOpacity(bars[0], '0.5');
      testBarStroke(bars[0], '3,4', '1.5');

      // dropoff bars
      testBarOpacity(bars[2], '0.5');
      testBarStroke(bars[2], '3,4', '1.5');
    });

    test('current series should have typical style', async () => {
      render(<FunnelTimeComparison {...FunnelTimeComparison.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(24);

      testBarOpacity(bars[1], '1');
      testBarStroke(bars[1], '', '1.5');

      // dropoff bars
      testBarOpacity(bars[3], '1');
      testBarStroke(bars[3], '', '1.5');
    });

    test('legend symobls should be styled correctly', async () => {
      render(<FunnelTimeComparison {...FunnelTimeComparison.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const legendSymbols = getAllLegendSymbols(chart);

      expect(legendSymbols).toHaveLength(4);

      // fill-opacity
      expect(legendSymbols[0]).toHaveAttribute('fill-opacity', '0.5');
      expect(legendSymbols[1]).toHaveAttribute('fill-opacity', '1');

      // stroke-dasharray
      expect(legendSymbols[0]).toHaveAttribute('stroke-dasharray', '3,4');
      expect(legendSymbols[1]).toHaveAttribute('stroke-dasharray', '');

      // fill
      expect(legendSymbols[0]).toHaveAttribute('fill', colors['categorical-100']);
      expect(legendSymbols[2]).toHaveAttribute('fill', colors['categorical-200']);

      // stroke
      expect(legendSymbols[0]).toHaveAttribute('stroke', colors['categorical-100']);
      expect(legendSymbols[2]).toHaveAttribute('stroke', colors['categorical-200']);
    });
  });

  describe('UserGrowthTimeComparison', () => {
    test('has correct number of bars', async () => {
      render(<UserGrowthTimeComparisonBarGrowth {...UserGrowthTimeComparisonBarGrowth.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(48);
    });

    test('historical series should have special style', async () => {
      render(<UserGrowthTimeComparisonBarGrowth {...UserGrowthTimeComparisonBarGrowth.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');

      // previous period April
      for (let i = 0; i <= 3; i++) {
        testBarOpacity(bars[i], '0.5');
        testBarStroke(bars[i], '3,4', '1.5');
      }

      // previous period May
      for (let i = 8; i <= 11; i++) {
        testBarOpacity(bars[i], '0.5');
        testBarStroke(bars[i], '3,4', '1.5');
      }
    });

    test('current series should have typical style', async () => {
      render(<UserGrowthTimeComparisonBarGrowth {...UserGrowthTimeComparisonBarGrowth.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');

      // last period April
      for (let i = 4; i <= 7; i++) {
        testBarOpacity(bars[i], '1');
        testBarStroke(bars[i], '', '1.5');
      }

      // last period May
      for (let i = 12; i <= 15; i++) {
        testBarOpacity(bars[i], '1');
        testBarStroke(bars[i], '', '1.5');
      }
    });
  });

  describe('TrendsTimeComparisonStackedBar', () => {
    test('historical series should have special style', async () => {
      render(<TrendsTimeComparisonStackedBar {...TrendsTimeComparisonStackedBar.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(112);

      testBarOpacity(bars[0], '0.5');
      testBarStroke(bars[0], '3,4', '1.5');
    });

    test('current series should have typical style', async () => {
      render(<TrendsTimeComparisonStackedBar {...TrendsTimeComparisonStackedBar.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(112);

      testBarOpacity(bars[1], '1');
      testBarStroke(bars[1], '', '1.5');
    });
  });

});
