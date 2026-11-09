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
import { Item, View } from 'vega';
import { Handler, Options as TooltipOptions } from 'vega-tooltip';

import { TOOLTIP_DELAY } from '@spectrum-charts/core-s2/constants';

import { useChartContext } from '../context/RscChartContext.js';
import useInspectTooltip from './useInspectTooltip.js';

jest.mock('../context/RscChartContext', () => ({
  useChartContext: jest.fn(),
}));

jest.mock('vega-tooltip', () => ({
  Handler: jest.fn().mockImplementation(() => ({ call: jest.fn() })),
}));

const mockUseChartContext = jest.mocked(useChartContext);
const MockHandler = jest.mocked(Handler);
const mockSetHoveredAxisLabel = jest.fn();
const view = {} as View;

const axisLabelItem = {
  mark: { role: 'axis-label', group: {} },
  bounds: { x1: 0, x2: 10, y1: 0, y2: 20 },
  datum: {},
} as unknown as Item;
const barItem = { mark: { name: 'bar0' }, bounds: { x1: 0, x2: 0, y1: 0, y2: 0 }, datum: {} } as unknown as Item;
const legendItem = { mark: { name: 'legend0' }, tooltip: 'Series A', datum: {} } as unknown as Item;

const renderTooltip = (inspectOptions: TooltipOptions = {}) =>
  renderHook(({ options }) => useInspectTooltip(options), { initialProps: { options: inspectOptions } });

const getInspectCall = (index = 0) => MockHandler.mock.results[index].value.call as jest.Mock;

describe('useInspectTooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChartContext.mockReturnValue({
      setHoveredAxisLabel: mockSetHoveredAxisLabel,
    } as unknown as ReturnType<typeof useChartContext>);
  });

  test('hovering an axis label sets hoveredAxisLabel with the item bounds and tooltip content', () => {
    const { result } = renderTooltip();

    result.current(view, { type: 'pointermove' } as MouseEvent, axisLabelItem, 'Category A');

    expect(mockSetHoveredAxisLabel).toHaveBeenCalledWith({
      bounds: { x1: 0, x2: 10, y1: 0, y2: 20 },
      content: 'Category A',
    });
    expect(getInspectCall()).not.toHaveBeenCalled();
  });

  test('hovering a non-axis-label item clears hoveredAxisLabel and shows the inspect tooltip', () => {
    const { result } = renderTooltip();
    const event = { type: 'mouseout' } as MouseEvent;

    result.current(view, event, barItem, 'value');

    expect(mockSetHoveredAxisLabel).toHaveBeenCalledWith(null);
    expect(getInspectCall()).toHaveBeenCalledWith(view, event, barItem, 'value');
  });

  test('delays legend item tooltips on pointermove', () => {
    jest.useFakeTimers();
    const { result } = renderTooltip();

    result.current(view, { type: 'pointermove' } as MouseEvent, legendItem, 'Series A');
    expect(getInspectCall()).not.toHaveBeenCalled();
    jest.advanceTimersByTime(TOOLTIP_DELAY);

    expect(getInspectCall()).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('keeps the same handler across re-renders and uses the latest inspect options', () => {
    const { result, rerender } = renderTooltip({ theme: 'light' });
    const handler = result.current;

    rerender({ options: { theme: 'dark' } });
    result.current(view, { type: 'mouseout' } as MouseEvent, barItem, 'value');

    expect(result.current).toBe(handler);
    expect(MockHandler).toHaveBeenLastCalledWith({ theme: 'dark' });
    expect(getInspectCall(1)).toHaveBeenCalledTimes(1);
    expect(getInspectCall(0)).not.toHaveBeenCalled();
  });
});
