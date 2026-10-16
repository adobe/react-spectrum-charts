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
import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { Config, Padding, Renderers, Spec, View, expressionFunction } from 'vega';
import embed from 'vega-embed';
import { Options as TooltipOptions } from 'vega-tooltip';

import { DRAW_IN_PAINT_FADE_MS, S2_EASE_OUT, TABLE } from '@spectrum-charts/core-s2/constants';
import { getLocale } from '@spectrum-charts/core-s2/locales';
import {
  ChartData,
  UserMeta,
  applyUserMetaConfigPatches,
  getVegaEmbedOptions,
} from '@spectrum-charts/vega-spec-builder-s2';

import { attachAnimationTicker, isAnimatedSpec, removeAnimationTimerEvents } from './animation/animationTicker.js';
import { getDrawInStart, hasDrawIn, hasTableRows, restoreDrawInStart } from './animation/drawInContinuity.js';
import { useDebugSpec } from './hooks/useDebugSpec.js';
import { extractValues, isVegaData } from './hooks/useSpec.js';
import { ChartProps } from './types/index.js';

// Register a custom expression function that returns the full container width (including axis space).
// `view._viewWidth` is the container width minus spec-level padding; adding padding back gives the
// true container width. Passing `width` as an argument creates a reactive dependency so the signal
// re-evaluates on every resize.
//
// Guarded to browser-only execution: this used to run unconditionally at module load, which crashed
// SSR frameworks server-rendering a "use client" component using this library (there is no `window`
// in Node's module evaluation). jsdom (used by this file's tests) provides `window`, so this still
// registers under Jest.
if (typeof window !== 'undefined') {
  expressionFunction('rscContainerWidth', function (this: { context: { dataflow: View } }) {
    const view = this.context.dataflow;
    const p = view.padding() as { left?: number; right?: number };
    const viewWidth = (view as unknown as { _viewWidth?: number })._viewWidth ?? 0;
    return viewWidth + (p.left ?? 0) + (p.right ?? 0);
  });
}

/**
 * Resizes an existing Vega view without recreating it.
 */
export const resizeView = (view: View | undefined, width: number, height: number): void => {
  if (view && width && height) {
    // Two passes: first updates width/height signals; second lets Vega re-settle layout
    // after dependent changes (e.g. legend column count → legend height → plot area height).
    void view
      .width(width)
      .height(height)
      .resize()
      .runAsync()
      .then(() => view.runAsync());
  }
};

export interface VegaChartProps {
  config: Config;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: ChartData[];
  debug: boolean;
  height: number;
  locale: ChartProps['locale'];
  onNewView: (view: View) => void;
  padding: Padding;
  renderer: Renderers;
  signals?: Record<string, unknown>;
  spec: Spec;
  tooltip: TooltipOptions;
  width: number;
}

export const VegaChart: FC<VegaChartProps> = ({
  config,
  data,
  debug,
  height,
  locale,
  onNewView,
  padding,
  renderer = 'svg',
  signals,
  spec,
  tooltip,
  width,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartView = useRef<View | undefined>(undefined);
  const detachAnimationTicker = useRef<(() => void) | undefined>(undefined);
  const hasMounted = useRef(false);
  // carried across rebuilds so draw-in plays once per mount
  const drawInStart = useRef<number | undefined>(undefined);
  // AN-445759: flipped to true when dimensions become valid post-mount with no existing view,
  // forcing the embed effect to run even though width/height are not in its deps.
  const [needsInitEmbed, setNeedsInitEmbed] = useState(false);

  const { number: numberLocale, time: timeLocale } = useMemo(() => getLocale(locale), [locale]);

  // Need to de a deep copy of the data because vega tries to transform the data
  const chartData = useMemo(() => {
    // JSON round-trip on purpose: Dates must become strings, as before
    // eslint-disable-next-line no-restricted-syntax
    const clonedData = JSON.parse(JSON.stringify(data));

    // We received a full Vega data array with potentially multiple dataset objects
    if (isVegaData(clonedData)) {
      return extractValues(clonedData);
    }

    // We received a simple array of data and we'll set a default key of 'table' to reference internally
    return { [TABLE]: clonedData };
  }, [data]);

  useDebugSpec(debug, spec, chartData, width, height, config);

  // Handle resize without recreating the view (prevents axis image flickering).
  // AN-445759: skip on initial mount — the embed effect handles that render. After mount, if
  // dimensions become valid with no existing view (started at 0), trigger the embed via needsInitEmbed.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (width && height && !chartView.current) {
      setNeedsInitEmbed(true);
    } else {
      resizeView(chartView.current, width, height);
    }
  }, [width, height]);

  useEffect(() => {
    let cancelled = false;
    let specCopy: Spec | undefined;
    const embeddedAt = Date.now();
    if (width && height && containerRef.current) {
      specCopy = structuredClone(spec);
      const tableData = specCopy.data?.find((d) => d.name === TABLE);
      if (tableData && 'values' in tableData) {
        tableData.values = chartData.table;
      }
      if (signals) {
        specCopy.signals = specCopy.signals?.map((signal) => {
          if (signal.name in signals && signals[signal.name] !== undefined && 'value' in signal) {
            signal.value = signals[signal.name];
          }
          return signal;
        });
      }
      const embedOptions = getVegaEmbedOptions({ locale, height, width, padding, renderer, config });
      const { patches } = (specCopy.usermeta as UserMeta | undefined) ?? {};
      const finalConfig = applyUserMetaConfigPatches(patches, embedOptions.config);
      const isAnimated = isAnimatedSpec(specCopy);
      // an empty chart has nothing drawn, so the next data draws in fresh
      if (!hasTableRows(specCopy)) drawInStart.current = undefined;
      const freshDrawIn = hasDrawIn(specCopy) && hasTableRows(specCopy) && !drawInStart.current;
      restoreDrawInStart(specCopy, drawInStart.current, embeddedAt);
      if (isAnimated) {
        // animated charts are driven by the shared animation ticker instead of Vega's always-on timer
        removeAnimationTimerEvents(specCopy);
      }
      // captured so the async .then attaches the ticker to the element this view was embedded into
      const container = containerRef.current;
      // hidden until the first paint, which then fades in instead of flickering in
      if (freshDrawIn) container.style.opacity = '0';

      void embed(container, specCopy, { ...embedOptions, config: finalConfig, tooltip })
        .then(({ view }) => {
          // cleanup already ran (unmount or re-embed) before embed resolved, so discard this view
          if (cancelled) {
            view.finalize();
            return;
          }
          chartView.current = view;
          if (freshDrawIn) {
            container.style.opacity = '';
            container.animate?.([{ opacity: 0 }, { opacity: 1 }], {
              duration: DRAW_IN_PAINT_FADE_MS,
              easing: `cubic-bezier(${S2_EASE_OUT.join(', ')})`,
            });
          }
          if (isAnimated) {
            detachAnimationTicker.current = attachAnimationTicker(view, container, freshDrawIn);
          }
          onNewView(view);
          view.resize();
          void view.runAsync();
          // One additional render to settle all resize calculations
          setTimeout(() => view.runAsync(), 0);
        })
        .catch((error: unknown) => console.error('Failed to render chart:', error));
    }
    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.style.opacity = '';
      // destroy the chart on unmount
      detachAnimationTicker.current?.();
      detachAnimationTicker.current = undefined;
      if (specCopy) {
        drawInStart.current ??= getDrawInStart(chartView.current, specCopy, embeddedAt);
      }
      if (chartView.current) {
        chartView.current.finalize();
        chartView.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chartData.table,
    config,
    data,
    needsInitEmbed,
    numberLocale,
    timeLocale,
    onNewView,
    padding,
    renderer,
    signals,
    spec,
    tooltip,
    locale,
  ]);

  return <div ref={containerRef} className="rsc"></div>;
};
