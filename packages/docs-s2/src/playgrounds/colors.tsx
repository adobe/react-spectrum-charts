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
import React, { CSSProperties, ReactNode } from 'react';

import { useColorMode } from '@docusaurus/theme-common';

import {
  ColorSchemeName,
  colorSchemes,
  s2CategoricalPaletteColors,
  s2CategoricalTokens,
  spectrum2Colors,
} from '@spectrum-charts/core-s2/tokens';

import { ClientOnly } from '../components/ClientOnly';

type Scheme = 'light' | 'dark';
type SchemeColors = (typeof spectrum2Colors)['light'];

const getToken = (scheme: Scheme, token: string): string => spectrum2Colors[scheme][token as keyof SchemeColors];

const cardStyle = (scheme: Scheme): CSSProperties => ({
  backgroundColor: getToken(scheme, 'gray-25'),
  border: `1px solid ${getToken(scheme, 'gray-200')}`,
  borderRadius: 24,
  color: getToken(scheme, 'gray-800'),
  padding: 32,
  marginBottom: 24,
});

const Card = ({ scheme, title, children }: { scheme: Scheme; title?: string; children: ReactNode }) => (
  <div style={cardStyle(scheme)}>
    {title && <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{title}</div>}
    {children}
  </div>
);

const CategoricalCard = ({ scheme }: { scheme: Scheme }) => (
  <Card scheme={scheme} title={scheme === 'light' ? 'Light' : 'Dark'}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: '20px 12px' }}>
      {s2CategoricalTokens.map((token, index) => {
        const hex = getToken(scheme, token);
        const category = String.fromCodePoint(65 + index);
        return (
          <div key={token} style={{ fontSize: 12, lineHeight: 1.4 }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>{category}</div>
            <div
              role="img"
              aria-label={`${category}: ${hex}`}
              title={`${token}: ${hex}`}
              style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: hex, marginBottom: 6 }}
            />
            <div style={{ color: getToken(scheme, 'gray-700') }}>{s2CategoricalPaletteColors[token]}</div>
            <div style={{ color: getToken(scheme, 'gray-700'), fontFamily: 'var(--ifm-font-family-monospace)' }}>
              {hex}
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

/**
 * Shows the categorical colors in light and dark, like the Spectrum color palette page.
 * @returns swatch cards
 */
export const CategoricalColors = () => (
  <ClientOnly
    markdown={
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Token</th>
            <th>Spectrum color</th>
            <th>Light</th>
            <th>Dark</th>
          </tr>
        </thead>
        <tbody>
          {s2CategoricalTokens.map((token, index) => (
            <tr key={token}>
              <td>{String.fromCodePoint(65 + index)}</td>
              <td>
                <code>{token}</code>
              </td>
              <td>
                <code>{s2CategoricalPaletteColors[token]}</code>
              </td>
              <td>
                <code>{getToken('light', token)}</code>
              </td>
              <td>
                <code>{getToken('dark', token)}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    }
  >
    {() => (
      <>
        <CategoricalCard scheme="light" />
        <CategoricalCard scheme="dark" />
      </>
    )}
  </ClientOnly>
);

const Ramp = ({ name, scheme }: { name: ColorSchemeName; scheme: Scheme }) => {
  const colors = colorSchemes[name as keyof typeof colorSchemes] as string[];
  return (
    <div style={{ marginBottom: 20 }}>
      <code style={{ background: 'none', border: 'none', padding: 0, color: getToken(scheme, 'gray-800') }}>
        {name}
      </code>
      <div style={{ display: 'flex', height: 48, borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
        {colors.map((color, index) => (
          <div
            key={`${color}-${index}`}
            role="img"
            aria-label={color}
            title={color}
            style={{ flex: 1, backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};

const getPaletteNames = (prefix: string) =>
  (Object.keys(colorSchemes) as ColorSchemeName[]).filter((name) => name.startsWith(prefix));

const RampTable = ({ prefix }: { prefix: string }) => (
  <table>
    <thead>
      <tr>
        <th>Palette</th>
        <th>Colors, in order</th>
      </tr>
    </thead>
    <tbody>
      {getPaletteNames(prefix).map((name) => (
        <tr key={name}>
          <td>
            <code>{name}</code>
          </td>
          <td>{(colorSchemes[name] as string[]).join(', ')}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const RampCard = ({ prefix }: { prefix: string }) => {
  const { colorMode } = useColorMode();
  const names = getPaletteNames(prefix);
  return (
    <Card scheme={colorMode}>
      {names.map((name) => (
        <Ramp key={name} name={name} scheme={colorMode} />
      ))}
    </Card>
  );
};

/**
 * Shows the sequential palettes as color ramps.
 * @returns ramp card
 */
export const SequentialPalettes = () => (
  <ClientOnly markdown={<RampTable prefix="sequential" />}>{() => <RampCard prefix="sequential" />}</ClientOnly>
);

/**
 * Shows the diverging palettes as color ramps.
 * @returns ramp card
 */
export const DivergingPalettes = () => (
  <ClientOnly markdown={<RampTable prefix="divergent" />}>{() => <RampCard prefix="divergent" />}</ClientOnly>
);
