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
import { ChartSchema } from './chart.schema.js';

export * from './axis.schema.js';
export * from './chart.schema.js';
export * from './dialogs/chartInspect.schema.js';
export * from './marks/bar.schema.js';
export * from './marks/line.schema.js';
export * from './marks/supplemental/barDirectLabel.schema.js';
export * from './marks/supplemental/lineDirectLabel.schema.js';

/** Validates and types an agent-supplied chart request against the catalog contract. */
export function parseChartRequest(payload: unknown) {
  return ChartSchema.parse(payload);
}
