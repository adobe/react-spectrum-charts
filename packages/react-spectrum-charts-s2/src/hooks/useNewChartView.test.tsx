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
import { Options as TooltipOptions } from 'vega-tooltip';

import { TOOLTIP_DELAY } from '@spectrum-charts/constants';

import useNewChartView from './useNewChartView';

const mockHandlerCall = jest.fn();
jest.mock('vega-tooltip', () => ({
  Handler: jest.fn().mockImplementation(() => ({ call: mockHandlerCall })),
}));

const inspectOptions = {} as TooltipOptions;

const getOnNewView = () => {
  const { result } = renderHook(() => useNewChartView(inspectOptions));
  return result.current;
};

const makeFakeView = () => ({ tooltip: jest.fn() } as unknown as View);

const getTooltipCallback = (view: View) => {
  getOnNewView()(view);
  return (view.tooltip as jest.Mock).mock.calls[0][0];
};

const legendItem = { mark: { name: 'legend0_symbol' }, tooltip: true } as unknown as Item;
const axisLabelItem = { mark: { role: 'axis-label' }, tooltip: true } as unknown as Item;
const plainItem = { mark: { name: 'bar0', role: 'mark' } } as unknown as Item;

describe('useNewChartView - tooltip delay behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('calls the tooltip handler immediately for a non-legend, non-axis-label item', () => {
    const view = makeFakeView();
    const callback = getTooltipCallback(view);
    callback(view, { type: 'pointermove' }, plainItem, undefined);
    expect(mockHandlerCall).toHaveBeenCalledTimes(1);
  });

  test('delays the tooltip handler for pointermove events on legend items with a tooltip', () => {
    const view = makeFakeView();
    const callback = getTooltipCallback(view);
    callback(view, { type: 'pointermove' }, legendItem, undefined);
    expect(mockHandlerCall).not.toHaveBeenCalled();

    jest.advanceTimersByTime(TOOLTIP_DELAY);
    expect(mockHandlerCall).toHaveBeenCalledTimes(1);
  });

  test('delays the tooltip handler for pointermove events on axis-label items with a tooltip', () => {
    const view = makeFakeView();
    const callback = getTooltipCallback(view);
    callback(view, { type: 'pointermove' }, axisLabelItem, undefined);
    expect(mockHandlerCall).not.toHaveBeenCalled();

    jest.advanceTimersByTime(TOOLTIP_DELAY);
    expect(mockHandlerCall).toHaveBeenCalledTimes(1);
  });

  test('cancels a pending delayed tooltip if the mouse moves again before the delay resolves', () => {
    const view = makeFakeView();
    const callback = getTooltipCallback(view);
    callback(view, { type: 'pointermove' }, legendItem, undefined);
    jest.advanceTimersByTime(TOOLTIP_DELAY / 2);
    callback(view, { type: 'pointermove' }, legendItem, undefined);
    jest.advanceTimersByTime(TOOLTIP_DELAY / 2);
    expect(mockHandlerCall).not.toHaveBeenCalled();

    jest.advanceTimersByTime(TOOLTIP_DELAY / 2);
    expect(mockHandlerCall).toHaveBeenCalledTimes(1);
  });

  test('does not delay non-pointermove events even for legend/axis-label items', () => {
    const view = makeFakeView();
    const callback = getTooltipCallback(view);
    callback(view, { type: 'pointerout' }, legendItem, undefined);
    expect(mockHandlerCall).toHaveBeenCalledTimes(1);
  });
});
