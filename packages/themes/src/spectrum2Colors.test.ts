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
import paletteTokens from '@adobe/spectrum-tokens/src/color-palette.json';

import { s2CategoricalPaletteColors, spectrum2Colors } from './spectrum2Colors';

type Scheme = 'light' | 'dark';
type PaletteToken = { value: string } | { sets: Record<Scheme, { value: string }> };

const spectrumTokens = paletteTokens as Record<string, PaletteToken>;

const namedColors: Record<string, string> = { white: '#FFFFFF', black: '#000000' };

const toHex = (color: string): string => {
  if (namedColors[color]) return namedColors[color];
  const rgb = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(color);
  if (!rgb) return color.toUpperCase();
  const hex = rgb
    .slice(1)
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex.toUpperCase()}`;
};

const getSpectrumColor = (name: string, scheme: Scheme): string | undefined => {
  const token = spectrumTokens[name];
  if (!token) return undefined;
  return toHex('sets' in token ? token.sets[scheme].value : token.value);
};

describe('spectrum2Colors', () => {
  test.each(['light', 'dark'] as const)('%s palette colors match @adobe/spectrum-tokens', (scheme) => {
    const schemeColors: Record<string, string> = spectrum2Colors[scheme];
    const paletteNames = Object.keys(schemeColors).filter((name) => !(name in s2CategoricalPaletteColors));
    const colors = Object.fromEntries(paletteNames.map((name) => [name, toHex(schemeColors[name])]));
    const spectrumColors = Object.fromEntries(paletteNames.map((name) => [name, getSpectrumColor(name, scheme)]));
    expect(colors).toEqual(spectrumColors);
  });
});
