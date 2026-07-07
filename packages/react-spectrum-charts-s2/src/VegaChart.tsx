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

import { TABLE } from '@spectrum-charts/constants';
import { getLocale } from '@spectrum-charts/locales';
import {
  ChartData,
  UserMeta,
  applyUserMetaConfigPatches,
  getTitleFontShorthand,
  getVegaEmbedOptions,
  wrapTitleText,
} from '@spectrum-charts/vega-spec-builder-s2';

import { useDebugSpec } from './hooks/useDebugSpec';
import { extractValues, isVegaData } from './hooks/useSpec';
import { ChartProps } from './types';

// Register a custom expression function that returns the full container width (including axis space).
// `view._viewWidth` is the container width minus spec-level padding; adding padding back gives the
// true container width. Passing `width` as an argument creates a reactive dependency so the signal
// re-evaluates on every resize.
expressionFunction('rscContainerWidth', function (this: { context: { dataflow: View } }) {
  const view = this.context.dataflow;
  const p = view.padding() as { left?: number; right?: number };
  const viewWidth = (view as unknown as { _viewWidth?: number })._viewWidth ?? 0;
  return viewWidth + (p.left ?? 0) + (p.right ?? 0);
});

// Handles making sure the title wraps correctly on resize
expressionFunction('rscWrapTitle', (text: string, maxWidth: number): string[] =>
  wrapTitleText(text, maxWidth)
);

/**
 * Resizes an existing Vega view without recreating it.
 */
export const resizeView = (view: View | undefined, width: number, height: number): void => {
  if (view && width && height) {
    // Two passes: first updates width/height signals; second lets Vega re-settle layout
    // after dependent changes (e.g. legend column count → legend height → plot area height).
    view.width(width).height(height).resize().runAsync().then(() => view.runAsync());
  }
};

// Upper bound on how long the initial embed will wait for the title font. Font loads are
// normally near-instant (cached or already triggered by other chart text), but a blocked or
// slow font fetch must never delay the chart's first paint indefinitely.
const TITLE_FONT_READY_TIMEOUT_MS = 250;

/**
 * Resolves once the title font is available for canvas measurement, or after
 * TITLE_FONT_READY_TIMEOUT_MS, whichever comes first. Vega evaluates the rscWrapTitle expression
 * synchronously while parsing the spec in embed(), so if the font isn't loaded yet, getLabelWidth
 * silently measures with a fallback font and the title wraps incorrectly on the first paint.
 * Awaiting this before the initial embed avoids that bad frame in the common case. Never rejects
 * and never blocks longer than the timeout, so a stalled or failed font fetch can't block rendering.
 */
const ensureTitleFontReady = (): Promise<unknown> => {
  if (typeof document === 'undefined' || !document.fonts) {
    return Promise.resolve();
  }
  const fontReady =
    typeof document.fonts.load === 'function'
      ? document.fonts.load(getTitleFontShorthand()).catch(() => undefined)
      : (document.fonts.ready ?? Promise.resolve());
  const timeout = new Promise((resolve) => setTimeout(resolve, TITLE_FONT_READY_TIMEOUT_MS));
  return Promise.race([fontReady, timeout]);
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
  const hasMounted = useRef(false);
  // Only the very first embed attempt (titled or not) may wait on font readiness — every later
  // re-embed (triggered by prop identity changes, e.g. hover-driven state updates, or a title
  // appearing after an initial untitled mount) must stay synchronous, since by then the font has
  // virtually certainly already loaded and any added delay makes an otherwise-instant view
  // destroy/recreate visibly flicker.
  const hasAttemptedEmbed = useRef(false);
  // AN-445759: flipped to true when dimensions become valid post-mount with no existing view,
  // forcing the embed effect to run even though width/height are not in its deps.
  const [needsInitEmbed, setNeedsInitEmbed] = useState(false);

  const { number: numberLocale, time: timeLocale } = useMemo(() => getLocale(locale), [locale]);

  // Need to de a deep copy of the data because vega tries to transform the data
  const chartData = useMemo(() => {
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
    if (width && height && containerRef.current) {
      const specCopy = JSON.parse(JSON.stringify(spec)) as Spec;
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

      const titleSignal = specCopy.signals?.find((s) => s.name === 'rscTitleText');
      const titleValue = titleSignal && 'value' in titleSignal ? titleSignal.value : undefined;
      const hasTitle = typeof titleValue === 'string' && titleValue.length > 0;

      const runEmbed = () => {
        if (cancelled || !containerRef.current) {
          return;
        }
        const embedOptions = getVegaEmbedOptions({ locale, height, width, padding, renderer, config });
        const { patches } = (specCopy.usermeta as UserMeta | undefined) ?? {};
        const finalConfig = applyUserMetaConfigPatches(patches, embedOptions.config);

        embed(containerRef.current, specCopy, { ...embedOptions, config: finalConfig, tooltip }).then(({ view }) => {
          chartView.current = view;
          onNewView(view);
          view.resize();
          view.runAsync();
          // One additional render to settle all resize calculations
          setTimeout(() => view.runAsync(), 0);

          // The initial embed above is already gated on font readiness via ensureTitleFontReady
          // when a title is present, so this re-evaluates the wrap as a safety net in case the
          // font wasn't actually ready for canvas measurement by the time embed() parsed the spec.
          // Subsequent evaluations fire via the rscWrapTitle expression on resize.
          if (hasTitle) {
            (document.fonts?.ready ?? Promise.resolve()).then(() => {
              if (view !== chartView.current) {
                return;
              }
              const titleText = view.signal('rscTitleText') as string;
              if (!titleText) {
                return;
              }
              const limit = view.signal('rscTitleLimit') as number;
              view.signal('rscWrappedTitleText', wrapTitleText(titleText, limit)).runAsync();
            });
          }
        });
      };

      const isInitialEmbedAttempt = !hasAttemptedEmbed.current;
      hasAttemptedEmbed.current = true;

      if (hasTitle && isInitialEmbedAttempt) {
        ensureTitleFontReady().then(runEmbed);
      } else {
        runEmbed();
      }
    }
    return () => {
      cancelled = true;
      // destroy the chart on unmount
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
