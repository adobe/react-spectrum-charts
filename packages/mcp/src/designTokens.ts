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
// Both packages are published as UMD bundles, which Node's native ESM loader cannot
// statically analyze for named exports — import the default and destructure instead.
import themes from '@spectrum-charts/themes';
import constants from '@spectrum-charts/constants';

const { ADOBE_CLEAN_FONT, s2Categorical6, s2Categorical12, s2Categorical16, s2Categorical20, spectrum2Colors } =
  themes;
const {
  ANNOTATION_FONT_SIZE,
  ANNOTATION_FONT_WEIGHT,
  CORNER_RADIUS,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_SIZE,
  DEFAULT_LABEL_FONT_WEIGHT,
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_LABEL_LIMIT,
  DEFAULT_LEGEND_SYMBOL_SIZE,
  DEFAULT_LEGEND_SYMBOL_WIDTH,
  DEFAULT_SYMBOL_STROKE_WIDTH,
  DEFAULT_TITLE_FONT_WEIGHT,
  DIRECT_LABEL_FONT_SIZE_L,
  DIRECT_LABEL_FONT_SIZE_M,
  DIRECT_LABEL_FONT_SIZE_S,
  DIRECT_LABEL_FONT_WEIGHT,
} = constants;

export type DesignTokenCategory = {
  id: string;
  title: string;
  description: string;
  tokens: Record<string, unknown>;
};

// Values below that are not backed by an exported constant are transcribed as of the
// getSpectrum2VegaConfig() config in packages/themes/src/spectrum2Theme.ts. They are
// duplicated here (not imported) since that file does not export them individually.
// If spectrum2Theme.ts changes, update the cited line numbers below to match.

const colors: DesignTokenCategory = {
  id: 'colors',
  title: 'Spectrum 2 Colors',
  description:
    'Full Spectrum 2 color-scale token catalog (token name -> CSS color), split by light/dark color scheme, ' +
    'plus the named categorical color scales. Resolved at runtime via getS2ColorValue(token, colorScheme) ' +
    'from @spectrum-charts/themes.',
  tokens: {
    scales: spectrum2Colors,
    categorical: {
      s2Categorical6,
      s2Categorical12,
      s2Categorical16,
      s2Categorical20,
    },
    defaultFontColorToken: DEFAULT_FONT_COLOR,
  },
};

const typography: DesignTokenCategory = {
  id: 'typography',
  title: 'Spectrum 2 Typography',
  description:
    'Font family, size, and weight tokens used across S2 chart marks, axes, legends, and labels.',
  tokens: {
    fontFamily: ADOBE_CLEAN_FONT,
    baseFontSize: DEFAULT_FONT_SIZE,
    defaultLabelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
    defaultTitleFontWeight: DEFAULT_TITLE_FONT_WEIGHT, // S1 title default; S2 chart title uses 'normal' (spectrum2Theme.ts:154-159)
    chartTitle: { fontSize: 22, fontWeight: 'normal' }, // spectrum2Theme.ts:152-159
    axisLabel: { fontSize: DEFAULT_FONT_SIZE, fontWeight: 'normal' }, // spectrum2Theme.ts:67-69
    axisTitle: { fontSize: DEFAULT_FONT_SIZE, fontWeight: 'normal' }, // spectrum2Theme.ts:81-83
    legendLabel: { fontSize: DEFAULT_FONT_SIZE, fontWeight: 'normal' }, // spectrum2Theme.ts:97-99
    legendTitle: { fontSize: DEFAULT_FONT_SIZE, fontWeight: 'normal' }, // spectrum2Theme.ts:112-114
    annotation: { fontSize: ANNOTATION_FONT_SIZE, fontWeight: ANNOTATION_FONT_WEIGHT },
    directLabel: {
      fontSizeS: DIRECT_LABEL_FONT_SIZE_S,
      fontSizeM: DIRECT_LABEL_FONT_SIZE_M,
      fontSizeL: DIRECT_LABEL_FONT_SIZE_L,
      fontWeight: DIRECT_LABEL_FONT_WEIGHT,
    },
  },
};

const spacing: DesignTokenCategory = {
  id: 'spacing',
  title: 'Spectrum 2 Spacing & Layout',
  description:
    'Padding, offset, stroke-width, and layout tokens used across S2 chart axes, legends, and marks.',
  tokens: {
    cornerRadius: CORNER_RADIUS,
    axis: {
      labelPadding: 8, // spectrum2Theme.ts:70
      titlePadding: 16, // spectrum2Theme.ts:84
      tickSize: 8, // spectrum2Theme.ts:76
    },
    legend: {
      padding: 8, // spectrum2Theme.ts:96
      rowPadding: 8, // spectrum2Theme.ts:107
      titlePadding: 8, // spectrum2Theme.ts:114
      columnPadding: DEFAULT_LEGEND_COLUMN_PADDING,
      labelLimit: DEFAULT_LEGEND_LABEL_LIMIT,
      symbolSize: DEFAULT_LEGEND_SYMBOL_SIZE,
      symbolWidth: DEFAULT_LEGEND_SYMBOL_WIDTH,
      horizontalLayout: { offset: 24, margin: 48 }, // spectrum2Theme.ts:41-48
      verticalLayout: { offset: 24, margin: 24 }, // spectrum2Theme.ts:49-56
    },
    line: {
      strokeWidth: 2.5, // spectrum2Theme.ts:124
    },
    symbol: {
      strokeWidth: DEFAULT_SYMBOL_STROKE_WIDTH,
    },
  },
};

export const DESIGN_TOKEN_CATEGORIES: DesignTokenCategory[] = [colors, typography, spacing];

export function getDesignTokenCategory(id: string): DesignTokenCategory {
  const category = DESIGN_TOKEN_CATEGORIES.find((c) => c.id === id);
  if (!category) {
    throw new Error(`Design token category not found for id=${id}`);
  }
  return category;
}
