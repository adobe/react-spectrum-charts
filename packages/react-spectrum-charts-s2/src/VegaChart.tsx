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

type AutosizeGatedView = View & { _resizeView: (...args: unknown[]) => void; __rscAutosizeOpenCount?: number };

/**
 * Opens or closes a window during which Vega's own autosize negotiation is allowed to actually
 * commit a new width/height (see gateAutosizeToExplicitResizes below). Call openAutosizeWindow
 * immediately before our own explicit `.resize()` calls, and closeAutosizeWindow once that settle
 * chain completes. Reference-counted (not a plain boolean) because overlapping resize calls are
 * common during a drag — each tick opens its own window, and an earlier tick finishing first must
 * not prematurely close the window a later, still-in-flight tick still needs open.
 */
const openAutosizeWindow = (view: View): void => {
  const v = view as AutosizeGatedView;
  v.__rscAutosizeOpenCount = (v.__rscAutosizeOpenCount ?? 0) + 1;
};
const closeAutosizeWindow = (view: View): void => {
  const v = view as AutosizeGatedView;
  v.__rscAutosizeOpenCount = Math.max(0, (v.__rscAutosizeOpenCount ?? 0) - 1);
};

/**
 * Patches Vega's internal (undocumented) `view._resizeView` — the function autosize calls to
 * actually commit a newly negotiated width/height — so it only takes effect while at least one
 * window opened via openAutosizeWindow is still open. Without this, `autosize: 'fit'`
 * re-negotiates and can shrink `width` on ANY dataflow pulse that marks the mark group dirty,
 * including ones wholly unrelated to layout (e.g. a hover-driven tooltip signal) — width/height
 * should only ever change during a window we explicitly opened via our own resize() calls.
 * No-ops if `_resizeView` isn't present (e.g. a future Vega version renamed/removed it) — we lose
 * this protection rather than throwing and breaking every chart with a title.
 */
const gateAutosizeToExplicitResizes = (view: View): void => {
  const viewAny = view as AutosizeGatedView;
  if (typeof viewAny._resizeView !== 'function') {
    return;
  }
  const originalResizeView = viewAny._resizeView.bind(viewAny);
  viewAny._resizeView = (...args: unknown[]) => {
    if (!viewAny.__rscAutosizeOpenCount) {
      return;
    }
    return originalResizeView(...args);
  };
};

// Canvas measureText (used by wrapTitleText) and Vega's actual SVG text rendering aren't always
// pixel-identical, so a wrap decision computed exactly at the available width can occasionally
// render a hair wider than intended. Matches the safety margin truncateText already uses in
// expressionFunctions.ts for the same canvas-vs-render mismatch.
const TITLE_LIMIT_SAFETY_MARGIN = 4;

/**
 * Resizes an existing Vega view without recreating it.
 */
export const resizeView = (view: View | undefined, width: number, height: number): void => {
  if (view && width && height) {
    openAutosizeWindow(view);
    // Two passes: first updates width/height signals; second lets Vega re-settle layout
    // after dependent changes (e.g. legend column count → legend height → plot area height).
    view
      .width(width)
      .height(height)
      .resize()
      .runAsync()
      .then(() => view.runAsync())
      .then(() => {
        correctTitleWrap(view);
        closeAutosizeWindow(view);
      });
  }
};

/**
 * Recomputes and pushes the title's wrapped text using Vega's now-settled `width` signal.
 * rscTitleLimit/rscWrappedTitleText are declared as plain value signals (see
 * chartSpecBuilder.ts's addTitleSignals) rather than a reactive Vega `update` binding — binding
 * the wrap limit to `width` would create a feedback loop, since `width` is itself recomputed under
 * `autosize: 'fit'` from the title's own rendered bounding box. Setting it imperatively, once
 * per settle, means the title's size can never feed back into the layout pass that produced it.
 * No-ops for a view whose spec has no title signal.
 */
const correctTitleWrap = (view: View, isStale: () => boolean = () => false): void => {
  let titleText: string | undefined;
  try {
    titleText = view.signal('rscTitleText') as string | undefined;
  } catch {
    return;
  }
  if (!titleText) {
    return;
  }
  (document.fonts?.ready ?? Promise.resolve()).then(() => {
    if (isStale()) {
      return;
    }
    const limit = Math.max(0, (view.signal('width') as number) - TITLE_LIMIT_SAFETY_MARGIN);
    const wrapped = wrapTitleText(titleText as string, limit);
    view.signal('rscTitleLimit', limit).signal('rscWrappedTitleText', wrapped).runAsync();
  });
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

      // Give the title a reasonable initial wrap using the known container width, before Vega
      // ever parses the spec. Without this, the declared default (the full, unwrapped title) can
      // be wider than the container on the very first autosize pass, which shrinks the plot
      // `width` toward 0 to make room for it — and once `width` hits 0, wrapTitleText's own
      // maxWidth<=0 guard hands the same unwrapped title straight back, permanently stuck.
      // This estimate ignores axis/legend space (unknown pre-embed), so correctTitleWrap still
      // refines it once the view settles — this just prevents the initial value from being
      // catastrophically wrong.
      const titleSignal = specCopy.signals?.find((s) => s.name === 'rscTitleText');
      const titleValue = titleSignal && 'value' in titleSignal ? titleSignal.value : undefined;
      if (typeof titleValue === 'string' && titleValue.length > 0) {
        const initialLimit = Math.max(0, width - TITLE_LIMIT_SAFETY_MARGIN);
        const initialGuess = wrapTitleText(titleValue, initialLimit);
        specCopy.signals = specCopy.signals?.map((signal) => {
          if (signal.name === 'rscTitleLimit') return { ...signal, value: initialLimit };
          if (signal.name === 'rscWrappedTitleText') return { ...signal, value: initialGuess };
          return signal;
        });
      }

      const embedOptions = getVegaEmbedOptions({ locale, height, width, padding, renderer, config });
      const { patches } = (specCopy.usermeta as UserMeta | undefined) ?? {};
      const finalConfig = applyUserMetaConfigPatches(patches, embedOptions.config);

      embed(containerRef.current, specCopy, { ...embedOptions, config: finalConfig, tooltip }).then(({ view }) => {
        chartView.current = view;
        onNewView(view);
        gateAutosizeToExplicitResizes(view);
        openAutosizeWindow(view);
        view
          .resize()
          .runAsync()
          // One additional render to settle all resize calculations
          .then(() => view.runAsync())
          .then(() => {
            correctTitleWrap(view, () => view !== chartView.current);
            closeAutosizeWindow(view);
          });
      });
    }
    return () => {
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
