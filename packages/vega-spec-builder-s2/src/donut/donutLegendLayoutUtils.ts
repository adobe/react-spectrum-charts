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

import { DEFAULT_LEGEND_SYMBOL_WIDTH } from '@spectrum-charts/constants';

import { getMaxLabelWidthExpr } from '../legend/legendUtils';
import { DonutOptions, LegendOptions, ScSpec } from '../types';

export const DONUT_LEGEND_EXTENT = 'rscDonutLegendExtent';
export const DONUT_LEGEND_MARGIN = 'rscDonutLegendMargin';

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
    const { position, labelLimit } = legends[index];
    // theme legend offset (24) + legend padding (2 * 8) + symbol + label offset (4) + widest label
    const extent = `${24 + 16 + DEFAULT_LEGEND_SYMBOL_WIDTH + 4} + ${getMaxLabelWidthExpr(`legend${index}`, labelLimit)}`;
    const donutWidth = donut.variant === 'semicircle' ? '2 * height' : 'height';
    const m = DONUT_LEGEND_MARGIN;
    const outer = `${DONUT_LEGEND_EXTENT} + ${m}`;

    spec.signals = [
      ...(spec.signals ?? []),
      { name: DONUT_LEGEND_EXTENT, update: extent },
      { name: m, update: `max(0, (rscViewWidth(width) - ${DONUT_LEGEND_EXTENT} - ${donutWidth}) / 2)` },
    ];
    const [leftX, rightX] =
      position === 'left' ? [`${m} > 0 ? -(${outer}) : 0`, `width + ${m}`] : [`-${m}`, `${m} > 0 ? width + ${outer} : width`];
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
