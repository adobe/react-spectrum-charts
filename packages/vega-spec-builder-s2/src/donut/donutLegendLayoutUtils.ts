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
import { produce } from 'immer';
import { RectMark } from 'vega';

import { DEFAULT_FONT_SIZE, DEFAULT_LEGEND_SYMBOL_WIDTH } from '@spectrum-charts/core-s2/constants';

import { getMaxLabelWidthExpr } from '../legend/legendUtils.js';
import { DonutOptions, LegendOptions, ScSpec } from '../types/index.js';

export const DONUT_LEGEND_EXTENT = 'rscDonutLegendExtent';
export const DONUT_LEGEND_MARGIN = 'rscDonutLegendMargin';

// Vega defaults for legend symbol stroke width and title limit
const LEGEND_SYMBOL_STROKE_WIDTH = 1.5;
const LEGEND_TITLE_LIMIT = 180;

/**
 * Gets an expression for the legend's widest content: its widest label, or its title if wider.
 * @param index legend index
 * @param legend
 * @returns vega expression string
 */
const getLegendContentWidthExpr = (index: number, { labelLimit, title, titleLimit }: LegendOptions): string => {
  const symbolColumn = DEFAULT_LEGEND_SYMBOL_WIDTH + LEGEND_SYMBOL_STROKE_WIDTH + 4;
  const legendName = `legend${index}`;
  const labels = `${symbolColumn} + ${getMaxLabelWidthExpr(legendName, labelLimit)}`;
  if (!title) return labels;
  const titleWidth = `min(getLabelWidth(${JSON.stringify(title)}, 'bold', ${DEFAULT_FONT_SIZE}), ${titleLimit ?? LEGEND_TITLE_LIMIT})`;
  return `max(${labels}, ${titleWidth})`;
};

const getSpacer = (name: string, x: string): RectMark => ({
  name,
  type: 'rect',
  interactive: false,
  aria: false,
  encode: { update: { x: { signal: x }, y: { value: 0 }, width: { value: 0 }, height: { value: 0 } } },
});

/**
 * Centers a donut and its left or right legend as a group by padding the chart bounds equally on both sides.
 * @param spec
 * @param donut
 * @param legends
 */
export const addDonutLegendLayout = produce<ScSpec, [DonutOptions | undefined, LegendOptions[]]>(
  (spec, donut, legends) => {
    const index = legends.findIndex(({ position }) => position === 'left' || position === 'right');
    if (!donut || index === -1) return;
    // theme legend offset (24) + legend padding (2 * 8) + widest content
    const extent = `${24 + 16} + ${getLegendContentWidthExpr(index, legends[index])}`;
    const donutWidth = donut.variant === 'semicircle' ? '2 * height' : 'height';
    const m = DONUT_LEGEND_MARGIN;
    // Half the legend width past the donut on each side keeps the bounds the same total width as before
    // (so the donut keeps its size) while recentering them on the donut rather than the donut-plus-legend.
    const outer = `${m} + ${DONUT_LEGEND_EXTENT} / 2`;
    const innerWidth = 'rscContainerWidth(width) - padding.left - padding.right';

    spec.signals = [
      ...(spec.signals ?? []),
      { name: DONUT_LEGEND_EXTENT, update: extent },
      { name: DONUT_LEGEND_MARGIN, update: `max(0, (${innerWidth} - ${DONUT_LEGEND_EXTENT} - ${donutWidth}) / 2)` },
    ];
    // Symmetric spacers keep the donut (not the donut-plus-legend group) centered: the legend extends the
    // bounds past the donut on its side, so an equal spacer on the far side balances it around the donut.
    const leftX = `${m} > 0 ? -(${outer}) : 0`;
    const rightX = `${m} > 0 ? width + ${outer} : width`;
    spec.marks = [
      ...(spec.marks ?? []),
      getSpacer('rscDonutLegendSpacerLeft', leftX),
      getSpacer('rscDonutLegendSpacerRight', rightX),
    ];
    // the spacers shift the plot, so align the title to the whole chart
    if (spec.title && typeof spec.title === 'object' && !Array.isArray(spec.title)) {
      spec.title.frame = 'bounds';
    }
  }
);
