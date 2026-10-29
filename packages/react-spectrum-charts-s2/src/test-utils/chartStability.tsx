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
import { ReactElement } from 'react';

import { act } from '@testing-library/react';
import { RenderModule, View, renderModule } from 'vega';
import * as vegaEmbed from 'vega-embed';

import { Provider } from '@react-spectrum/s2';
import { ANIMATION_ACTIVE, DEFAULT_COLOR_SCHEME, FIRST_MARK_ID, MARK_ID } from '@spectrum-charts/core-s2/constants';

import { render } from './spectrumRender.js';

/** Builds a chart element that passes the harness's `onVegaViewReady` to its `Chart`. */
export type ChartFactory<P> = (props: P) => ReactElement;

/** A serialized scene graph node. */
export type SceneNode = { [key: string]: unknown };

type Mounted = ReturnType<typeof render>;

// called with one argument renderModule is a getter, which vega-typings doesn't declare
const getRenderModule = renderModule as unknown as (name: string) => RenderModule;
const svgRenderer = getRenderModule('svg').renderer.prototype as unknown as { render: (...args: unknown[]) => unknown };

const embed = vegaEmbed.default;

const SETTLE_TIMEOUT_MS = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAnimating = (view: View): boolean => {
  try {
    return Boolean(view.signal(ANIMATION_ACTIVE));
  } catch {
    return false;
  }
};

/** Counts the views and SVG renders of every chart rendered in the enclosing `describe`. */
export const setupChartHarness = () => {
  const views: View[] = [];
  let renderSpy: jest.SpyInstance | undefined;
  let embedSpy: jest.SpyInstance | undefined;
  let pendingEmbeds = 0;

  beforeEach(() => {
    views.length = 0;
    pendingEmbeds = 0;
    renderSpy = jest.spyOn(svgRenderer, 'render');
    embedSpy = jest.spyOn(vegaEmbed, 'default').mockImplementation((...args) => {
      pendingEmbeds++;
      const result = embed(...args);
      const done = () => pendingEmbeds--;
      result.then(done, done);
      return result;
    });
  });

  afterEach(() => {
    renderSpy?.mockRestore();
    embedSpy?.mockRestore();
    renderSpy = undefined;
    embedSpy = undefined;
  });

  const onVegaViewReady = (view: View) => {
    views.push(view);
  };

  const latestView = (): View => {
    const view = views.at(-1);
    if (!view) {
      throw new Error('No view rendered');
    }
    return view;
  };

  const renderCount = () => renderSpy?.mock.calls.length ?? 0;

  /** Waits until every pending embed, dataflow run, render and animation has finished. */
  const settle = async () => {
    const deadline = Date.now() + SETTLE_TIMEOUT_MS;
    let previous = '';
    let stableChecks = 0;
    for (;;) {
      await act(async () => {
        await sleep(0);
        const view = views.at(-1);
        await view?.runAsync();
        if (view && isAnimating(view)) {
          await sleep(16);
        }
      });
      const view = views.at(-1);
      const snapshot = `${views.length}:${renderCount()}`;
      const busy = pendingEmbeds > 0 || (view !== undefined && isAnimating(view));
      stableChecks = snapshot === previous && !busy ? stableChecks + 1 : 0;
      if (stableChecks === 2) {
        return;
      }
      if (Date.now() > deadline) {
        throw new Error('Chart did not settle');
      }
      previous = snapshot;
    }
  };

  /** Mounts a chart and settles it. */
  const mount = async (element: ReactElement): Promise<Mounted> => {
    const mounted = render(element);
    await settle();
    return mounted;
  };

  /** Rerenders a mounted chart with a new element and settles it. */
  const update = async (mounted: Mounted, element: ReactElement) => {
    mounted.rerender(<Provider colorScheme={DEFAULT_COLOR_SCHEME}>{element}</Provider>);
    await settle();
  };

  /**
   * Mounts each element in order, then reports the views and renders created after the initial mount.
   * @param elements the initial element followed by each update
   * @returns new views and renders after mount
   */
  const countUpdates = async ([initial, ...updates]: ReactElement[]) => {
    const mounted = await mount(initial);
    const mountViews = views.length;
    const mountRenders = renderCount();
    for (const element of updates) {
      await update(mounted, element);
    }
    mounted.unmount();
    return { mountViews, mountRenders, views: views.length - mountViews, renders: renderCount() - mountRenders };
  };

  /**
   * Mounts with props `a`, updates to `b` and settles, then compares against a fresh mount of `b`.
   * @param chart builds the chart for a set of props
   * @param a initial props
   * @param b updated props
   * @param options `interact` runs on the settled mount of `a`; `expected` replaces `b` for the fresh mount
   * @returns the normalized updated and freshly mounted scenes, and the updated view
   */
  const compareUpdateToMount = async <P,>(
    chart: ChartFactory<P>,
    a: P,
    b: P,
    { interact, expected = b }: { interact?: () => Promise<void>; expected?: P } = {}
  ) => {
    const mounted = await mount(chart(a));
    if (interact) {
      await interact();
      await settle();
    }
    await update(mounted, chart(b));
    const updatedView = latestView();
    const updated = getScene(updatedView);
    mounted.unmount();

    const fresh = await mount(chart(expected));
    const freshScene = getScene(latestView());
    fresh.unmount();

    return { updated, fresh: freshScene, updatedView };
  };

  return { views, onVegaViewReady, latestView, renderCount, settle, mount, update, countUpdates, compareUpdateToMount };
};

// back-references, renderer state and generated ids (MARK_ID counts up across a view's dataflow runs);
// vega's sceneToJSON is avoided because its key list drops gradients, cursors and data
const OMITTED_KEYS = new Set([
  'mark',
  'group',
  'source',
  'context',
  'dirty',
  '_svg',
  '_update',
  '_bounds',
  'clip_id',
  MARK_ID,
  FIRST_MARK_ID,
]);

const serialize = (value: unknown, path: Set<object>): unknown => {
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }
  // in-place updates can differ from a fresh mount by float rounding error
  if (typeof value === 'number') {
    return Number(value.toPrecision(12));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (path.has(value)) {
    throw new Error('Scene graph contains a cycle');
  }
  path.add(value);
  const result = Array.isArray(value)
    ? value.map((entry) => serialize(entry, path))
    : Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !OMITTED_KEYS.has(key))
          // gradient ids come from a global counter
          .filter(([key]) => !(key === 'id' && 'gradient' in value))
          // popover group ids default to MARK_ID
          .filter(([key]) => !key.endsWith('_selectedGroupId'))
          .map(([key, entry]) => [key, serialize(entry, path)])
      );
  path.delete(value);
  if ('role' in value && AXIS_ITEM_ROLES.has(value.role as string)) {
    sortByTickValue((result as { items?: unknown[] }).items);
  }
  return result;
};

// vega appends ticks that enter on a domain change, so axis item order isn't meaningful
const AXIS_ITEM_ROLES = new Set(['axis-tick', 'axis-label', 'axis-grid']);

const sortByTickValue = (items: unknown[] | undefined) =>
  items?.sort((a, b) => getTickValue(a) - getTickValue(b));

const getTickValue = (item: unknown): number => Number((item as { datum?: { value?: unknown } }).datum?.value);

/**
 * Serializes a view's scene graph with back-references and nondeterministic fields removed.
 * @param view
 * @returns SceneNode
 */
export const getScene = (view: View): SceneNode =>
  serialize((view.scenegraph() as unknown as { root: unknown }).root, new Set()) as SceneNode;
