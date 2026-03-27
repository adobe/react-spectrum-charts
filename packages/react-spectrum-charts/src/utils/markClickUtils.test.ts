/*
 * Copyright 2023 Adobe. All rights reserved.
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

import { COMPONENT_NAME } from '@spectrum-charts/constants';

import {
  ActionItem,
  GetOnMarkClickCallbackArgs,
  findSceneItemByDimension,
  getItemBounds,
  getItemName,
  getLegendItemValue,
  getOnChartMarkContextMenuCallback,
  getOnMarkClickCallback,
  handleLegendItemClick,
  handleLegendItemMouseInput,
  isThumbnailItem,
} from './markClickUtils';

const defaultMarkClickArgs: GetOnMarkClickCallbackArgs = {
  chartView: { current: true as unknown as View },
  selectedData: { current: null },
  selectedDataBounds: { current: undefined },
  selectedDataName: { current: undefined },
  chartId: 'test',
  hiddenSeries: [],
  setHiddenSeries: jest.fn(),
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
  let setHiddenSeries;
  let onLegendClick;
  const item = {
    context: null,
    height: null,
    width: null,
    items: [{ role: 'legend-label', bounds: null, clip: null, items: [{ datum: { value: 'test' } }] }],
  } as unknown as Item;

  beforeEach(() => {
    setHiddenSeries = jest.fn();
    onLegendClick = jest.fn();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should call setHiddenSeries if legendItemValue is found', () => {
    handleLegendItemClick(item, { ...defaultMarkClickArgs, setHiddenSeries, legendIsToggleable: true });
    expect(setHiddenSeries).toHaveBeenCalled();
  });
  test('should not call setHiddenSeries if legendItemValue is not found', () => {
    const item = {} as unknown as Item;
    handleLegendItemClick(item, { ...defaultMarkClickArgs, setHiddenSeries, legendIsToggleable: true });
    expect(setHiddenSeries).not.toHaveBeenCalled();
  });
  test('should not call setHiddenSeries if legendHasPopover is true', () => {
    const item = {} as unknown as Item;
    handleLegendItemClick(item, { ...defaultMarkClickArgs, setHiddenSeries, legendHasPopover: true });
    expect(setHiddenSeries).not.toHaveBeenCalled();
  });
  test('should not call setHiddenSeries if trigger is contextmenu', () => {
    const item = {} as unknown as Item;
    handleLegendItemClick(item, { ...defaultMarkClickArgs, setHiddenSeries, trigger: 'contextmenu' });
    expect(setHiddenSeries).not.toHaveBeenCalled();
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

describe('getOnMarkClickCallback()', () => {
  const fakeClickEvent = { type: 'click' } as Parameters<ReturnType<typeof getOnMarkClickCallback>>[0];

  describe('mark click with markHasPopover', () => {
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

  describe('with thumbnail item', () => {
    const barItemDatum = { browser: 'Chrome', downloads: 27000 };
    const barSceneItem = {
      bounds: { x1: 10, x2: 50, y1: 100, y2: 200 },
      datum: barItemDatum,
      mark: { name: 'bar0', marktype: 'rect', role: 'mark', group: { x: 0, y: 0 }, items: [] },
    };
  
    const thumbnailItem = {
      bounds: { x1: 10, x2: 50, y1: 200, y2: 250 },
      datum: { browser: 'Chrome', thumbnail: '/chrome.png' },
      mark: {
        name: 'axis0AxisThumbnail0',
        marktype: 'image',
        role: 'mark',
        group: { x: 0, y: 0 },
        items: [],
      },
    } as unknown as Item;
  
    const thumbnailPopoverConfig = {
      thumbnailNames: ['axis0AxisThumbnail0'],
      dimensionField: 'browser',
      barMarkName: 'bar0',
    };

    test('should set selectedData when thumbnail item is clicked and matching bar item found', () => {
      const selectedData = { current: null as unknown };
      const selectedDataBounds = { current: undefined as unknown };
      const selectedDataName = { current: undefined as unknown };
      const mockView = {
        scenegraph: () => ({ root: { items: [barSceneItem] } }),
      } as unknown as View;
  
      const callback = getOnMarkClickCallback({
        ...defaultMarkClickArgs,
        chartView: { current: mockView },
        selectedData: selectedData as GetOnMarkClickCallbackArgs['selectedData'],
        selectedDataBounds: selectedDataBounds as GetOnMarkClickCallbackArgs['selectedDataBounds'],
        selectedDataName: selectedDataName as GetOnMarkClickCallbackArgs['selectedDataName'],
        thumbnailPopoverConfig,
      });
      callback(fakeClickEvent, thumbnailItem);
      expect(selectedData.current).toStrictEqual({ [COMPONENT_NAME]: 'bar0', ...barItemDatum });
      expect(selectedDataName.current).toBe('bar0');
    });

    test('should not set selectedData when thumbnailPopoverConfig is omitted', () => {
      const selectedData = { current: null as unknown };
      const callback = getOnMarkClickCallback({
        ...defaultMarkClickArgs,
        selectedData: selectedData as GetOnMarkClickCallbackArgs['selectedData'],
      });
      callback(fakeClickEvent, thumbnailItem);
      expect(selectedData.current).toBeNull();
    });
  
    test('should not set selectedData when thumbnail name is not in config thumbnailNames', () => {
      const selectedData = { current: null as unknown };
      const mockView = {
        scenegraph: () => ({ root: { items: [barSceneItem] } }),
      } as unknown as View;
      const callback = getOnMarkClickCallback({
        ...defaultMarkClickArgs,
        chartView: { current: mockView },
        selectedData: selectedData as GetOnMarkClickCallbackArgs['selectedData'],
        thumbnailPopoverConfig: {
          thumbnailNames: ['axis1AxisThumbnail0'],
          dimensionField: 'browser',
          barMarkName: 'bar0',
        },
      });
      callback(fakeClickEvent, thumbnailItem);
      expect(selectedData.current).toBeNull();
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
});

describe('isThumbnailItem()', () => {
  test('should return true for an image mark whose name includes AxisThumbnail', () => {
    const item = {
      bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
      datum: {},
      mark: { marktype: 'image', name: 'axis0AxisThumbnail0', role: 'mark', group: { x: 0, y: 0 }, items: [] },
    } as ActionItem;
    expect(isThumbnailItem(item)).toBe(true);
  });

  test('should return false for a non-image mark', () => {
    const item = {
      bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
      datum: {},
      mark: { marktype: 'rect', name: 'axis0AxisThumbnail0', role: 'mark', group: { x: 0, y: 0 }, items: [] },
    } as ActionItem;
    expect(isThumbnailItem(item)).toBe(false);
  });

  test('should return false for an image mark whose name does not include AxisThumbnail', () => {
    const item = {
      bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
      datum: {},
      mark: { marktype: 'image', name: 'someOtherImage', role: 'mark', group: { x: 0, y: 0 }, items: [] },
    } as ActionItem;
    expect(isThumbnailItem(item)).toBe(false);
  });
});

describe('findSceneItemByDimension()', () => {
  const barItem = {
    bounds: { x1: 10, x2: 50, y1: 100, y2: 200 },
    datum: { browser: 'Chrome', downloads: 27000 },
    mark: { name: 'bar0', marktype: 'rect', role: 'mark', group: { x: 0, y: 0 }, items: [] },
  };

  const buildView = (root: unknown) =>
    ({ scenegraph: () => ({ root }) } as unknown as View);

  test('should return a matching item found at the root level', () => {
    const view = buildView({ items: [barItem] });
    const result = findSceneItemByDimension(view, 'bar0', 'browser', 'Chrome');
    expect(result).toBe(barItem);
  });

  test('should return matching item after traversing non-matching siblings in a nested structure', () => {
    const nonMatchingBarSibling = {
      bounds: { x1: 1, x2: 2, y1: 3, y2: 4 },
      datum: { browser: 'Firefox', downloads: 100 },
      mark: { name: 'bar0', marktype: 'rect', role: 'mark', group: { x: 0, y: 0 }, items: [] },
    };
    const group = { items: [{ items: [nonMatchingBarSibling, barItem] }] };
    const view = buildView(group);
    const result = findSceneItemByDimension(view, 'bar0', 'browser', 'Chrome');
    expect(result).toBe(barItem);
  });

  test('should return undefined when dimension value does not match', () => {
    const view = buildView({ items: [barItem] });
    const result = findSceneItemByDimension(view, 'bar0', 'browser', 'Firefox');
    expect(result).toBeUndefined();
  });

  test('should return undefined when mark name does not match', () => {
    const view = buildView({ items: [barItem] });
    const result = findSceneItemByDimension(view, 'bar1', 'browser', 'Chrome');
    expect(result).toBeUndefined();
  });

  test('should return undefined when scenegraph is empty', () => {
    const view = buildView({ items: [] });
    const result = findSceneItemByDimension(view, 'bar0', 'browser', 'Chrome');
    expect(result).toBeUndefined();
  });
});
