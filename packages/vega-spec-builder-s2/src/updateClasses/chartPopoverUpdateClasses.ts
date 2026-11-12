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
import { ChartPopoverOptions, UpdateClassTable } from '../types/index.js';
import { NOOP, REBUILD } from './updateClassValues.js';

/** Update classes for chart popover options. */
export const CHART_POPOVER_UPDATE_CLASSES = {
  containerPadding: NOOP,
  contentMargin: NOOP,
  height: NOOP,
  maxHeight: NOOP,
  maxWidth: NOOP,
  minHeight: NOOP,
  minWidth: NOOP,
  onOpenChange: NOOP,
  rightClick: NOOP,
  UNSAFE_highlightBy: REBUILD,
  width: NOOP,
} satisfies UpdateClassTable<ChartPopoverOptions>;
