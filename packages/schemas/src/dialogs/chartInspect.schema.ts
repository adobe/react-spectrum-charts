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

// Mirrors ChartInspectOptions (vega-spec-builder-s2/src/types/dialogs/chartInspectSpec.types.ts).
// ChartInspectProps' `children` (a (datum) => ReactNode render prop) isn't representable in JSON,
// so it isn't modeled here — the renderer supplies a default dimension/metric tooltip body instead.
export const ChartInspectSchema = z
  .object({
    component: z.literal('ChartInspect'),
    excludeDataKeys: z
      .array(z.string())
      .optional()
      .describe('Data keys that disable the tooltip for a row when truthy.'),
    highlightBy: z
      .union([z.enum(['series', 'dimension', 'item']), z.array(z.string())])
      .optional()
      .describe('Which marks are highlighted while the tooltip is visible.'),
    targets: z
      .array(z.enum(['dimensionArea', 'item']))
      .optional()
      .describe('Which mark regions trigger the tooltip on hover.'),
  })
  .describe('A hover tooltip showing the dimension and metric for the hovered bar.');

export type ChartInspectInput = z.infer<typeof ChartInspectSchema>;
