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

/**
 * How a chart applies a change to one input.
 * - `noop`: nothing changes
 * - `signal`: signal values update on the live view
 * - `data`: table rows update on the live view
 * - `size`: the live view resizes
 * - `rebuild`: a new view replaces the old one
 */
export type UpdateClass = 'noop' | 'signal' | 'data' | 'size' | 'rebuild';

/** Declared behavior for a change to one input. */
export interface UpdateClassification {
  /** How the change is applied */
  update: UpdateClass;
  /** Whether the change makes it a different chart, so draw-in replays; only meaningful for `rebuild` */
  replay: boolean;
}

/** Classification for every key of an options or props type. */
export type UpdateClassTable<T> = { [K in keyof Required<T>]-?: UpdateClassification };
