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
import { spectrumColors } from './spectrumColors.js';
import { spectrum2Colors } from './spectrum2Colors.js';

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

/** Spectrum 2 categorical color tokens, in palette order. */
export const s2CategoricalTokens = [
  'categorical-100',
  'categorical-200',
  'categorical-300',
  'categorical-400',
  'categorical-500',
  'categorical-600',
  'categorical-700',
  'categorical-800',
  'categorical-900',
  'categorical-1000',
  'categorical-1100',
  'categorical-1200',
  'categorical-1300',
  'categorical-1400',
  'categorical-1500',
  'categorical-1600',
  'categorical-1700',
  'categorical-1800',
  'categorical-1900',
  'categorical-2000',
] as const;

const getS2Categorical = (count: number): string[] =>
  s2CategoricalTokens.slice(0, count).map((token) => s2Colors[token]);

export const s2Categorical6 = getS2Categorical(6);
export const s2Categorical12 = getS2Categorical(12);
export const s2Categorical16 = getS2Categorical(16);
export const s2Categorical20 = getS2Categorical(20);
