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
import { z } from 'zod';

// Mirrors the plain-value subset of AxisProps (react-spectrum-charts-s2/src/types/axis/axis.types.ts),
// Advanced/rare fields (labels, subLabels, range, currencyLocale/Code, tick limits) are left out for now
export const AxisSchema = z
  .object({
    component: z.literal('Axis'),
    position: z.enum(['left', 'right', 'top', 'bottom']).describe('Where the axis is placed on the chart.'),
    title: z.union([z.string(), z.array(z.string())]).optional().describe('Axis title.'),
    grid: z.boolean().optional().describe('Displays gridlines at each tick location.'),
    baseline: z.boolean().optional().describe('Adds a baseline rule for this axis.'),
    ticks: z.boolean().optional().describe('Displays ticks at each label location.'),
    labelFormat: z.enum(['duration', 'linear', 'percentage', 'time']).optional().describe('Format of axis labels.'),
    numberFormat: z
      .string()
      .optional()
      .describe('d3 number format specifier. Only valid if labelFormat is linear or undefined.'),
    granularity: z
      .enum(['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'])
      .optional()
      .describe('Granularity of primary axis labels for a time axis. Ignored for non-time axes.'),
  })
  .describe('An axis for the chart. Omit axes entirely for chart types that have none (e.g. Donut).');

export type AxisInput = z.infer<typeof AxisSchema>;
