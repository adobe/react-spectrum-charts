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
import { LegendOptions, UpdateClassTable } from '../types/index.js';
import { NOOP, REBUILD } from './updateClassValues.js';

/** Update classes for legend options. */
export const LEGEND_UPDATE_CLASSES = {
  align: REBUILD,
  chartPopovers: REBUILD,
  color: REBUILD,
  defaultHiddenSeries: NOOP,
  descriptions: REBUILD,
  hasMouseInteraction: REBUILD,
  hasOnClick: REBUILD,
  hiddenEntries: REBUILD,
  highlight: REBUILD,
  isToggleable: REBUILD,
  keys: REBUILD,
  labelLimit: REBUILD,
  legendLabels: REBUILD,
  lineType: REBUILD,
  lineWidth: REBUILD,
  name: REBUILD,
  opacity: REBUILD,
  position: REBUILD,
  symbolShape: REBUILD,
  title: REBUILD,
  titleLimit: REBUILD,
} satisfies UpdateClassTable<LegendOptions>;
