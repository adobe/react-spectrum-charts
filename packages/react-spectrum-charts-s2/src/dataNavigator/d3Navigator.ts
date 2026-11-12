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
import dataNavigator, { NodeObject, Structure } from 'data-navigator';

import {
  D3Chart,
  D3ChartOptions,
  LineOptions,
  NavigationItems,
  NavigationPoint,
  NavigationSeries,
} from '@spectrum-charts/chart-d3';
import { DEFAULT_METRIC, DEFAULT_TIME_DIMENSION } from '@spectrum-charts/core-s2/constants';

import './dataNavigator.css';
import { addSiblingKeySynonyms, baseNavigationRules } from './navigationRules.js';

/* data-navigator's `rendering()` and `input()` factories are typed as `() => any`. */
interface DataNavigatorRenderer {
  initialize: () => void;
  render: (node: { renderId: string; datum: NodeObject }) => HTMLElement | undefined;
  remove: (renderId: string) => void;
  wrapper?: HTMLElement;
  exitElement?: HTMLElement;
  entryButton?: HTMLElement;
}

interface DataNavigatorInput {
  enter: () => NodeObject | undefined;
  move: (current: string | null, direction: string) => NodeObject | undefined;
  keydownValidator: (event: KeyboardEvent) => string | undefined;
  focus: (renderId: string) => void;
}

interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type Target =
  | { kind: 'chart' }
  | { kind: 'series'; series: NavigationSeries }
  | { kind: 'point'; point: NavigationPoint };

interface LabelFields {
  dimension: string;
  metric: string;
  isTime: boolean;
  locale?: string;
}

export interface D3NavigationStructure {
  structure: Structure;
  entryPoint: string;
  targets: Map<string, Target>;
}

const CLEARED_FOCUS = {
  focusedItem: null,
  focusedSeries: null,
  focusedRegion: null,
  hoveredItem: null,
};

const addEdge = (structure: Structure, source: string, target: string, navigationRules: string[]) => {
  const edgeId = `${source}<->${target}`;
  structure.edges[edgeId] = { source, target, navigationRules };
  structure.nodes[source].edges.push(edgeId);
  structure.nodes[target].edges.push(edgeId);
};

const formatValue = (value: unknown, fields: LabelFields, isTime = false): string => {
  if (isTime && typeof value === 'number') {
    return new Intl.DateTimeFormat(fields.locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(value);
  }
  return typeof value === 'number' ? value.toLocaleString(fields.locale) : String(value);
};

const pointLabel = (point: NavigationPoint, fields: LabelFields): string =>
  `${fields.dimension}: ${formatValue(point.datum[fields.dimension], fields, fields.isTime)}, ${
    fields.metric
  }: ${formatValue(point.datum[fields.metric], fields)}`;

const getLabelFields = (options: D3ChartOptions): LabelFields => {
  const mark = options.marks.find((m): m is LineOptions => m.markType === 'line');
  return {
    dimension: mark?.dimension ?? DEFAULT_TIME_DIMENSION,
    metric: mark?.metric ?? DEFAULT_METRIC,
    isTime: (mark?.scaleType ?? 'time') === 'time',
    locale: options.locale,
  };
};

/**
 * Builds a chart → series → point navigation structure: Enter drills in, Escape drills out, arrows move between siblings.
 * @param items
 * @param options
 * @param chartId
 * @returns structure, entry point, and the chart item behind each node
 */
export const buildD3NavigationStructure = (
  items: NavigationItems,
  options: D3ChartOptions,
  chartId: string
): D3NavigationStructure => {
  const fields = getLabelFields(options);
  const rootId = `${chartId}-chart`;
  const structure: Structure = { nodes: {}, edges: {}, navigationRules: baseNavigationRules };
  const targets = new Map<string, Target>();
  const seriesCount = items.series.length;
  const summary = `Line chart with ${seriesCount} series`;
  structure.nodes[rootId] = {
    id: rootId,
    renderId: rootId,
    edges: [],
    dimensionLevel: 0,
    semantics: { label: options.title ? `${options.title}. ${summary}` : summary },
  };
  targets.set(rootId, { kind: 'chart' });

  items.series.forEach((series, s) => {
    const seriesId = `${chartId}-s${s}`;
    structure.nodes[seriesId] = {
      id: seriesId,
      renderId: seriesId,
      edges: [],
      dimensionLevel: 1,
      semantics: { label: `${series.seriesId}, series ${s + 1} of ${seriesCount}, ${series.points.length} points` },
    };
    targets.set(seriesId, { kind: 'series', series });
    addEdge(structure, rootId, seriesId, s === 0 ? ['child', 'parent'] : ['parent']);
    if (s > 0) addEdge(structure, `${chartId}-s${s - 1}`, seriesId, ['left', 'right']);

    series.points.forEach((point, p) => {
      const pointId = `${seriesId}p${p}`;
      structure.nodes[pointId] = {
        id: pointId,
        renderId: pointId,
        edges: [],
        semantics: { label: `${pointLabel(point, fields)}, ${series.seriesId}` },
      };
      targets.set(pointId, { kind: 'point', point });
      addEdge(structure, seriesId, pointId, p === 0 ? ['child', 'parent'] : ['parent']);
      if (p > 0) addEdge(structure, `${seriesId}p${p - 1}`, pointId, ['left', 'right']);
    });
  });
  addSiblingKeySynonyms(structure);
  return { structure, entryPoint: rootId, targets };
};

const focusState = (target: Target) => {
  if (target.kind === 'point') {
    return { ...CLEARED_FOCUS, focusedItem: target.point.datum, hoveredItem: target.point.datum };
  }
  if (target.kind === 'series') {
    return { ...CLEARED_FOCUS, focusedSeries: target.series.seriesId };
  }
  return { ...CLEARED_FOCUS, focusedRegion: 'chart' as const };
};

const position = (el: HTMLElement, bounds: Bounds) => {
  el.style.left = `${bounds.x1}px`;
  el.style.top = `${bounds.y1}px`;
  el.style.width = `${bounds.x2 - bounds.x1}px`;
  el.style.height = `${bounds.y2 - bounds.y1}px`;
  el.style.outline = 'none';
  el.style.boxShadow = 'none';
};

const targetBounds = (target: Target, items: NavigationItems): Bounds => {
  if (target.kind === 'point') return target.point.bounds;
  if (target.kind === 'series') return target.series.bounds;
  return items.chart;
};

export interface AttachD3NavigatorOptions {
  /** Positioned element wrapping the chart; navigation overlays are added to it. */
  container: HTMLElement;
  chart: D3Chart;
  options: D3ChartOptions;
  chartId: string;
}

/**
 * Attaches keyboard navigation to a D3 chart; the focus ring is drawn by the chart, overlays only carry focus and labels.
 * @param options
 * @returns a function that detaches the navigator
 */
export const attachD3Navigator = ({ container, chart, options, chartId }: AttachD3NavigatorOptions): (() => void) => {
  const items = chart.getNavigationItems();
  const { structure, entryPoint, targets } = buildD3NavigationStructure(items, options, chartId);
  if (!container.id) container.id = `dn-root-${chartId}`;
  container.querySelectorAll('.dn-wrapper, .dn-exit-position, .dn-exit').forEach((node) => node.remove());

  let current: string | null = null;
  const rendering: DataNavigatorRenderer = dataNavigator.rendering({
    elementData: structure.nodes,
    defaults: {
      cssClass: 'dn-node',
      spatialProperties: { x: 0, y: 0, width: container.clientWidth || 400, height: container.clientHeight || 300 },
    },
    suffixId: chartId,
    root: { id: container.id, description: 'Accessible chart navigation', width: '100%', height: '100%' },
    entryButton: { include: true, callbacks: { click: enter } },
    exitElement: { include: true },
  });
  rendering.initialize();
  const input: DataNavigatorInput = dataNavigator.input({
    structure,
    navigationRules: baseNavigationRules,
    entryPoint,
    exitPoint: rendering.exitElement?.id,
  });

  function enter() {
    const node = input.enter();
    if (node) navigate(node);
  }

  function navigate(node: NodeObject) {
    const renderId = node.renderId ?? node.id;
    if (rendering.entryButton) (rendering.entryButton as HTMLButtonElement).tabIndex = -1;
    const previous = current;
    const el = rendering.render({ renderId, datum: node });
    if (!el) return;
    const target = targets.get(node.id);
    if (target) position(el, targetBounds(target, items));

    el.addEventListener('keydown', (event) => {
      const direction = input.keydownValidator(event);
      if (!direction) return;
      event.preventDefault();
      const next = input.move(current, direction);
      if (next) {
        navigate(next);
        return;
      }
      if (direction === 'parent' && rendering.exitElement) {
        rendering.exitElement.style.display = 'block';
        input.focus(rendering.exitElement.id);
      }
    });
    el.addEventListener('focus', () => {
      if (target) chart.setState(focusState(target));
    });

    // Set before focusing so listeners see the new node; remove the old node after so its focusout stays inside.
    current = node.id;
    input.focus(renderId);
    if (previous && previous !== node.id) rendering.remove(previous);
  }

  const clearFocusVisuals = () => chart.setState(CLEARED_FOCUS);

  const clearFocusState = () => {
    if (current) rendering.remove(current);
    current = null;
    if (rendering.entryButton) (rendering.entryButton as HTMLButtonElement).tabIndex = 0;
    clearFocusVisuals();
  };

  const handleFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (next instanceof Node && container.contains(next)) return;
    clearFocusVisuals();
  };
  rendering.wrapper?.addEventListener('focusout', handleFocusOut);
  rendering.exitElement?.addEventListener('focus', clearFocusState);

  return () => {
    rendering.wrapper?.removeEventListener('focusout', handleFocusOut);
    rendering.exitElement?.removeEventListener('focus', clearFocusState);
    container
      .querySelectorAll('.dn-wrapper, .dn-exit-position, .dn-exit, .dn-entry-button')
      .forEach((node) => node.remove());
    if (current) clearFocusVisuals();
  };
};
