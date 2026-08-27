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
  // Last-column labels flip to the node's left (standard Sankey convention) so they don't clip past
  // the chart edge. That makes the last and second-to-last columns' labels grow toward each other
  // across one shared gap -- every other gap only has one label growing into it. `labelLimit` caps
  // each label to the room available (Vega truncates with an ellipsis): the full gap normally, half
  // the gap for the two columns sharing one, so neither can reach the other's text.
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
    // original edge row, nested to avoid colliding with the computed fields above -- mirrors Venn's
    // `table_data` lookup-back convention for tooltip/popover passthrough.
    table_data: link.datum,
  }));

  data.push({ name: getSankeyNodeDataName(name), values: nodeRows }, { name: getSankeyLinkDataName(name), values: linkRows });
});

export const addMarks = produce<Mark[], [SankeySpecOptions]>((marks, props) => {
  // Links before nodes (ribbons sit under node rects), before both label pairs (name above center,
  // value below, matching Workspace's Flow). Each label is a halo + foreground pair (getSankeyNodeLabelMarkPair).
  marks.push(
    getSankeyLinkMark(props),
    getSankeyNodeMark(props),
    ...getSankeyNodeLabelMarks(props),
    ...getSankeyNodeValueLabelMarks(props)
  );
});

// Unlike Venn (whose `color` field lands on the shared TABLE, so the generic
// `addFieldToFacetScaleDomain` helper works), a Sankey node's `id` only exists on its own
// precomputed `${name}_nodes` data -- no 1:1 TABLE row per node. Domain points there directly instead.
export const addScales = produce<Scale[], [SankeySpecOptions]>((scales, { color, name }) => {
  const index = getScaleIndexByName(scales, COLOR_SCALE);
  scales[index] = { ...scales[index], domain: { data: getSankeyNodeDataName(name), field: color } };
});

export const addSignals = produce<Signal[], [SankeySpecOptions]>((signals, props) => {
  const { chartInspects, name } = props;

  if (!isInteractive(props)) return;
  // Both layers write into the same `${name}_hoveredItem` signal -- mirrors Venn's dual
  // `addHoveredItemSignal` call for `circles`/`intersections`.
  addHoveredItemSignal(signals, name, undefined, 1, chartInspects[0]?.excludeDataKeys);
  addHoveredItemSignal(signals, name, getSankeyLinkMarkName(name), 1, chartInspects[0]?.excludeDataKeys);
});
