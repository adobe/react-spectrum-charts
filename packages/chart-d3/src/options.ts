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
import { getChartType } from './charts/chartType.js';
import { D3ChartOptions, ResolvedChartOptions, SupportedMarkOptions } from './types.js';

const warnedMarkTypes = new Set<string>();

/**
 * Narrows the shared chart contract to the marks this engine renders, warning once per unsupported mark type,
 * and names unnamed marks by index like Vega's `line0`.
 * @param options
 * @returns ResolvedChartOptions
 */
export const resolveOptions = (options: D3ChartOptions): ResolvedChartOptions => {
  const marks = (options.marks ?? []).filter((mark): mark is SupportedMarkOptions => {
    if (getChartType(mark.markType)) return true;
    if (!warnedMarkTypes.has(mark.markType)) {
      warnedMarkTypes.add(mark.markType);
      console.warn(`[chart-d3] '${mark.markType}' marks are not supported by the D3 engine yet and will not render.`);
    }
    return false;
  });
  return { ...options, marks: marks.map((mark, i) => ({ ...mark, name: mark.name ?? `${mark.markType}${i}` })) };
};
