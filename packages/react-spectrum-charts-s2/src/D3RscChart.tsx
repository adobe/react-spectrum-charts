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
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { D3Chart as D3ChartInstance } from '@spectrum-charts/chart-d3';
import { DEFAULT_SYMBOL_SHAPES, DEFAULT_SYMBOL_SIZES } from '@spectrum-charts/core-s2/constants';
import { SymbolSize } from '@spectrum-charts/vega-spec-builder-s2';

import { D3Chart } from './D3Chart.js';
import { useChartContext } from './context/RscChartContext.js';
import { toD3ChartOptions } from './d3/toD3ChartOptions.js';
import { D3ChartDialogs, useD3Interactions } from './d3/useD3Interactions.js';
import { attachD3Navigator } from './dataNavigator/d3Navigator.js';
import { useD3LegendEvents } from './hooks/useD3LegendEvents.js';
import useLegend from './hooks/useLegend.js';
import { useChartOptions } from './hooks/useSpec.js';
import { RscChartProps } from './types/index.js';
import { sanitizeRscChartChildren } from './utils/index.js';
import { D3Environment } from './viewHost/d3ViewAdapter.js';

/** Chart body for `engine="d3"`: builds the shared chart options and renders them with the D3 engine. */
export const D3RscChart = (props: RscChartProps) => {
  const {
    animations,
    animationTypes,
    accessibleNavigation,
    backgroundColor,
    data,
    chartWidth,
    chartHeight,
    colors,
    colorScheme,
    description,
    hiddenSeries,
    highlightedItem,
    highlightedSeries,
    idKey,
    lineTypes,
    lineWidths,
    locale,
    opacities,
    padding,
    renderer,
    symbolShapes = DEFAULT_SYMBOL_SHAPES,
    symbolSizes = DEFAULT_SYMBOL_SIZES as [SymbolSize, SymbolSize],
    title,
  } = props;
  const { chartId } = useChartContext();
  const children = useMemo(() => sanitizeRscChartChildren(props.children), [props.children]);
  const legendProps = useLegend(children);
  const { legendHiddenSeries, isToggleable } = legendProps;
  const interactions = useD3Interactions(props, children, legendProps);
  const subscribeLegendEvents = useD3LegendEvents(legendProps);

  const options = useChartOptions({
    animations,
    animationTypes,
    accessibleNavigation,
    backgroundColor,
    children,
    colors,
    colorScheme,
    data,
    description,
    hiddenSeries,
    highlightedItem,
    highlightedSeries,
    idKey,
    lineTypes,
    lineWidths,
    opacities,
    symbolShapes,
    symbolSizes,
    title,
  });
  const d3Options = useMemo(() => options && toD3ChartOptions(options), [options]);

  const signals = useMemo(() => {
    const next: Record<string, unknown> = { ...interactions.signals };
    if (isToggleable) next.hiddenSeries = legendHiddenSeries;
    return next;
  }, [interactions.signals, isToggleable, legendHiddenSeries]);
  const markNames = useMemo(
    () => (options?.marks ?? []).map((mark, i) => ('name' in mark && mark.name) || `${mark.markType}${i}`),
    [options]
  );

  // The chart lives in a ref (like Vega's view) so a new chart never re-renders this subtree.
  const chartRef = useRef<D3ChartInstance | undefined>(undefined);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const detachNavigator = useRef<(() => void) | undefined>(undefined);
  const attachNavigator = useCallback(() => {
    detachNavigator.current?.();
    const container = navContainerRef.current;
    const chart = chartRef.current;
    detachNavigator.current =
      accessibleNavigation && container && chart && d3Options?.data.length
        ? attachD3Navigator({ container, chart, options: d3Options, chartId })
        : undefined;
    // chart size changes move the navigation overlays
  }, [accessibleNavigation, chartId, chartWidth, chartHeight, d3Options]);
  const attachLatest = useRef(attachNavigator);
  useEffect(() => {
    attachLatest.current = attachNavigator;
    attachNavigator();
    return () => {
      detachNavigator.current?.();
      detachNavigator.current = undefined;
    };
  }, [attachNavigator]);

  const { onNewView: onInteractionsView } = interactions;
  const onNewView = useCallback(
    (chart: D3ChartInstance) => {
      onInteractionsView(chart);
      subscribeLegendEvents(chart);
      chartRef.current = chart;
      attachLatest.current();
    },
    [onInteractionsView, subscribeLegendEvents]
  );

  if (!d3Options) return null;
  const chart = (
    <>
      <D3ChartDialogs
        colorScheme={props.colorScheme}
        idKey={props.idKey}
        locale={props.locale}
        sanitizedChildren={children}
        markNames={markNames}
        targetStyle={interactions.targetStyle}
        axisLabelTooltipStyle={interactions.axisLabelTooltipStyle}
      />
      <D3Chart
        colorScheme={colorScheme}
        height={chartHeight}
        locale={locale as D3Environment['locale']}
        onNewView={onNewView}
        options={d3Options}
        padding={padding}
        renderer={renderer}
        signals={signals}
        width={chartWidth}
      />
    </>
  );
  if (!accessibleNavigation) return chart;
  return (
    <div id={`${chartId}-dn-root`} ref={navContainerRef} style={{ position: 'relative' }}>
      {chart}
    </div>
  );
};
D3RscChart.displayName = 'D3RscChart';
