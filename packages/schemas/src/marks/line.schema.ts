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

import { LineDirectLabelSchema } from './supplemental/lineDirectLabel.schema';

// FacetRef<T> = string (data field name) | { value: T }, see specUtil.types.ts in vega-spec-builder.
const facetRef = <T extends z.ZodTypeAny>(value: T) => z.union([z.string(), z.object({ value })]);

// Line's own supported decorations. chartPopovers/chartInspects/forecasts/linePointAnnotations/
// metricRanges/trendlines are still deferred — add them when a real request needs them.
export const LineDecorationSchema = z.discriminatedUnion('component', [LineDirectLabelSchema]);

// Mirrors the plain-value subset of LineProps (react-spectrum-charts-s2/src/types/marks/line.types.ts),
// Kept intentionally minimal for now
export const LineSchema = z
  .object({
    component: z.literal('Line'),
    dimension: z.string().describe('Data field the line is trended against (x-axis).'),
    metric: z.string().describe('Data field used as the line value (y-axis).'),
    color: facetRef(z.string()).optional().describe('Line color, or a data field to color by.'),
    scaleType: z.enum(['linear', 'point', 'time', 'band']).optional().describe('Type of scale used for the dimension axis.'),
    decorations: z
      .array(LineDecorationSchema)
      .optional()
      .describe('Direct labels attached to the lines.'),
  })
  .describe('A trended line for a metric over a continuous or ordinal dimension.');

export type LineInput = z.infer<typeof LineSchema>;
export type LineDecorationInput = z.infer<typeof LineDecorationSchema>;
