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

import { useChartContext } from '../context/RscChartContext';
import useAxisLabelTooltipAnchorStyle from './useAxisLabelTooltipAnchorStyle';

jest.mock('../context/RscChartContext', () => ({
  useChartContext: jest.fn(),
}));

const mockUseChartContext = jest.mocked(useChartContext);

const mockView = { origin: jest.fn(() => [1, 0]) };

describe('useAxisLabelTooltipAnchorStyle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns display: none when no axis label is hovered', () => {
    mockUseChartContext.mockReturnValue({
      chartView: { current: mockView },
      hoveredAxisLabel: null,
    } as unknown as ReturnType<typeof useChartContext>);

    const { result } = renderHook(() => useAxisLabelTooltipAnchorStyle(10));
    expect(result.current).toStrictEqual({ display: 'none' });
  });

  test('returns display: none when the view is not yet ready', () => {
    mockUseChartContext.mockReturnValue({
      chartView: { current: undefined },
      hoveredAxisLabel: { bounds: { x1: 0, x2: 10, y1: 0, y2: 20 }, content: 'Category A' },
    } as unknown as ReturnType<typeof useChartContext>);

    const { result } = renderHook(() => useAxisLabelTooltipAnchorStyle(10));
    expect(result.current).toStrictEqual({ display: 'none' });
  });

  test('positions the anchor from the hovered label bounds, padding, and view origin', () => {
    mockUseChartContext.mockReturnValue({
      chartView: { current: mockView },
      hoveredAxisLabel: { bounds: { x1: 5, x2: 25, y1: 100, y2: 114 }, content: 'Category A' },
    } as unknown as ReturnType<typeof useChartContext>);

    const { result } = renderHook(() => useAxisLabelTooltipAnchorStyle(10));
    expect(result.current).toStrictEqual({
      position: 'absolute',
      width: 20,
      height: 14,
      left: 16, // x1(5) + leftPadding(10) + origin[0](1)
      top: 110, // y1(100) + topPadding(10) + origin[1](0)
    });
  });

  test('supports a per-side padding object', () => {
    mockUseChartContext.mockReturnValue({
      chartView: { current: mockView },
      hoveredAxisLabel: { bounds: { x1: 5, x2: 25, y1: 100, y2: 114 }, content: 'Category A' },
    } as unknown as ReturnType<typeof useChartContext>);

    const { result } = renderHook(() => useAxisLabelTooltipAnchorStyle({ top: 4, left: 8, right: 0, bottom: 0 }));
    expect(result.current).toMatchObject({ left: 14, top: 104 });
  });
});
