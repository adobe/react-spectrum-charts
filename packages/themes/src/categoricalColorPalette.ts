/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { spectrumColors } from './spectrumColors';
import { spectrum2Colors } from './spectrum2Colors';

const colors = spectrumColors.light;
const s2Colors = spectrum2Colors.light;

export const categorical6 = [
  colors['categorical-100'],
  colors['categorical-200'],
  colors['categorical-300'],
  colors['categorical-400'],
  colors['categorical-500'],
  colors['categorical-600'],
];

export const categorical12 = [
  ...categorical6,
  colors['categorical-700'],
  colors['categorical-800'],
  colors['categorical-900'],
  colors['categorical-1000'],
  colors['categorical-1100'],
  colors['categorical-1200'],
];

export const categorical16 = [
  ...categorical12,
  colors['categorical-1300'],
  colors['categorical-1400'],
  colors['categorical-1500'],
  colors['categorical-1600'],
];

export const s2Categorical6 = [
  s2Colors['categorical-100'],
  s2Colors['categorical-200'],
  s2Colors['categorical-300'],
  s2Colors['categorical-400'],
  s2Colors['categorical-500'],
  s2Colors['categorical-600'],
];

export const s2Categorical12 = [
  ...s2Categorical6,
  s2Colors['categorical-700'],
  s2Colors['categorical-800'],
  s2Colors['categorical-900'],
  s2Colors['categorical-1000'],
  s2Colors['categorical-1100'],
  s2Colors['categorical-1200'],
];

export const s2Categorical16 = [
  ...s2Categorical12,
  s2Colors['categorical-1300'],
  s2Colors['categorical-1400'],
  s2Colors['categorical-1500'],
  s2Colors['categorical-1600'],
];

export const s2Categorical20 = [
  ...s2Categorical16,
  s2Colors['categorical-1700'],
  s2Colors['categorical-1800'],
  s2Colors['categorical-1900'],
  s2Colors['categorical-2000'],
];
