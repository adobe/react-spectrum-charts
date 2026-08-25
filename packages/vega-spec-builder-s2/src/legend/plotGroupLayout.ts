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
import { Data, GroupMark, Scale, Signal } from 'vega';

import {
  COLOR_SCALE,
  LINE_TYPE_SCALE,
  LINE_WIDTH_SCALE,
  OPACITY_SCALE,
  SYMBOL_SHAPE_SCALE,
  SYMBOL_SIZE_SCALE,
} from '@spectrum-charts/constants';

import { LEGEND_OFFSET, LegendPosition, isVerticalLegend } from './legendBandGroup';
import { ScSpec } from '../types';

/** Ordinal facet scales the legend group needs (shared with the plot); kept top-level, not moved into the plot group. */
const SHARED_FACET_SCALES = new Set<string>([
  COLOR_SCALE,
  OPACITY_SCALE,
  LINE_TYPE_SCALE,
  LINE_WIDTH_SCALE,
  SYMBOL_SHAPE_SCALE,
  SYMBOL_SIZE_SCALE,
]);

/**
 * Approach A′ / subview (see planning/research/custom-legend.md): to render the accessible-navigation
 * legend as our own marks below the chart while honoring the user-defined height entirely in Vega,
 * the chart is nested in a `plot` group sized to `plotHeight = height - legendBandHeight`, and the
 * legend is a sibling group in the remaining band. Nesting the chart's marks + axes + scales in the
 * plot group is what lets the axes anchor to `plotHeight` (they read the group's height, not the
 * view's) — the fix for the band-carve's stranded axis.
 *
 * Increment 1: nest the plot + reserve a fixed empty band (no legend yet), so the plot repositioning
 * can be verified in isolation. The band becomes dynamic + gets the legend group in the next step.
 */

/** Vertical space a bottom axis's tick labels occupy below the plot (label + tick + padding); tune visually. */
export const BOTTOM_AXIS_LABEL_RESERVE = 28;
/** Extra vertical space when the bottom axis also has a title. */
export const BOTTOM_AXIS_TITLE_RESERVE = 28;

/** The legend to render in the band below the plot: its group mark plus the top-level data/signals it reads. */
export interface LegendBand {
  group: GroupMark;
  data: Data[];
  signals: Signal[];
}

export const wrapChartInPlotGroup = (
  spec: ScSpec,
  legend?: LegendBand,
  bottomAxisReserve = 0,
  position: LegendPosition = 'bottom'
): ScSpec => {
  // Keep scales the legend band needs at the top level so both the plot group (bars) and the sibling
  // legend group can reference them: the facet scales (entry colors/shapes match the chart) and the
  // legend's `${name}Entries` ordinal scale (the legend reads its domain for entry order/index).
  const scales = (spec.scales ?? []) as Scale[];
  const isSharedScale = (scale: Scale): boolean => SHARED_FACET_SCALES.has(scale.name) || scale.name.endsWith('Entries');
  const sharedScales = scales.filter(isSharedScale);
  const plotScales = scales.filter((scale) => !isSharedScale(scale));

  const vertical = isVerticalLegend(position);
  // The plot is offset to make room for the band: down by (band + offset) for a top legend, right by
  // (band + offset) for a left legend.
  const plotX = position === 'left' ? { signal: `legendBandWidth + ${LEGEND_OFFSET}` } : { value: 0 };
  const plotY = position === 'top' ? { signal: `legendBandHeight + ${LEGEND_OFFSET}` } : { value: 0 };

  const plotGroup: GroupMark = {
    type: 'group',
    name: 'plotGroup',
    encode: {
      update: {
        x: plotX,
        y: plotY,
        width: { signal: 'plotWidth' },
        height: { signal: 'plotHeight' },
      },
    },
    // Group-scoped `width`/`height` shadow the view dimensions for everything inside the group, so
    // scales (`range: 'width'`/`'height'`), axis baselines/grid, and focus rings resolve to the plot
    // area — otherwise they read the full view size and spill past the axes into the band.
    signals: [
      { name: 'height', update: 'plotHeight' },
      { name: 'width', update: 'plotWidth' },
    ],
    scales: plotScales,
    axes: spec.axes,
    marks: spec.marks,
  };

  // Horizontal (top/bottom) legend reserves height: plot = height − band − offset − bottom-axis area.
  // Vertical (left/right) legend reserves width: plot = width − band − offset; height only loses the axis.
  const horizontalPlotHeight = `max(0, height - legendBandHeight - ${LEGEND_OFFSET} - ${bottomAxisReserve})`;
  const verticalPlotHeight = `max(0, height - ${bottomAxisReserve})`;
  const plotHeightSignal: Signal = {
    name: 'plotHeight',
    update: legend ? (vertical ? verticalPlotHeight : horizontalPlotHeight) : 'height',
  };
  const plotWidthSignal: Signal = {
    name: 'plotWidth',
    update: legend && vertical ? `max(0, width - legendBandWidth - ${LEGEND_OFFSET})` : 'width',
  };

  return {
    ...spec,
    // The built-in legend is replaced by our own marks in the band; drop it.
    legends: [],
    // Only the shared facet scales stay top-level; positional scales/axes move into the plot group.
    scales: sharedScales,
    axes: [],
    data: [...(spec.data ?? []), ...(legend?.data ?? [])],
    marks: legend ? [plotGroup, legend.group] : [plotGroup],
    signals: [...(spec.signals ?? []), ...(legend?.signals ?? []), plotHeightSignal, plotWidthSignal],
  };
};
