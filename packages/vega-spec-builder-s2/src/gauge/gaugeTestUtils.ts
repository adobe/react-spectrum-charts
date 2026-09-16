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
import { GaugeSpecOptions } from '../types';

export const defaultGaugeOptions: GaugeSpecOptions = {
  arcSize: 2 / 3,
  color: 'categorical-100',
  colorScheme: 'light',
  holeRatio: 0.8,
  index: 0,
  label: 'Test label',
  markType: 'gauge',
  maxScaleValue: 100,
  metric: 'testMetric',
  method: 'last',
  minScaleValue: 0,
  name: 'testName',
  numberFormat: 'shortNumber',
  showNeedle: true,
};
