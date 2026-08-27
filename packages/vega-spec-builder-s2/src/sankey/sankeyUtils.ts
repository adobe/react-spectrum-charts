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
import { EncodeEntry, NumericValueRef, PathMark, ProductionRule, RectMark, TextMark } from 'vega';

import { SANKEY_NODE_PADDING, SANKEY_NODE_WIDTH } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import {
  getColorProductionRule,
  getCursor,
  getDirectLabelFontSizeProductionRule,
  getInspectEncoding,
  getMarkOpacity,
} from '../marks/markUtils';
import { SankeySpecOptions } from '../types';

/**
 * Layout math ported from Workspace's own production Sankey renderer
 * (aaui-web-spa `packages/ui-core/src/CloudViz.js:25637`, `d3.pathing()`), rewritten dependency-free
 * (no d3) since Vega has no sankey/flow-layout transform of its own. Unlike the source implementation
 * -- which receives pre-assigned node columns from Workspace's checkpoint-tree model -- this module
 * also has to derive columns itself (`assignColumns`) from a flat source/target/value edge list, since
 * that's the only input a generic chart-library mark can assume.
 *
 * Workspace's original also modeled "entry"/"exit" stub links (flow entering/leaving a partially-loaded
 * window). That concept doesn't apply here: every edge in a fully-specified source/target/value list has
 * both ends, so those stub-curve branches of the original `link()` generator are intentionally not ported.
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
 * Reads the source/target/value edges out of the chart data using the configured field names,
 * dropping any row that's missing one of the three.
 */
export const getSankeyEdges = (options: SankeySpecOptions): SankeyEdgeInput[] => {
  const { data, source, target, value } = options;
  const unsafeData = data as unknown as Record<string, unknown>[];

  return unsafeData
    .filter((datum) => datum[source] != null && datum[target] != null && typeof datum[value] === 'number')
    .map((datum) => ({
      source: String(datum[source]),
      target: String(datum[target]),
      value: datum[value] as number,
      datum,
    }));
};

/**
 * Assigns each node to a column via topological layering: a node's column is one greater than the
 * deepest column of any node that flows into it, and nodes with no incoming edges start at column 0.
 *
 * A cycle (A -> B -> A) can't be topologically layered -- the back-edge that closes the cycle is
 * detected via DFS, dropped from the layering graph (so the algorithm terminates), and reported via
 * `console.warn` rather than silently mis-laying the diagram. The edge itself is still rendered
 * (`buildLayout` doesn't filter edges based on this), it just doesn't influence column assignment.
 *
 * `explicitColumns`, if provided, overrides the computed column for any node id present in the map --
 * a hook for a future consumer (e.g. Workspace) that already knows column identity from its own
 * incrementally-fetched, checkpoint-tree data model and shouldn't need topological inference at all.
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

  // any node still not visited is part of an all-cycle component with no clean entry point -- place at column 0
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
 * Builds the full node/link layout: columns, x/y positions, node/ribbon sizing, and vertical ordering
 * (via the ported relaxation + collision-resolution passes). Positions and sizes are literal pixel
 * values -- Vega scales aren't used for them, matching Venn's precomputed-geometry convention
 * (`venn/vennUtils.ts`), since Vega has no sankey/flow-layout transform to delegate to.
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
 */
const computeNodeBreadths = (nodes: SankeyLayoutNode[], chartWidth: number): number => {
  const numColumns = new Set(nodes.map((node) => node.column)).size;
  const availableWidth = Math.max(chartWidth - SANKEY_NODE_WIDTH, 0);
  const columnSpacing = numColumns > 1 ? availableWidth / (numColumns - 1) : availableWidth;
  nodes.forEach((node) => (node.x = node.column * columnSpacing));
  return columnSpacing;
};

/**
 * Assigns y positions and node/link thicknesses, ported from `computeNodeDepths`/`initializeNodeDepth`
 * plus the `relaxLeftToRight`/`relaxRightToLeft`/`resolveCollisions` crossing-reduction passes.
 *
 * The pre-alpha spec for this mark explicitly scoped out crossing minimization ("no crossing-minimization
 * pass... ribbons may visually cross"). This implementation deliberately keeps it, since Workspace's
 * existing, tested reference implementation already solves it at negligible marginal cost.
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
    if (overflow > 0) {
      let yBound = (sorted[sorted.length - 1].y -= overflow);
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
 * Cubic-bezier ribbon path between a link's source and target node edges, ported from `d3.pathing()`'s
 * `link()` generator (only the "both ends present" branch -- see the module-level comment on why the
 * entry/exit stub-curve branches aren't applicable to a generic edge list).
 *
 * One deliberate departure from the original: `d3.pathing()` only shifts the bottom edge's control
 * points (`shortLinkOffset`) for links thinner than 15px, so the top and bottom edges of a *thick*
 * ribbon are perfectly parallel copies of each other -- fine in Workspace's own chart, which grows the
 * canvas to fit the data (see CloudViz.js's `_measureChart`/`_sizeChart`) rather than fitting the data
 * into a fixed height, so a dominant link rarely has to be as thick, proportionally, as it can be here.
 * Since this mark *is* fit into a fixed `chartHeight`, a very thick link (e.g. a root/entry node's
 * total outflow) reads as a rigid trapezoid instead of a ribbon. Capping the same offset at
 * `MAX_CURVE_BOOST` for every link -- instead of zeroing it out above 15px -- keeps thin links
 * identical to the original and gives thick links a small, proportionally-negligible independent bend
 * on their bottom edge, enough to read as a ribbon rather than a block.
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
    // The mark's own name and its underlying data source name must be two distinct strings: Vega
    // registers mark names and dataset names in the same namespace, so reusing one string for both
    // (as an earlier version of this file did) throws "Duplicate data set name" at parse time.
    name: getSankeyLinkMarkName(name),
    from: { data: getSankeyLinkDataName(name) },
    encode: {
      enter: {
        path: { field: 'path' },
        fill: getColorProductionRule('sourceId', colorScheme),
        // componentInfo in the inspect/popover signal is keyed by the parent name (not the layer's own
        // mark name) so a single <ChartInspect>/<ChartPopover> under <Sankey name="..."> handles both
        // layers -- matches Venn's `getInterserctionMark`, which does the same for its second layer.
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
/** Halo stroke width, scaled down from `DIRECT_LABEL_BACKGROUND_STROKE_WIDTH` (4px, tuned for the
 * larger direct-label font) so it doesn't blob out this mark's much smaller label text. */
const NODE_LABEL_HALO_STROKE_WIDTH = 2;
/** Halo opacity -- softens it to a glow rather than a hard-edged block wherever a label lands on
 * plain chart background instead of a colored ribbon (see the comment where this is used). */
const NODE_LABEL_HALO_OPACITY = 0.65;

/**
 * Shared enter-encode fields for a node label's background-halo and foreground text marks --
 * everything except `fill`/`stroke`, which differ between the two.
 */
const getSankeyNodeLabelBaseEnter = (textField: string, dy: number): EncodeEntry => ({
  // `labelX`/`labelY`/`labelAlign`/`labelLimit` are precomputed alongside the rest of the layout in
  // `sankeySpecBuilder.ts`'s addData (rather than derived here via encoding math), to stay consistent
  // with the "everything precomputed in JS" convention this mark follows. `labelAlign` flips for the
  // last column (no room to its right within the chart), and `labelLimit` caps each label to the
  // actual gap between columns via Vega's own text truncation (ellipsizes automatically) so adjacent
  // columns' labels -- which now grow toward each other around that flip -- can't collide.
  x: { field: 'labelX' },
  y: { field: 'labelY' },
  dy: { value: dy },
  text: { field: textField },
  align: { field: 'labelAlign' },
  baseline: { value: 'middle' },
  limit: { field: 'labelLimit' },
});

/**
 * A label pair -- a background "halo" text mark (stroked in the chart's background color) plus a
 * foreground fill text mark on top -- so labels stay legible sitting directly on top of colored,
 * crossing ribbons. Same two-mark halo technique `getLineDirectLabelMarks` uses for line series'
 * end-of-line labels (lineDirectLabel/lineDirectLabelUtils.ts), reused here for consistency rather
 * than inventing a different labeling convention for this mark. Font size also reuses that same
 * mechanism (`getDirectLabelFontSizeProductionRule`): `options.fontSize` overrides it (the story sets
 * this to 14, matching `DIRECT_LABEL_FONT_SIZE_S`), otherwise it scales with chart width via the
 * shared `CHART_SIZE_FONT_SIZE` signal, same as Line's direct labels.
 */
const getSankeyNodeLabelMarkPair = (
  options: SankeySpecOptions,
  markNameSuffix: string,
  textField: string,
  dy: number,
  fillColor: string,
  fontSizeEncoding: ProductionRule<NumericValueRef>
): TextMark[] => {
  const { name } = options;
  // Deliberately NOT derived from `backgroundColor`/`colorScheme`, unlike Line's direct labels
  // (which this halo technique is otherwise copied from): those labels sit in the chart margin, on
  // the actual chart background, so a background-matching halo makes sense there. These labels sit
  // on top of arbitrarily-colored ribbons/nodes instead, where a scheme-matched light-mode halo
  // (white) blends into lighter ribbon colors, and dark-mode's scheme-matched dark text similarly
  // fails against the palette's darker colors -- so the pairing needs to work against arbitrary
  // colors, not the page background. Forcing the 'dark' variant of these tokens regardless of the
  // chart's actual colorScheme (dark halo + light text) reuses that already-legible combination
  // universally, rather than inventing new one-off colors.
  const resolvedBg = getS2ColorValue('gray-25', 'dark');
  const baseEnter = getSankeyNodeLabelBaseEnter(textField, dy);

  const backgroundTextMark: TextMark = {
    name: `${name}_${markNameSuffix}_bg`,
    type: 'text',
    from: { data: getSankeyNodeDataName(name) },
    interactive: false,
    encode: {
      enter: {
        ...baseEnter,
        // `fill` must be set explicitly here -- SVG's default text fill is solid black, so without
        // this the halo rendered as an (almost-but-not-quite-matching) solid black text-shaped block
        // sitting behind the foreground text, not a halo, which read as a stray dark box wherever a
        // label landed on plain chart background rather than a colored ribbon. `fillOpacity`/
        // `strokeOpacity` soften it further so it reads as a soft glow, not a hard-edged block, in
        // that same case.
        fill: { value: resolvedBg },
        fillOpacity: { value: NODE_LABEL_HALO_OPACITY },
        stroke: { value: resolvedBg },
        strokeOpacity: { value: NODE_LABEL_HALO_OPACITY },
        strokeWidth: { value: NODE_LABEL_HALO_STROKE_WIDTH },
      },
      update: { fontSize: fontSizeEncoding },
    },
  };

  const foregroundTextMark: TextMark = {
    name: `${name}_${markNameSuffix}`,
    type: 'text',
    from: { data: getSankeyNodeDataName(name) },
    interactive: false,
    encode: {
      enter: { ...baseEnter, fill: { value: fillColor } },
      update: { fontSize: fontSizeEncoding },
    },
  };

  return [backgroundTextMark, foregroundTextMark];
};

// Both label fills below force the 'dark' scheme variant of these gray tokens regardless of the
// chart's actual colorScheme -- see the comment in getSankeyNodeLabelMarkPair for why.
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
    getS2ColorValue('gray-700', 'dark'),
    // one size smaller than the name label when an explicit override is set; otherwise the value
    // label falls back to the same chart-width-responsive signal as the name label (no offset --
    // offsetting a signal expression isn't worth the added complexity for the default/unset case).
    options.fontSize !== undefined
      ? { value: options.fontSize - 1 }
      : getDirectLabelFontSizeProductionRule(options.fontSize)
  );

export const getSankeyNodeDataName = (name: string): string => `${name}_nodes`;
export const getSankeyLinkMarkName = (name: string): string => `${name}_links`;
export const getSankeyLinkDataName = (name: string): string => `${name}_linksData`;

export const getSankeyNodeMarkId = (name: string, nodeId: string): string => `${name}_node_${nodeId}`;
export const getSankeyLinkMarkId = (name: string, linkIndex: number): string => `${name}_link_${linkIndex}`;
