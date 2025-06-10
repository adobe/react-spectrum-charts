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
import { BulletSpecOptions } from '../types';

export const sampleOptionsColumn: BulletSpecOptions = {
  markType: 'bullet',
  colorScheme: 'light',
  index: 0,
  color: 'green',
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  name: 'bullet0',
  idKey: 'rscMarkId',
  direction: 'column',
  showTarget: true,
  showTargetValue: false,
  labelPosition: 'top',
  scaleType: 'normal',
  maxScaleValue: 100,
  metricAxis: false,
  track: false,
  thresholdBarColor: false,
};

export const sampleOptionsRow: BulletSpecOptions = {
  markType: 'bullet',
  colorScheme: 'light',
  index: 0,
  color: 'green',
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  name: 'bullet0',
  idKey: 'rscMarkId',
  direction: 'row',
  showTarget: true,
  showTargetValue: false,
  labelPosition: 'top',
  scaleType: 'normal',
  maxScaleValue: 100,
  track: false,
  thresholdBarColor: false,
  metricAxis: false,
};
