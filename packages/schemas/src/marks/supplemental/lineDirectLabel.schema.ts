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

// Mirrors LineDirectLabelProps (react-spectrum-charts-s2/src/types/marks/supplemental/lineDirectLabel.types.ts).
export const LineDirectLabelSchema = z
  .object({
    component: z.literal('LineDirectLabel'),
    value: z
      .enum(['last', 'average', 'series'])
      .optional()
      .describe(
        '"last": value at the last data point, "average": average of all values, "series": series key/name. Defaults to "last".'
      ),
    position: z
      .enum(['start', 'end'])
      .optional()
      .describe('Where to place the label along the line: "start" or "end". Defaults to "end".'),
    format: z.string().optional().describe('Number format string (matches axis formatting).'),
    prefix: z.string().optional().describe('Text prepended to the value.'),
    excludeSeries: z.array(z.string()).optional().describe('Series values to exclude from labeling.'),
    fontSize: z.number().optional().describe('Override font size in pixels.'),
  })
  .describe('A value label rendered at the start or end of each line.');

export type LineDirectLabelInput = z.infer<typeof LineDirectLabelSchema>;
