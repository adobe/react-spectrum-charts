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
import { EncodeEntry, PathMark, RectMark, TextMark } from 'vega';

import { SANKEY_NODE_PADDING, SANKEY_NODE_WIDTH } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import {
  getColorProductionRule,
  getCursor,
  getDirectLabelFontSizeProductionRule,
  getDirectLabelTextMarkPair,
  getInspectEncoding,
  getMarkOpacity,
} from '../marks/markUtils';
import { SankeySpecOptions } from '../types';

/**
 * Layout math ported from Workspace's Sankey renderer (aaui-web-spa `CloudViz.js:25637`,
 * `d3.pathing()`), rewritten dependency-free since Vega has no flow-layout transform. Unlike the
 * source, which gets pre-assigned columns from Workspace's own data model, this also derives columns
 * itself (`assignColumns`) from a flat source/target/value edge list. Workspace's "entry"/"exit" stub
 * links (for partially-loaded windows) don't apply to a fully-specified edge list, so those branches
 * of the original `link()` generator aren't ported.
 */

const CURVATURE = 0.5;
/** Number of left-right/right-left relaxation passes used to reduce ribbon crossings. */
const RELAXATION_ITERATIONS = 32;

export interface SankeyEdgeInput {
  source: string;
  target: string;
  value: number;
  /** the original data row this edge came from, kept for tooltip passthrough */
  datum: Record<string, unknown>;
}

export interface SankeyLayoutLink {
  source: SankeyLayoutNode;
  target: SankeyLayoutNode;
  value: number;
  /** vertical offset of this link within its source node */
  sy: number;
  /** vertical offset of this link within its target node */
  ty: number;
  /** thickness of the ribbon, in pixels */
  dy: number;
  datum: Record<string, unknown>;
}

export interface SankeyLayoutNode {
  id: string;
  column: number;
  value: number;
  x: number;
  y: number;
  /** node width, in pixels */
  dx: number;
  /** node height, in pixels */
  dy: number;
  sourceLinks: SankeyLayoutLink[];
  targetLinks: SankeyLayoutLink[];
}

/**
 * Reads source/target/value edges from the chart data, dropping rows missing a source/target or
 * with a non-finite or negative value (which would corrupt the shared `ky` scale factor).
 */
export const getSankeyEdges = (options: SankeySpecOptions): SankeyEdgeInput[] => {
  const { data, source, target, value } = options;
  const unsafeData = data as unknown as Record<string, unknown>[];

  return unsafeData
    .filter(
      (datum) =>
        datum[source] != null &&
        datum[target] != null &&
        typeof datum[value] === 'number' &&
        Number.isFinite(datum[value]) &&
        (datum[value] as number) >= 0
    )
    .map((datum) => ({
      source: String(datum[source]),
      target: String(datum[target]),
      value: datum[value] as number,
      datum,
    }));
};

/**
 * Assigns each node to a column via topological layering: a node's column is one past the deepest
 * column of any node flowing into it; nodes with no incoming edges start at column 0.
 *
 * Cycles (A -> B -> A) can't be topologically layered. The closing back-edge is detected via DFS,
 * dropped from layering (so this terminates), and reported via `console.warn` -- the edge is still
 * rendered, it just doesn't affect column assignment.
 *
 * `explicitColumns` overrides the computed column for any node id present in the map -- a hook for a
 * future consumer that already knows column identity and doesn't need topological inference.
 */
export const assignColumns = (
  edges: SankeyEdgeInput[],
  explicitColumns?: Record<string, number>
): Map<string, number> => {
  const nodeIds = getUniqueNodeIds(edges);
  const backEdges = findBackEdges(nodeIds, edges);
  const layeringEdges = edges.filter((edge) => !backEdges.has(edge));

  if (backEdges.size) {
    // eslint-disable-next-line no-console
    console.warn(
      `Sankey: ${backEdges.size} cyclic edge(s) detected and excluded from column layering (still rendered): ` +
        [...backEdges].map((edge) => `${edge.source} -> ${edge.target}`).join(', ')
    );
  }

  const outEdgesByNode = groupEdgesBySource(layeringEdges);
  const inDegree = new Map<string, number>();
  nodeIds.forEach((id) => inDegree.set(id, 0));
  layeringEdges.forEach((edge) => inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1));

  const columns = new Map<string, number>();
  let frontier = nodeIds.filter((id) => inDegree.get(id) === 0);
  frontier.forEach((id) => columns.set(id, 0));

  while (frontier.length) {
    const nextFrontier: string[] = [];
    frontier.forEach((id) => {
      const column = columns.get(id) ?? 0;
      (outEdgesByNode.get(id) ?? []).forEach((edge) => {
        const remaining = (inDegree.get(edge.target) ?? 0) - 1;
        inDegree.set(edge.target, remaining);
        columns.set(edge.target, Math.max(columns.get(edge.target) ?? 0, column + 1));
        if (remaining === 0) {
          nextFrontier.push(edge.target);
        }
      });
    });
    frontier = nextFrontier;
  }

  // a node still unvisited is part of an all-cycle component with no entry point -- place at column 0
  nodeIds.forEach((id) => {
    if (!columns.has(id)) columns.set(id, 0);
  });

  if (explicitColumns) {
    Object.entries(explicitColumns).forEach(([id, column]) => columns.set(id, column));
  }

  return columns;
};

const getUniqueNodeIds = (edges: SankeyEdgeInput[]): string[] => {
  const ids = new Set<string>();
  edges.forEach((edge) => {
    ids.add(edge.source);
    ids.add(edge.target);
  });
  return [...ids];
};

const groupEdgesBySource = (edges: SankeyEdgeInput[]): Map<string, SankeyEdgeInput[]> => {
  const map = new Map<string, SankeyEdgeInput[]>();
  edges.forEach((edge) => {
    const group = map.get(edge.source) ?? [];
    group.push(edge);
    map.set(edge.source, group);
  });
  return map;
};

/** DFS-based cycle detection; returns the set of edges that close a cycle (the "back edges"). */
const findBackEdges = (nodeIds: string[], edges: SankeyEdgeInput[]): Set<SankeyEdgeInput> => {
  const outEdges = groupEdgesBySource(edges);
  const state = new Map<string, 'visiting' | 'done'>();
  const backEdges = new Set<SankeyEdgeInput>();

  const visit = (id: string) => {
    state.set(id, 'visiting');
    (outEdges.get(id) ?? []).forEach((edge) => {
      const targetState = state.get(edge.target);
      if (targetState === 'visiting') {
        backEdges.add(edge);
      } else if (targetState !== 'done') {
        visit(edge.target);
      }
    });
    state.set(id, 'done');
  };

  nodeIds.forEach((id) => {
    if (!state.has(id)) visit(id);
  });

  return backEdges;
};

/** value = max(sum of outgoing, sum of incoming), ported from `d3.pathing()`'s `computeNodeValues`. */
const computeNodeValue = (node: SankeyLayoutNode): number =>
  Math.max(sum(node.sourceLinks, (link) => link.value), sum(node.targetLinks, (link) => link.value));

const sum = <T>(items: T[], accessor: (item: T) => number): number => items.reduce((total, item) => total + accessor(item), 0);

/**
 * Builds the full node/link layout: columns, x/y positions, sizing, and vertical ordering. Positions
 * and sizes are literal pixel values, not Vega scales -- matching Venn's precomputed-geometry
 * convention (`venn/vennUtils.ts`).
 */
export const buildSankeyLayout = (
  edges: SankeyEdgeInput[],
  chartWidth: number,
  chartHeight: number,
  explicitColumns?: Record<string, number>
): { nodes: SankeyLayoutNode[]; links: SankeyLayoutLink[]; columnSpacing: number } => {
  const columns = assignColumns(edges, explicitColumns);
  const nodesById = new Map<string, SankeyLayoutNode>();
  const getNode = (id: string): SankeyLayoutNode => {
    let node = nodesById.get(id);
    if (!node) {
      node = {
        id,
        column: columns.get(id) ?? 0,
        value: 0,
        x: 0,
        y: 0,
        dx: SANKEY_NODE_WIDTH,
        dy: 0,
        sourceLinks: [],
        targetLinks: [],
      };
      nodesById.set(id, node);
    }
    return node;
  };

  const links: SankeyLayoutLink[] = edges.map((edge) => {
    const source = getNode(edge.source);
    const target = getNode(edge.target);
    const link: SankeyLayoutLink = { source, target, value: edge.value, sy: 0, ty: 0, dy: 0, datum: edge.datum };
    source.sourceLinks.push(link);
    target.targetLinks.push(link);
    return link;
  });

  const nodes = [...nodesById.values()];
  nodes.forEach((node) => (node.value = computeNodeValue(node)));

  const columnSpacing = computeNodeBreadths(nodes, chartWidth);
  computeNodeDepths(nodes, chartHeight);
  computeLinkDepths(nodes);

  return { nodes, links, columnSpacing };
};

/**
 * Assigns x positions from each node's column, ported from `computeNodeBreadths`/`scaleNodeBreadths`.
 * Returns the column spacing so callers can size labels to fit the actual gap between columns.
 * `node.x` is rounded to a whole pixel to avoid an anti-aliasing seam against touching ribbons.
 */
const computeNodeBreadths = (nodes: SankeyLayoutNode[], chartWidth: number): number => {
  const numColumns = new Set(nodes.map((node) => node.column)).size;
  const availableWidth = Math.max(chartWidth - SANKEY_NODE_WIDTH, 0);
  const columnSpacing = numColumns > 1 ? availableWidth / (numColumns - 1) : availableWidth;
  nodes.forEach((node) => (node.x = Math.round(node.column * columnSpacing)));
  return columnSpacing;
};

/**
 * Assigns y positions and node/link thicknesses, ported from `computeNodeDepths`/`initializeNodeDepth`
 * plus the relaxation/collision passes below. Crossing minimization is kept (unlike the pre-alpha
 * spec's scoped-out plan) since Workspace's tested implementation already handles it cheaply.
 */
const computeNodeDepths = (nodes: SankeyLayoutNode[], chartHeight: number): void => {
  const nodesByColumn = groupByColumn(nodes);

  const ky = Math.min(
    ...nodesByColumn.map((columnNodes) => {
      const columnValue = sum(columnNodes, (node) => node.value) || 1;
      return (chartHeight - (columnNodes.length - 1) * SANKEY_NODE_PADDING) / columnValue;
    })
  );

  nodesByColumn.forEach((columnNodes) => {
    columnNodes.forEach((node, i) => {
      node.y = i;
      node.dy = Math.max(0, node.value * ky);
      [...node.sourceLinks, ...node.targetLinks].forEach((link) => (link.dy = link.value * ky));
    });
  });

  resolveCollisions(nodesByColumn, chartHeight);
  for (let iteration = 0, alpha = 1; iteration < RELAXATION_ITERATIONS; iteration++) {
    alpha *= 0.99;
    relaxRightToLeft(nodesByColumn, alpha);
    resolveCollisions(nodesByColumn, chartHeight);
    relaxLeftToRight(nodesByColumn, alpha);
    resolveCollisions(nodesByColumn, chartHeight);
  }
};

const groupByColumn = (nodes: SankeyLayoutNode[]): SankeyLayoutNode[][] => {
  const byColumn = new Map<number, SankeyLayoutNode[]>();
  nodes.forEach((node) => {
    const group = byColumn.get(node.column) ?? [];
    group.push(node);
    byColumn.set(node.column, group);
  });
  return [...byColumn.entries()].sort(([a], [b]) => a - b).map(([, group]) => group);
};

const center = (node: SankeyLayoutNode): number => node.y + node.dy / 2;

const relaxLeftToRight = (nodesByColumn: SankeyLayoutNode[][], alpha: number): void => {
  nodesByColumn.forEach((columnNodes) => {
    columnNodes.forEach((node) => {
      if (!node.targetLinks.length) return;
      const weightedY = sum(node.targetLinks, (link) => center(link.source) * link.value);
      const totalValue = sum(node.targetLinks, (link) => link.value);
      node.y += (weightedY / totalValue - center(node)) * alpha;
    });
  });
};

const relaxRightToLeft = (nodesByColumn: SankeyLayoutNode[][], alpha: number): void => {
  [...nodesByColumn].reverse().forEach((columnNodes) => {
    columnNodes.forEach((node) => {
      if (!node.sourceLinks.length) return;
      const weightedY = sum(node.sourceLinks, (link) => center(link.target) * link.value);
      const totalValue = sum(node.sourceLinks, (link) => link.value);
      node.y += (weightedY / totalValue - center(node)) * alpha;
    });
  });
};

const resolveCollisions = (nodesByColumn: SankeyLayoutNode[][], chartHeight: number): void => {
  nodesByColumn.forEach((columnNodes) => {
    const sorted = [...columnNodes].sort((a, b) => a.y - b.y);
    let y0 = 0;
    sorted.forEach((node) => {
      const dy = y0 - node.y;
      if (dy > 0) node.y += dy;
      y0 = node.y + node.dy + SANKEY_NODE_PADDING;
    });

    const overflow = y0 - SANKEY_NODE_PADDING - chartHeight;
    const lastNode = sorted.at(-1);
    if (overflow > 0 && lastNode) {
      lastNode.y -= overflow;
      let yBound = lastNode.y;
      for (let i = sorted.length - 2; i >= 0; i--) {
        const node = sorted[i];
        const dy = node.y + node.dy + SANKEY_NODE_PADDING - yBound;
        if (dy > 0) node.y -= dy;
        yBound = node.y;
      }
    }
  });
};

/**
 * Assigns each link's vertical offset within its source/target node (`sy`/`ty`), ordering the stack
 * by the connected node's position so parallel ribbons don't cross their own siblings unnecessarily.
 * Ported from `computeLinkDepths` (minus the entry/exit-stub bookkeeping -- not applicable here).
 */
const computeLinkDepths = (nodes: SankeyLayoutNode[]): void => {
  nodes.forEach((node) => {
    node.sourceLinks.sort((a, b) => a.target.y - b.target.y);
    node.targetLinks.sort((a, b) => a.source.y - b.source.y);
  });
  nodes.forEach((node) => {
    let sy = 0;
    let ty = 0;
    node.sourceLinks.forEach((link) => {
      link.sy = sy;
      sy += link.dy;
    });
    node.targetLinks.forEach((link) => {
      link.ty = ty;
      ty += link.dy;
    });
  });
};

/** Cap, in pixels, on how much the bottom edge's control points can shift relative to the top edge's. */
const MAX_CURVE_BOOST = 15;

/**
 * Cubic-bezier ribbon path between a link's source and target edges, ported from `d3.pathing()`'s
 * `link()` generator (the "both ends present" branch only -- see the module comment on stub curves).
 *
 * Departure from the original: `d3.pathing()` only bends the bottom edge (`shortLinkOffset`) below
 * 15px thickness, so a thick ribbon's top and bottom edges run perfectly parallel -- fine in
 * Workspace's chart, which grows the canvas to fit the data instead of a fixed height. Here, fit into
 * a fixed `chartHeight`, a thick link (e.g. a root node's total outflow) would read as a rigid
 * trapezoid. Capping the bend at `MAX_CURVE_BOOST` instead of zeroing it out keeps thin links
 * unchanged while giving thick ones enough independent bend to read as a ribbon.
 */
export const getRibbonPath = (link: SankeyLayoutLink): string => {
  const curveHeight = Math.max(1, link.dy);
  const x0 = link.source.x + link.source.dx;
  const x1 = link.target.x;
  const x2 = lerp(x0, x1, CURVATURE);
  const x3 = lerp(x0, x1, 1 - CURVATURE);
  const curveBoost = Math.min(curveHeight, MAX_CURVE_BOOST);
  const shortLinkOffset = link.source.y < link.target.y ? -curveBoost : curveBoost;
  const x4 = x3 + shortLinkOffset;
  const x5 = x2 + shortLinkOffset;
  const y0 = link.source.y + link.sy;
  const y1 = link.target.y + link.ty;
  const y2 = y1 + curveHeight;
  const y3 = y0 + curveHeight;

  return `M${x0},${y0}C${x2},${y0} ${x3},${y1} ${x1},${y1}v${curveHeight}C${x4},${y2} ${x5},${y3} ${x0},${y3}Z`;
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------------------------------------------------------------------------------------------------
// Mark builders
// ---------------------------------------------------------------------------------------------------

export const getSankeyLinkMark = (options: SankeySpecOptions): PathMark => {
  const { chartInspects, chartPopovers, colorScheme, name } = options;

  return {
    type: 'path',
    // Mark name and data-source name must differ -- Vega shares one namespace for both, and reusing
    // a string for each throws "Duplicate data set name" at parse time.
    name: getSankeyLinkMarkName(name),
    from: { data: getSankeyLinkDataName(name) },
    encode: {
      enter: {
        path: { field: 'path' },
        fill: getColorProductionRule('sourceId', colorScheme),
        // Without this, path marks inherit the theme's default stroke, showing as a seam at each node.
        stroke: { value: 'transparent' },
        // Keyed by the parent name (not this layer's mark name) so one <ChartInspect>/<ChartPopover>
        // under <Sankey name="..."> covers both layers -- matches Venn's `getInterserctionMark`.
        tooltip: getInspectEncoding(chartInspects, name),
      },
      update: {
        opacity: getMarkOpacity(options),
        cursor: getCursor(chartPopovers),
      },
    },
  };
};

export const getSankeyNodeMark = (options: SankeySpecOptions): RectMark => {
  const { chartInspects, chartPopovers, color, colorScheme, name } = options;

  return {
    type: 'rect',
    name,
    from: { data: getSankeyNodeDataName(name) },
    encode: {
      enter: {
        x: { field: 'x' },
        y: { field: 'y' },
        width: { field: 'dx' },
        height: { field: 'dy' },
        fill: getColorProductionRule(color, colorScheme),
        tooltip: getInspectEncoding(chartInspects, name),
      },
      update: {
        opacity: getMarkOpacity(options),
        cursor: getCursor(chartPopovers),
      },
    },
  };
};

/** Vertical offset, in pixels, of the node name label above the node's vertical center. */
const NODE_LABEL_NAME_DY = -7;
/** Vertical offset, in pixels, of the node value label below the node's vertical center. */
const NODE_LABEL_VALUE_DY = 9;
/** Halo stroke width, scaled down from `DIRECT_LABEL_BACKGROUND_STROKE_WIDTH` (4px) for this mark's smaller text. */
const NODE_LABEL_HALO_STROKE_WIDTH = 2;

/** Shared enter-encode fields for a label's background-halo and foreground text marks (everything except `fill`/`stroke`). */
const getSankeyNodeLabelBaseEnter = (textField: string, dy: number): EncodeEntry => ({
  // labelX/labelY/labelAlign/labelLimit are precomputed in addData, per this mark's "everything
  // precomputed in JS" convention. labelAlign flips for the last column (no room to its right);
  // labelLimit caps each label to the gap between columns so the two flipped-and-facing labels can't collide.
  x: { field: 'labelX' },
  y: { field: 'labelY' },
  dy: { value: dy },
  text: { field: textField },
  align: { field: 'labelAlign' },
  baseline: { value: 'middle' },
  limit: { field: 'labelLimit' },
});

/**
 * A background-halo + foreground text mark pair, so labels stay legible over colored ribbons. Same
 * two-mark technique `getLineDirectLabelMarks` uses (lineDirectLabelUtils.ts), reused for consistency.
 * Font size also reuses `getDirectLabelFontSizeProductionRule`: `options.fontSize` overrides it,
 * otherwise it scales with chart width via the shared `CHART_SIZE_FONT_SIZE` signal.
 */
const getSankeyNodeLabelMarkPair = (
  options: SankeySpecOptions,
  markNameSuffix: string,
  textField: string,
  dy: number,
  fillColor: string,
  fontSizeEncoding: { signal: string } | { value: number }
): TextMark[] => {
  const { name } = options;
  // Unlike Line's direct labels, not derived from colorScheme: these labels sit on arbitrary ribbon
  // colors, not the chart background, where a scheme-matched halo (light or dark) can blend into the
  // palette. Forcing the 'dark' variant (dark halo + light text) is legible against any color.
  const resolvedBg = getS2ColorValue('gray-25', 'dark');
  const baseEnter = getSankeyNodeLabelBaseEnter(textField, dy);

  return getDirectLabelTextMarkPair(
    `${name}_${markNameSuffix}`,
    getSankeyNodeDataName(name),
    {
      enter: {
        ...baseEnter,
        fill: { value: resolvedBg },
        stroke: { value: resolvedBg },
        strokeWidth: { value: NODE_LABEL_HALO_STROKE_WIDTH },
      },
      update: { fontSize: fontSizeEncoding },
    },
    {
      enter: { ...baseEnter, fill: { value: fillColor } },
      update: { fontSize: fontSizeEncoding },
    }
  );
};

// Both fills below force the 'dark' scheme variant regardless of colorScheme -- see getSankeyNodeLabelMarkPair.
export const getSankeyNodeLabelMarks = (options: SankeySpecOptions): TextMark[] =>
  getSankeyNodeLabelMarkPair(
    options,
    'label',
    'id',
    NODE_LABEL_NAME_DY,
    getS2ColorValue('gray-800', 'dark'),
    getDirectLabelFontSizeProductionRule(options.fontSize)
  );

/** Value label under each node's name -- Workspace's Flow visualization always shows this. */
export const getSankeyNodeValueLabelMarks = (options: SankeySpecOptions): TextMark[] =>
  getSankeyNodeLabelMarkPair(
    options,
    'valueLabel',
    'formattedValue',
    NODE_LABEL_VALUE_DY,
    // same fill as the name label -- gray-700 read as a gold-ish tint over saturated ribbons.
    getS2ColorValue('gray-800', 'dark'),
    // one size smaller than the name label when overridden; otherwise falls back to the same
    // responsive signal as the name label (not worth offsetting a signal expression).
    options.fontSize !== undefined
      ? { value: options.fontSize - 1 }
      : getDirectLabelFontSizeProductionRule(options.fontSize)
  );

export const getSankeyNodeDataName = (name: string): string => `${name}_nodes`;
export const getSankeyLinkMarkName = (name: string): string => `${name}_links`;
export const getSankeyLinkDataName = (name: string): string => `${name}_linksData`;

export const getSankeyNodeMarkId = (name: string, nodeId: string): string => `${name}_node_${nodeId}`;
export const getSankeyLinkMarkId = (name: string, linkIndex: number): string => `${name}_link_${linkIndex}`;
