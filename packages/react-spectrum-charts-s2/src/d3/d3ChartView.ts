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
import { D3Chart, HitTarget, ItemBounds } from '@spectrum-charts/chart-d3';
import {
  FILTERED_TABLE,
  HOVERED_ITEM,
  SELECTED_GROUP,
  SELECTED_ITEM,
  SELECTED_SERIES,
} from '@spectrum-charts/core-s2/constants';

type Padding = number | { top?: number; right?: number; bottom?: number; left?: number } | undefined;
type ItemListener = (event: Event, item: D3SceneItem | null) => void;
type SignalListener = (name: string, value: unknown) => void;

/** Root group of synthetic items; its empty mark ends group-offset traversal in vega-tooltip and markClickUtils. */
const ROOT = { x: 0, y: 0, mark: {} };

/** The subset of a Vega scene item that the shared click, popover and tooltip utilities read. */
export interface D3SceneItem {
  datum: Record<string, unknown> | D3SceneItem;
  bounds: ItemBounds;
  mark: { name: string; marktype: string; group: typeof ROOT; role?: string; items?: unknown[] };
  isVoronoi?: boolean;
  /** Present only when the mark encodes a tooltip, like Vega items. */
  tooltip?: Exclude<HitTarget['tooltip'], undefined>;
}

/** Signals that map onto chart-d3 state. */
const STATE_SIGNALS: Record<string, 'selectedId' | 'selectedSeries' | 'selectedGroup'> = {
  [SELECTED_ITEM]: 'selectedId',
  [SELECTED_SERIES]: 'selectedSeries',
  [SELECTED_GROUP]: 'selectedGroup',
};

const sceneItem = (name: string, marktype: string, bounds: ItemBounds, datum: D3SceneItem['datum']): D3SceneItem => ({
  datum,
  bounds,
  mark: { name, marktype, group: ROOT },
});

/**
 * Converts a chart-d3 hit target to a Vega-like scene item, nesting voronoi points like Vega's voronoi datum.
 * @param target
 * @returns scene item
 */
export const toSceneItem = (target: HitTarget): D3SceneItem => {
  if (target.role) {
    const item = sceneItem(target.mark, 'text', target.bounds, target.datum);
    const tooltip = target.tooltip === undefined ? {} : { tooltip: target.tooltip };
    return { ...item, ...tooltip, mark: { ...item.mark, role: target.role, items: new Array(target.itemCount ?? 1) } };
  }
  if (!target.point) return sceneItem(target.mark, 'symbol', target.bounds, target.datum);
  const point = sceneItem(target.point.mark, 'symbol', target.point.bounds, target.datum);
  return { ...sceneItem(target.mark, 'path', target.bounds, point), isVoronoi: true };
};

const getPaddingOffset = (padding: Padding): [number, number] =>
  typeof padding === 'number' ? [padding, padding] : [padding?.left ?? 0, padding?.top ?? 0];

/**
 * Wraps a chart-d3 chart in the subset of the Vega View API that the shared React interaction code uses.
 * @param chart
 * @param padding
 * @returns view-like bridge
 */
export const createD3ChartView = (chart: D3Chart, padding: Padding) => {
  const signals = new Map<string, unknown>();
  const signalListeners = new Map<string, Set<SignalListener>>();
  const rendererOrigin = (): [number, number] => {
    const origin = chart.getLayout()?.origin ?? { x: 0, y: 0 };
    return [origin.x, origin.y];
  };

  const view = {
    chart,
    signal(name: string, ...value: unknown[]) {
      if (!value.length) return signals.get(name);
      signals.set(name, value[0]);
      if (name in STATE_SIGNALS) chart.setState({ [STATE_SIGNALS[name]]: value[0] ?? null });
      else if (name.endsWith(`_${HOVERED_ITEM}`) && value[0] == null) chart.setState({ hoveredItem: null });
      signalListeners.get(name)?.forEach((listener) => listener(name, value[0]));
      return view;
    },
    addSignalListener(name: string, listener: SignalListener) {
      signalListeners.set(name, (signalListeners.get(name) ?? new Set()).add(listener));
      return view;
    },
    removeSignalListener(name: string, listener: SignalListener) {
      signalListeners.get(name)?.delete(listener);
      return view;
    },
    run: () => view,
    runAsync: () => Promise.resolve(view),
    data: (name: string) => (name === FILTERED_TABLE ? chart.getData() : []),
    /** Like Vega's view origin, which excludes padding. */
    origin(): [number, number] {
      const [x, y] = rendererOrigin();
      const [left, top] = getPaddingOffset(padding);
      return [x - left, y - top];
    },
    /** Like Vega's renderer origin, which includes padding. */
    rendererOrigin,
    scale(name: string) {
      const legendIndex = /^legend(\d+)Entries$/.exec(name)?.[1];
      const entries = legendIndex === undefined ? [] : chart.getLayout()?.legends[Number(legendIndex)]?.entries;
      const domain = entries?.map(({ value }) => value) ?? [];
      return { domain: () => domain, range: () => [] };
    },
    container: () => chart.element.parentElement,
    addEventListener(type: string, listener: ItemListener) {
      const emit = (event: Event, target: HitTarget | null) => listener(event, target ? toSceneItem(target) : null);
      if (type === 'click' || type === 'contextmenu') {
        chart.on(type, (_datum, event, target) => emit(event, target));
      } else if (type === 'mouseover' || type === 'mouseout') {
        let previous: HitTarget | null = null;
        chart.on('hover', (_datum, target, event) => {
          const synthetic = event ?? new MouseEvent(type);
          if (type === 'mouseout' && previous) emit(synthetic, previous);
          if (type === 'mouseover' && target) emit(synthetic, target);
          previous = target;
        });
      }
      return view;
    },
    toSVG: () => Promise.resolve(chart.toSVG()),
    toCanvas: () => Promise.resolve(chart.toCanvas()),
    toImageURL(type: string) {
      if (type === 'svg') return Promise.resolve(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(chart.toSVG())}`);
      return Promise.resolve(chart.toCanvas().toDataURL('image/png'));
    },
  };
  return view;
};

export type D3ChartView = ReturnType<typeof createD3ChartView>;
