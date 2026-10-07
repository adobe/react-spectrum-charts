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
  findMarksByGroupName,
  getAllLegendEntries,
  getAllMarksByGroupName,
  render,
  screen,
} from '../test-utils';
import '../test-utils/__mocks__/matchMedia.mock.js';
import { CheckoutErrorRateThresholds, EventTrendsPeriodComparison, FunnelConversion } from './ChartExamples.story';

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
  describe('EventTrendsPeriodComparison', () => {
    test('historical series should have special style', async () => {
      render(<EventTrendsPeriodComparison {...EventTrendsPeriodComparison.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(16);

      testBarOpacity(bars[0], '0.5');
      testBarStroke(bars[0], '3,4', '1.5');
    });

    test('current series should have typical style', async () => {
      render(<EventTrendsPeriodComparison {...EventTrendsPeriodComparison.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const bars = getAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(16);

      testBarOpacity(bars[1], '1');
      testBarStroke(bars[1], '', '1.5');
    });
  });
});

describe('CheckoutErrorRateThresholds', () => {
  let chart: HTMLElement;

  beforeEach(async () => {
    render(<CheckoutErrorRateThresholds {...CheckoutErrorRateThresholds.args} />);

    chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('should plot 3 reference lines with fixed S2 content neutral color', async () => {
    const refLine0 = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
    expect(refLine0).toBeInTheDocument();
    expect(refLine0).toHaveAttribute('stroke', colors['gray-800']);

    const refLine1 = await findMarksByGroupName(chart, 'axis0ReferenceLine1', 'line');
    expect(refLine1).toBeInTheDocument();
    expect(refLine1).toHaveAttribute('stroke', colors['gray-800']);

    const refLine2 = await findMarksByGroupName(chart, 'axis0ReferenceLine2', 'line');
    expect(refLine2).toBeInTheDocument();
    expect(refLine2).toHaveAttribute('stroke', colors['gray-800']);
  });
});
