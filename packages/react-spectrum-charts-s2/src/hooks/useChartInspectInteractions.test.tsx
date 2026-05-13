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

import { COMPONENT_NAME, FILTERED_TABLE, GROUP_DATA, GROUP_ID } from '@spectrum-charts/constants';

import { useChartContext } from '../context/RscChartContext';
import { RscChartProps } from '../types';
import useChartInspectInteractions from './useChartInspectInteractions';
import useChartInspects, { InspectDetail } from './useChartInspects';

jest.mock('../context/RscChartContext', () => ({
  useChartContext: jest.fn(),
}));

jest.mock('./useChartInspects', () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));

jest.mock('./useLegend', () => ({
  __esModule: true,
  default: jest.fn(() => ({ descriptions: undefined })),
}));

const mockUseChartContext = jest.mocked(useChartContext);
const mockUseChartInspects = jest.mocked(useChartInspects);

const mockSignal = jest.fn();
const mockData = jest.fn();
const mockCallback = jest.fn(() => null);

const baseProps = {
  colorScheme: 'light',
  idKey: 'rscMarkId',
  tooltipAnchor: 'cursor',
  tooltipPlacement: 'top',
} as unknown as RscChartProps;

const defaultInspect: InspectDetail = {
  name: 'line0',
  callback: mockCallback,
  highlightBy: undefined,
  targets: undefined,
};

const baseValue = {
  [COMPONENT_NAME]: 'line0',
  rscMarkId: 'item-1',
};

function makeContext(
  idSignal?: { name: string },
  groupSignal?: { name: string }
) {
  return {
    chartView: { current: { signal: mockSignal, data: mockData } },
    controlledHoveredIdSignal: { current: idSignal },
    controlledHoveredGroupSignal: { current: groupSignal },
  };
}

function getFormatTooltip() {
  const { result } = renderHook(() => useChartInspectInteractions(baseProps, []));
  return result.current.inspectOptions.formatTooltip;
}

describe('useChartInspectInteractions - controlledHoveredIdSignal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChartInspects.mockReturnValue([defaultInspect]);
  });

  test('calls signal with the idKey value when controlledHoveredIdSignal is set', () => {
    mockUseChartContext.mockReturnValue(makeContext({ name: 'line0_controlledHoveredId' }) as ReturnType<typeof useChartContext>);
    const formatTooltip = getFormatTooltip();
    formatTooltip?.({ ...baseValue });
    expect(mockSignal).toHaveBeenCalledWith('line0_controlledHoveredId', 'item-1');
  });

  test('calls signal with null when idKey is absent from value', () => {
    mockUseChartContext.mockReturnValue(makeContext({ name: 'line0_controlledHoveredId' }) as ReturnType<typeof useChartContext>);
    const formatTooltip = getFormatTooltip();
    formatTooltip?.({ [COMPONENT_NAME]: 'line0' });
    expect(mockSignal).toHaveBeenCalledWith('line0_controlledHoveredId', null);
  });

  test('does not call signal when controlledHoveredIdSignal is not set', () => {
    mockUseChartContext.mockReturnValue(makeContext() as ReturnType<typeof useChartContext>);
    const formatTooltip = getFormatTooltip();
    formatTooltip?.({ ...baseValue });
    expect(mockSignal).not.toHaveBeenCalled();
  });
});

describe('useChartInspectInteractions - controlledHoveredGroupSignal', () => {
  const groupKey = `line0_${GROUP_ID}`;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChartInspects.mockReturnValue([defaultInspect]);
  });

  test('calls group signal when value contains a key ending in GROUP_ID', () => {
    mockUseChartContext.mockReturnValue(makeContext(undefined, { name: 'line0_controlledHoveredGroup' }) as ReturnType<typeof useChartContext>);
    const formatTooltip = getFormatTooltip();
    formatTooltip?.({ ...baseValue, [groupKey]: 'group-a' });
    expect(mockSignal).toHaveBeenCalledWith('line0_controlledHoveredGroup', 'group-a');
  });

  test('does not call group signal when no GROUP_ID key exists in value', () => {
    mockUseChartContext.mockReturnValue(makeContext(undefined, { name: 'line0_controlledHoveredGroup' }) as ReturnType<typeof useChartContext>);
    const formatTooltip = getFormatTooltip();
    formatTooltip?.({ ...baseValue }); // no key ending in GROUP_ID
    expect(mockSignal).not.toHaveBeenCalled();
  });

  test('does not call group signal when controlledHoveredGroupSignal is not set', () => {
    mockUseChartContext.mockReturnValue(makeContext() as ReturnType<typeof useChartContext>);
    const formatTooltip = getFormatTooltip();
    formatTooltip?.({ ...baseValue, [groupKey]: 'group-a' });
    expect(mockSignal).not.toHaveBeenCalled();
  });
});

describe('useChartInspectInteractions - highlightBy GROUP_DATA population', () => {
  const groupKey = `line0_${GROUP_ID}`;
  const tableData = [
    { [groupKey]: 'group-a', value: 1 },
    { [groupKey]: 'group-b', value: 2 },
    { [groupKey]: 'group-a', value: 3 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChartContext.mockReturnValue(makeContext() as ReturnType<typeof useChartContext>);
    mockData.mockReturnValue(tableData);
  });

  test('filters FILTERED_TABLE into GROUP_DATA when highlightBy is series', () => {
    mockUseChartInspects.mockReturnValue([{ ...defaultInspect, highlightBy: 'series' }]);
    const value = { ...baseValue, [groupKey]: 'group-a' };
    getFormatTooltip()?.({ ...value });
    expect(mockData).toHaveBeenCalledWith(FILTERED_TABLE);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({ [GROUP_DATA]: [tableData[0], tableData[2]] })
    );
  });

  test('filters FILTERED_TABLE into GROUP_DATA when highlightBy is dimension', () => {
    mockUseChartInspects.mockReturnValue([{ ...defaultInspect, highlightBy: 'dimension' }]);
    const value = { ...baseValue, [groupKey]: 'group-b' };
    getFormatTooltip()?.({ ...value });
    expect(mockData).toHaveBeenCalledWith(FILTERED_TABLE);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({ [GROUP_DATA]: [tableData[1]] })
    );
  });

  test('does not fetch table data when highlightBy is item', () => {
    mockUseChartInspects.mockReturnValue([{ ...defaultInspect, highlightBy: 'item' }]);
    getFormatTooltip()?.({ ...baseValue });
    expect(mockData).not.toHaveBeenCalled();
  });

  test('does not fetch table data when highlightBy is undefined', () => {
    mockUseChartInspects.mockReturnValue([{ ...defaultInspect, highlightBy: undefined }]);
    getFormatTooltip()?.({ ...baseValue });
    expect(mockData).not.toHaveBeenCalled();
  });
});
