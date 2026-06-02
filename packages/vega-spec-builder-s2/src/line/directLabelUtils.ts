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
import { NumericValueRef, ProductionRule, TextMark, Transforms } from 'vega';

import { BACKGROUND_COLOR, DIRECT_LABEL_BACKGROUND_STROKE_WIDTH, DIRECT_LABEL_FONT_WEIGHT } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { ColorScheme } from '../types';

type PositionRef = NumericValueRef | ProductionRule<NumericValueRef>;
type FillOverride = { field: string } | { value: string };

// Shared style constants used by both mark variants.
// Any visual change here automatically applies to hover labels AND static labels.
const directLabelBackgroundStyle = {
  fill: { value: 'transparent' as const },
  stroke: { signal: BACKGROUND_COLOR },
  strokeWidth: { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH },
  fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
};

const getDirectLabelForegroundFill = (colorScheme: ColorScheme, override?: FillOverride): FillOverride =>
  override ?? { value: getS2ColorValue('gray-900', colorScheme) };

/**
 * Builds the two-mark (background halo + foreground text) pattern for hover-style labels
 * where position is encoded directly from data (no label transform).
 * Both marks read from the same dataSource.
 */
export const getDirectLabelTextMarks = (
  backgroundMarkName: string,
  foregroundMarkName: string,
  dataSource: string,
  textSignal: string,
  xEncoding: PositionRef,
  yEncoding: PositionRef,
  colorScheme: ColorScheme,
  additionalUpdateEncode: Record<string, unknown> = {}
): TextMark[] => [
  {
    name: backgroundMarkName,
    type: 'text',
    interactive: false,
    from: { data: dataSource },
    encode: {
      enter: { text: { signal: textSignal }, ...directLabelBackgroundStyle },
      update: { x: xEncoding, y: yEncoding, ...additionalUpdateEncode } as never,
    },
  },
  {
    name: foregroundMarkName,
    type: 'text',
    interactive: false,
    from: { data: dataSource },
    encode: {
      enter: {
        text: { signal: textSignal },
        fill: getDirectLabelForegroundFill(colorScheme),
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
      },
      update: { x: xEncoding, y: yEncoding, ...additionalUpdateEncode } as never,
    },
  },
];

/**
 * Builds the two-mark (background halo + foreground text) pattern for annotation-style labels
 * that use Vega's label transform for collision-aware placement.
 * The background mark runs the label transform; the foreground reads its computed positions
 * (x, y, align, baseline, opacity) from the background mark.
 */
export const getLabelTransformTextMarks = (
  backgroundMarkName: string,
  foregroundMarkName: string,
  dataSource: string,
  textSignal: string,
  colorScheme: ColorScheme,
  labelTransform: Transforms,
  foregroundFillOverride?: FillOverride
): TextMark[] => [
  {
    name: backgroundMarkName,
    type: 'text',
    interactive: false,
    from: { data: dataSource },
    encode: {
      enter: { text: { signal: textSignal }, ...directLabelBackgroundStyle },
      update: { fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT } },
    },
    transform: [labelTransform],
  },
  {
    name: foregroundMarkName,
    type: 'text',
    interactive: false,
    from: { data: backgroundMarkName },
    encode: {
      enter: { fill: getDirectLabelForegroundFill(colorScheme, foregroundFillOverride) },
      update: {
        text: { field: 'text' },
        x: { field: 'x' },
        y: { field: 'y' },
        align: { field: 'align' },
        baseline: { field: 'baseline' },
        opacity: { field: 'opacity' },
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
      },
    },
  },
];
