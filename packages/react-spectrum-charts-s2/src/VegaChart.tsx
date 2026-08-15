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

import { Config, Padding, Renderers, Spec, View } from 'vega';
import { Options as TooltipOptions } from 'vega-tooltip';

import { TABLE } from '@spectrum-charts/constants';
import { ChartData } from '@spectrum-charts/vega-spec-builder-s2';

import { useDebugSpec } from './hooks/useDebugSpec';
import { extractValues, isVegaData } from './hooks/useSpec';
import { ChartProps } from './types';
import { VegaChartControllerHandle, attachVegaChartController } from './vegaChartController/attachVegaChartController';
import { VegaChartInteractionConfig } from './vegaChartController/interactionConfig';

export interface VegaChartProps {
  config: Config;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: ChartData[];
  debug: boolean;
  height: number;
  interactionConfig?: VegaChartInteractionConfig;
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
  interactionConfig,
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
  const handleRef = useRef<VegaChartControllerHandle | null>(null);
  // Skips the recreate effect on the very first render — the mount effect below already did the
  // initial embed. Without this, every mount would embed twice (once from mount, once from recreate
  // firing on the same render pass); harmless behaviorally thanks to attachVegaChartController's own
  // cancellation guard, but a real efficiency regression.
  const hasMounted = useRef(false);

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

  // Mount/destroy — runs exactly once per actual mount. Constructs the controller, which performs
  // the initial embed itself if dimensions are already valid.
  useEffect(() => {
    if (!containerRef.current) return;
    const handle = attachVegaChartController(containerRef.current, {
      chartData,
      config,
      data,
      height,
      interactionConfig,
      locale,
      onNewView,
      padding,
      renderer,
      signals,
      spec,
      tooltip,
      width,
    });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount only; prop changes flow through the resize/recreate effects below, not through re-running this effect.
  }, []);

  // Cheap resize path — does not recreate the view (prevents axis image flickering).
  useEffect(() => {
    handleRef.current?.resize(width, height);
  }, [width, height]);

  // Expensive recreate path.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    handleRef.current?.updateSpec({
      chartData,
      config,
      data,
      height,
      interactionConfig,
      locale,
      onNewView,
      padding,
      renderer,
      signals,
      spec,
      tooltip,
      width,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- width/height intentionally excluded, handled by the resize effect above.
  }, [chartData.table, config, data, interactionConfig, onNewView, padding, renderer, signals, spec, tooltip, locale]);

  return <div ref={containerRef} className="rsc"></div>;
};
