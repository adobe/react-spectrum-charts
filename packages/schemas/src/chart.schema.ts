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

import { AxisSchema } from './axis.schema';
import { BarSchema } from './marks/bar.schema';
import { LineSchema } from './marks/line.schema';

// Add each new mark schema to this union as it's built out.
export const MarkSchema = z.discriminatedUnion('component', [BarSchema, LineSchema]);

export const ChartSchema = z.object({
  component: z.literal('Chart'),
  data: z.object({ values: z.array(z.record(z.string(), z.unknown())) }),
  colorScheme: z.enum(['light', 'dark']).optional(),
  backgroundColor: z.string().optional(),
  // Optional and unbounded: some chart types (e.g. Donut) have no axes at all, so this must not
  // default to any particular count or be assumed present by the renderer.
  axes: z.array(AxisSchema).optional().describe('Axes for the chart. Omit for chart types that use none.'),
  children: z.array(MarkSchema).min(1).describe('The mark(s) to render inside this chart.'),
});

export type MarkInput = z.infer<typeof MarkSchema>;
export type ChartInput = z.infer<typeof ChartSchema>;
