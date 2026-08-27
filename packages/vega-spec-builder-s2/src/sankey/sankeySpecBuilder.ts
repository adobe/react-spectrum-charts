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
import { Data, Mark, Scale, Signal } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_SANKEY_COLOR,
  DEFAULT_SANKEY_SOURCE,
  DEFAULT_SANKEY_TARGET,
  DEFAULT_SANKEY_VALUE,
  SANKEY_NODE_WIDTH,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { isInteractive } from '../marks/markUtils';
import { getScaleIndexByName } from '../scale/scaleSpecBuilder';
import { addHoveredItemSignal } from '../signal/signalSpecBuilder';
import { ChartData, ColorScheme, HighlightedItem, ScSpec, SankeyOptions, SankeySpecOptions } from '../types';
import {
  buildSankeyLayout,
  getSankeyEdges,
  getSankeyLinkDataName,
  getSankeyLinkMark,
  getSankeyLinkMarkId,
  getSankeyLinkMarkName,
  getSankeyNodeDataName,
  getSankeyNodeLabelMarks,
  getSankeyNodeMark,
  getSankeyNodeMarkId,
  getSankeyNodeValueLabelMarks,
  getRibbonPath,
} from './sankeyUtils';

export const addSankey = produce<
  ScSpec,
  [
    SankeyOptions & {
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      idKey: string;
      index?: number;
      chartHeight?: number;
      chartWidth?: number;
      data?: ChartData[];
    }
  ]
>(
  (
    spec,
    {
      chartPopovers = [],
      chartInspects = [],
      color = DEFAULT_SANKEY_COLOR,
      colorScheme = DEFAULT_COLOR_SCHEME,
      index = 0,
      source = DEFAULT_SANKEY_SOURCE,
      target = DEFAULT_SANKEY_TARGET,
      value = DEFAULT_SANKEY_VALUE,
      name,
      chartHeight = 100,
      chartWidth = 100,
      data = [],
      ...props
    }
  ) => {
    const sankeyProps: SankeySpecOptions = {
      chartPopovers,
      chartInspects,
      chartHeight,
      chartWidth,
      data,
      index,
      colorScheme,
      color,
      source,
      target,
      value,
      name: toCamelCase(name ?? `sankey${index}`),
      ...props,
    };
    spec.data = addData(spec.data ?? [], sankeyProps);
    spec.signals = addSignals(spec.signals ?? [], sankeyProps);
    spec.scales = addScales(spec.scales ?? [], sankeyProps);
    spec.marks = addMarks(spec.marks ?? [], sankeyProps);
  }
);

export const addData = produce<Data[], [SankeySpecOptions]>((data, props) => {
  const { chartHeight, chartWidth, idKey, name } = props;
  const edges = getSankeyEdges(props);
  const { nodes, links, columnSpacing } = buildSankeyLayout(edges, chartWidth, chartHeight);
  // last-column nodes have no room to their right within the chart, so their label sits to the
  // left of the node instead (standard Sankey/D3 convention) -- otherwise it gets clipped past the
  // chart's edge, since a right-hand label offset assumes there's space to the right of the node.
  // That flip means the last column's labels and the second-to-last column's labels now grow toward
  // each other across the same gap -- every other gap only ever has one label growing into it (the
  // column to its left, growing right), so it's only this one gap where two labels can collide.
  // `labelLimit` caps each label to the actual room available (Vega's text `limit` encoding
  // truncates with an ellipsis): the full gap for columns with no competing label, or half the gap
  // for the two columns that share one, so neither can grow far enough to reach the other's text.
  const maxColumn = Math.max(0, ...nodes.map((node) => node.column));
  const fullGapLimit = Math.max(0, columnSpacing - SANKEY_NODE_WIDTH - 8);
  const sharedGapLimit = Math.max(0, (columnSpacing - SANKEY_NODE_WIDTH) / 2 - 4);

  const nodeRows = nodes.map((node) => {
    const isLastColumn = node.column === maxColumn;
    const sharesGapWithFlippedLabel = node.column >= maxColumn - 1;
    const labelLimit = sharesGapWithFlippedLabel ? sharedGapLimit : fullGapLimit;
    return {
      [idKey]: getSankeyNodeMarkId(name, node.id),
      id: node.id,
      value: node.value,
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy,
      labelX: isLastColumn ? node.x - 4 : node.x + node.dx + 4,
      labelY: node.y + node.dy / 2,
      labelAlign: isLastColumn ? 'right' : 'left',
      labelLimit,
      formattedValue: node.value.toLocaleString(),
    };
  });

  const linkRows = links.map((link, i) => ({
    [idKey]: getSankeyLinkMarkId(name, i),
    sourceId: link.source.id,
    targetId: link.target.id,
    value: link.value,
    path: getRibbonPath(link),
    // original edge row, nested (rather than spread) to avoid colliding with the computed fields
    // above -- mirrors Venn's `table_data` lookup-back convention for tooltip/popover passthrough.
    table_data: link.datum,
  }));

  data.push({ name: getSankeyNodeDataName(name), values: nodeRows }, { name: getSankeyLinkDataName(name), values: linkRows });
});

export const addMarks = produce<Mark[], [SankeySpecOptions]>((marks, props) => {
  // links painted before nodes so ribbons sit under the node rects, before both label pairs
  // (name above center, value below -- matches Workspace's Flow visualization convention). Each
  // label is a background-halo + foreground pair (see getSankeyNodeLabelMarkPair in sankeyUtils.ts),
  // the same two-mark technique Line's direct labels use, so labels stay legible over colored ribbons.
  marks.push(
    getSankeyLinkMark(props),
    getSankeyNodeMark(props),
    ...getSankeyNodeLabelMarks(props),
    ...getSankeyNodeValueLabelMarks(props)
  );
});

// Unlike Venn (whose `color` field is computed directly onto the shared TABLE via a formula
// transform, so the generic TABLE-anchored `addFieldToFacetScaleDomain` helper works), a Sankey
// node's `id` only exists on its own precomputed `${name}_nodes` data -- there's no 1:1 TABLE row
// per node (a node is derived from potentially many edge rows). So the color scale's domain is
// pointed directly at that data source instead of going through the TABLE-only helper.
export const addScales = produce<Scale[], [SankeySpecOptions]>((scales, { color, name }) => {
  const index = getScaleIndexByName(scales, COLOR_SCALE);
  scales[index] = { ...scales[index], domain: { data: getSankeyNodeDataName(name), field: color } };
});

export const addSignals = produce<Signal[], [SankeySpecOptions]>((signals, props) => {
  const { chartInspects, name } = props;

  if (!isInteractive(props)) return;
  // both layers write into the same `${name}_hoveredItem` signal (whichever was hovered most
  // recently wins) -- mirrors Venn's dual `addHoveredItemSignal` call for `circles`/`intersections`.
  addHoveredItemSignal(signals, name, undefined, 1, chartInspects[0]?.excludeDataKeys);
  addHoveredItemSignal(signals, name, getSankeyLinkMarkName(name), 1, chartInspects[0]?.excludeDataKeys);
});
