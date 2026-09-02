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
import { DEFAULT_SANKEY_COLOR, DEFAULT_SANKEY_SOURCE, DEFAULT_SANKEY_TARGET, DEFAULT_SANKEY_VALUE } from '@spectrum-charts/constants';

import { SankeySpecOptions } from '../types';

export const data = [
  { source: 'Home', target: 'Product', value: 10 },
  { source: 'Home', target: 'Search', value: 6 },
  { source: 'Product', target: 'Cart', value: 7 },
  { source: 'Search', target: 'Product', value: 4 },
  { source: 'Cart', target: 'Checkout', value: 5 },
];

/** A -> B -> C -> A: every node is part of a cycle, so nothing has an in-degree-0 entry point. */
export const cyclicData = [
  { source: 'A', target: 'B', value: 3 },
  { source: 'B', target: 'C', value: 3 },
  { source: 'C', target: 'A', value: 1 },
];

/** "Orphan" has no edges at all; "SourceOnly" only ever appears as a source; "SinkOnly" only as a target. */
export const sourceAndSinkOnlyData = [
  { source: 'SourceOnly', target: 'Middle', value: 2 },
  { source: 'Middle', target: 'SinkOnly', value: 2 },
];

export const customSankeyOptions: SankeySpecOptions = {
  chartInspects: [],
  chartPopovers: [],
  data,
  colorScheme: 'light',
  idKey: 'rscMarkId',
  index: 0,
  markType: 'sankey',
  chartWidth: 400,
  chartHeight: 300,
  name: 'sankey',
  color: DEFAULT_SANKEY_COLOR,
  source: DEFAULT_SANKEY_SOURCE,
  target: DEFAULT_SANKEY_TARGET,
  value: DEFAULT_SANKEY_VALUE,
};

export const defaultSankeyOptions: SankeySpecOptions = {
  chartHeight: 100,
  chartWidth: 100,
  colorScheme: 'light',
  data: [],
  idKey: 'rscMarkId',
  index: 0,
  markType: 'sankey',
  chartPopovers: [],
  chartInspects: [],
  color: DEFAULT_SANKEY_COLOR,
  source: DEFAULT_SANKEY_SOURCE,
  target: DEFAULT_SANKEY_TARGET,
  value: DEFAULT_SANKEY_VALUE,
  name: 'sankey0',
};
