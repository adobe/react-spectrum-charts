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
import { FC, useEffect, useMemo, useRef } from 'react';

import { Config, Padding, Renderers, Spec, TooltipHandler, View, expressionFunction } from 'vega';

import { TABLE } from '@spectrum-charts/core-s2/constants';
import { ChartData } from '@spectrum-charts/vega-spec-builder-s2';

import { useDebugSpec } from './hooks/useDebugSpec.js';
import { extractValues, isVegaData } from './hooks/useSpec.js';
import { ChartProps } from './types/index.js';
import { ViewHost, createViewHost } from './viewHost/index.js';

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
  /** Set at embed, before the renderer exists; changing it on a live view makes Vega rebuild the renderer */
  tooltip: TooltipHandler;
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
  const host = useRef<ViewHost | undefined>(undefined);

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

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const created = createViewHost(containerRef.current);
    host.current = created;
    return () => {
      created.destroy();
      host.current = undefined;
    };
  }, []);

  // the host compares what changed and rebuilds the view, updates it in place, resizes it or does nothing
  useEffect(() => {
    host.current?.update({
      environment: { config, locale, padding, renderer, tooltip },
      height,
      onNewView,
      signals,
      spec,
      table: chartData.table,
      width,
    });
  }, [chartData.table, config, height, locale, onNewView, padding, renderer, signals, spec, tooltip, width]);

  return <div ref={containerRef} className="rsc"></div>;
};
