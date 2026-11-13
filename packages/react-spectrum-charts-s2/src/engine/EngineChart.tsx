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
import { ReactElement, ReactNode, RefObject, useEffect, useMemo, useRef } from 'react';

import { Datum, createDonutChart, createLineChart } from '@spectrum-charts/chart-engine';
import { DEFAULT_SYMBOL_SHAPES, DEFAULT_SYMBOL_SIZES } from '@spectrum-charts/core-s2/constants';
import type { SymbolSize } from '@spectrum-charts/vega-spec-builder-s2';

import { rscPropsToSpecBuilderOptions } from '../rscToSbAdapter/index.js';
import { RscChartProps } from '../types/index.js';
import { sanitizeRscChartChildren } from '../utils/index.js';
import { toEngineOptions } from './toEngineOptions.js';

/** The parts of an engine chart used for image export. */
export interface EngineExporter {
  toSVG: () => string;
  toPNG: () => Promise<Blob>;
}

type EngineInstance = ReturnType<typeof createLineChart> | ReturnType<typeof createDonutChart>;

interface EngineChartProps {
  chartProps: RscChartProps;
  children: ReactNode;
  engineRef: RefObject<EngineExporter | undefined>;
  /** Rendered when the engine can't draw the chart's children. */
  fallback: ReactElement;
}

/**
 * Draws the chart with the chart engine instead of Vega.
 * @alpha
 */
export const EngineChart = ({ chartProps, children, engineRef, fallback }: EngineChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<EngineInstance | undefined>(undefined);
  const { chartHeight, chartWidth, data, hiddenSeries, highlightedSeries } = chartProps;

  const sanitizedChildren = useMemo(() => sanitizeRscChartChildren(children), [children]);
  const config = useMemo(() => {
    const chartOptions = rscPropsToSpecBuilderOptions({
      ...chartProps,
      children: sanitizedChildren,
      symbolShapes: chartProps.symbolShapes ?? DEFAULT_SYMBOL_SHAPES,
      symbolSizes: chartProps.symbolSizes ?? (DEFAULT_SYMBOL_SIZES as [SymbolSize, SymbolSize]),
    });
    return toEngineOptions(chartOptions);
    // chartProps is rebuilt every render; depend on the fields the adapter reads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sanitizedChildren,
    chartWidth,
    chartHeight,
    chartProps.animations,
    chartProps.colors,
    chartProps.colorScheme,
    chartProps.description,
    chartProps.title,
  ]);
  const type = typeof config === 'string' ? undefined : config.type;

  useEffect(() => {
    if (typeof config === 'string') console.warn(`Chart engine: falling back to Vega because ${config}.`);
  }, [config]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof config === 'string') return;
    const rows = data as unknown as Datum[];
    const instance =
      config.type === 'line'
        ? createLineChart(container, { ...config.options, data: rows })
        : createDonutChart(container, { ...config.options, data: rows });
    instanceRef.current = instance;
    engineRef.current = instance;
    return () => {
      instance.destroy();
      instanceRef.current = undefined;
      engineRef.current = undefined;
    };
    // the instance is recreated only when the chart type changes; later changes go through update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (typeof config === 'string') return;
    instanceRef.current?.update({ ...config.options, data: data as unknown as Datum[] } as never);
  }, [config, data]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (instance && instance.getState().hidden.join('\n') !== hiddenSeries.join('\n')) instance.setHidden(hiddenSeries);
  }, [hiddenSeries, type]);

  useEffect(() => {
    const instance = instanceRef.current;
    const key = highlightedSeries === undefined ? null : String(highlightedSeries);
    if (instance && instance.getState().highlighted !== key) instance.setHighlight(key);
  }, [highlightedSeries, type]);

  if (typeof config === 'string') return fallback;
  return <div ref={containerRef} className="rsc-engine-chart" style={{ width: chartWidth, height: chartHeight }} />;
};
