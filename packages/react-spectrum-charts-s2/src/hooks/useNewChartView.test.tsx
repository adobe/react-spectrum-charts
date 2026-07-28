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
import { renderHook } from '@testing-library/react';
import { View } from 'vega';
import { Options as TooltipOptions } from 'vega-tooltip';

import { useChartContext } from '../context/RscChartContext';
import { RscChartProps } from '../types';
import useAxisLabelOnClickDetails from './useAxisLabelOnClickDetails';
import { UseLegendProps } from './useLegend';
import useMarkMouseInputDetails from './useMarkMouseInputDetails';
import useMarkOnClickDetails from './useMarkOnClickDetails';
import useNewChartView from './useNewChartView';
import usePopovers from './usePopovers';

jest.mock('../context/RscChartContext', () => ({
  useChartContext: jest.fn(),
}));

jest.mock('./usePopovers', () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));

jest.mock('./useMarkOnClickDetails', () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));

jest.mock('./useMarkMouseInputDetails', () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));

jest.mock('./useAxisLabelOnClickDetails', () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));

const mockUseChartContext = jest.mocked(useChartContext);
const mockUsePopovers = jest.mocked(usePopovers);
const mockUseMarkOnClickDetails = jest.mocked(useMarkOnClickDetails);
const mockUseMarkMouseInputDetails = jest.mocked(useMarkMouseInputDetails);
const mockUseAxisLabelOnClickDetails = jest.mocked(useAxisLabelOnClickDetails);

const baseProps = { idKey: 'rscMarkId' } as unknown as RscChartProps;
const legendProps: UseLegendProps = { legendHiddenSeries: [], setLegendHiddenSeries: jest.fn() };
const inspectOptions = {} as TooltipOptions;

const getOnNewView = () => {
  const { result } = renderHook(() => useNewChartView(baseProps, [], inspectOptions, legendProps));
  return result.current;
};

const makeFakeView = () =>
  ({
    tooltip: jest.fn(),
    addEventListener: jest.fn(),
  } as unknown as View);

describe('useNewChartView - axis label click wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChartContext.mockReturnValue({
      chartView: { current: undefined },
      selectedData: { current: null },
      selectedDataBounds: { current: undefined },
      selectedDataName: { current: undefined },
      chartId: 'test-chart',
    } as unknown as ReturnType<typeof useChartContext>);
    mockUsePopovers.mockReturnValue([]);
    mockUseMarkOnClickDetails.mockReturnValue([]);
    mockUseMarkMouseInputDetails.mockReturnValue([]);
  });

  test('registers an axis label click listener when useAxisLabelOnClickDetails returns details', () => {
    mockUseAxisLabelOnClickDetails.mockReturnValue([{ markName: 'axis0', onClick: jest.fn() }]);
    const view = makeFakeView();
    getOnNewView()(view);
    const clickListenerCount = (view.addEventListener as jest.Mock).mock.calls.filter(
      ([eventName]) => eventName === 'click'
    ).length;
    expect(clickListenerCount).toBe(2);
  });

  test('does not register an axis label click listener when there are no axis onClick details', () => {
    mockUseAxisLabelOnClickDetails.mockReturnValue([]);
    const view = makeFakeView();
    getOnNewView()(view);
    const clickListenerCount = (view.addEventListener as jest.Mock).mock.calls.filter(
      ([eventName]) => eventName === 'click'
    ).length;
    expect(clickListenerCount).toBe(1);
  });
});
