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

import dataNavigator, { NodeObject } from 'data-navigator';
import { View } from 'vega';

import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { NavigableChartType, buildChartStructure } from './buildChartStructure';
import './dataNavigator.css';

/*
 * data-navigator's `rendering()` and `input()` factories are typed as `() => any`.
 */
interface DataNavigatorRenderer {
  initialize: () => void;
  render: (node: { renderId: string; datum: NodeObject }) => HTMLElement | undefined;
  remove: (renderId: string) => void;
  wrapper?: HTMLElement;
  exitElement?: HTMLElement;
}

interface DataNavigatorInput {
  enter: () => NodeObject | undefined;
  move: (current: string | null, direction: string) => NodeObject | undefined;
  keydownValidator: (event: KeyboardEvent) => string | undefined;
  focus: (renderId: string) => void;
}

export interface AttachDataNavigatorOptions {
  /** Positioned element the navigation overlay is rendered into. */
  container: HTMLElement;
  /** The chart type to build navigation for. */
  chartType: NavigableChartType;
  /** Chart data (plain objects). */
  data: SimpleData[];
  /** Primary categorical / x-axis field. */
  dimension?: string;
  /** Series / color field (set for stacked bars). */
  color?: string;
  /** Primary metric / y-axis field. */
  metric?: string;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** Stable id used to namespace the rendered nav elements. */
  chartId: string;
  /** Accessor for the live Vega view; focus signals are set on it as the user navigates. */
  getView: () => View | undefined;
}

interface FocusSignals {
  item: string | null; // a single bar / stacked segment
  region: string | null; // the whole chart (entry/root)
  dimension: string | null; // a dimension group, e.g. a whole stack
}

/**
 * Maps the focused node to the chart's focus signals by its level:
 *  - leaf (no dimensionLevel) → a single bar/segment (`item` = node id)
 *  - dimension root (level 1) → the chart overview (`region` = 'chart')
 *  - division (level 2)       → a dimension group / stack (`dimension` = the column value)
 */
const nodeFocusSignals = (node: NodeObject): FocusSignals => {
  if (node.dimensionLevel == null) {
    return { item: node.id, region: null, dimension: null };
  }
  if (node.dimensionLevel === 1) {
    return { item: null, region: 'chart', dimension: null };
  }
  const dimensionValue = node.derivedNode ? node.data?.[node.derivedNode] : undefined;
  return { item: null, region: null, dimension: dimensionValue != null ? String(dimensionValue) : null };
};

const applyFocusSignals = (view: View | undefined, { item, region, dimension }: FocusSignals): void => {
  if (!view) return;

  view.signal(FOCUSED_ITEM, item);
  view.signal(FOCUSED_REGION, region);
  view.signal(FOCUSED_DIMENSION, dimension);
  view.runAsync();
};

const CLEARED_FOCUS: FocusSignals = { item: null, region: null, dimension: null };

/**
 * Builds the navigation structure and drives data-navigator's rendering +
 * input modules. The visible focus indicator is drawn on the Vega canvas (focus-ring marks); the
 * elements created here are invisible overlays used only for keyboard focus and assistive tech.
 */
export const attachDataNavigator = ({
  container,
  chartType,
  data,
  dimension,
  color,
  metric,
  title,
  chartId,
  getView,
}: AttachDataNavigatorOptions): void => {
  const built = buildChartStructure({ chartType, data, dimension, color, metric, title });
  if (!built) return;
  const { structure, entryPoint } = built;

  if (!container.id) {
    container.id = `dn-root-${chartId}`;
  }

  container.querySelectorAll('.dn-wrapper, .dn-exit-position, .dn-exit').forEach((node) => node.remove());

  let current: string | null = null;
  let previous: string | null = null;
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 300;

  const rendering: DataNavigatorRenderer = dataNavigator.rendering({
    elementData: structure.nodes,
    defaults: {
      cssClass: 'dn-node',
      spatialProperties: { x: 0, y: 0, width, height },
    },
    suffixId: chartId,
    root: {
      id: container.id,
      description: 'Accessible chart navigation',
      width: '100%',
      height: 0,
    },
    entryButton: { include: true, callbacks: { click: enter } },
    exitElement: { include: true },
  });

  rendering.initialize();

  const input: DataNavigatorInput = dataNavigator.input({
    structure,
    navigationRules: structure.navigationRules ?? {},
    entryPoint,
    exitPoint: rendering.exitElement?.id,
  });

  function enter() {
    const node = input.enter();
    if (node) {
      navigate(node);
    }
  }

  function navigate(node: NodeObject) {
    const renderId = node.renderId || node.id;
    node.renderId = renderId;

    if (previous) rendering.remove(previous);

    const el = rendering.render({ renderId, datum: node });
    if (!el) return;

    // Visual focus comes from the Vega ring, so overlay the element across the whole container.
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.top = '0';
    el.style.left = '0';

    el.addEventListener('keydown', (event) => {
      const direction = input.keydownValidator(event);
      if (!direction) return;
      event.preventDefault();
      // Final exit behavior is undecided, this is the current placeholder
      if (direction === 'parent' && current === entryPoint) {
        if (rendering.exitElement) {
          rendering.exitElement.style.display = 'block';
          input.focus(rendering.exitElement.id);
        }
        return;
      }
      const next = input.move(current, direction);
      if (next) navigate(next);
    });

    el.addEventListener('focus', () => applyFocusSignals(getView(), nodeFocusSignals(node)));

    input.focus(renderId);
    previous = current;
    current = node.id;
  }

  if (rendering.exitElement) {
    rendering.exitElement.addEventListener('focus', () => {
      if (current) rendering.remove(current);
      current = null;
      applyFocusSignals(getView(), CLEARED_FOCUS);
    });
  }
};
