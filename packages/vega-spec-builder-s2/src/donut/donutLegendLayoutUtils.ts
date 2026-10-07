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
import { RectMark, Signal } from 'vega';

import { DEFAULT_FONT_SIZE, DEFAULT_LEGEND_SYMBOL_WIDTH } from '@spectrum-charts/constants';

import { getMaxLabelWidthExpr } from '../legend/legendUtils';
import { DonutOptions, LegendOptions, ScSpec } from '../types';

/** Distance between the plot and a side legend (spectrum2Theme's vertical legend layout offset). */
export const DONUT_LEGEND_OFFSET = 24;
const LEGEND_PADDING = 8;
const LEGEND_LABEL_OFFSET = 4;
const LEGEND_TITLE_LIMIT = 180;

export const DONUT_LEGEND_WIDTH_SIGNAL = 'rscDonutLegendWidth';
export const DONUT_LEGEND_MARGIN_SIGNAL = 'rscDonutLegendMargin';
export const DONUT_LEGEND_SPACER_START = 'rscDonutLegendSpacerStart';
export const DONUT_LEGEND_SPACER_END = 'rscDonutLegendSpacerEnd';

type SideLegend = Pick<LegendOptions, 'labelLimit' | 'position' | 'title' | 'titleLimit'> & { name: string };

/**
 * Gets the first left or right legend, which is the only kind that sits beside the donut.
 * @param legends
 * @returns legend with its spec name, or undefined
 */
export const getDonutSideLegend = (legends: LegendOptions[]): SideLegend | undefined => {
  const index = legends.findIndex(({ position }) => position === 'left' || position === 'right');
  return index === -1 ? undefined : { ...legends[index], name: `legend${index}` };
};

/**
 * Gets an estimate of a side legend's rendered width from its measured labels and title.
 * @param legend
 * @returns vega expression string
 */
export const getDonutLegendWidthExpr = ({ name, labelLimit, title, titleLimit }: SideLegend): string => {
  const labelColumn = `${DEFAULT_LEGEND_SYMBOL_WIDTH} + ${LEGEND_LABEL_OFFSET} + ${getMaxLabelWidthExpr(name, labelLimit)}`;
  const titleWidth = title
    ? `min(getLabelWidth(${JSON.stringify(title)}, 'bold', ${DEFAULT_FONT_SIZE}), ${titleLimit ?? LEGEND_TITLE_LIMIT})`
    : '0';
  return `${2 * LEGEND_PADDING} + max(${labelColumn}, ${titleWidth})`;
};

/**
 * Gets the signals for the side legend's estimated width and the empty margin on each side of the donut and legend.
 * @param legend
 * @param variant
 * @returns Signal[]
 */
export const getDonutLegendSignals = (legend: SideLegend, variant: DonutOptions['variant']): Signal[] => {
  // the widest the donut can draw at this height; a semicircle only sweeps the top half
  const donutWidth = variant === 'semicircle' ? '2 * height' : 'height';
  return [
    { name: DONUT_LEGEND_WIDTH_SIGNAL, update: getDonutLegendWidthExpr(legend) },
    {
      name: DONUT_LEGEND_MARGIN_SIGNAL,
      update: `max(0, (rscViewWidth(width) - ${DONUT_LEGEND_OFFSET} - ${DONUT_LEGEND_WIDTH_SIGNAL} - ${donutWidth}) / 2)`,
    },
  ];
};

/**
 * Gets an invisible zero-size mark whose position pads the chart bounds so autosize centers the donut and legend.
 * @param name
 * @param x vega expression for the spacer's x position
 * @returns RectMark
 */
const getSpacerMark = (name: string, x: string): RectMark => ({
  name,
  type: 'rect',
  interactive: false,
  aria: false,
  encode: { update: { x: { signal: x }, y: { value: 0 }, width: { value: 0 }, height: { value: 0 } } },
});

/**
 * Gets the spacer marks on the outer edges of the donut and its side legend.
 * @param position side of the legend
 * @returns RectMark[]
 */
export const getDonutLegendSpacerMarks = (position: SideLegend['position']): RectMark[] => {
  const margin = DONUT_LEGEND_MARGIN_SIGNAL;
  const legendExtent = `${DONUT_LEGEND_OFFSET} + ${DONUT_LEGEND_WIDTH_SIGNAL} + ${margin}`;
  if (position === 'left') {
    return [
      getSpacerMark(DONUT_LEGEND_SPACER_START, `${margin} > 0 ? -(${legendExtent}) : 0`),
      getSpacerMark(DONUT_LEGEND_SPACER_END, `width + ${margin}`),
    ];
  }
  return [
    getSpacerMark(DONUT_LEGEND_SPACER_START, `-${margin}`),
    getSpacerMark(DONUT_LEGEND_SPACER_END, `${margin} > 0 ? width + ${legendExtent} : width`),
  ];
};

/**
 * Keeps a donut next to its left or right legend by centering them as a group when the chart is wider than the donut.
 * @param spec
 * @param options
 */
export const addDonutLegendLayout = produce<ScSpec, [{ donut?: DonutOptions; legends: LegendOptions[] }]>(
  (spec, { donut, legends }) => {
    const legend = getDonutSideLegend(legends);
    if (!donut || !legend) return;
    spec.signals = [...(spec.signals ?? []), ...getDonutLegendSignals(legend, donut.variant)];
    spec.marks = [...(spec.marks ?? []), ...getDonutLegendSpacerMarks(legend.position)];
    // the spacers shift the plot, so align the title to the whole chart instead
    if (spec.title && typeof spec.title === 'object' && !Array.isArray(spec.title)) {
      spec.title = { ...spec.title, frame: 'bounds' };
    }
  }
);
