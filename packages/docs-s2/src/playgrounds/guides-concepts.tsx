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
import BrowserOnly from '@docusaurus/BrowserOnly';
import React from 'react';

import { Axis, Bar, ColorScale, Legend, Line, LocaleCode, colorSchemes } from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import { guideMonthlyRevenueData, guideSourceSessionsData } from '../components/examples/data';

// Plot of about 480 × 288, plus room for the axes and a bottom legend.
const PREVIEW_SIZE: PreviewSize = { width: 560, height: 380 };
const LOCALE_PREVIEW_SIZE: PreviewSize = { width: 600, height: 330 };

const PALETTE_GROUPS: { title: string; prefix: (name: string) => boolean }[] = [
  { title: 'Categorical', prefix: (name) => name.toLowerCase().includes('categorical') },
  { title: 'Sequential', prefix: (name) => name.startsWith('sequential') },
  { title: 'Diverging', prefix: (name) => name.startsWith('divergent') },
];

// The categoricalN palettes are Spectrum 1 colors, so the guide leaves them out.
const paletteNames = (Object.keys(colorSchemes) as ColorScale[]).filter((name) => !name.startsWith('categorical'));

// colorSchemes is stubbed in the SSR bundle, so swatches render client-side only.
const PaletteSwatches = () => (
  <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
    {PALETTE_GROUPS.map(({ title, prefix }) => (
      <div key={title}>
        <strong>{title}</strong>
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          {paletteNames.filter(prefix).map((name) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <code style={{ minWidth: 260 }}>{name}</code>
              <div style={{ display: 'flex', flexWrap: 'wrap' }} aria-hidden>
                {colorSchemes[name].map((color, index) => (
                  <span
                    key={`${color}-${index}`}
                    title={color}
                    style={{ width: 18, height: 18, backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/**
 * Shows the colors in every named palette that `colors` accepts.
 * @returns swatch list element
 */
export const GuidePaletteSwatches = () => (
  <BrowserOnly>{() => <PaletteSwatches />}</BrowserOnly>
);

const paletteControls: PlaygroundControl[] = [
  { name: 'colors', type: 'select', options: paletteNames, defaultValue: 's2Categorical20' },
  { name: 'colorScheme', type: 'select', options: ['light', 'dark'], defaultValue: 'light' },
  {
    name: 'backgroundColor',
    type: 'select',
    options: ['transparent', 'gray-25', 'gray-100', 'blue-100'],
    defaultValue: 'transparent',
  },
];

/**
 * Playground for named palettes, color scheme, and background color on a stacked bar chart.
 * @returns playground element
 */
export const GuidePalettePlayground = () => (
  <PropPlayground
    previewSize={() => PREVIEW_SIZE}
    controls={paletteControls}
    component="Chart"
    render={({ colors = 's2Categorical20', colorScheme = 'light', backgroundColor = 'transparent' }) => (
      <Chart
        data={guideSourceSessionsData}
        colors={colors === 's2Categorical20' ? undefined : (colors as ColorScale)}
        colorScheme={colorScheme as 'light' | 'dark'}
        backgroundColor={backgroundColor === 'transparent' ? undefined : String(backgroundColor)}
      >
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
        <Bar dimension="quarter" metric="sessions" color="source" />
        <Legend />
      </Chart>
    )}
  />
);

const localeControls: PlaygroundControl[] = [
  {
    name: 'locale',
    type: 'select',
    options: ['en-US', 'de-DE', 'fr-FR', 'ja-JP', 'pt-BR', 'zh-CN'],
    defaultValue: 'de-DE',
  },
  {
    group: 'Axis',
    name: 'numberFormat',
    type: 'select',
    options: ['shortNumber', 'standardNumber', 'currency', 'shortCurrency'],
    defaultValue: 'currency',
  },
];

/**
 * Playground for how the chart locale formats currency and month labels.
 * @returns playground element
 */
export const GuideLocalePlayground = () => (
  <PropPlayground
    previewSize={() => LOCALE_PREVIEW_SIZE}
    controls={localeControls}
    component="Chart"
    render={({ locale = 'de-DE', numberFormat = 'currency' }) => (
      <Chart data={guideMonthlyRevenueData} locale={locale === 'en-US' ? undefined : (locale as LocaleCode)}>
        <Axis position="left" grid numberFormat={numberFormat === 'shortNumber' ? undefined : String(numberFormat)} />
        <Axis position="bottom" baseline labelFormat="time" granularity="month" />
        <Line metric="revenue" />
      </Chart>
    )}
  />
);
