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

import { D3Chart as D3ChartInstance, D3ChartOptions } from '@spectrum-charts/chart-d3';

import { ViewHost, createViewHost } from './viewHost/index.js';
import { D3Environment, D3ViewSpec, d3ViewAdapter } from './viewHost/d3ViewAdapter.js';

export interface D3ChartProps {
  colorScheme: D3Environment['colorScheme'];
  height: number;
  locale: D3Environment['locale'];
  onNewView: (chart: D3ChartInstance) => void;
  options: D3ChartOptions;
  padding: D3Environment['padding'];
  renderer: D3Environment['renderer'];
  signals?: Record<string, unknown>;
  width: number;
}

/** Renders chart options with the D3 engine through the shared view host. */
export const D3Chart: FC<D3ChartProps> = ({
  colorScheme,
  height,
  locale,
  onNewView,
  options,
  padding,
  renderer,
  signals,
  width,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const host = useRef<ViewHost<D3ViewSpec, D3ChartInstance, D3Environment> | undefined>(undefined);
  const spec = useMemo<D3ViewSpec>(() => ({ options }), [options]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const created = createViewHost(containerRef.current, d3ViewAdapter);
    host.current = created;
    return () => {
      created.destroy();
      host.current = undefined;
    };
  }, []);

  useEffect(() => {
    host.current?.update({
      environment: { colorScheme, locale, padding, renderer },
      height,
      onNewView,
      signals,
      spec,
      table: options.data,
      width,
    });
  }, [colorScheme, height, locale, onNewView, options.data, padding, renderer, signals, spec, width]);

  return <div ref={containerRef} className="rsc"></div>;
};
