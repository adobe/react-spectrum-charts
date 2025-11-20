/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { MARK_ID } from '@spectrum-charts/constants';

import { DonutSpecOptions } from '../types';

export const defaultDonutOptions: DonutSpecOptions = {
  chartPopovers: [],
  chartTooltips: [],
  color: 'testColor',
  colorScheme: 'light',
  donutSummaries: [],
  holeRatio: 0.85,
  idKey: MARK_ID,
  index: 0,
  isBoolean: false,
  name: 'testName',
  markType: 'donut',
  metric: 'testMetric',
  segmentLabels: [],
  startAngle: 0,
  S2: false,
};
