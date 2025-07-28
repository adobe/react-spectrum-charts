/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { DEFAULT_VENN_COLOR, DEFAULT_VENN_LABEL, DEFAULT_VENN_METRIC } from '@spectrum-charts/constants';

import { VennSpecOptions } from '../types';

const { A, B, C } = {
  A: 'Instagram',
  B: 'TikTok',
  C: 'X',
};

export const data = [
  { regions: [A], radius: 12 },
  { regions: [B], radius: 12 },
  { regions: [C], radius: 6 },
  { regions: ['D'], radius: 6 },
  { regions: [A, B], radius: 2 },
  { regions: [A, 'D'], radius: 2 },
  { regions: [A, C], radius: 2 },
  { regions: [B, C], radius: 2 },
  { regions: [A, B, C], radius: 1 },
];

export const customVennOptions: VennSpecOptions = {
  chartTooltips: [],
  chartPopovers: [],
  data,
  colorScheme: 'light',
  idKey: 'set_id',
  index: 0,
  markType: 'venn',
  chartWidth: 350,
  chartHeight: 350,
  orientation: '0deg',
  name: 'venn',
  label: 'label',
  color: 'regions',
  metric: 'radius',
};

export const defaultVennOptions: VennSpecOptions = {
  chartHeight: 100,
  chartWidth: 100,
  colorScheme: 'light',
  data: [],
  idKey: 'rscMarkId',
  index: 0,
  markType: 'venn',
  chartPopovers: [],
  chartTooltips: [],
  color: DEFAULT_VENN_COLOR,
  label: DEFAULT_VENN_LABEL,
  metric: DEFAULT_VENN_METRIC,
  name: 'venn0',
  orientation: '0deg',
};
