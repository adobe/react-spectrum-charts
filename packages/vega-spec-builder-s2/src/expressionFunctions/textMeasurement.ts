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
import { FontWeight } from 'vega';

import { ADOBE_CLEAN_FONT } from '@spectrum-charts/core-s2/tokens';

const LABEL_WIDTH_CACHE_MAX_SIZE = 5000;
const labelWidthCache = new Map<string, number>();
let measureContext: CanvasRenderingContext2D | null | undefined;

const getMeasureContext = (): CanvasRenderingContext2D | null => {
  if (measureContext === undefined) {
    measureContext = document.createElement('canvas').getContext('2d');
    // Drop fallback-font measurements once web fonts finish loading.
    document.fonts?.addEventListener?.('loadingdone', () => {
      labelWidthCache.clear();
    });
  }
  return measureContext;
};

/** Measures text using a shared canvas and font-aware cache. */
export const getLabelWidth = (text: string, fontWeight: FontWeight = 'bold', fontSize: number = 12) => {
  const font = `${fontWeight} ${fontSize}px ${ADOBE_CLEAN_FONT}`;
  const key = `${font}|${text}`;
  const cached = labelWidthCache.get(key);
  if (cached !== undefined) return cached;

  const context = getMeasureContext();
  if (context === null) return 0;

  context.font = font;
  const width = context.measureText(text).width;
  if (document.fonts?.status !== 'loading') {
    if (labelWidthCache.size >= LABEL_WIDTH_CACHE_MAX_SIZE) {
      labelWidthCache.delete(labelWidthCache.keys().next().value as string);
    }
    labelWidthCache.set(key, width);
  }
  return width;
};

/** Truncates text to its measured width with an ellipsis. */
export const truncateText = (
  text: string,
  maxWidth: number,
  fontWeight: FontWeight = 'normal',
  fontSize: number = 12
) => {
  maxWidth = maxWidth - 4;
  const textWidth = getLabelWidth(text, fontWeight, fontSize);
  const elipsisWidth = getLabelWidth('\u2026', fontWeight, fontSize);
  if (textWidth <= maxWidth) return text;

  let truncatedText = text.slice(0, -1).trim();
  for (let i = truncatedText.length; i > 0; i--) {
    truncatedText = truncatedText.slice(0, -1).trim();
    if (getLabelWidth(truncatedText, fontWeight, fontSize) + elipsisWidth <= maxWidth) break;
  }
  if (truncatedText.length === 0) return text;
  return truncatedText + '\u2026';
};
