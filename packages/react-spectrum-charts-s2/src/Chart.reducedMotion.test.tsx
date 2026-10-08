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
import { Chart } from './Chart.js';
import { Line } from './components/index.js';
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion.js';
import { render } from './test-utils/index.js';
import { RscChartProps } from './types/index.js';

const mockRscChart = jest.fn((_props: RscChartProps) => null);

jest.mock('./RscChart', () => ({
  RscChart: (props: RscChartProps) => mockRscChart(props),
}));

jest.mock('./hooks/usePrefersReducedMotion', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUsePrefersReducedMotion = jest.mocked(usePrefersReducedMotion);

describe('Chart reduced motion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('disables animations when reduced motion is preferred', () => {
    mockUsePrefersReducedMotion.mockReturnValue(true);

    render(
      <Chart data={[{ x: 1, y: 1 }]} animations>
        <Line dimension="x" metric="y" />
      </Chart>
    );

    expect(mockRscChart).toHaveBeenCalledWith(expect.objectContaining({ animations: false }));
  });

  test('preserves the animations prop when reduced motion is not preferred', () => {
    mockUsePrefersReducedMotion.mockReturnValue(false);

    render(
      <Chart data={[{ x: 1, y: 1 }]}>
        <Line dimension="x" metric="y" />
      </Chart>
    );

    expect(mockRscChart).toHaveBeenCalledWith(expect.objectContaining({ animations: undefined }));
  });
});
