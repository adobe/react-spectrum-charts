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

// Mirrors BarDirectLabelProps (react-spectrum-charts-s2/src/types/marks/supplemental/barDirectLabel.types.ts).
export const BarDirectLabelSchema = z
  .object({
    component: z.literal('BarDirectLabel'),
    position: z
      .enum(['start', 'middle', 'end', 'end-outside'])
      .optional()
      .describe('Where to place the label relative to the bar. Defaults to "end-outside".'),
    format: z
      .string()
      .optional()
      .describe(
        'Number format for the label value: "currency", "shortCurrency", "shortNumber", "standardNumber", ' +
          '"percentage", or a custom d3-format specifier. Defaults to ",.2~f".'
      ),
  })
  .describe('A value label rendered directly on each bar.');

export type BarDirectLabelInput = z.infer<typeof BarDirectLabelSchema>;
