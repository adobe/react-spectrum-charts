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
import { Spec, View } from 'vega';

import { AxisProjectionRequest, ChartGeometryEvent } from '../types/chart.types.js';

export function getChartGeometry(
  view: View,
  spec: Spec,
  requests: readonly AxisProjectionRequest[]
): Pick<ChartGeometryEvent, 'plotBounds' | 'projections' | 'donutSummaries'> {
  if (
    !Array.isArray(requests) ||
    requests.some(
      (request) =>
        !request ||
        typeof request.id !== 'string' ||
        !request.id ||
        !['top', 'bottom', 'left', 'right'].includes(request.position) ||
        !Number.isFinite(request.value)
    ) ||
    new Set(requests.map(({ id }) => id)).size !== requests.length
  ) {
    throw new Error('Axis projections require unique nonempty IDs, axis positions and finite numeric values.');
  }
  const padding = view.padding();
  const [originX, originY] = view.origin();
  const plotBounds = {
    x: originX + (typeof padding === 'number' ? padding : padding.left ?? 0),
    y: originY + (typeof padding === 'number' ? padding : padding.top ?? 0),
    width: view.width(),
    height: view.height(),
  };
  if (!Object.values(plotBounds).every(Number.isFinite) || plotBounds.width <= 0 || plotBounds.height <= 0) {
    throw new Error('Axis projections require a settled, positive plot rectangle.');
  }
  const projectors = new Map<AxisProjectionRequest['position'], (value: number) => number | null>();
  const projections = requests.map(({ id, position, value }) => {
    let project = projectors.get(position);
    if (!project) {
      const scaleNames = [...new Set(spec.axes?.filter((axis) => axis.orient === position).map((axis) => axis.scale))];
      if (scaleNames.length !== 1) {
        throw new Error(`Axis projections require one declared scale at position "${position}".`);
      }
      const scaleSpec = spec.scales?.find((scale) => scale.name === scaleNames[0]);
      if (
        !scaleSpec ||
        ![undefined, 'linear', 'time', 'utc', 'log', 'pow', 'sqrt', 'symlog'].includes(scaleSpec.type)
      ) {
        throw new Error('Axis projections require a continuous numeric or temporal scale.');
      }
      const scale = view.scale(scaleNames[0]);
      const domain: number[] = scale.domain().map(Number);
      if (!domain.length || !domain.every(Number.isFinite)) {
        throw new Error('Axis projections require a finite scale domain.');
      }
      const min = Math.min(...domain);
      const max = Math.max(...domain);
      const horizontal = position === 'top' || position === 'bottom';
      const offset = horizontal ? plotBounds.x : plotBounds.y;
      const extent = horizontal ? plotBounds.width : plotBounds.height;
      project = (input) => {
        if (input < min || input > max) return null;
        const pixel: number = scale(input);
        return Number.isFinite(pixel) && pixel >= 0 && pixel <= extent ? offset + pixel : null;
      };
      projectors.set(position, project);
    }
    return { id, coordinate: project(value) };
  });
  const suffix = '_summaryFits';
  const donutSummaries = (spec.signals ?? [])
    .filter(({ name }) => name.endsWith(suffix))
    .map(({ name }) => {
      const fits: unknown = view.signal(name);
      if (typeof fits !== 'boolean') throw new Error('Donut summary fit must be a settled boolean.');
      return { name: name.slice(0, -suffix.length), fits };
    });
  return { plotBounds, projections, ...(donutSummaries.length ? { donutSummaries } : {}) };
}
