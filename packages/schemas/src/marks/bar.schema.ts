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

import { ChartInspectSchema } from '../dialogs/chartInspect.schema';
import { BarDirectLabelSchema } from './supplemental/barDirectLabel.schema';

// FacetRef<T> = string (data field name) | { value: T }, see specUtil.types.ts in vega-spec-builder.
const facetRef = <T extends z.ZodTypeAny>(value: T) => z.union([z.string(), z.object({ value })]);
// Two field names split a facet into a secondary/dual facet, see DualFacet in barSpec.types.ts.
const dualFacet = z.tuple([z.string(), z.string()]);

const orientation = z.enum(['vertical', 'horizontal']);

// Bar's own supported decorations. barAnnotations/chartPopovers/trendlines are still deferred —
// add them when a real request needs them, same as the rest of BarSchema's omissions below.
export const BarDecorationSchema = z.discriminatedUnion('component', [BarDirectLabelSchema, ChartInspectSchema]);

// Mirrors the plain-value subset of BarProps (react-spectrum-charts/src/types/marks/bar.types.ts),
export const BarSchema = z
  .object({
    component: z.literal('Bar'),
    dimension: z.string().describe('Data field for the bar categories (x-axis for a vertical bar).'),
    metric: z.string().describe('Data field used as the bar value.'),
    color: z
      .union([facetRef(z.string()), dualFacet])
      .optional()
      .describe('Color, or a data field to color by. Two field names split into a secondary facet.'),
    orientation: orientation.optional().default('vertical'),
    type: z.enum(['dodged', 'stacked']).optional().describe('"dodged" (grouped) or "stacked".'),
    trellis: z.string().optional().describe('Data field to split into small multiples.'),
    trellisOrientation: orientation.optional(),
    hasSquareCorners: z.boolean().optional().describe('Square instead of the default rounded top corners.'),
    metricAxis: z.string().optional().describe('Name of the axis the metric is trended against.'),
    decorations: z
      .array(BarDecorationSchema)
      .optional()
      .describe('Direct labels and/or a hover tooltip attached to the bars.'),
  })
  .describe('Categorical bars for a metric. Supports grouping, stacking, and trellising into small multiples.');

export type BarInput = z.infer<typeof BarSchema>;
export type BarDecorationInput = z.infer<typeof BarDecorationSchema>;
