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

import { useChartContext } from '../context/RscChartContext.js';
import { RscChartProps } from '../types/index.js';
import useAxisLabelOnClickDetails from './useAxisLabelOnClickDetails.js';
import { UseLegendProps } from './useLegend.js';
import useMarkMouseInputDetails from './useMarkMouseInputDetails.js';
import useMarkOnClickDetails from './useMarkOnClickDetails.js';
import useNewChartView from './useNewChartView.js';
import usePopovers from './usePopovers.js';

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

const renderOnNewView = (initialLegendProps: UseLegendProps = legendProps) =>
  renderHook(({ legend }) => useNewChartView(baseProps, [], legend), {
    initialProps: { legend: initialLegendProps },
  });

const getOnNewView = () => renderOnNewView().result.current;

type Listener = (event: { type: string }, item: unknown) => void;

const makeFakeView = () =>
  ({
    tooltip: jest.fn(),
    signal: jest.fn(),
    addEventListener: jest.fn(),
  }) as unknown as View;

const fire = (view: View, type: string, item: unknown) => {
  (view.addEventListener as jest.Mock).mock.calls
    .filter(([eventName]) => eventName === type)
    .forEach(([, listener]: [string, Listener]) => listener({ type }, item));
};

const sceneItem = (role: string, name: string, datum: Record<string, unknown>) => ({
  bounds: { x1: 0, x2: 1, y1: 0, y2: 1 },
  datum,
  mark: { role, name, marktype: 'symbol', group: {}, items: [{}, {}] },
});

describe('useNewChartView', () => {
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
    mockUseAxisLabelOnClickDetails.mockReturnValue([]);
  });

  test('keeps the same onNewView when legend state and child details change', () => {
    const { result, rerender } = renderOnNewView();
    const first = result.current;

    mockUseAxisLabelOnClickDetails.mockReturnValue([{ markName: 'axis0', onClick: jest.fn() }]);
    rerender({ legend: { ...legendProps, legendHiddenSeries: ['a'], isToggleable: true, onClick: jest.fn() } });

    expect(result.current).toBe(first);
  });

  test('legend clicks read the latest hidden series and callbacks', () => {
    const { result, rerender } = renderOnNewView();
    const view = makeFakeView();
    result.current(view);

    const onClick = jest.fn();
    const setLegendHiddenSeries = jest.fn();
    rerender({ legend: { legendHiddenSeries: ['b'], setLegendHiddenSeries, isToggleable: true, onClick } });
    fire(view, 'click', sceneItem('legend-symbol', 'legend0_legendSymbol', { value: 'a' }));

    expect(onClick).toHaveBeenCalledWith('a');
    expect(setLegendHiddenSeries).toHaveBeenCalledWith(['b', 'a']);
  });

  test('legend hovers call the latest legend callbacks', () => {
    const { result, rerender } = renderOnNewView();
    const view = makeFakeView();
    result.current(view);

    const onMouseOver = jest.fn();
    rerender({ legend: { ...legendProps, onMouseOver } });
    fire(view, 'mouseover', sceneItem('legend-symbol', 'legend0_legendSymbol', { value: 'a' }));

    expect(onMouseOver).toHaveBeenCalledWith('a');
  });

  test('axis label clicks call onClick details added after the view was created', () => {
    const { result, rerender } = renderOnNewView();
    const view = makeFakeView();
    result.current(view);

    const onAxisClick = jest.fn();
    mockUseAxisLabelOnClickDetails.mockReturnValue([{ markName: 'axis0', onClick: onAxisClick }]);
    rerender({ legend: legendProps });
    fire(view, 'click', sceneItem('axis-label', 'axis0_labels', { value: 'Jan', index: 0 }));

    expect(onAxisClick).toHaveBeenCalledWith(expect.anything(), 'Jan', 0);
  });

  test('does not call axis label onClick when there are no axis onClick details', () => {
    const view = makeFakeView();
    getOnNewView()(view);

    expect(() => fire(view, 'click', sceneItem('axis-label', 'axis0_labels', { value: 'Jan', index: 0 }))).not.toThrow();
  });

  test('does not set a tooltip on the view, since that rebuilds the renderer', () => {
    const view = makeFakeView();
    getOnNewView()(view);
    expect(view.tooltip).not.toHaveBeenCalled();
  });

  test('prevents the container context menu only while a mark handles it', () => {
    const container = document.createElement('div');
    container.id = 'test-chart';
    document.body.appendChild(container);
    const { result, rerender } = renderOnNewView();
    result.current(makeFakeView());
    result.current(makeFakeView());

    const before = new MouseEvent('contextmenu', { cancelable: true });
    container.dispatchEvent(before);
    mockUseMarkOnClickDetails.mockReturnValue([{ markName: 'line0', onContextMenu: jest.fn() }]);
    rerender({ legend: legendProps });
    const after = new MouseEvent('contextmenu', { cancelable: true });
    container.dispatchEvent(after);

    expect({ before: before.defaultPrevented, after: after.defaultPrevented }).toEqual({ before: false, after: true });
    container.remove();
  });
});
