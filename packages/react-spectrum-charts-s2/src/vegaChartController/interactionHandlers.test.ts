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
import { Item, View } from 'vega';

import { COMPONENT_NAME, DIMENSION_FIELD, FILTERED_TABLE, GROUP_DATA } from '@spectrum-charts/constants';

import { ContextMenuMode } from '../types/marks/line.types';
import { VegaChartInteractionConfig } from './interactionConfig';
import {
  ActionItem,
  GetOnMarkClickCallbackArgs,
  attachInteractionListeners,
  getItemBounds,
  getItemName,
  getLegendItemValue,
  getOnAxisLabelClickCallback,
  getOnChartMarkContextMenuCallback,
  getOnMarkClickCallback,
  handleLegendItemClick,
  handleLegendItemMouseInput,
} from './interactionHandlers';

const defaultMarkClickArgs: GetOnMarkClickCallbackArgs = {
  chartView: { current: { signal: jest.fn().mockReturnValue([]) } as unknown as View },
  selectedData: { current: null },
  selectedDataBounds: { current: undefined },
  selectedDataName: { current: undefined },
  chartId: 'test',
  setSignal: jest.fn(),
  legendHasPopover: false,
  trigger: 'click',
};

describe('getItemBounds()', () => {
  test('should return default bounds if null or undefined', () => {
    expect(getItemBounds(null)).toStrictEqual({ x1: 0, x2: 0, y1: 0, y2: 0 });
    expect(getItemBounds(undefined)).toStrictEqual({ x1: 0, x2: 0, y1: 0, y2: 0 });
  });
});

describe('handleLegendItemClick()', () => {
  let setSignal;
  let onLegendClick;
  const item = {
    context: null,
    height: null,
    width: null,
    items: [{ role: 'legend-label', bounds: null, clip: null, items: [{ datum: { value: 'test' } }] }],
  } as unknown as Item;

  beforeEach(() => {
    setSignal = jest.fn();
    onLegendClick = jest.fn();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should call setSignal with the toggled hiddenSeries if legendItemValue is found', () => {
    handleLegendItemClick(item, { ...defaultMarkClickArgs, setSignal, legendIsToggleable: true });
    expect(setSignal).toHaveBeenCalledWith('hiddenSeries', ['test']);
  });
  test('should read the current hiddenSeries off the live view rather than a frozen value', () => {
    const chartView = { current: { signal: jest.fn().mockReturnValue(['other']) } as unknown as View };
    handleLegendItemClick(item, { ...defaultMarkClickArgs, chartView, setSignal, legendIsToggleable: true });
    expect(setSignal).toHaveBeenCalledWith('hiddenSeries', ['other', 'test']);
  });
  test('should not call setSignal if legendItemValue is not found', () => {
    const item = {} as unknown as Item;
    handleLegendItemClick(item, { ...defaultMarkClickArgs, setSignal, legendIsToggleable: true });
    expect(setSignal).not.toHaveBeenCalled();
  });
  test('should not call setSignal if legendHasPopover is true', () => {
    const item = {} as unknown as Item;
    handleLegendItemClick(item, { ...defaultMarkClickArgs, setSignal, legendHasPopover: true });
    expect(setSignal).not.toHaveBeenCalled();
  });
  test('should not call setSignal if trigger is contextmenu', () => {
    const item = {} as unknown as Item;
    handleLegendItemClick(item, { ...defaultMarkClickArgs, setSignal, trigger: 'contextmenu' });
    expect(setSignal).not.toHaveBeenCalled();
  });
  test('should call onLegendClick if trigger is click', () => {
    handleLegendItemClick(item, { ...defaultMarkClickArgs, onLegendClick, trigger: 'click' });
    expect(onLegendClick).toHaveBeenCalled();
  });
  test('should not call onLegendClick if trigger is contextmenu', () => {
    handleLegendItemClick(item, { ...defaultMarkClickArgs, onLegendClick, trigger: 'contextmenu' });
    expect(onLegendClick).not.toHaveBeenCalled();
  });
  test('should set selectedData if legendHasPopover is true', () => {
    const selectedData = { current: null };
    handleLegendItemClick(item, { ...defaultMarkClickArgs, legendHasPopover: true, selectedData });
    expect(selectedData.current).toStrictEqual({
      rscComponentName: undefined,
      rscSeriesId: 'test',
      value: 'test',
    });
  });
});

describe('getLegendItemValue', () => {
  test('should return the legend item value for SceneGroup', () => {
    const item = {
      context: null,
      height: null,
      width: null,
      items: [{ role: 'legend-label', bounds: null, clip: null, items: [{ datum: { value: 'test' } }] }],
    } as unknown as Item;
    expect(getLegendItemValue(item)).toBe('test');
  });
  test('should return the legend item value for SceneItem', () => {
    const item = { datum: { value: 'test' }, bounds: null } as unknown as Item;
    expect(getLegendItemValue(item)).toBe('test');
  });

  describe('should return undefined', () => {
    test('if labelItem is not a Scene', () => {
      const item = {
        context: null,
        height: null,
        width: null,
        items: [{ role: 'legend-label', items: [{ datum: { value: 'test' } }] }],
      } as unknown as Item;
      expect(getLegendItemValue(item)).toBeUndefined();
    });
    test('if labelItem has no items', () => {
      const item = {
        context: null,
        height: null,
        width: null,
        items: [],
      } as unknown as Item;
      expect(getLegendItemValue(item)).toBeUndefined();
    });
    test('id datum does not exist on the first labelItem', () => {
      const item = {
        context: null,
        height: null,
        width: null,
        items: [{ role: 'legend-label', bounds: null, clip: null, items: [{}] }],
      } as unknown as Item;
      expect(getLegendItemValue(item)).toBeUndefined();
    });
    test('if item is undefined', () => {
      expect(getLegendItemValue(undefined)).toBeUndefined();
    });
  });
});

describe('getItemName()', () => {
  test('should return undefined if the item is invalid', () => {
    expect(getItemName(undefined)).toBeUndefined();
    expect(
      getItemName({ datum: undefined, mark: { marktype: 'line', role: 'mark', group: undefined, items: [] } })
    ).toBeUndefined();
  });
  test('should return undefined if there is no name on the mark', () => {
    expect(
      getItemName({
        datum: undefined,
        bounds: undefined,
        mark: { marktype: 'line', role: 'mark', group: undefined, items: [] },
      } as ActionItem)
    ).toBeUndefined();
  });
  test('should return the name if it exists on the mark', () => {
    expect(
      getItemName({
        datum: undefined,
        bounds: undefined,
        mark: { marktype: 'line', role: 'mark', group: undefined, items: [], name: 'rect0_test' },
      } as ActionItem)
    ).toBe('rect0');
  });
});

describe('handleLegendItemMouseInput()', () => {
  let onLegendMouseInput;
  beforeEach(() => {
    onLegendMouseInput = jest.fn();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should call onLegendMouseInput if legendItemValue is found', () => {
    const item = {
      context: null,
      height: null,
      width: null,
      items: [{ role: 'legend-label', bounds: null, clip: null, items: [{ datum: { value: 'test' } }] }],
    } as unknown as Item;
    handleLegendItemMouseInput(item, onLegendMouseInput);
    expect(onLegendMouseInput).toHaveBeenCalled();
  });
  test('should not call onLegendMouseInput if legendItemValue is not found', () => {
    handleLegendItemMouseInput(undefined, onLegendMouseInput);
    expect(onLegendMouseInput).not.toHaveBeenCalled();
  });
});

describe('getOnMarkClickCallback() mark click with markHasPopover', () => {
  const markItem = {
    datum: { foo: 1 },
    bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
    mark: {
      role: 'mark',
      name: 'bar0_rect',
      marktype: 'rect',
      group: { x: 0, y: 0 },
      items: [],
    },
  } as unknown as Item;

  const fakeClickEvent = { type: 'click' } as Parameters<ReturnType<typeof getOnMarkClickCallback>>[0];

  test('should not set selectedData when markHasPopover is false', () => {
    const selectedData = { current: null as unknown };
    const callback = getOnMarkClickCallback({
      ...defaultMarkClickArgs,
      markHasPopover: false,
      selectedData: selectedData as GetOnMarkClickCallbackArgs['selectedData'],
    });
    callback(fakeClickEvent, markItem);
    expect(selectedData.current).toBeNull();
  });

  test('should set selectedData when markHasPopover is true', () => {
    const selectedData = { current: null as unknown };
    const callback = getOnMarkClickCallback({
      ...defaultMarkClickArgs,
      markHasPopover: true,
      selectedData: selectedData as GetOnMarkClickCallbackArgs['selectedData'],
    });
    callback(fakeClickEvent, markItem);
    expect(selectedData.current).toStrictEqual({
      [COMPONENT_NAME]: 'bar0',
      foo: 1,
    });
  });
});

describe('getOnChartMarkContextMenuCallback()', () => {
  const chartView = { current: true as unknown as View };
  const lineMarkItem = {
    datum: { date: 1000, value: 42 },
    bounds: { x1: 5, y1: 10, x2: 15, y2: 20 },
    mark: {
      role: 'mark',
      name: 'line0_voronoi',
      marktype: 'path',
      group: { x: 0, y: 0 },
      items: [],
    },
  } as unknown as Item;

  const fakeContextMenuEvent = { type: 'contextmenu', clientX: 10, clientY: 15 } as unknown as Parameters<
    ReturnType<typeof getOnChartMarkContextMenuCallback>
  >[0];

  test('should call onContextMenu with event and datum when contextmenu event on matching mark', () => {
    const onContextMenu = jest.fn();
    const callback = getOnChartMarkContextMenuCallback(chartView, [
      { markName: 'line0', onContextMenu },
    ]);
    callback(fakeContextMenuEvent, lineMarkItem);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ clientX: 10, clientY: 15 }),
      { date: 1000, value: 42 }
    );
  });

  test('should not call onContextMenu when event type is click', () => {
    const onContextMenu = jest.fn();
    const callback = getOnChartMarkContextMenuCallback(chartView, [
      { markName: 'line0', onContextMenu },
    ]);
    callback({ type: 'click' } as unknown as typeof fakeContextMenuEvent, lineMarkItem);
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  test('should not call onContextMenu when item is legend item', () => {
    const onContextMenu = jest.fn();
    const legendItem = {
      datum: { value: 'Chrome' },
      mark: { role: 'legend-symbol', name: 'legend', marktype: 'symbol', group: { x: 0, y: 0 }, items: [] },
      bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
    } as unknown as Item;
    const callback = getOnChartMarkContextMenuCallback(chartView, [
      { markName: 'line0', onContextMenu },
    ]);
    callback(fakeContextMenuEvent, legendItem);
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  test('should not call onContextMenu when no detail matches mark name', () => {
    const onContextMenu = jest.fn();
    const callback = getOnChartMarkContextMenuCallback(chartView, [
      { markName: 'bar0', onContextMenu },
    ]);
    callback(fakeContextMenuEvent, lineMarkItem);
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  test('should not call onContextMenu when markClickDetails is empty', () => {
    const onContextMenu = jest.fn();
    const callback = getOnChartMarkContextMenuCallback(chartView, []);
    callback(fakeContextMenuEvent, lineMarkItem);
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  test('should not call onContextMenu when chartView.current is undefined', () => {
    const onContextMenu = jest.fn();
    const callback = getOnChartMarkContextMenuCallback({ current: undefined }, [
      { markName: 'line0', onContextMenu },
    ]);
    callback(fakeContextMenuEvent, lineMarkItem);
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  test('should not call onContextMenu when item is null', () => {
    const onContextMenu = jest.fn();
    const callback = getOnChartMarkContextMenuCallback(chartView, [
      { markName: 'line0', onContextMenu },
    ]);
    callback(fakeContextMenuEvent, null as unknown as ActionItem);
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  test('should use sourceEvent when present on event', () => {
    const onContextMenu = jest.fn();
    const eventWithSource = {
      type: 'contextmenu',
      sourceEvent: { clientX: 100, clientY: 200 } as MouseEvent,
    } as unknown as Parameters<ReturnType<typeof getOnChartMarkContextMenuCallback>>[0];
    const callback = getOnChartMarkContextMenuCallback(chartView, [
      { markName: 'line0', onContextMenu },
    ]);
    callback(eventWithSource, lineMarkItem);
    expect(onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ clientX: 100, clientY: 200 }),
      { date: 1000, value: 42 }
    );
  });

  describe('contextMenuMode filtering', () => {
    const xAxisVoronoiItem = {
      datum: { date: 1000, value: 42 },
      bounds: { x1: 5, y1: 10, x2: 15, y2: 20 },
      mark: {
        role: 'mark',
        name: 'line0_xAxisVoronoi',
        marktype: 'path',
        group: { x: 0, y: 0 },
        items: [],
      },
    } as unknown as ActionItem;

    const hoverItem = {
      datum: { date: 1000, value: 42 },
      bounds: { x1: 5, y1: 10, x2: 15, y2: 20 },
      mark: {
        role: 'mark',
        name: 'line0_hover0',
        marktype: 'symbol',
        group: { x: 0, y: 0 },
        items: [],
      },
    } as unknown as ActionItem;

    test("'interaction' allows all mark types", () => {
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(chartView, [
        { markName: 'line0', onContextMenu, contextMenuMode: 'interaction' },
      ]);
      callback(fakeContextMenuEvent, lineMarkItem);
      callback(fakeContextMenuEvent, hoverItem);
      expect(onContextMenu).toHaveBeenCalledTimes(2);
    });

    test("'dimension' allows _xAxisVoronoi marks", () => {
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(chartView, [
        { markName: 'line0', onContextMenu, contextMenuMode: 'dimension' },
      ]);
      callback(fakeContextMenuEvent, xAxisVoronoiItem);
      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });

    test("'dimension' blocks _voronoi and hover marks", () => {
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(chartView, [
        { markName: 'line0', onContextMenu, contextMenuMode: 'dimension' },
      ]);
      callback(fakeContextMenuEvent, lineMarkItem);
      callback(fakeContextMenuEvent, hoverItem);
      expect(onContextMenu).not.toHaveBeenCalled();
    });

    test("'item' allows hover marks", () => {
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(chartView, [
        { markName: 'line0', onContextMenu, contextMenuMode: 'item' },
      ]);
      callback(fakeContextMenuEvent, hoverItem);
      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });

    test("'item' blocks _voronoi and _xAxisVoronoi marks", () => {
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(chartView, [
        { markName: 'line0', onContextMenu, contextMenuMode: 'item' },
      ]);
      callback(fakeContextMenuEvent, lineMarkItem);
      callback(fakeContextMenuEvent, xAxisVoronoiItem);
      expect(onContextMenu).not.toHaveBeenCalled();
    });

    test('enriches datum with GROUP_DATA when mark is _xAxisVoronoi and DIMENSION_FIELD is present', () => {
      const row1 = { date: 1000, value: 10, series: 'a' };
      const row2 = { date: 1000, value: 20, series: 'b' };
      const row3 = { date: 2000, value: 30, series: 'a' };
      const mockChartView = {
        current: {
          data: (name: string) => (name === FILTERED_TABLE ? [row1, row2, row3] : []),
        } as unknown as View,
      };
      const itemWithDimensionField = {
        datum: { date: 1000, value: 42, [DIMENSION_FIELD]: 'date' },
        bounds: { x1: 5, y1: 10, x2: 15, y2: 20 },
        mark: {
          role: 'mark',
          name: 'line0_xAxisVoronoi',
          marktype: 'path',
          group: { x: 0, y: 0 },
          items: [],
        },
      } as unknown as ActionItem;
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(mockChartView, [
        { markName: 'line0', onContextMenu },
      ]);
      callback(fakeContextMenuEvent, itemWithDimensionField);
      const [, datum] = onContextMenu.mock.calls[0];
      expect(datum).toHaveProperty(GROUP_DATA, [row1, row2]);
    });

    test('handles Date dimension values in GROUP_DATA enrichment', () => {
      const date1 = new Date(1000);
      const date2 = new Date(2000);
      const row1 = { date: date1, value: 10, series: 'a' };
      const row2 = { date: date1, value: 20, series: 'b' };
      const row3 = { date: date2, value: 30, series: 'a' };
      const mockChartView = {
        current: {
          data: (name: string) => (name === FILTERED_TABLE ? [row1, row2, row3] : []),
        } as unknown as View,
      };
      const itemWithDate = {
        datum: { date: date1, value: 42, [DIMENSION_FIELD]: 'date' },
        bounds: { x1: 5, y1: 10, x2: 15, y2: 20 },
        mark: {
          role: 'mark',
          name: 'line0_xAxisVoronoi',
          marktype: 'path',
          group: { x: 0, y: 0 },
          items: [],
        },
      } as unknown as ActionItem;
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(mockChartView, [
        { markName: 'line0', onContextMenu },
      ]);
      callback(fakeContextMenuEvent, itemWithDate);
      const [, datum] = onContextMenu.mock.calls[0];
      expect(datum).toHaveProperty(GROUP_DATA, [row1, row2]);
    });

    test("unknown contextMenuMode falls back to allowing the mark", () => {
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(chartView, [
        { markName: 'line0', onContextMenu, contextMenuMode: 'unknown' as ContextMenuMode },
      ]);
      callback(fakeContextMenuEvent, lineMarkItem);
      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });

    test('handles string dimension values in GROUP_DATA enrichment', () => {
      const row1 = { category: 'A', value: 10, series: 'a' };
      const row2 = { category: 'A', value: 20, series: 'b' };
      const row3 = { category: 'B', value: 30, series: 'a' };
      const mockChartView = {
        current: {
          data: (name: string) => (name === FILTERED_TABLE ? [row1, row2, row3] : []),
        } as unknown as View,
      };
      const itemWithString = {
        datum: { category: 'A', value: 42, [DIMENSION_FIELD]: 'category' },
        bounds: { x1: 5, y1: 10, x2: 15, y2: 20 },
        mark: {
          role: 'mark',
          name: 'line0_xAxisVoronoi',
          marktype: 'path',
          group: { x: 0, y: 0 },
          items: [],
        },
      } as unknown as ActionItem;
      const onContextMenu = jest.fn();
      const callback = getOnChartMarkContextMenuCallback(mockChartView, [
        { markName: 'line0', onContextMenu },
      ]);
      callback(fakeContextMenuEvent, itemWithString);
      const [, datum] = onContextMenu.mock.calls[0];
      expect(datum).toHaveProperty(GROUP_DATA, [row1, row2]);
    });
  });
});

describe('getOnAxisLabelClickCallback()', () => {
  const fakeClickEvent = { type: 'click' } as Parameters<ReturnType<typeof getOnAxisLabelClickCallback>>[0];

  // mimics Vega's tick datum shape - index is a fraction (i / (tickCount - 1)), not a position
  const getAxisLabelItem = (value: string | Date, normalizedIndex: number, markItemCount = 5) =>
    ({
      datum: { value, index: normalizedIndex },
      bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
      mark: {
        role: 'axis-label',
        name: 'axis0_labelHover',
        marktype: 'text',
        group: { x: 0, y: 0 },
        items: new Array(markItemCount).fill(null),
      },
    } as unknown as Item);

  test('calls onClick with the native event, the label value, and the recovered integer index', () => {
    const onClick = jest.fn();
    const callback = getOnAxisLabelClickCallback([{ markName: 'axis0', onClick }]);
    // 3rd of 5 ticks -> recovered index 2
    callback(fakeClickEvent, getAxisLabelItem('Safari', 0.5));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(fakeClickEvent, 'Safari', 2);
  });

  test('recovers index 0 and the last index correctly', () => {
    const onClick = jest.fn();
    const callback = getOnAxisLabelClickCallback([{ markName: 'axis0', onClick }]);
    callback(fakeClickEvent, getAxisLabelItem('Chrome', 0));
    callback(fakeClickEvent, getAxisLabelItem('Explorer', 1));
    expect(onClick).toHaveBeenNthCalledWith(1, fakeClickEvent, 'Chrome', 0);
    expect(onClick).toHaveBeenNthCalledWith(2, fakeClickEvent, 'Explorer', 4);
  });

  test('passes through a Date value unchanged for time-scale axis labels', () => {
    const onClick = jest.fn();
    const callback = getOnAxisLabelClickCallback([{ markName: 'axis0', onClick }]);
    const tickDate = new Date('2026-01-01');
    callback(fakeClickEvent, getAxisLabelItem(tickDate, 0));
    expect(onClick).toHaveBeenCalledWith(fakeClickEvent, tickDate, 0);
  });

  test('unwraps sourceEvent to pass the underlying native mouse event', () => {
    const onClick = jest.fn();
    const callback = getOnAxisLabelClickCallback([{ markName: 'axis0', onClick }]);
    const nativeEvent = { clientX: 10, clientY: 20 } as unknown as MouseEvent;
    const wrappedEvent = { type: 'click', sourceEvent: nativeEvent } as unknown as typeof fakeClickEvent;
    callback(wrappedEvent, getAxisLabelItem('Safari', 0.5));
    expect(onClick).toHaveBeenCalledWith(nativeEvent, 'Safari', 2);
  });

  test('does not call onClick when the item is not an axis-label mark', () => {
    const onClick = jest.fn();
    const callback = getOnAxisLabelClickCallback([{ markName: 'axis0', onClick }]);
    const nonAxisLabelItem = {
      datum: { value: 'Safari', index: 0.5 },
      bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
      mark: { role: 'mark', name: 'axis0_labelHover', marktype: 'text', group: { x: 0, y: 0 }, items: [] },
    } as unknown as Item;
    callback(fakeClickEvent, nonAxisLabelItem);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('does not call onClick when no detail matches the mark name', () => {
    const onClick = jest.fn();
    const callback = getOnAxisLabelClickCallback([{ markName: 'axis1', onClick }]);
    callback(fakeClickEvent, getAxisLabelItem('Safari', 0.5));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('does not call onClick when axisLabelOnClickDetails is empty or undefined', () => {
    const onClick = jest.fn();
    getOnAxisLabelClickCallback([])(fakeClickEvent, getAxisLabelItem('Safari', 0.5));
    getOnAxisLabelClickCallback(undefined)(fakeClickEvent, getAxisLabelItem('Safari', 0.5));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('does not throw when item is null', () => {
    const onClick = jest.fn();
    const callback = getOnAxisLabelClickCallback([{ markName: 'axis0', onClick }]);
    expect(() => callback(fakeClickEvent, null as unknown as ActionItem)).not.toThrow();
    expect(onClick).not.toHaveBeenCalled();
  });

  test('does not call onClick for the synthetic "extra" boundary tick on binned domains', () => {
    const onClick = jest.fn();
    const callback = getOnAxisLabelClickCallback([{ markName: 'axis0', onClick }]);
    // Vega's extra boundary tick: index -1, no top-level value
    const extraTickItem = {
      datum: { index: -1, extra: { value: 'Chrome' }, label: '' },
      bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
      mark: {
        role: 'axis-label',
        name: 'axis0_labelHover',
        marktype: 'text',
        group: { x: 0, y: 0 },
        items: new Array(5).fill(null),
      },
    } as unknown as Item;
    callback(fakeClickEvent, extraTickItem);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('attachInteractionListeners()', () => {
  const makeConfig = (overrides: Partial<VegaChartInteractionConfig> = {}): VegaChartInteractionConfig => ({
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
    ...overrides,
  });

  const makeView = (): View =>
    ({
      addEventListener: jest.fn(),
      signal: jest.fn(),
    } as unknown as View);

  test('always attaches the base click/mouseover/mouseout listeners', () => {
    const view = makeView();
    attachInteractionListeners(view, makeConfig(), jest.fn());

    expect(view.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(view.addEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function));
    expect(view.addEventListener).toHaveBeenCalledWith('mouseout', expect.any(Function));
  });

  test('does not write selected-item signals or add a legend/popover click listener when nothing is interactive', () => {
    const view = makeView();
    attachInteractionListeners(view, makeConfig(), jest.fn());

    expect(view.signal).not.toHaveBeenCalled();
    // Only the one base click listener (getOnChartMarkClickCallback) — no legend/popover click listener.
    expect((view.addEventListener as jest.Mock).mock.calls.filter(([type]) => type === 'click')).toHaveLength(1);
  });

  test('writes selected-item signals and adds a legend/popover click listener when popovers exist', () => {
    const view = makeView();
    attachInteractionListeners(
      view,
      makeConfig({ popovers: [{ name: 'bar0', attachedToLegend: false, rightClick: false }] }),
      jest.fn()
    );

    expect(view.signal).toHaveBeenCalled();
    expect((view.addEventListener as jest.Mock).mock.calls.filter(([type]) => type === 'click')).toHaveLength(2);
  });

  test('writes selected-item signals and adds a legend/popover click listener when the legend is toggleable', () => {
    const view = makeView();
    attachInteractionListeners(view, makeConfig({ legend: { isToggleable: true } }), jest.fn());

    expect(view.signal).toHaveBeenCalled();
    expect((view.addEventListener as jest.Mock).mock.calls.filter(([type]) => type === 'click')).toHaveLength(2);
  });

  test('adds a contextmenu listener when a popover is right-click triggered', () => {
    const view = makeView();
    attachInteractionListeners(
      view,
      makeConfig({ popovers: [{ name: 'bar0', attachedToLegend: false, rightClick: true }] }),
      jest.fn()
    );

    expect((view.addEventListener as jest.Mock).mock.calls.filter(([type]) => type === 'contextmenu')).toHaveLength(1);
  });

  test('adds a contextmenu listener when a mark has onContextMenu configured', () => {
    const view = makeView();
    attachInteractionListeners(
      view,
      makeConfig({ markClickDetails: [{ markName: 'bar0', onContextMenu: jest.fn() }] }),
      jest.fn()
    );

    expect((view.addEventListener as jest.Mock).mock.calls.filter(([type]) => type === 'contextmenu')).toHaveLength(1);
  });

  test('adds an axis label click listener when axisLabelOnClickDetails is non-empty', () => {
    const view = makeView();
    attachInteractionListeners(
      view,
      makeConfig({ axisLabelOnClickDetails: [{ markName: 'axis0', onClick: jest.fn() }] }),
      jest.fn()
    );

    expect((view.addEventListener as jest.Mock).mock.calls.filter(([type]) => type === 'click')).toHaveLength(2);
  });
});
