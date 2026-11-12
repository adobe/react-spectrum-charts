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
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types.js';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types.js';

export interface VennOptions {
  markType: 'venn';
  /** Key in the data that is used as the color facet */
  color?: string;
  /** Key in the data that is used as the metric */
  metric?: string;
  /** orientation of the diagram in degrees */
  orientation?: VennDegreeOptions;
  /** key in data that is used for labels inside the sets and intersections*/
  label?: string;
  /** Sets the name of the component. */
  name?: string;

  // children
  chartPopovers?: ChartPopoverOptions[];
  chartInspects?: ChartInspectOptions[];
}

export type VennDegreeOptions = '0deg' | '90deg' | '180deg' | '270deg';
