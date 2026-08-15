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
import { render, waitFor } from '@testing-library/react';
import { Spec, View } from 'vega';
import embed from 'vega-embed';

import { VegaChart, VegaChartProps } from './VegaChart';

jest.mock('vega-embed');

const mockEmbed = jest.mocked(embed);

const createMockView = (): View =>
  ({
    runAsync: jest.fn().mockResolvedValue(undefined),
    resize: jest.fn().mockReturnThis(),
    height: jest.fn().mockReturnThis(),
    width: jest.fn().mockReturnThis(),
    finalize: jest.fn(),
    signal: jest.fn(),
    addEventListener: jest.fn(),
  }) as unknown as View;

const defaultSpec: Spec = {};

const defaultProps: VegaChartProps = {
  config: {},
  data: [],
  debug: false,
  height: 600,
  locale: undefined,
  onNewView: jest.fn(),
  padding: 0,
  renderer: 'svg',
  spec: defaultSpec,
  tooltip: {},
  width: 800,
};

// AN-445759: regression tests for the init render cycle fix
describe('VegaChart init render cycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmbed.mockResolvedValue({ view: createMockView() } as unknown as Awaited<ReturnType<typeof embed>>);
  });

  test('calls embed on initial mount with valid dimensions', async () => {
    render(<VegaChart {...defaultProps} />);

    await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
  });

  test('does not call embed on initial mount with zero dimensions', () => {
    render(<VegaChart {...defaultProps} width={0} height={0} />);

    expect(mockEmbed).not.toHaveBeenCalled();
  });

  test('calls embed when dimensions become valid after starting at zero', async () => {
    const { rerender } = render(<VegaChart {...defaultProps} width={0} height={0} />);
    expect(mockEmbed).not.toHaveBeenCalled();

    rerender(<VegaChart {...defaultProps} width={800} height={600} />);

    await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
  });
});

describe('VegaChart interactionConfig forwarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('forwards interactionConfig to the controller, wiring refs.chartView.current on mount', async () => {
    const mockView = createMockView();
    mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);
    const interactionConfig: NonNullable<VegaChartProps['interactionConfig']> = {
      chartId: 'test',
      idKey: 'id',
      markClickDetails: [],
      markMouseInputDetails: [],
      axisLabelOnClickDetails: [],
      legend: {},
      popovers: [],
      refs: {
        chartView: { current: undefined },
        selectedData: { current: null },
        selectedDataName: { current: '' },
        selectedDataBounds: { current: { x1: 0, x2: 0, y1: 0, y2: 0 } },
      },
    };

    render(<VegaChart {...defaultProps} interactionConfig={interactionConfig} />);

    await waitFor(() => expect(interactionConfig.refs.chartView.current).toBe(mockView));
  });
});
